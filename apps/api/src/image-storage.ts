import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config";

export async function saveImageDataUrl(input: { imageDataUrl: string }) {
  const buffer = Buffer.from(extractBase64Data(input.imageDataUrl), "base64");
  const ext = extensionForDataUrl(input.imageDataUrl);
  const now = new Date();
  const datePath = [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ];
  const timestamp = [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const filename = `${timestamp}-${crypto.randomUUID()}.${ext}`;
  const relativePath = path.join(...datePath, filename);
  const storedPath = path.join(config.uploadDir, relativePath);

  await fs.mkdir(path.dirname(storedPath), { recursive: true });
  await fs.writeFile(storedPath, buffer);

  return {
    storedPath,
    publicUrl: `/uploads/${toPosixPath(relativePath)}`,
  };
}

export async function deleteStoredImage(publicUrl: string) {
  const relativePath = normalizeUploadRelativePath(publicUrl);
  if (!relativePath) {
    return false;
  }

  const storedPath = path.join(config.uploadDir, relativePath);

  try {
    await fs.rm(storedPath, { force: true });
    await removeEmptyParents(path.dirname(storedPath), config.uploadDir);
    return true;
  } catch {
    return false;
  }
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

function normalizeUploadRelativePath(publicUrl: string) {
  if (!publicUrl.startsWith("/uploads/")) {
    return null;
  }

  const relative = publicUrl.replace("/uploads/", "");
  return relative.split("/").filter(Boolean).join(path.sep);
}

function toPosixPath(input: string) {
  return input.split(path.sep).join("/");
}

async function removeEmptyParents(currentDir: string, stopDir: string) {
  const normalizedStop = path.resolve(stopDir);
  let target = path.resolve(currentDir);

  while (target.startsWith(normalizedStop) && target !== normalizedStop) {
    try {
      const entries = await fs.readdir(target);
      if (entries.length > 0) {
        break;
      }
      await fs.rmdir(target);
      target = path.dirname(target);
    } catch {
      break;
    }
  }
}
