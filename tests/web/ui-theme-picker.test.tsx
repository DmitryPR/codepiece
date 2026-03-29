import './happy-dom-globals';
import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../app/theme-context';
import { ThemePicker } from '../../app/theme-picker';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-cp-theme');
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

describe('ThemePicker (UI)', () => {
  test('lists Original first, then Monochrome, then Black & gold', () => {
    const view = render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>,
    );
    const sel = view.getByRole('combobox', { name: /color theme/i });
    const labels = Array.from(sel.querySelectorAll('option')).map((o) => (o as HTMLOptionElement).textContent);
    expect(labels).toEqual(['Original', 'Monochrome', 'Black & gold']);
  });

  test('changing theme updates html data-cp-theme and localStorage', () => {
    const view = render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>,
    );
    const sel = view.getByRole('combobox', { name: /color theme/i });
    fireEvent.change(sel, { target: { value: 'elegance' } });
    expect(document.documentElement.getAttribute('data-cp-theme')).toBe('elegance');
    expect(localStorage.getItem('cp-theme')).toBe('elegance');

    fireEvent.change(sel, { target: { value: 'harmony' } });
    expect(document.documentElement.getAttribute('data-cp-theme')).toBe('harmony');
    expect(localStorage.getItem('cp-theme')).toBe('harmony');
  });

  test('default selection is Original (classic)', () => {
    const view = render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>,
    );
    const sel = view.getByRole('combobox', { name: /color theme/i }) as HTMLSelectElement;
    expect(sel.value).toBe('classic');
  });
});
