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
  promptSummary: string | null;
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
  dayNotes: Record<DaySlot, string>;
  entries: WeekEntry[];
}

export type ReactorMaterialType = "diary" | "idea" | "prompt" | "link" | "sample" | "image";

export interface ReactorMaterialMeta {
  sourceUrl?: string;
  previewTitle?: string;
  siteName?: string;
  previewImageUrl?: string;
  imageUrl?: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
}

export interface ReactorMaterial {
  id: string;
  dayKey: string;
  parentId: string | null;
  type: ReactorMaterialType;
  content: string;
  important: boolean;
  note: string;
  manualTags: string[];
  meta: ReactorMaterialMeta | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReactorDay {
  dayKey: string;
  label: string;
  itemCount: number;
  materials: ReactorMaterial[];
}

export interface ReactorBoard {
  days: ReactorDay[];
}
