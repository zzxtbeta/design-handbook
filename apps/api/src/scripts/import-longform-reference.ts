import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  applyLongformAnalysis,
  createLongformEntry,
  listLongformEntries,
  updateLongformEntry,
} from "../longform-store";
import { generateLongformAnalysisInsight } from "../ai";

const DEFAULT_FILE =
  "/Users/guyongrui/Desktop/素材积累/嘉叔养生-一人公司的幻觉与真相-20260331.md";

function parseMarkdownContent(raw: string) {
  return raw
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => block !== "---");
}

function firstUsefulExcerpt(blocks: string[]) {
  return (
    blocks.find(
      (block) =>
        !block.startsWith("#") &&
        !block.startsWith(">") &&
        block.replace(/[*_`>#-]/g, "").trim().length > 30,
    ) ?? ""
  )
    .replace(/[*_`>#-]/g, "")
    .trim()
    .slice(0, 140);
}

function parseMeta(raw: string) {
  const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "未命名长文样本";
  const sourceLine = raw.match(/^>\s*来源：(.+)$/m)?.[1]?.trim() ?? "";
  const publishedAt = raw.match(/^>\s*整理日期：(\d{4}-\d{2}-\d{2})$/m)?.[1]?.trim() ?? null;

  const [sourcePlatform = "", authorName = ""] = sourceLine.split(" - ").map((part) => part.trim());
  return { title, sourcePlatform, authorName, publishedAt };
}

async function main() {
  const filePath = resolve(process.argv[2] ?? DEFAULT_FILE);
  const raw = await readFile(filePath, "utf8");
  const blocks = parseMarkdownContent(raw);
  const excerpt = firstUsefulExcerpt(blocks);
  const { title, sourcePlatform, authorName, publishedAt } = parseMeta(raw);

  const existing = (await listLongformEntries()).find((entry) => entry.title === title);

  const payload = {
    status: "ready" as const,
    title,
    excerpt,
    authorName,
    sourcePlatform: sourcePlatform || "抖音",
    sourceUrl: null,
    publishedAt: publishedAt ? new Date(publishedAt) : null,
    language: "zh-CN",
    rawText: raw,
    contentBlocks: blocks,
    coverCaption: "Counter Thesis",
    coverPalette: ["#efebe3", "#d9d0c6", "#695247"] as [string, string, string],
  };

  const entry = existing
    ? await updateLongformEntry(existing.id, payload)
    : await createLongformEntry(payload);

  if (!entry) {
    throw new Error("Failed to upsert longform entry.");
  }

  const analysis = await generateLongformAnalysisInsight({
    title: entry.title,
    excerpt: entry.excerpt,
    rawText: entry.rawText,
  });

  await applyLongformAnalysis(entry.id, analysis);
  console.log(`[longform-import] ready: ${entry.id} ${entry.title}`);
}

main().catch((error) => {
  console.error("[longform-import] failed", error);
  process.exitCode = 1;
});
