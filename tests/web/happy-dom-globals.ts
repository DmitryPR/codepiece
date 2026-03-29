/**
 * Registers happy-dom globals for React Testing Library (import before RTL / components).
 * Safe to import from multiple UI test files; registers once.
 */
import { GlobalWindow } from 'happy-dom';

declare global {
  var __CODEPIECE_HAPPY_WINDOW__: GlobalWindow | undefined;
}

if (globalThis.__CODEPIECE_HAPPY_WINDOW__ == null) {
  const w = new GlobalWindow({ url: 'http://localhost:4000/' });
  globalThis.__CODEPIECE_HAPPY_WINDOW__ = w;
  globalThis.window = w as unknown as Window & typeof globalThis;
  globalThis.document = w.document;
  globalThis.navigator = w.navigator;
  globalThis.HTMLElement = w.HTMLElement as unknown as typeof HTMLElement;
  globalThis.Element = w.Element as unknown as typeof Element;
  globalThis.Node = w.Node as unknown as typeof Node;
  globalThis.Text = w.Text as unknown as typeof Text;
  globalThis.DocumentFragment = w.DocumentFragment as unknown as typeof DocumentFragment;
  globalThis.customElements = w.customElements;
  globalThis.MutationObserver = w.MutationObserver;
  globalThis.getComputedStyle = w.getComputedStyle.bind(w);
  globalThis.requestAnimationFrame = w.requestAnimationFrame.bind(w);
  globalThis.cancelAnimationFrame = w.cancelAnimationFrame.bind(w);
  globalThis.FileReader = w.FileReader as unknown as typeof FileReader;
  globalThis.HTMLSelectElement = w.HTMLSelectElement as unknown as typeof HTMLSelectElement;
  globalThis.HTMLButtonElement = w.HTMLButtonElement as unknown as typeof HTMLButtonElement;
  globalThis.HTMLTextAreaElement = w.HTMLTextAreaElement as unknown as typeof HTMLTextAreaElement;
  globalThis.localStorage = w.localStorage;
  globalThis.sessionStorage = w.sessionStorage;
}

if (document.body == null) {
  const html = document.createElement('html');
  const body = document.createElement('body');
  html.appendChild(body);
  document.appendChild(html);
}
