import { desc, eq, gte, inArray } from "drizzle-orm";
import { reactorMaterials } from "@handbook/db";
import { db } from "./db";

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

export interface ReactorMaterialRecord {
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

export interface ReactorDayRecord {
  dayKey: string;
  label: string;
  itemCount: number;
  materials: ReactorMaterialRecord[];
}

export interface ReactorBoardRecord {
  days: ReactorDayRecord[];
}

export async function getReactorBoard(dayCount = 3, weekOffset = 0) {
  const keys = weekDayKeys(dayCount, weekOffset);
  const rows = await db
    .select()
    .from(reactorMaterials)
    .where(inArray(reactorMaterials.dayKey, keys))
    .orderBy(desc(reactorMaterials.createdAt), desc(reactorMaterials.orderIndex));

  return {
    days: keys.map((dayKey, index) => {
      const materials = rows
        .filter((row) => row.dayKey === dayKey)
        .map(mapMaterial);

      return {
        dayKey,
        label: index === 0 ? "Today" : index === 1 ? "Yesterday" : formatEarlierLabel(dayKey),
        itemCount: materials.length,
        materials,
      };
    }),
  } satisfies ReactorBoardRecord;
}

export async function createReactorMaterial(input: {
  type: ReactorMaterialType;
  content: string;
  important?: boolean;
  parentId?: string | null;
  note?: string;
  manualTags?: string[];
  dayKey?: string;
  meta?: ReactorMaterialMeta | null;
}) {
  const timestamp = new Date();
  const dayKey = input.dayKey ?? localDayKey(timestamp);
  const [created] = await db
    .insert(reactorMaterials)
    .values({
      dayKey,
      parentId: input.parentId ?? null,
      type: input.type,
      content: input.content.trim(),
      important: input.important ?? false,
      note: input.note?.trim() ?? "",
      manualTags: normalizeTags(input.manualTags ?? []),
      meta: input.meta ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning();

  return mapMaterial(created);
}

export async function updateReactorMaterial(
  materialId: string,
  patch: {
    content?: string;
    important?: boolean;
    parentId?: string | null;
    note?: string;
    manualTags?: string[];
    meta?: ReactorMaterialMeta | null;
  },
) {
  const [updated] = await db
    .update(reactorMaterials)
    .set({
      content: patch.content?.trim(),
      important: patch.important,
      parentId: patch.parentId,
      note: patch.note?.trim(),
      manualTags: patch.manualTags ? normalizeTags(patch.manualTags) : undefined,
      meta: patch.meta,
      updatedAt: new Date(),
    })
    .where(eq(reactorMaterials.id, materialId))
    .returning();

  return updated ? mapMaterial(updated) : null;
}

export async function deleteReactorMaterial(materialId: string) {
  await db
    .update(reactorMaterials)
    .set({
      parentId: null,
      updatedAt: new Date(),
    })
    .where(eq(reactorMaterials.parentId, materialId));

  const [deleted] = await db
    .delete(reactorMaterials)
    .where(eq(reactorMaterials.id, materialId))
    .returning();

  return deleted ? mapMaterial(deleted) : null;
}

export async function getReactorMaterialsSince(dayKey: string) {
  const rows = await db
    .select()
    .from(reactorMaterials)
    .where(gte(reactorMaterials.dayKey, dayKey))
    .orderBy(desc(reactorMaterials.createdAt), desc(reactorMaterials.orderIndex));

  return rows.map(mapMaterial);
}

function mapMaterial(row: typeof reactorMaterials.$inferSelect): ReactorMaterialRecord {
  return {
    id: row.id,
    dayKey: row.dayKey,
    parentId: row.parentId,
    type: row.type,
    content: row.content,
    important: row.important,
    note: row.note,
    manualTags: Array.isArray(row.manualTags) ? row.manualTags : [],
    meta: row.meta && typeof row.meta === "object" ? (row.meta as ReactorMaterialMeta) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function weekDayKeys(dayCount: number, weekOffset: number) {
  const start = startOfWeek(weekOffset);

  return Array.from({ length: dayCount }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return localDayKey(day);
  });
}

function startOfWeek(offset: number) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff + offset * 7);
  return base;
}

function localDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatEarlierLabel(dayKey: string) {
  const [, month = "", day = ""] = dayKey.split("-");
  return `${month} / ${day}`;
}
