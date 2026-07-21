DROP INDEX "verse_audio_verse_idx";--> statement-breakpoint
ALTER TABLE "verse_audio" ADD COLUMN "kind" text DEFAULT 'recitation' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "verse_audio_verse_idx" ON "verse_audio" USING btree ("chapter_number","verse_number","kind");