import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config";

export async function saveImageDataUrl(input: { imageDataUrl: string }) {
  const buffer = Buffer.from(extractBase64Data(input.imageDataUrl), "base64");
  const ext = extensionForDataUrl(input.imageDataUrl);
  return writeUploadBuffer(buffer, ext);
}

export async function saveRemoteImageUrl(input: { imageUrl: string }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(input.imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: input.imageUrl,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.byteLength < 128) {
      return null;
    }

    return writeUploadBuffer(buffer, extensionForContentType(contentType, input.imageUrl));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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
  return extensionForMimeType(mediaType);
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

async function writeUploadBuffer(buffer: Buffer, ext: string) {
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

function extensionForContentType(contentType: string, fallbackUrl: string) {
  const mediaType = contentType.split(";")[0]?.trim() ?? "";
  const fromMime = extensionForMimeType(mediaType);
  if (fromMime !== "png") {
    return fromMime;
  }

  const pathname = new URL(fallbackUrl).pathname.toLowerCase();
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
    return "jpg";
  }
  if (pathname.endsWith(".webp")) {
    return "webp";
  }
  if (pathname.endsWith(".gif")) {
    return "gif";
  }
  if (pathname.endsWith(".svg")) {
    return "svg";
  }
  return "png";
}

function extensionForMimeType(mediaType: string) {
  if (mediaType === "image/jpeg") {
    return "jpg";
  }
  if (mediaType === "image/webp") {
    return "webp";
  }
  if (mediaType === "image/gif") {
    return "gif";
  }
  if (mediaType === "image/svg+xml") {
    return "svg";
  }
  return "png";
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
