import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { entries } from "@handbook/db";
import { generateDesignTerms } from "../ai";
import { config } from "../config";
import { db } from "../db";
import { markEntryReady } from "../store";

async function main() {
  const rows = await db
    .select({
      id: entries.id,
      imageUrl: entries.imageUrl,
      status: entries.status,
    })
    .from(entries)
    .where(eq(entries.status, "ready"));

  console.log(`[backfill-prompts] reprocessing ${rows.length} ready entries`);

  for (const row of rows) {
    const imagePath = path.resolve(config.uploadDir, row.imageUrl.replace(/^\/uploads\//, ""));
    const imageBuffer = await fs.readFile(imagePath);
    const mimeType = mimeTypeForPath(imagePath);
    const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const insight = await generateDesignTerms({ imageUrl: imageDataUrl });
    await markEntryReady(row.id, insight);
    console.log(`[backfill-prompts] updated ${row.id}`);
  }
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
    console.log("[backfill-prompts] done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[backfill-prompts] failed", error);
    process.exit(1);
  });
