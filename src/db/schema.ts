import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  displayName: text('display_name'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  sourcePath: text('source_path').notNull(),
  symbolName: text('symbol_name').notNull(),
  snippetText: text('snippet_text').notNull(),
  lineStart: integer('line_start', { mode: 'number' }).notNull(),
  lineEnd: integer('line_end', { mode: 'number' }).notNull(),
  contextSummary: text('context_summary').notNull(),
  repoLabel: text('repo_label').notNull(),
  license: text('license').notNull(),
  commitSha: text('commit_sha'),
});

export const swipes = sqliteTable('swipes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cardId: text('card_id').notNull(),
  action: text('action').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const snippetMemos = sqliteTable(
  'snippet_memos',
  {
    userId: text('user_id').notNull(),
    cardId: text('card_id').notNull(),
    body: text('body').notNull(),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.cardId] }),
  }),
);
