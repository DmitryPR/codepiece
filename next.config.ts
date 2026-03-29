import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Native / runtime-specific drivers; do not bundle `bun:sqlite` for Node server.
  serverExternalPackages: ['better-sqlite3', 'bun:sqlite'],
};

export default nextConfig;
