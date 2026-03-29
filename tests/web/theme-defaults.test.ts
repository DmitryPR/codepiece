import { describe, expect, test } from 'bun:test';
import { CP_THEME_DEFAULT, CP_THEME_STORAGE_KEY } from '../../app/theme-context';

describe('theme defaults (no DOM)', () => {
  test('CP_THEME_DEFAULT is classic (Original)', () => {
    expect(CP_THEME_DEFAULT).toBe('classic');
  });

  test('storage key is stable', () => {
    expect(CP_THEME_STORAGE_KEY).toBe('cp-theme');
  });
});
