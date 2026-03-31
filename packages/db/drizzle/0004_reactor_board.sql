DO $$
BEGIN
	CREATE TYPE "public"."reactor_material_type" AS ENUM('diary', 'idea', 'prompt', 'link', 'sample');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reactor_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_index" serial NOT NULL,
	"day_key" varchar(10) NOT NULL,
	"type" "reactor_material_type" NOT NULL,
	"content" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"manual_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
