import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  'coverage',
  '__pycache__',
]);

/** True if path segment or file should be skipped (generated-ish). */
export function shouldSkipRelativePath(rel: string): boolean {
  const norm = rel.replace(/\\/g, '/');
  const parts = norm.split('/');
  for (const p of parts) {
    if (SKIP_DIRS.has(p)) return true;
    if (p.endsWith('.generated.ts')) return true;
  }
  if (norm.endsWith('.d.ts')) return true;
  return false;
}

export function listTsFiles(rootAbs: string): string[] {
  const out: string[] = [];

  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const abs = join(dir, e.name);
      const rel = relative(rootAbs, abs).replace(/\\/g, '/');
      if (shouldSkipRelativePath(rel)) continue;
      if (e.isDirectory()) walk(abs);
      else if (e.isFile() && e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) {
        out.push(abs);
      }
    }
  }

  walk(rootAbs);
  return out.sort();
}

export function fileContentHash(content: string): string {
  let h = 2166136261;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function readRepoLicenseHint(repoRoot: string): string {
  for (const name of ['LICENSE', 'LICENSE.md', 'COPYING']) {
    const p = join(repoRoot, name);
    if (!existsSync(p)) continue;
    try {
      const line = readFileSync(p, 'utf8').split(/\r?\n/)[0]?.trim() ?? '';
      if (line.length > 120) return line.slice(0, 117) + '...';
      return line || 'unknown';
    } catch {
      return 'unknown';
    }
  }
  return 'unknown';
}
