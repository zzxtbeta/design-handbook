export type DaySlot = "mon" | "tue" | "wed" | "thu" | "fri" | "weekend";
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
  entries: Entry[];
}

const decorationStyles = ["amber", "pink", "sage", "blue"] as const;

const weeks = new Map<string, WeekRecord>();

function now() {
  return new Date().toISOString();
}

export function createTerm(term: string, position: number): EntryTerm {
  return {
    id: crypto.randomUUID(),
    term,
    position,
    deletedAt: null,
  };
}

function seedWeek(weekKey: string): WeekRecord {
  const offset = parseWeekOffset(weekKey);
  const metadata = weekMetadata(offset);
  const record: WeekRecord = {
    weekKey: normalizedWeekKey(weekKey),
    weekNumber: metadata.weekNumber,
    label: metadata.label,
    dayNumbers: metadata.dayNumbers,
    note:
      offset === 0
        ? "这一周先把贴图 -> 提词 -> 回看闭环做顺，不急着上分析面板。"
        : `这是第 ${metadata.weekNumber} 周的视觉手帐。重点看时间感和回看体验。`,
    entries: [
      {
        id: crypto.randomUUID(),
        daySlot: "mon",
        title: offset === 0 ? "Warm editorial" : "Editorial memory",
        imageUrl:
          "/seed/warm-editorial.svg?data=" +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#f3d1a7"/><stop offset="1" stop-color="#f8efe1"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="40" y="160" font-size="32" fill="#6b4424">${offset === 0 ? "Warm editorial" : "Editorial memory"}</text></svg>`,
          ),
        imageWidth: 400,
        imageHeight: 300,
        status: "ready",
        errorMessage: null,
        decorationStyle: "amber",
        createdAt: now(),
        updatedAt: now(),
        terms: [
          "editorial layout",
          "paper texture",
          "soft shadow",
          "warm neutral palette",
        ].map(createTerm),
      },
      {
        id: crypto.randomUUID(),
        daySlot: "wed",
        title: "Soft glass note",
        imageUrl:
          "/seed/soft-glass.svg?data=" +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 420"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#d5ece9"/><stop offset="1" stop-color="#f9f5ef"/></linearGradient></defs><rect width="320" height="420" fill="url(#g)"/><circle cx="160" cy="170" r="100" fill="#ffffff88"/><text x="70" y="350" font-size="26" fill="#425458">soft glass</text></svg>`,
          ),
        imageWidth: 320,
        imageHeight: 420,
        status: "ready",
        errorMessage: null,
        decorationStyle: "sage",
        createdAt: now(),
        updatedAt: now(),
        terms: [
          "glassmorphism",
          "soft blur",
          "airy spacing",
          "translucent layer",
        ].map(createTerm),
      },
    ],
  };

  weeks.set(record.weekKey, record);
  return record;
}

export function getWeek(weekKey: string) {
  const normalized = normalizedWeekKey(weekKey);
  return structuredClone(weeks.get(normalized) ?? seedWeek(normalized));
}

export function createEntry(input: {
  weekKey: string;
  daySlot: DaySlot;
  imageUrl: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
}) {
  const normalized = normalizedWeekKey(input.weekKey);
  const record = weeks.get(normalized) ?? seedWeek(normalized);
  const entry: Entry = {
    id: crypto.randomUUID(),
    daySlot: input.daySlot,
    title: "New inspiration",
    imageUrl: input.imageUrl,
    imageWidth: input.imageWidth ?? null,
    imageHeight: input.imageHeight ?? null,
    status: "processing",
    errorMessage: null,
    decorationStyle:
      decorationStyles[Math.floor(Math.random() * decorationStyles.length)],
    createdAt: now(),
    updatedAt: now(),
    terms: [],
  };

  record.entries.unshift(entry);
  weeks.set(normalized, record);

  return structuredClone(entry);
}

export function getEntry(entryId: string) {
  for (const week of weeks.values()) {
    const entry = week.entries.find((candidate) => candidate.id === entryId);
    if (entry) {
      return structuredClone(entry);
    }
  }

  return null;
}

export function updateWeekNote(weekKey: string, content: string) {
  const normalized = normalizedWeekKey(weekKey);
  const record = weeks.get(normalized) ?? seedWeek(normalized);
  record.note = content;
  weeks.set(normalized, record);
  return structuredClone(record);
}

export function markEntryReady(entryId: string, terms: string[]) {
  for (const week of weeks.values()) {
    const entry = week.entries.find((candidate) => candidate.id === entryId);
    if (!entry) {
      continue;
    }

    entry.status = "ready";
    entry.errorMessage = null;
    entry.title = terms[0] ?? "Untitled entry";
    entry.terms = terms.map(createTerm);
    entry.updatedAt = now();
    return structuredClone(entry);
  }

  return null;
}

export function markEntryFailed(entryId: string, message: string) {
  for (const week of weeks.values()) {
    const entry = week.entries.find((candidate) => candidate.id === entryId);
    if (!entry) {
      continue;
    }

    entry.status = "failed";
    entry.errorMessage = message;
    entry.updatedAt = now();
    return structuredClone(entry);
  }

  return null;
}

export function deleteEntryTerm(termId: string) {
  for (const week of weeks.values()) {
    for (const entry of week.entries) {
      const target = entry.terms.find((term) => term.id === termId);
      if (target) {
        target.deletedAt = now();
        entry.updatedAt = now();
        return {
          entryId: entry.id,
          termId,
        };
      }
    }
  }

  return null;
}

function normalizedWeekKey(input: string) {
  return input === "current" ? "offset-0" : input;
}

function parseWeekOffset(weekKey: string) {
  const normalized = normalizedWeekKey(weekKey);
  const match = normalized.match(/^offset-(-?\d+)$/);
  return match ? Number(match[1]) : 0;
}

function weekMetadata(offset: number) {
  const base = startOfWeek(new Date());
  base.setDate(base.getDate() + offset * 7);

  const weekStart = new Date(base);
  const weekEnd = new Date(base);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
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

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function padDay(date: Date) {
  return String(date.getDate()).padStart(2, "0");
}

function monthDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function isoWeekNumber(date: Date) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  return Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
