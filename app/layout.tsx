import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './theme-context';

export const metadata: Metadata = {
  title: 'CodePiece',
  description: 'Swipe on code snippets',
};

/** Must match CP_THEME_DEFAULT in theme-context.tsx */
const CP_THEME_SSR_DEFAULT = 'classic';

/** Runs before paint; raw <head> script — avoid next/script inline children (React 19 + hydration). */
const themeBoot = `(function(){var v=${JSON.stringify(CP_THEME_SSR_DEFAULT)};try{var t=localStorage.getItem("cp-theme");if(t==="elegance"||t==="classic"||t==="harmony")v=t;}catch(e){}document.documentElement.setAttribute("data-cp-theme",v);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-cp-theme={CP_THEME_SSR_DEFAULT} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
