import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export type FileMemoryEntry = {
  contentHash: string;
  status: 'processed' | 'skipped';
  reason?: string;
};

export type ScanMemoryFile = {
  version: 1;
  files: Record<string, FileMemoryEntry>;
};

export function emptyMemory(): ScanMemoryFile {
  return { version: 1, files: {} };
}

export function loadMemory(path: string): ScanMemoryFile {
  if (!existsSync(path)) return emptyMemory();
  try {
    const raw = readFileSync(path, 'utf8');
    const j = JSON.parse(raw) as ScanMemoryFile;
    if (j?.version !== 1 || typeof j.files !== 'object') return emptyMemory();
    return j;
  } catch {
    return emptyMemory();
  }
}

export function saveMemory(path: string, mem: ScanMemoryFile): void {
  const dir = dirname(path);
  if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(mem, null, 2), 'utf8');
}
