import { HomeClient } from '../home-client';

export default function Page() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(16px, 4vw, 24px)' }}>
      <HomeClient />
    </main>
  );
}
