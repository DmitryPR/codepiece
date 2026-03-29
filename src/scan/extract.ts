import { Project, type FunctionDeclaration, type JSDoc, type MethodDeclaration } from 'ts-morph';
import type { CardCandidate } from './types';

const MAX_BODY_LINES = 200;
const MAX_SUMMARY_CHARS = 320;

function clampSummary(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_SUMMARY_CHARS) return t;
  return `${t.slice(0, MAX_SUMMARY_CHARS - 1)}…`;
}

/** First non-empty line; strip common JSDoc line prefixes. */
function firstMeaningfulLine(text: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const t = line.replace(/^\s*\*+\s?/, '').trim();
    if (t) return t;
  }
  return null;
}

function stripLineOrBlockComment(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('//')) return t.replace(/^\/\/+\s?/, '').trim();
  if (t.startsWith('/*')) {
    return t
      .replace(/^\/\*\*?/, '')
      .replace(/\*\/\s*$/, '')
      .split(/\r?\n/)
      .map((ln) => ln.replace(/^\s*\*+\s?/, '').trim())
      .join('\n')
      .trim();
  }
  return t;
}

function summaryFromJSDoc(jsDoc: JSDoc): string | null {
  const desc = jsDoc.getDescription().trim();
  if (desc) {
    const line = firstMeaningfulLine(desc);
    if (line) return clampSummary(line);
  }

  const main = jsDoc.getCommentText()?.trim();
  if (main) {
    const line = firstMeaningfulLine(main);
    if (line) return clampSummary(line);
  }

  for (const tag of jsDoc.getTags()) {
    const n = tag.getTagName().toLowerCase();
    if (n === 'description' || n === 'desc' || n === 'summary') {
      const c = tag.getCommentText()?.trim();
      if (c) {
        const line = firstMeaningfulLine(c);
        if (line) return clampSummary(line);
      }
    }
  }

  return null;
}

/** `//` or `/*` immediately before the node (skip `/**` — those are JSDoc). */
function summaryFromLeadingPlainComment(node: FunctionDeclaration | MethodDeclaration): string | null {
  const full = node.getSourceFile().getFullText();
  for (const r of node.getLeadingCommentRanges()) {
    const raw = full.slice(r.getPos(), r.getEnd());
    if (raw.trimStart().startsWith('/**')) continue;
    const cleaned = stripLineOrBlockComment(raw);
    const line = firstMeaningfulLine(cleaned);
    if (line) return clampSummary(line);
  }
  return null;
}

/** "getUserById" → "Get user by id"; supports snake_case and Class.method (uses last segment). */
export function humanizeSymbolName(displayName: string): string {
  const last = displayName.includes('.') ? (displayName.split('.').pop() ?? displayName) : displayName;
  const spacedUnders = last.replace(/[_-]+/g, ' ').trim();
  const afterAcronym = spacedUnders.replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2');
  const splitCamel = afterAcronym
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!splitCamel) return displayName;
  return splitCamel.charAt(0).toUpperCase() + splitCamel.slice(1);
}

function shortenType(t: string, max: number): string {
  const one = t.replace(/\s+/g, ' ').trim();
  if (one.length <= max) return one;
  return `${one.slice(0, max - 1)}…`;
}

function heuristicContextSummary(displayName: string, node: FunctionDeclaration | MethodDeclaration): string {
  const title = humanizeSymbolName(displayName);
  const mod = node.isGenerator() ? ' (generator)' : node.isAsync() ? ' (async)' : '';

  const params = node.getParameters();
  let args: string;
  if (params.length === 0) args = 'Takes no arguments';
  else if (params.length === 1) args = `Takes 1 argument (${params[0].getName()})`;
  else {
    const ns = params
      .slice(0, 3)
      .map((p) => p.getName())
      .join(', ');
    args = `Takes ${params.length} arguments (${ns}${params.length > 3 ? ', …' : ''})`;
  }

  let ret = '';
  try {
    const rt = shortenType(node.getReturnType().getText(node), 88);
    if (rt === 'void' || rt === 'undefined') ret = '; returns nothing';
    else if (rt) ret = `; returns ${rt}`;
  } catch {
    /* type text can fail on rare nodes */
  }

  return `[heuristic] ${title}${mod}: ${args}${ret}.`;
}

function deriveContextSummary(displayName: string, node: FunctionDeclaration | MethodDeclaration): string {
  for (const jd of node.getJsDocs()) {
    const s = summaryFromJSDoc(jd);
    if (s) return s;
  }
  const plain = summaryFromLeadingPlainComment(node);
  if (plain) return plain;
  return heuristicContextSummary(displayName, node);
}

function lineSpan(fn: { getStartLineNumber: () => number; getEndLineNumber: () => number }): number {
  return fn.getEndLineNumber() - fn.getStartLineNumber() + 1;
}

export function extractFromSource(relativePath: string, sourceText: string): CardCandidate[] {
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile(relativePath, sourceText, { overwrite: true });
  const out: CardCandidate[] = [];

  for (const fn of sf.getFunctions()) {
    const name = fn.getName() ?? 'anonymous';
    if (fn.getBody() == null) continue;
    if (lineSpan(fn) > MAX_BODY_LINES) continue;
    const summary = deriveContextSummary(name, fn);
    out.push({
      sourcePath: relativePath,
      symbolName: name,
      snippetText: fn.getText(),
      lineStart: fn.getStartLineNumber(),
      lineEnd: fn.getEndLineNumber(),
      contextSummary: summary,
    });
  }

  for (const cls of sf.getClasses()) {
    for (const m of cls.getMethods()) {
      if (m.getBody() == null) continue;
      if (lineSpan(m) > MAX_BODY_LINES) continue;
      const name = `${cls.getName() ?? 'Class'}.${m.getName()}`;
      const summary = deriveContextSummary(name, m);
      out.push({
        sourcePath: relativePath,
        symbolName: name,
        snippetText: m.getText(),
        lineStart: m.getStartLineNumber(),
        lineEnd: m.getEndLineNumber(),
        contextSummary: summary,
      });
    }
  }

  return out;
}
