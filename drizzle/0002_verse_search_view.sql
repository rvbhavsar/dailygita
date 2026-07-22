-- Weighted full-text search surface for verse retrieval.
--
-- The chat companion previously searched one translation row per verse, ranked
-- by a flat ts_rank over OR-ed terms. This aggregates every English source we
-- hold for a verse into a single weighted document:
--
--   A  the English translations (all of them, not just one) — primary meaning
--   B  the word-by-word meanings — Sanskrit term to English gloss, very dense
--   C  the chapter summary — thematic context, shared across the chapter
--
-- Weighting lets ts_rank_cd favour a verse whose *translation* is on-topic over
-- one that merely shares a word via its chapter summary, and cover-density
-- ranking rewards matches that sit close together. Both were flat before.

CREATE MATERIALIZED VIEW verse_search AS
SELECT
  v.verse_id,
  v.chapter_number,
  v.verse_number,
  v.text AS sanskrit,
  string_agg(DISTINCT te.description, ' ') AS translations,
  setweight(to_tsvector('english', coalesce(string_agg(DISTINCT te.description, ' '), '')), 'A') ||
  setweight(to_tsvector('english', coalesce(v.word_meanings, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(c.chapter_summary, '')), 'C') AS search_vector
FROM verses v
JOIN chapters c ON c.chapter_number = v.chapter_number
LEFT JOIN translations te ON te.verse_id = v.verse_id AND te.language = 'english'
GROUP BY v.verse_id, v.chapter_number, v.verse_number, v.text, v.word_meanings, c.chapter_summary;
--> statement-breakpoint
CREATE UNIQUE INDEX verse_search_verse_id_idx ON verse_search (verse_id);
--> statement-breakpoint
CREATE INDEX verse_search_vector_idx ON verse_search USING GIN (search_vector);
