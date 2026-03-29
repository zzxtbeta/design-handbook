ALTER TABLE "weeks" ADD COLUMN "week_key" varchar(32) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "weeks_week_key_unique" ON "weeks" USING btree ("week_key");