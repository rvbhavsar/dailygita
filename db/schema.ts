import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Replaces Supabase's hidden auth.users table.
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // Emails are stored lowercased; this enforces case-insensitive uniqueness
    // without requiring the citext extension.
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
  }),
);

export const passwordResets = pgTable('password_resets', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  dailyVerseEnabled: boolean('daily_verse_enabled').notNull().default(true),
  age: integer('age'),
  profession: text('profession'),
  maritalStatus: text('marital_status'),
  selectedChallenges: text('selected_challenges').array().notNull().default([]),
  isOnboarded: boolean('is_onboarded').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  chapterNumber: integer('chapter_number').notNull().unique(),
  name: text('name').notNull(),
  nameTransliterated: text('name_transliterated'),
  nameTranslated: text('name_translated'),
  versesCount: integer('verses_count').notNull().default(0),
  chapterSummary: text('chapter_summary'),
  chapterSummaryHindi: text('chapter_summary_hindi'),
});

export const verses = pgTable('verses', {
  id: serial('id').primaryKey(),
  verseId: integer('verse_id').notNull().unique(),
  chapterNumber: integer('chapter_number')
    .notNull()
    .references(() => chapters.chapterNumber, { onDelete: 'cascade' }),
  verseNumber: integer('verse_number').notNull(),
  text: text('text').notNull(),
  transliteration: text('transliteration'),
  wordMeanings: text('word_meanings'),
});

export const translations = pgTable('translations', {
  id: serial('id').primaryKey(),
  verseId: integer('verse_id')
    .notNull()
    .references(() => verses.verseId, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  language: text('language').notNull().default('english'),
  description: text('description').notNull(),
});

export const savedInsights = pgTable('saved_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // The client's composite verse key ("2-47"), not the global integer verse id.
  verseId: text('verse_id').notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  verseNumber: integer('verse_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  challengeId: text('challenge_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Promoted from localStorage now that per-user auth exists.
export const favorites = pgTable(
  'favorites',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chapterNumber: integer('chapter_number').notNull(),
    verseNumber: integer('verse_number').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.chapterNumber, t.verseNumber] }),
  }),
);

// Phase 2: populated by the verse/challenge analysis job.
export const verseChallenges = pgTable(
  'verse_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterNumber: integer('chapter_number').notNull(),
    verseNumber: integer('verse_number').notNull(),
    challenges: text('challenges').array().notNull().default([]),
    aiSummary: text('ai_summary'),
    // Plain-language theme words for retrieval (added in 0003). Bridges a
    // reader's words to a verse whose translation uses none of them.
    keywords: text('keywords'),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    verseIdx: uniqueIndex('verse_challenges_verse_idx').on(t.chapterNumber, t.verseNumber),
  }),
);

/**
 * Audio per verse. Two kinds, from different sources:
 * - 'recitation': authentic Sanskrit chanting hotlinked from the gita/gita
 *   dataset. Deepgram has no Sanskrit voice, and real recitation beats TTS.
 * - 'narration': English translation + insight, generated on demand by
 *   Deepgram and cached on disk.
 */
export const verseAudio = pgTable(
  'verse_audio',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterNumber: integer('chapter_number').notNull(),
    verseNumber: integer('verse_number').notNull(),
    kind: text('kind').notNull().default('recitation'),
    url: text('url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    verseIdx: uniqueIndex('verse_audio_verse_idx').on(t.chapterNumber, t.verseNumber, t.kind),
  }),
);

/**
 * Personal access keys for the MCP connector — how a user connects Daily Gita
 * to their own agent (Claude Desktop, Cursor, a programmatic client).
 *
 * Only the SHA-256 of the key is stored: a 256-bit random token needs no slow
 * KDF, and a plain hash keeps lookup O(1) on the unique index. The prefix is
 * kept in the clear so the UI can show "dg_live_abcd…" without the secret.
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

// ── OAuth 2.1 (co-hosted authorization server for the MCP connector) ──────────
// Lets ChatGPT / Claude.ai web connect via the standard OAuth flow, alongside
// the personal api_keys used by header-capable clients.

/** Dynamically-registered clients (RFC 7591). Public clients — no secret; PKCE
 *  is the code-exchange protection. */
export const oauthClients = pgTable('oauth_clients', {
  clientId: text('client_id').primaryKey(),
  clientName: text('client_name'),
  redirectUris: text('redirect_uris').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Short-lived authorization codes, single-use, bound to client + redirect +
 *  PKCE challenge + resource + user. Only the hash is stored. */
export const oauthAuthCodes = pgTable('oauth_auth_codes', {
  codeHash: text('code_hash').primaryKey(),
  clientId: text('client_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  redirectUri: text('redirect_uri').notNull(),
  codeChallenge: text('code_challenge').notNull(),
  resource: text('resource').notNull(),
  scope: text('scope').notNull().default(''),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
});

/** Access and refresh tokens (opaque, hashed). `resource` is the audience the
 *  token is bound to; `chainId` groups a refresh lineage so a reused (retired)
 *  refresh token can revoke the whole chain — the theft signal. */
export const oauthTokens = pgTable('oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  type: text('type').notNull(), // 'access' | 'refresh'
  clientId: text('client_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  resource: text('resource').notNull(),
  scope: text('scope').notNull().default(''),
  chainId: uuid('chain_id').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
