-- Fold AI-generated thematic enrichment into the verse search surface.
--
-- verse_challenges gains a `keywords` column: modern, plain-language words for
-- what a verse is *about* ("fear, courage, self-doubt, encouragement") — the
-- vocabulary that bridges a reader saying "I'm afraid" to a verse whose
-- translation says "faint-heartedness". The 8 challenge tags and ai_summary
-- already exist on the table.
--
-- The verse_search view is rebuilt to weight those keywords highly (B, just
-- under the scripture itself) alongside the existing translations / word
-- meanings / chapter summary. Populated by scripts/enrich-verses.ts, then the
-- view is refreshed.

ALTER TABLE verse_challenges ADD COLUMN IF NOT EXISTS keywords text;
--> statement-breakpoint
DROP MATERIALIZED VIEW IF EXISTS verse_search;
--> statement-breakpoint
CREATE MATERIALIZED VIEW verse_search AS
SELECT
  v.verse_id,
  v.chapter_number,
  v.verse_number,
  v.text AS sanskrit,
  string_agg(DISTINCT te.description, ' ') AS translations,
  setweight(to_tsvector('english', coalesce(string_agg(DISTINCT te.description, ' '), '')), 'A') ||
  setweight(to_tsvector('english', coalesce(vc.keywords, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(v.word_meanings, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(vc.ai_summary, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(c.chapter_summary, '')), 'D') AS search_vector
FROM verses v
JOIN chapters c ON c.chapter_number = v.chapter_number
LEFT JOIN translations te ON te.verse_id = v.verse_id AND te.language = 'english'
LEFT JOIN verse_challenges vc
       ON vc.chapter_number = v.chapter_number AND vc.verse_number = v.verse_number
GROUP BY v.verse_id, v.chapter_number, v.verse_number, v.text, v.word_meanings,
         vc.keywords, vc.ai_summary, c.chapter_summary;
--> statement-breakpoint
CREATE UNIQUE INDEX verse_search_verse_id_idx ON verse_search (verse_id);
--> statement-breakpoint
CREATE INDEX verse_search_vector_idx ON verse_search USING GIN (search_vector);
