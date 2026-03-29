import { Project } from 'ts-morph';
import type { CardCandidate } from './types';

const MAX_BODY_LINES = 200;

function firstLineFromJsDoc(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const line = t.split(/\r?\n/)[0]?.trim();
  return line || null;
}

function headBeforeBrace(node: { getText: () => string }): string {
  const t = node.getText();
  const i = t.indexOf('{');
  return (i === -1 ? t : t.slice(0, i)).replace(/\s+/g, ' ').trim();
}

function contextForFunction(name: string, node: { getText: () => string }): string {
  const sig = headBeforeBrace(node);
  return `[heuristic] ${name}${sig ? ` — ${sig}` : ''}`;
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
    const js = fn.getJsDocs()[0]?.getDescription().trim();
    const summary = firstLineFromJsDoc(js ?? '') ?? contextForFunction(name, fn);
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
      const js = m.getJsDocs()[0]?.getDescription().trim();
      const summary = firstLineFromJsDoc(js ?? '') ?? contextForFunction(name, m);
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
