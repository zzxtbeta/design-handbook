import fs from "node:fs/promises";
import path from "node:path";
import { count, isNotNull } from "drizzle-orm";
import { dayNotes, entries, entryTerms, longformEntries, reactorMaterials, weekNotes } from "@handbook/db";
import { config } from "../config";
import { client, db } from "../db";

async function walkFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const parts = await fs.readdir(dir, { withFileTypes: true });

    for (const part of parts) {
      const fullPath = path.join(dir, part.name);
      if (part.isDirectory()) {
        files.push(...(await walkFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }
  } catch {
    return files;
  }

  return files;
}

function isUploadPublicUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/uploads/");
}

async function main() {
  const [entriesCount] = await db.select({ count: count() }).from(entries);
  const [entryTermsCount] = await db.select({ count: count() }).from(entryTerms);
  const [weekNotesCount] = await db.select({ count: count() }).from(weekNotes);
  const [dayNotesCount] = await db.select({ count: count() }).from(dayNotes);
  const [reactorMaterialsCount] = await db.select({ count: count() }).from(reactorMaterials);
  const [longformEntriesCount] = await db.select({ count: count() }).from(longformEntries);

  const entryRows = await db
    .select({ imageUrl: entries.imageUrl })
    .from(entries)
    .where(isNotNull(entries.imageUrl));
  const reactorRows = await db.select({ meta: reactorMaterials.meta }).from(reactorMaterials);
  const longformRows = await db
    .select({ imageUrl: longformEntries.coverImagePath })
    .from(longformEntries)
    .where(isNotNull(longformEntries.coverImagePath));

  const expectedFiles = new Set<string>(
    [
      ...entryRows.map((row) => row.imageUrl),
      ...reactorRows.map((row) => row.meta?.imageUrl),
      ...longformRows.map((row) => row.imageUrl),
    ].filter(isUploadPublicUrl),
  );

  const actualFiles = new Set<string>(
    (await walkFiles(config.uploadDir)).map(
      (filePath) =>
        `/uploads/${path.relative(config.uploadDir, filePath).split(path.sep).join("/")}`,
    ),
  );

  const missing = [...expectedFiles].filter((file) => !actualFiles.has(file));
  const orphan = [...actualFiles].filter((file) => !expectedFiles.has(file));

  const report = {
    database: {
      entries: entriesCount.count,
      entry_terms: entryTermsCount.count,
      week_notes: weekNotesCount.count,
      day_notes: dayNotesCount.count,
      reactor_materials: reactorMaterialsCount.count,
      longform_entries: longformEntriesCount.count,
    },
    files: {
      uploadDir: config.uploadDir,
      expected: expectedFiles.size,
      actual: actualFiles.size,
      missingCount: missing.length,
      orphanCount: orphan.length,
      missing,
      orphan,
    },
  };

  console.log(JSON.stringify(report, null, 2));

  if (missing.length > 0 || orphan.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("[audit-storage-health] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
