CREATE TABLE IF NOT EXISTS "day_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"day_slot" "day_slot" NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'day_notes_week_id_weeks_id_fk'
	) THEN
		ALTER TABLE "day_notes" ADD CONSTRAINT "day_notes_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END
$$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "day_notes_week_id_day_slot_unique" ON "day_notes" USING btree ("week_id","day_slot");
