import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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

export const weeks = pgTable("weeks", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
  weekEnd: timestamp("week_end", { withTimezone: true }).notNull(),
  weekLabel: varchar("week_label", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const entries = pgTable("entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekId: uuid("week_id").notNull().references(() => weeks.id),
  daySlot: daySlotEnum("day_slot").notNull(),
  imageUrl: text("image_url").notNull(),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
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
});
