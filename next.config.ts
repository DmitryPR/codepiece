import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Native driver for Node (`next dev` runs the CLI with Node). Bun-only `bun:sqlite` is
  // required only inside `openBun()` when `process.versions.bun` is set — do not list it
  // here (invalid package id can confuse Turbopack resolution on some setups).
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
