import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from './theme-context';

export const metadata: Metadata = {
  title: 'CodePiece',
  description: 'Swipe on code snippets',
};

const themeBoot = `(function(){var v="classic";try{var t=localStorage.getItem("cp-theme");if(t==="elegance"||t==="classic"||t==="harmony")v=t;}catch(e){}document.documentElement.setAttribute("data-cp-theme",v);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="cp-theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
