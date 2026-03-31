ALTER TABLE "reactor_materials"
ADD COLUMN IF NOT EXISTS "important" boolean DEFAULT false NOT NULL;
