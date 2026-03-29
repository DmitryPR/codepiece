import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from './theme-context';

export const metadata: Metadata = {
  title: 'CodePiece',
  description: 'Swipe on code snippets',
};

/** Must match CP_THEME_DEFAULT in theme-context.tsx and default in public/theme-boot.js */
const CP_THEME_SSR_DEFAULT = 'classic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-cp-theme={CP_THEME_SSR_DEFAULT} suppressHydrationWarning>
      <body>
        {/**
         * External file + beforeInteractive: inline <script> in RSC triggered React 19
         * "Encountered a script tag while rendering…" and confused hydration next to flight scripts.
         */}
        <Script id="cp-theme-boot" strategy="beforeInteractive" src="/theme-boot.js" />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
