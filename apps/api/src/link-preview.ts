export interface LinkPreviewResult {
  sourceUrl: string;
  previewTitle?: string;
  siteName?: string;
  previewImageUrl?: string;
}

export async function fetchLinkPreview(sourceUrl: string): Promise<LinkPreviewResult> {
  const normalizedUrl = normalizeUrl(sourceUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "handbook-reactor-bot/0.1",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    const html = await response.text();
    const previewTitle =
      readMeta(html, "property", "og:title") ??
      readMeta(html, "name", "twitter:title") ??
      readTitle(html) ??
      hostnameForUrl(normalizedUrl);

    const siteName =
      readMeta(html, "property", "og:site_name") ??
      readMeta(html, "name", "application-name") ??
      hostnameForUrl(normalizedUrl);

    const previewImageUrl = absolutizeUrl(
      normalizedUrl,
      readMeta(html, "property", "og:image") ?? readMeta(html, "name", "twitter:image"),
    );

    return {
      sourceUrl: normalizedUrl,
      previewTitle,
      siteName,
      previewImageUrl,
    };
  } catch {
    return {
      sourceUrl: normalizedUrl,
      previewTitle: hostnameForUrl(normalizedUrl),
      siteName: hostnameForUrl(normalizedUrl),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUrl(input: string) {
  try {
    return new URL(input).toString();
  } catch {
    return new URL(`https://${input}`).toString();
  }
}

function hostnameForUrl(input: string) {
  try {
    return new URL(input).hostname.replace(/^www\./, "");
  } catch {
    return input;
  }
}

function readMeta(html: string, attrName: "property" | "name", attrValue: string) {
  const escaped = escapeRegExp(attrValue);
  const pattern = new RegExp(
    `<meta[^>]*${attrName}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  return decodeHtmlEntity(html.match(pattern)?.[1]?.trim() ?? "");
}

function readTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
  return decodeHtmlEntity(match);
}

function absolutizeUrl(baseUrl: string, maybeRelative?: string) {
  if (!maybeRelative) {
    return undefined;
  }

  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function decodeHtmlEntity(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
