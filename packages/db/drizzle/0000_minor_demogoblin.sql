CREATE TYPE "public"."day_slot" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'weekend');--> statement-breakpoint
CREATE TYPE "public"."entry_source" AS ENUM('paste', 'upload');--> statement-breakpoint
CREATE TYPE "public"."entry_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."entry_term_source" AS ENUM('gemini', 'manual');--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"day_slot" "day_slot" NOT NULL,
	"image_url" text NOT NULL,
	"image_width" integer,
	"image_height" integer,
	"status" "entry_status" DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"decoration_style" varchar(32) NOT NULL,
	"source_type" "entry_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"term" varchar(120) NOT NULL,
	"position" integer NOT NULL,
	"source" "entry_term_source" NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "week_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" timestamp with time zone NOT NULL,
	"week_end" timestamp with time zone NOT NULL,
	"week_label" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_terms" ADD CONSTRAINT "entry_terms_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_notes" ADD CONSTRAINT "week_notes_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "week_notes_week_id_unique" ON "week_notes" USING btree ("week_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weeks_week_start_unique" ON "weeks" USING btree ("week_start");