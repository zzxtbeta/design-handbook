export type EntryStatus = "processing" | "ready" | "failed";
export type DaySlot = "mon" | "tue" | "wed" | "thu" | "fri" | "weekend";
export type DecorationStyle = "amber" | "pink" | "sage" | "blue";

export interface EntryTerm {
  id: string;
  term: string;
  position: number;
  deletedAt: string | null;
}

export interface WeekEntry {
  id: string;
  daySlot: DaySlot;
  title: string;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  status: EntryStatus;
  errorMessage: string | null;
  decorationStyle: DecorationStyle;
  createdAt: string;
  updatedAt: string;
  terms: EntryTerm[];
}

export interface WeekData {
  weekKey: string;
  weekNumber: number;
  label: string;
  dayNumbers: Record<DaySlot, string>;
  note: string;
  entries: WeekEntry[];
}
