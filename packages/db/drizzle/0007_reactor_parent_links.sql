ALTER TABLE "reactor_materials"
ADD COLUMN IF NOT EXISTS "parent_id" uuid;
