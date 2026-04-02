ALTER TYPE "public"."reactor_material_type" ADD VALUE IF NOT EXISTS 'image';
--> statement-breakpoint
ALTER TABLE "reactor_materials" ADD COLUMN IF NOT EXISTS "meta" jsonb;
