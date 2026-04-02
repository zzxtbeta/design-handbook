import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const daySlotEnum = pgEnum("day_slot", [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "weekend",
]);

export const entryStatusEnum = pgEnum("entry_status", [
  "processing",
  "ready",
  "failed",
]);

export const entrySourceEnum = pgEnum("entry_source", [
  "paste",
  "upload",
]);

export const entryTermSourceEnum = pgEnum("entry_term_source", [
  "gemini",
  "manual",
]);

export const reactorMaterialTypeEnum = pgEnum("reactor_material_type", [
  "diary",
  "idea",
  "prompt",
  "link",
  "sample",
  "image",
]);

export const longformStatusEnum = pgEnum("longform_status", [
  "draft",
  "ready",
  "archived",
]);

export const longformAnalysisStatusEnum = pgEnum("longform_analysis_status", [
  "idle",
  "ready",
  "failed",
]);

export const weeks = pgTable("weeks", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekKey: varchar("week_key", { length: 32 }).notNull(),
  weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
  weekEnd: timestamp("week_end", { withTimezone: true }).notNull(),
  weekLabel: varchar("week_label", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  weekKeyUnique: uniqueIndex("weeks_week_key_unique").on(table.weekKey),
  weekStartUnique: uniqueIndex("weeks_week_start_unique").on(table.weekStart),
}));

export const entries = pgTable("entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekId: uuid("week_id").notNull().references(() => weeks.id),
  daySlot: daySlotEnum("day_slot").notNull(),
  imageUrl: text("image_url").notNull(),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  promptSummary: text("prompt_summary"),
  status: entryStatusEnum("status").notNull().default("processing"),
  errorMessage: text("error_message"),
  decorationStyle: varchar("decoration_style", { length: 32 }).notNull(),
  sourceType: entrySourceEnum("source_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const entryTerms = pgTable("entry_terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id").notNull().references(() => entries.id),
  term: varchar("term", { length: 120 }).notNull(),
  position: integer("position").notNull(),
  source: entryTermSourceEnum("source").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weekNotes = pgTable("week_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekId: uuid("week_id").notNull().references(() => weeks.id),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  weekIdUnique: uniqueIndex("week_notes_week_id_unique").on(table.weekId),
}));

export const dayNotes = pgTable("day_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekId: uuid("week_id").notNull().references(() => weeks.id),
  daySlot: daySlotEnum("day_slot").notNull(),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  weekDayUnique: uniqueIndex("day_notes_week_id_day_slot_unique").on(table.weekId, table.daySlot),
}));

export const reactorMaterials = pgTable("reactor_materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderIndex: serial("order_index").notNull(),
  dayKey: varchar("day_key", { length: 10 }).notNull(),
  parentId: uuid("parent_id"),
  type: reactorMaterialTypeEnum("type").notNull(),
  content: text("content").notNull(),
  important: boolean("important").notNull().default(false),
  note: text("note").notNull().default(""),
  manualTags: jsonb("manual_tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  meta: jsonb("meta").$type<{
    sourceUrl?: string;
    previewTitle?: string;
    siteName?: string;
    previewImageUrl?: string;
    imageUrl?: string;
    imageWidth?: number | null;
    imageHeight?: number | null;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const longformEntries = pgTable("longform_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderIndex: serial("order_index").notNull(),
  status: longformStatusEnum("status").notNull().default("draft"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  excerpt: text("excerpt").notNull().default(""),
  authorName: text("author_name").notNull().default(""),
  sourcePlatform: varchar("source_platform", { length: 80 }),
  sourceUrl: text("source_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  language: varchar("language", { length: 24 }).notNull().default("zh-CN"),
  rawText: text("raw_text").notNull().default(""),
  contentBlocks: jsonb("content_blocks").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  coverImagePath: text("cover_image_path"),
  coverCaption: text("cover_caption").notNull().default(""),
  coverPalette: jsonb("cover_palette").$type<[string, string, string] | null>(),
  analysisStatus: longformAnalysisStatusEnum("analysis_status").notNull().default("idle"),
  whyItWorks: text("why_it_works").notNull().default(""),
  framework: jsonb("framework").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  resonance: jsonb("resonance").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  reusableMoves: jsonb("reusable_moves").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  analysisUpdatedAt: timestamp("analysis_updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const longformAnalysisRuns = pgTable("longform_analysis_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id").notNull().references(() => longformEntries.id),
  whyItWorks: text("why_it_works").notNull().default(""),
  framework: jsonb("framework").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  resonance: jsonb("resonance").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  reusableMoves: jsonb("reusable_moves").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  promptVersion: varchar("prompt_version", { length: 32 }).notNull().default("v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
