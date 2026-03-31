import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import express from "express";
import cors from "cors";
import { generateDesignTerms } from "./ai";
import { config } from "./config";
import { deleteStoredImage, saveImageDataUrl, saveRemoteImageUrl } from "./image-storage";
import { fetchLinkPreview } from "./link-preview";
import {
  createReactorMaterial,
  deleteReactorMaterial,
  getReactorBoard,
  updateReactorMaterial,
} from "./reactor-store";
import {
  createEntry,
  deleteEntry,
  deleteEntryTerm,
  getEntry,
  getWeek,
  markEntryFailed,
  markEntryReady,
  moveEntryToDay,
  updateDayNote,
  updateWeekNote,
} from "./store";

const app = express();
const port = config.port;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(config.uploadDir));

app.get("/seed/:name", async (request, response) => {
  const raw = request.query.data;
  if (typeof raw !== "string") {
    response.status(404).end();
    return;
  }

  response.setHeader("Content-Type", "image/svg+xml");
  response.send(decodeURIComponent(raw));
});

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "api",
    aiProvider: config.ai.provider,
    aiConfigured:
      config.ai.provider === "mock"
        ? false
        : Boolean(
            config.ai.geminiApiKey ||
              config.ai.apiKey ||
              config.ai.openaiApiKey ||
              config.ai.anthropicApiKey ||
              config.ai.litellmApiKey,
          ),
    uploadDir: config.uploadDir,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/weeks/:weekKey", async (request, response) => {
  response.json(await getWeek(request.params.weekKey));
});

app.get("/api/reactor/days", async (request, response) => {
  const rawDays = Number(request.query.days ?? 3);
  const rawOffset = Number(request.query.offset ?? 0);
  const days = Number.isFinite(rawDays) ? Math.max(1, Math.min(7, rawDays)) : 3;
  const offset = Number.isFinite(rawOffset) ? Math.max(-52, Math.min(52, rawOffset)) : 0;
  response.json(await getReactorBoard(days, offset));
});

app.post("/api/reactor/materials", async (request, response) => {
  const { type, content, note, manualTags, dayKey, meta, imageDataUrl } = request.body;

  if (typeof type !== "string") {
    response.status(400).json({
      error: "type is required.",
    });
    return;
  }

  if (type !== "image" && (typeof content !== "string" || content.trim() === "")) {
    response.status(400).json({
      error: "non-empty content is required.",
    });
    return;
  }

  let resolvedMeta =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? { ...(meta as Record<string, unknown>) }
      : null;
  let resolvedContent = typeof content === "string" ? content : "";

  if (type === "link" && resolvedMeta?.sourceUrl && typeof resolvedMeta.sourceUrl === "string") {
    const preview = await fetchLinkPreview(resolvedMeta.sourceUrl);
    const cachedPreview =
      preview.previewImageUrl
        ? await saveRemoteImageUrl({ imageUrl: preview.previewImageUrl })
        : null;
    resolvedMeta = {
      ...resolvedMeta,
      ...preview,
      ...(cachedPreview ? { imageUrl: cachedPreview.publicUrl } : {}),
    };
    resolvedContent = preview.previewTitle ?? resolvedContent ?? preview.sourceUrl;
  }

  if (type === "image") {
    if (typeof imageDataUrl !== "string" || imageDataUrl.trim() === "") {
      response.status(400).json({ error: "imageDataUrl is required for image materials." });
      return;
    }

    const image = await saveImageDataUrl({ imageDataUrl });
    resolvedMeta = {
      ...resolvedMeta,
      imageUrl: image.publicUrl,
    };
    resolvedContent = resolvedContent.trim() || "Image";
  }

  response.status(201).json(
    await createReactorMaterial({
      type: type as Parameters<typeof createReactorMaterial>[0]["type"],
      content: resolvedContent,
      note: typeof note === "string" ? note : "",
      manualTags: Array.isArray(manualTags) ? manualTags.filter((tag) => typeof tag === "string") : [],
      dayKey: typeof dayKey === "string" ? dayKey : undefined,
      meta: resolvedMeta as Parameters<typeof createReactorMaterial>[0]["meta"],
    }),
  );
});

app.patch("/api/reactor/materials/:id", async (request, response) => {
  const updated = await updateReactorMaterial(request.params.id, {
    content: typeof request.body.content === "string" ? request.body.content : undefined,
    note: typeof request.body.note === "string" ? request.body.note : undefined,
    manualTags: Array.isArray(request.body.manualTags)
      ? request.body.manualTags.filter((tag: unknown) => typeof tag === "string")
      : undefined,
    meta:
      request.body.meta && typeof request.body.meta === "object" && !Array.isArray(request.body.meta)
        ? request.body.meta
        : undefined,
  });

  if (!updated) {
    response.status(404).json({ error: "Material not found." });
    return;
  }

  response.json(updated);
});

app.delete("/api/reactor/materials/:id", async (request, response) => {
  const deleted = await deleteReactorMaterial(request.params.id);

  if (!deleted) {
    response.status(404).json({ error: "Material not found." });
    return;
  }

  if (deleted.meta?.imageUrl) {
    await deleteStoredImage(deleted.meta.imageUrl);
  }

  response.json(deleted);
});

app.post("/api/entries", async (request, response) => {
  const { weekKey, daySlot, imageDataUrl, imageWidth, imageHeight } = request.body;

  if (!weekKey || !daySlot || !imageDataUrl) {
    response.status(400).json({
      error: "weekKey, daySlot, imageDataUrl are required.",
    });
    return;
  }

  const image = await saveImageDataUrl({ imageDataUrl });
  const entry = await createEntry({
    weekKey,
    daySlot,
    imageUrl: image.publicUrl,
    imageWidth,
    imageHeight,
  });

  void processEntry(entry.id, imageDataUrl, imageWidth, imageHeight);
  response.status(202).json(entry);
});

app.put("/api/weeks/:weekKey/note", async (request, response) => {
  response.json(
    await updateWeekNote(request.params.weekKey, String(request.body.content ?? "")),
  );
});

app.put("/api/weeks/:weekKey/day-notes/:daySlot", async (request, response) => {
  response.json(
    await updateDayNote(
      request.params.weekKey,
      request.params.daySlot as Parameters<typeof updateDayNote>[1],
      String(request.body.content ?? ""),
    ),
  );
});

app.get("/api/entries/:id", async (request, response) => {
  const entry = await getEntry(request.params.id);

  if (!entry) {
    response.status(404).json({ error: "Entry not found." });
    return;
  }

  response.json(entry);
});

app.patch("/api/entry-terms/:id", async (request, response) => {
  if (request.body.action !== "delete") {
    response.status(400).json({ error: "Only delete action is supported." });
    return;
  }

  const result = await deleteEntryTerm(request.params.id);

  if (!result) {
    response.status(404).json({ error: "Term not found." });
    return;
  }

  response.json(result);
});

app.patch("/api/entries/:id/day-slot", async (request, response) => {
  const { daySlot } = request.body;

  if (!daySlot) {
    response.status(400).json({ error: "daySlot is required." });
    return;
  }

  const result = await moveEntryToDay(request.params.id, daySlot);

  if (!result) {
    response.status(404).json({ error: "Entry not found." });
    return;
  }

  response.json(result);
});

app.delete("/api/entries/:id", async (request, response) => {
  const result = await deleteEntry(request.params.id);

  if (!result) {
    response.status(404).json({ error: "Entry not found." });
    return;
  }

  if (result.imageUrl) {
    await deleteStoredImage(result.imageUrl);
  }

  response.json(result);
});

async function processEntry(
  entryId: string,
  imageDataUrl: string,
  imageWidth?: number,
  imageHeight?: number,
) {
  await new Promise((resolve) => setTimeout(resolve, 900));

  if ((imageWidth ?? 0) < 40 || (imageHeight ?? 0) < 40) {
    await markEntryFailed(entryId, "图片过小，无法可靠提取术语。");
    return;
  }

  try {
    const insight = await generateDesignTerms({
      imageUrl: imageDataUrl,
    });

    if (insight.terms.length === 0) {
      await markEntryFailed(entryId, "模型返回了空术语结果。");
      return;
    }

    await markEntryReady(entryId, insight);
  } catch (error) {
    console.error("[api] processEntry failed", error);
    await markEntryFailed(entryId, "术语生成失败，请稍后重试。");
  }
}

await fs.mkdir(path.resolve(config.uploadDir), { recursive: true });

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
