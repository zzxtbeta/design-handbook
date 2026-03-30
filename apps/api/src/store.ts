import { asc, eq, inArray } from "drizzle-orm";
import {
  dayNotes,
  entries,
  entryTerms,
  weekNotes,
  weeks,
  type daySlotEnum,
} from "@handbook/db";
import { db } from "./db";

export type DaySlot = (typeof daySlotEnum.enumValues)[number];
export type EntryStatus = "processing" | "ready" | "failed";

export interface EntryTerm {
  id: string;
  term: string;
  position: number;
  deletedAt: string | null;
}

export interface Entry {
  id: string;
  daySlot: DaySlot;
  title: string;
  promptSummary: string | null;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  status: EntryStatus;
  errorMessage: string | null;
  decorationStyle: "amber" | "pink" | "sage" | "blue";
  createdAt: string;
  updatedAt: string;
  terms: EntryTerm[];
}

export interface WeekRecord {
  weekKey: string;
  weekNumber: number;
  label: string;
  dayNumbers: Record<DaySlot, string>;
  note: string;
  dayNotes: Record<DaySlot, string>;
  entries: Entry[];
}

const decorationStyles = ["amber", "pink", "sage", "blue"] as const;

export async function getWeek(weekKey: string) {
  const normalized = normalizedWeekKey(weekKey);
  const record = await ensureWeekRecord(normalized);
  return buildWeekRecord(record, normalized);
}

export async function createEntry(input: {
  weekKey: string;
  daySlot: DaySlot;
  imageUrl: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
}) {
  const normalized = normalizedWeekKey(input.weekKey);
  const week = await ensureWeekRecord(normalized);
  const now = new Date();

  const [entry] = await db
    .insert(entries)
    .values({
      weekId: week.id,
      daySlot: input.daySlot,
      imageUrl: input.imageUrl,
      imageWidth: input.imageWidth ?? null,
      imageHeight: input.imageHeight ?? null,
      promptSummary: null,
      status: "processing",
      errorMessage: null,
      decorationStyle:
        decorationStyles[Math.floor(Math.random() * decorationStyles.length)],
      sourceType: "paste",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapEntry(entry, []);
}

export async function getEntry(entryId: string) {
  const [entry] = await db.select().from(entries).where(eq(entries.id, entryId));

  if (!entry) {
    return null;
  }

  const terms = await db
    .select()
    .from(entryTerms)
    .where(eq(entryTerms.entryId, entry.id))
    .orderBy(asc(entryTerms.position));

  return mapEntry(entry, terms);
}

export async function updateWeekNote(weekKey: string, content: string) {
  const normalized = normalizedWeekKey(weekKey);
  const week = await ensureWeekRecord(normalized);
  const existing = await db
    .select()
    .from(weekNotes)
    .where(eq(weekNotes.weekId, week.id));

  if (existing[0]) {
    await db
      .update(weekNotes)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(weekNotes.id, existing[0].id));
  } else {
    await db.insert(weekNotes).values({
      weekId: week.id,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return getWeek(normalized);
}

export async function updateDayNote(weekKey: string, daySlot: DaySlot, content: string) {
  const normalized = normalizedWeekKey(weekKey);
  const week = await ensureWeekRecord(normalized);
  const existing = await db
    .select()
    .from(dayNotes)
    .where(eq(dayNotes.weekId, week.id))
    .then((rows) => rows.find((row) => row.daySlot === daySlot));

  if (existing) {
    await db
      .update(dayNotes)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(dayNotes.id, existing.id));
  } else {
    await db.insert(dayNotes).values({
      weekId: week.id,
      daySlot,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return getWeek(normalized);
}

export async function markEntryReady(
  entryId: string,
  payload: {
    terms: string[];
    promptSummary: string | null;
  },
) {
  const timestamp = new Date();

  const [updated] = await db
    .update(entries)
    .set({
      promptSummary: payload.promptSummary,
      status: "ready",
      errorMessage: null,
      updatedAt: timestamp,
    })
    .where(eq(entries.id, entryId))
    .returning();

  if (!updated) {
    return null;
  }

  await db.delete(entryTerms).where(eq(entryTerms.entryId, entryId));

  if (payload.terms.length > 0) {
    await db.insert(entryTerms).values(
      payload.terms.map((term, index) => ({
        entryId,
        term,
        position: index,
        source: "gemini" as const,
        createdAt: timestamp,
      })),
    );
  }

  return getEntry(entryId);
}

export async function markEntryFailed(entryId: string, message: string) {
  const [updated] = await db
    .update(entries)
    .set({
      status: "failed",
      errorMessage: message,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, entryId))
    .returning();

  if (!updated) {
    return null;
  }

  return getEntry(entryId);
}

export async function deleteEntryTerm(termId: string) {
  const [updated] = await db
    .update(entryTerms)
    .set({
      deletedAt: new Date(),
    })
    .where(eq(entryTerms.id, termId))
    .returning();

  if (!updated) {
    return null;
  }

  await db
    .update(entries)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(entries.id, updated.entryId));

  return {
    entryId: updated.entryId,
    termId,
  };
}

export async function deleteEntry(entryId: string) {
  const [existing] = await db.select().from(entries).where(eq(entries.id, entryId));

  if (!existing) {
    return null;
  }

  await db.delete(entryTerms).where(eq(entryTerms.entryId, entryId));

  const [deleted] = await db
    .delete(entries)
    .where(eq(entries.id, entryId))
    .returning();

  if (!deleted) {
    return null;
  }

  return {
    entryId,
    imageUrl: existing.imageUrl,
  };
}

export async function moveEntryToDay(entryId: string, daySlot: DaySlot) {
  const [updated] = await db
    .update(entries)
    .set({
      daySlot,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, entryId))
    .returning();

  if (!updated) {
    return null;
  }

  return getEntry(entryId);
}

async function ensureWeekRecord(weekKey: string) {
  const offset = parseWeekOffset(weekKey);
  const metadata = weekMetadata(offset);

  const existing = await db
    .select()
    .from(weeks)
    .where(eq(weeks.weekKey, metadata.storageKey));

  if (existing[0]) {
    await ensureWeekNote(existing[0].id, defaultWeekNote(offset, metadata.weekNumber));
    await seedWeekEntries(existing[0].id, offset);
    return existing[0];
  }

  const [created] = await db
    .insert(weeks)
    .values({
      weekKey: metadata.storageKey,
      weekStart: metadata.weekStart,
      weekEnd: metadata.weekEnd,
      weekLabel: metadata.label,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await ensureWeekNote(created.id, defaultWeekNote(offset, metadata.weekNumber));
  await seedWeekEntries(created.id, offset);
  return created;
}

async function ensureWeekNote(weekId: string, content: string) {
  const existing = await db
    .select()
    .from(weekNotes)
    .where(eq(weekNotes.weekId, weekId));

  if (!existing[0]) {
    await db.insert(weekNotes).values({
      weekId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

async function seedWeekEntries(weekId: string, offset: number) {
  const existing = await db.select().from(entries).where(eq(entries.weekId, weekId));
  if (existing.length > 0 || offset !== 0) {
    return;
  }
}

async function buildWeekRecord(
  week: typeof weeks.$inferSelect,
  responseWeekKey: string,
): Promise<WeekRecord> {
  const metadata = weekMetadata(offsetFromWeekStart(week.weekStart));
  const noteRows = await db
    .select()
    .from(weekNotes)
    .where(eq(weekNotes.weekId, week.id));
  const dayNoteRows = await db
    .select()
    .from(dayNotes)
    .where(eq(dayNotes.weekId, week.id));

  const entryRows = await db
    .select()
    .from(entries)
    .where(eq(entries.weekId, week.id))
    .orderBy(entries.createdAt);

  const entryIds = entryRows.map((entry) => entry.id);
  const termRows =
    entryIds.length === 0
      ? []
      : await db
          .select()
          .from(entryTerms)
          .where(inArray(entryTerms.entryId, entryIds))
          .orderBy(asc(entryTerms.position));

  const termsByEntry = new Map<string, typeof termRows>();
  for (const termRow of termRows) {
    const list = termsByEntry.get(termRow.entryId) ?? [];
    list.push(termRow);
    termsByEntry.set(termRow.entryId, list);
  }

  return {
    weekKey: responseWeekKey,
    weekNumber: metadata.weekNumber,
    label: week.weekLabel,
    dayNumbers: metadata.dayNumbers,
    note: noteRows[0]?.content ?? "",
    dayNotes: {
      mon: dayNoteRows.find((row) => row.daySlot === "mon")?.content ?? "",
      tue: dayNoteRows.find((row) => row.daySlot === "tue")?.content ?? "",
      wed: dayNoteRows.find((row) => row.daySlot === "wed")?.content ?? "",
      thu: dayNoteRows.find((row) => row.daySlot === "thu")?.content ?? "",
      fri: dayNoteRows.find((row) => row.daySlot === "fri")?.content ?? "",
      weekend: dayNoteRows.find((row) => row.daySlot === "weekend")?.content ?? "",
    },
    entries: entryRows
      .map((entry) => mapEntry(entry, termsByEntry.get(entry.id) ?? []))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  };
}

function mapEntry(
  entry: typeof entries.$inferSelect,
  terms: (typeof entryTerms.$inferSelect)[],
): Entry {
  const visibleTerms = terms
    .filter((term) => term.deletedAt === null)
    .sort((a, b) => a.position - b.position);

  return {
    id: entry.id,
    daySlot: entry.daySlot,
    title: visibleTerms[0]?.term ?? "New inspiration",
    promptSummary: entry.promptSummary,
    imageUrl: entry.imageUrl,
    imageWidth: entry.imageWidth,
    imageHeight: entry.imageHeight,
    status: entry.status,
    errorMessage: entry.errorMessage,
    decorationStyle: entry.decorationStyle as Entry["decorationStyle"],
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    terms: visibleTerms.map((term) => ({
      id: term.id,
      term: term.term,
      position: term.position,
      deletedAt: term.deletedAt?.toISOString() ?? null,
    })),
  };
}

function normalizedWeekKey(input: string) {
  return input === "current" ? "offset-0" : input;
}

function parseWeekOffset(weekKey: string) {
  const match = weekKey.match(/^offset-(-?\d+)$/);
  return match ? Number(match[1]) : 0;
}

function defaultWeekNote(offset: number, weekNumber: number) {
  return offset === 0
    ? "这一周先把贴图 -> 提词 -> 回看闭环做顺，不急着上分析面板。"
    : `这是第 ${weekNumber} 周的视觉手帐。重点看时间感和回看体验。`;
}

function weekMetadata(offset: number) {
  const base = startOfWeek(new Date());
  base.setDate(base.getDate() + offset * 7);

  const weekStart = new Date(base);
  const weekEnd = new Date(base);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    weekStart,
    weekEnd,
    storageKey: isoDateKey(weekStart),
    weekNumber: isoWeekNumber(weekStart),
    label: `${monthDayLabel(weekStart)} - ${monthDayLabel(weekEnd)}`,
    dayNumbers: {
      mon: padDay(weekStart),
      tue: padDay(addDays(weekStart, 1)),
      wed: padDay(addDays(weekStart, 2)),
      thu: padDay(addDays(weekStart, 3)),
      fri: padDay(addDays(weekStart, 4)),
      weekend: padDay(addDays(weekStart, 5)),
    } satisfies Record<DaySlot, string>,
  };
}

function offsetFromWeekStart(weekStart: Date) {
  const currentWeekStart = startOfWeek(new Date());
  const diffMs = weekStart.getTime() - currentWeekStart.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date: Date, value: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + value);
  return copy;
}

function padDay(date: Date) {
  return String(date.getDate()).padStart(2, "0");
}

function monthDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(date);
}

function isoDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isoWeekNumber(date: Date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);

  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }

  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}
