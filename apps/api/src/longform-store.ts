import { desc, eq } from "drizzle-orm";
import { longformAnalysisRuns, longformEntries } from "@handbook/db";
import { db } from "./db";

export interface LongformEntryRecord {
  id: string;
  status: "draft" | "ready" | "archived";
  title: string;
  subtitle: string | null;
  excerpt: string;
  authorName: string;
  sourcePlatform: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  language: string;
  rawText: string;
  contentBlocks: string[];
  coverImagePath: string | null;
  coverCaption: string;
  coverPalette: [string, string, string] | null;
  analysisStatus: "idle" | "ready" | "failed";
  whyItWorks: string;
  framework: string[];
  resonance: string[];
  reusableMoves: string[];
  analysisUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listLongformEntries() {
  const rows = await db
    .select()
    .from(longformEntries)
    .orderBy(desc(longformEntries.updatedAt), desc(longformEntries.orderIndex));

  return rows.map(mapLongformEntry);
}

export async function getLongformEntry(entryId: string) {
  const [row] = await db
    .select()
    .from(longformEntries)
    .where(eq(longformEntries.id, entryId));

  return row ? mapLongformEntry(row) : null;
}

export async function createLongformEntry(input: {
  title: string;
  subtitle?: string | null;
  excerpt?: string;
  authorName?: string;
  sourcePlatform?: string | null;
  sourceUrl?: string | null;
  publishedAt?: Date | null;
  language?: string;
  rawText?: string;
  contentBlocks?: string[];
  coverImagePath?: string | null;
  coverCaption?: string;
  coverPalette?: [string, string, string] | null;
}) {
  const timestamp = new Date();
  const [created] = await db
    .insert(longformEntries)
    .values({
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() ?? null,
      excerpt: input.excerpt?.trim() ?? "",
      authorName: input.authorName?.trim() ?? "",
      sourcePlatform: input.sourcePlatform?.trim() ?? null,
      sourceUrl: input.sourceUrl?.trim() ?? null,
      publishedAt: input.publishedAt ?? null,
      language: input.language?.trim() || "zh-CN",
      rawText: input.rawText ?? "",
      contentBlocks: input.contentBlocks ?? [],
      coverImagePath: input.coverImagePath ?? null,
      coverCaption: input.coverCaption?.trim() ?? "",
      coverPalette: input.coverPalette ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning();

  return mapLongformEntry(created);
}

export async function updateLongformEntry(
  entryId: string,
  patch: {
    status?: "draft" | "ready" | "archived";
    title?: string;
    subtitle?: string | null;
    excerpt?: string;
    authorName?: string;
    sourcePlatform?: string | null;
    sourceUrl?: string | null;
    publishedAt?: Date | null;
    language?: string;
    rawText?: string;
    contentBlocks?: string[];
    coverImagePath?: string | null;
    coverCaption?: string;
    coverPalette?: [string, string, string] | null;
  },
) {
  const [updated] = await db
    .update(longformEntries)
    .set({
      status: patch.status,
      title: patch.title?.trim(),
      subtitle: patch.subtitle === null ? null : patch.subtitle?.trim(),
      excerpt: patch.excerpt?.trim(),
      authorName: patch.authorName?.trim(),
      sourcePlatform: patch.sourcePlatform === null ? null : patch.sourcePlatform?.trim(),
      sourceUrl: patch.sourceUrl === null ? null : patch.sourceUrl?.trim(),
      publishedAt: patch.publishedAt,
      language: patch.language?.trim(),
      rawText: patch.rawText,
      contentBlocks: patch.contentBlocks,
      coverImagePath: patch.coverImagePath === null ? null : patch.coverImagePath,
      coverCaption: patch.coverCaption?.trim(),
      coverPalette: patch.coverPalette,
      updatedAt: new Date(),
    })
    .where(eq(longformEntries.id, entryId))
    .returning();

  return updated ? mapLongformEntry(updated) : null;
}

export async function applyLongformAnalysis(
  entryId: string,
  analysis: {
    whyItWorks: string;
    framework: string[];
    resonance: string[];
    reusableMoves: string[];
  },
) {
  const timestamp = new Date();
  const [updated] = await db
    .update(longformEntries)
    .set({
      analysisStatus: "ready",
      whyItWorks: analysis.whyItWorks,
      framework: analysis.framework,
      resonance: analysis.resonance,
      reusableMoves: analysis.reusableMoves,
      analysisUpdatedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(longformEntries.id, entryId))
    .returning();

  if (!updated) {
    return null;
  }

  await db.insert(longformAnalysisRuns).values({
    entryId,
    whyItWorks: analysis.whyItWorks,
    framework: analysis.framework,
    resonance: analysis.resonance,
    reusableMoves: analysis.reusableMoves,
    promptVersion: "v1",
    createdAt: timestamp,
  });

  return mapLongformEntry(updated);
}

function mapLongformEntry(row: typeof longformEntries.$inferSelect): LongformEntryRecord {
  return {
    id: row.id,
    status: row.status,
    title: row.title,
    subtitle: row.subtitle ?? null,
    excerpt: row.excerpt,
    authorName: row.authorName,
    sourcePlatform: row.sourcePlatform ?? null,
    sourceUrl: row.sourceUrl ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    language: row.language,
    rawText: row.rawText,
    contentBlocks: Array.isArray(row.contentBlocks) ? row.contentBlocks : [],
    coverImagePath: row.coverImagePath ?? null,
    coverCaption: row.coverCaption,
    coverPalette:
      Array.isArray(row.coverPalette) && row.coverPalette.length === 3
        ? (row.coverPalette as [string, string, string])
        : null,
    analysisStatus: row.analysisStatus,
    whyItWorks: row.whyItWorks,
    framework: Array.isArray(row.framework) ? row.framework : [],
    resonance: Array.isArray(row.resonance) ? row.resonance : [],
    reusableMoves: Array.isArray(row.reusableMoves) ? row.reusableMoves : [],
    analysisUpdatedAt: row.analysisUpdatedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
