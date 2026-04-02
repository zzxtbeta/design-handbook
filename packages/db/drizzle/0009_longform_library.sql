DO $$ BEGIN
 CREATE TYPE "public"."longform_status" AS ENUM('draft', 'ready', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."longform_analysis_status" AS ENUM('idle', 'ready', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "longform_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_index" serial NOT NULL,
	"status" "longform_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"excerpt" text DEFAULT '' NOT NULL,
	"author_name" text DEFAULT '' NOT NULL,
	"source_platform" varchar(80),
	"source_url" text,
	"published_at" timestamp with time zone,
	"language" varchar(24) DEFAULT 'zh-CN' NOT NULL,
	"raw_text" text DEFAULT '' NOT NULL,
	"content_blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_image_path" text,
	"cover_caption" text DEFAULT '' NOT NULL,
	"cover_palette" jsonb,
	"analysis_status" "longform_analysis_status" DEFAULT 'idle' NOT NULL,
	"why_it_works" text DEFAULT '' NOT NULL,
	"framework" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resonance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reusable_moves" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"analysis_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "longform_analysis_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"why_it_works" text DEFAULT '' NOT NULL,
	"framework" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resonance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reusable_moves" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prompt_version" varchar(32) DEFAULT 'v1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "longform_analysis_runs" ADD CONSTRAINT "longform_analysis_runs_entry_id_longform_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."longform_entries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
