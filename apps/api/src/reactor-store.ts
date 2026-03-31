import { desc, eq, gte, inArray } from "drizzle-orm";
import { reactorMaterials } from "@handbook/db";
import { db } from "./db";

export type ReactorMaterialType = "diary" | "idea" | "prompt" | "link" | "sample";

export interface ReactorMaterialRecord {
  id: string;
  dayKey: string;
  type: ReactorMaterialType;
  content: string;
  note: string;
  manualTags: string[];
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

export async function getReactorBoard(dayCount = 3) {
  const keys = recentDayKeys(dayCount);
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
  note?: string;
  manualTags?: string[];
  dayKey?: string;
}) {
  const timestamp = new Date();
  const dayKey = input.dayKey ?? localDayKey(timestamp);
  const [created] = await db
    .insert(reactorMaterials)
    .values({
      dayKey,
      type: input.type,
      content: input.content.trim(),
      note: input.note?.trim() ?? "",
      manualTags: normalizeTags(input.manualTags ?? []),
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
    note?: string;
    manualTags?: string[];
  },
) {
  const [updated] = await db
    .update(reactorMaterials)
    .set({
      content: patch.content?.trim(),
      note: patch.note?.trim(),
      manualTags: patch.manualTags ? normalizeTags(patch.manualTags) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(reactorMaterials.id, materialId))
    .returning();

  return updated ? mapMaterial(updated) : null;
}

export async function deleteReactorMaterial(materialId: string) {
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
    type: row.type,
    content: row.content,
    note: row.note,
    manualTags: Array.isArray(row.manualTags) ? row.manualTags : [],
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

function recentDayKeys(dayCount: number) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  return Array.from({ length: dayCount }, (_, index) => {
    const day = new Date(base);
    day.setDate(base.getDate() - index);
    return localDayKey(day);
  });
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
