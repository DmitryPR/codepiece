import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: 12 }}>Page not found</h1>
      <Link href="/" style={{ color: 'var(--cp-accent, #2563eb)' }}>
        Back to home
      </Link>
    </div>
  );
}
