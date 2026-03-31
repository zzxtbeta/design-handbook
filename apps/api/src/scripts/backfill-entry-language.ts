import fs from "node:fs/promises";
import path from "node:path";
import { and, eq, isNotNull } from "drizzle-orm";
import { entries } from "@handbook/db";
import { generateDesignTerms } from "../ai";
import { config } from "../config";
import { db } from "../db";
import { getEntry, markEntryReady } from "../store";

async function main() {
  const rows = await db
    .select({
      id: entries.id,
      imageUrl: entries.imageUrl,
      promptSummary: entries.promptSummary,
      status: entries.status,
    })
    .from(entries)
    .where(and(eq(entries.status, "ready"), isNotNull(entries.promptSummary)));

  const targets: typeof rows = [];

  for (const row of rows) {
    const entry = await getEntry(row.id);
    if (!entry) {
      continue;
    }

    if (needsChineseBackfill(row.promptSummary ?? "", entry.terms.map((term) => term.term))) {
      targets.push(row);
    }
  }

  console.log(`[backfill] found ${targets.length} entries needing Chinese backfill`);

  for (const row of targets) {
    const imagePath = path.resolve(config.uploadDir, row.imageUrl.replace(/^\/uploads\//, ""));
    const imageBuffer = await fs.readFile(imagePath);
    const mimeType = mimeTypeForPath(imagePath);
    const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const insight = await generateDesignTerms({ imageUrl: imageDataUrl });
    await markEntryReady(row.id, insight);
    console.log(`[backfill] updated ${row.id} -> ${insight.promptSummary}`);
  }
}

function needsChineseBackfill(value: string, terms: string[]) {
  if (!value.trim()) {
    return true;
  }

  return /[A-Za-z]/.test(value) || terms.some((term) => /[A-Za-z]/.test(term));
}

function mimeTypeForPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  return "image/png";
}

void main()
  .then(() => {
    console.log("[backfill] done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[backfill] failed", error);
    process.exit(1);
  });
