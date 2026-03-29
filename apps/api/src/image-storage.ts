import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config";

export async function saveImageDataUrl(input: { imageDataUrl: string }) {
  const buffer = Buffer.from(extractBase64Data(input.imageDataUrl), "base64");
  const ext = extensionForDataUrl(input.imageDataUrl);
  const filename = `${crypto.randomUUID()}.${ext}`;

  await fs.mkdir(config.uploadDir, { recursive: true });
  await fs.writeFile(path.join(config.uploadDir, filename), buffer);

  return {
    storedPath: path.join(config.uploadDir, filename),
    publicUrl: `/uploads/${filename}`,
  };
}

function extensionForDataUrl(dataUrl: string) {
  const mediaType = dataUrl.match(/^data:(.*?);base64,/)?.[1] ?? "image/png";
  if (mediaType === "image/jpeg") {
    return "jpg";
  }
  if (mediaType === "image/webp") {
    return "webp";
  }
  return "png";
}

function extractBase64Data(dataUrl: string) {
  return dataUrl.split(",")[1] ?? "";
}
