import { readFileSync, existsSync, realpathSync } from 'fs';
import { relative, basename } from 'path';
import { getDb, resetDbCache } from '../db/client';
import { cards } from '../db/schema';
import { stableCardId } from '../lib/card-id';
import { listTsFiles, fileContentHash, readRepoLicenseHint } from './paths';
import { extractFromSource } from './extract';
import { loadMemory, saveMemory } from './memory';

export type ScanResult = {
  filesSeen: number;
  filesProcessed: number;
  filesSkipped: number;
  cardsUpserted: number;
};

export type RunScanOptions = {
  targetRepo?: string;
  memoryPath?: string;
  repoLabel?: string;
  licenseHint?: string;
};

export function runScan(options?: RunScanOptions): ScanResult {
  const targetRepo = options?.targetRepo ?? process.env.TARGET_REPO;
  if (!targetRepo?.trim()) {
    throw new Error('TARGET_REPO is required (absolute or relative path to a TypeScript project)');
  }

  const absRoot = realpathSync(targetRepo);
  if (!existsSync(absRoot)) throw new Error(`TARGET_REPO does not exist: ${absRoot}`);

  const memoryPath = options?.memoryPath ?? process.env.SCAN_MEMORY_PATH ?? 'data/scan-memory.json';
  const repoLabel = options?.repoLabel ?? process.env.REPO_LABEL ?? basename(absRoot);
  const licenseHint = options?.licenseHint ?? readRepoLicenseHint(absRoot);

  const mem = loadMemory(memoryPath);
  const db = getDb();

  let filesSeen = 0;
  let filesProcessed = 0;
  let filesSkipped = 0;
  let cardsUpserted = 0;

  const paths = listTsFiles(absRoot);

  for (const abs of paths) {
    filesSeen++;
    const rel = relative(absRoot, abs).replace(/\\/g, '/');
    const content = readFileSync(abs, 'utf8');
    const hash = fileContentHash(content);
    const prev = mem.files[rel];
    if (prev?.status === 'processed' && prev.contentHash === hash) {
      filesSkipped++;
      continue;
    }

    let candidates;
    try {
      candidates = extractFromSource(rel, content);
    } catch (e) {
      mem.files[rel] = { contentHash: hash, status: 'skipped', reason: `parse_error: ${String(e)}` };
      filesSkipped++;
      continue;
    }

    mem.files[rel] = { contentHash: hash, status: 'processed' };
    filesProcessed++;

    for (const c of candidates) {
      const id = stableCardId(repoLabel, c.sourcePath, c.symbolName);
      db.insert(cards)
        .values({
          id,
          sourcePath: c.sourcePath,
          symbolName: c.symbolName,
          snippetText: c.snippetText,
          lineStart: c.lineStart,
          lineEnd: c.lineEnd,
          contextSummary: c.contextSummary,
          repoLabel,
          license: licenseHint,
          commitSha: null,
        })
        .onConflictDoUpdate({
          target: cards.id,
          set: {
            sourcePath: c.sourcePath,
            symbolName: c.symbolName,
            snippetText: c.snippetText,
            lineStart: c.lineStart,
            lineEnd: c.lineEnd,
            contextSummary: c.contextSummary,
            repoLabel,
            license: licenseHint,
          },
        })
        .run();
      cardsUpserted++;
    }
  }

  saveMemory(memoryPath, mem);
  return { filesSeen, filesProcessed, filesSkipped, cardsUpserted };
}

export { resetDbCache };
