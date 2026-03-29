import { defineConfig } from 'drizzle-kit';

const dbPath = process.env.CODEPIECE_DB ?? 'data/codepiece.db';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: dbPath.startsWith('file:') ? dbPath : `file:${dbPath}` },
});
