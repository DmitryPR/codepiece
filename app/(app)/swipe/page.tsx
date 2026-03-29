import { SwipeClient } from '../../swipe-client';

export default function SwipePage() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(16px, 4vw, 24px)' }}>
      <SwipeClient />
    </main>
  );
}
