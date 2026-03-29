/** Raw DDL kept in sync with `schema.ts` for environments without drizzle-kit push. */
export const INIT_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY NOT NULL,
  source_path TEXT NOT NULL,
  symbol_name TEXT NOT NULL,
  snippet_text TEXT NOT NULL,
  line_start INTEGER NOT NULL,
  line_end INTEGER NOT NULL,
  context_summary TEXT NOT NULL,
  repo_label TEXT NOT NULL,
  license TEXT NOT NULL,
  commit_sha TEXT
);
CREATE TABLE IF NOT EXISTS swipes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_swipes_user ON swipes (user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_card ON swipes (card_id);
`;
