-- Tracks daily wisdom emails so cron retries never double-send.
CREATE TABLE IF NOT EXISTS daily_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_date text NOT NULL,
  verse_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS daily_email_deliveries_user_date_idx
  ON daily_email_deliveries (user_id, delivery_date);
