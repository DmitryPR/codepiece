'use client';

import { useCpTheme, type CpThemeId } from './theme-context';

const OPTIONS: { id: CpThemeId; label: string }[] = [
  { id: 'classic', label: 'Original' },
  { id: 'harmony', label: 'Monochrome' },
  { id: 'elegance', label: 'Black & gold' },
];

export function ThemePicker() {
  const { theme, setTheme } = useCpTheme();

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      <span style={{ opacity: 0.75, whiteSpace: 'nowrap' }}>Theme</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as CpThemeId)}
        aria-label="Color theme"
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid var(--cp-border)',
          background: 'var(--cp-surface)',
          color: 'var(--cp-text)',
          cursor: 'pointer',
          fontSize: 13,
          maxWidth: 'min(200px, 50vw)',
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
