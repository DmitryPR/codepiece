import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodePiece',
  description: 'Swipe on code snippets',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
