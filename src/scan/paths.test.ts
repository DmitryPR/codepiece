import { describe, expect, test } from 'bun:test';
import { shouldSkipRelativePath, listTsFiles, fileContentHash, readRepoLicenseHint } from './paths';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('shouldSkipRelativePath', () => {
  test('skips node_modules', () => {
    expect(shouldSkipRelativePath('node_modules/foo.ts')).toBe(true);
  });
  test('skips nested dist', () => {
    expect(shouldSkipRelativePath('pkg/dist/index.ts')).toBe(true);
  });
  test('skips .d.ts via pattern in tree', () => {
    expect(shouldSkipRelativePath('types/index.d.ts')).toBe(true);
  });
  test('allows normal src', () => {
    expect(shouldSkipRelativePath('src/lib/foo.ts')).toBe(false);
  });
});

describe('listTsFiles', () => {
  const root = join(process.cwd(), 'tmp-test-walk-' + Date.now());
  test('lists .ts and skips node_modules', () => {
    try {
      mkdirSync(join(root, 'src'), { recursive: true });
      mkdirSync(join(root, 'node_modules', 'x'), { recursive: true });
      writeFileSync(join(root, 'src', 'a.ts'), 'export const a = 1');
      writeFileSync(join(root, 'node_modules', 'x', 'b.ts'), 'export const b = 1');
      const files = listTsFiles(root);
      expect(files.some((f) => f.endsWith('src/a.ts'))).toBe(true);
      expect(files.some((f) => f.includes('node_modules'))).toBe(false);
    } finally {
      if (existsSync(root)) rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('fileContentHash', () => {
  test('stable for same string', () => {
    expect(fileContentHash('abc')).toBe(fileContentHash('abc'));
  });
  test('differs for different string', () => {
    expect(fileContentHash('a')).not.toBe(fileContentHash('b'));
  });
});

describe('readRepoLicenseHint', () => {
  const root = join(process.cwd(), 'tmp-lic-' + Date.now());
  test('returns unknown when no license file', () => {
    mkdirSync(root, { recursive: true });
    expect(readRepoLicenseHint(root)).toBe('unknown');
    rmSync(root, { recursive: true, force: true });
  });
  test('reads first line of LICENSE', () => {
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, 'LICENSE'), 'MIT License\nmore');
    expect(readRepoLicenseHint(root)).toContain('MIT');
    rmSync(root, { recursive: true, force: true });
  });
});
