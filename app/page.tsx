import { SwipeClient } from './swipe-client';

export default function Page() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>CodePiece</h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>Swipe right to like, left to skip.</p>
      <SwipeClient />
    </main>
  );
}
