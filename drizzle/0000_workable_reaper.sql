CREATE TABLE "chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"chapter_number" integer NOT NULL,
	"name" text NOT NULL,
	"name_transliterated" text,
	"name_translated" text,
	"verses_count" integer DEFAULT 0 NOT NULL,
	"chapter_summary" text,
	"chapter_summary_hindi" text,
	CONSTRAINT "chapters_chapter_number_unique" UNIQUE("chapter_number")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" uuid NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_chapter_number_verse_number_pk" PRIMARY KEY("user_id","chapter_number","verse_number")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"daily_verse_enabled" boolean DEFAULT true NOT NULL,
	"age" integer,
	"profession" text,
	"marital_status" text,
	"selected_challenges" text[] DEFAULT '{}' NOT NULL,
	"is_onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "saved_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"verse_id" text NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"challenge_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"verse_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"language" text DEFAULT 'english' NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_audio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL,
	"challenges" text[] DEFAULT '{}' NOT NULL,
	"ai_summary" text,
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verses" (
	"id" serial PRIMARY KEY NOT NULL,
	"verse_id" integer NOT NULL,
	"chapter_number" integer NOT NULL,
	"verse_number" integer NOT NULL,
	"text" text NOT NULL,
	"transliteration" text,
	"word_meanings" text,
	CONSTRAINT "verses_verse_id_unique" UNIQUE("verse_id")
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_insights" ADD CONSTRAINT "saved_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translations" ADD CONSTRAINT "translations_verse_id_verses_verse_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("verse_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verses" ADD CONSTRAINT "verses_chapter_number_chapters_chapter_number_fk" FOREIGN KEY ("chapter_number") REFERENCES "public"."chapters"("chapter_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "verse_audio_verse_idx" ON "verse_audio" USING btree ("chapter_number","verse_number");--> statement-breakpoint
CREATE UNIQUE INDEX "verse_challenges_verse_idx" ON "verse_challenges" USING btree ("chapter_number","verse_number");