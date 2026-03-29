import fs from "node:fs/promises";
import path from "node:path";
import express from "express";
import cors from "cors";
import { generateDesignTerms } from "./ai";
import { config } from "./config";
import { saveImageDataUrl } from "./image-storage";
import {
  createEntry,
  deleteEntryTerm,
  getEntry,
  getWeek,
  markEntryFailed,
  markEntryReady,
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
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/weeks/:weekKey", (request, response) => {
  response.json(getWeek(request.params.weekKey));
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
  const entry = createEntry({
    weekKey,
    daySlot,
    imageUrl: image.publicUrl,
    imageWidth,
    imageHeight,
  });

  void processEntry(entry.id, imageDataUrl, imageWidth, imageHeight);
  response.status(202).json(entry);
});

app.put("/api/weeks/:weekKey/note", (request, response) => {
  response.json(
    updateWeekNote(request.params.weekKey, String(request.body.content ?? "")),
  );
});

app.get("/api/entries/:id", (request, response) => {
  const entry = getEntry(request.params.id);

  if (!entry) {
    response.status(404).json({ error: "Entry not found." });
    return;
  }

  response.json(entry);
});

app.patch("/api/entry-terms/:id", (request, response) => {
  if (request.body.action !== "delete") {
    response.status(400).json({ error: "Only delete action is supported." });
    return;
  }

  const result = deleteEntryTerm(request.params.id);

  if (!result) {
    response.status(404).json({ error: "Term not found." });
    return;
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
    markEntryFailed(entryId, "图片过小，无法可靠提取术语。");
    return;
  }

  try {
    const terms = await generateDesignTerms({
      imageUrl: imageDataUrl,
    });

    if (terms.length === 0) {
      markEntryFailed(entryId, "模型返回了空术语结果。");
      return;
    }

    markEntryReady(entryId, terms);
  } catch (error) {
    console.error("[api] processEntry failed", error);
    markEntryFailed(entryId, "术语生成失败，请稍后重试。");
  }
}

await fs.mkdir(path.resolve(config.uploadDir), { recursive: true });

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
