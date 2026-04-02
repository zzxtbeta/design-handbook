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
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`preview fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const meta = parseMetaTags(html);
    const previewTitle =
      meta["og:title"] ??
      meta["twitter:title"] ??
      readTitle(html) ??
      hostnameForUrl(normalizedUrl);

    const siteName =
      meta["og:site_name"] ??
      meta["application-name"] ??
      hostnameForUrl(normalizedUrl);

    const previewImageUrl = sanitizePreviewImageUrl(
      absolutizeUrl(normalizedUrl, meta["og:image"] ?? meta["twitter:image"]),
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

function parseMetaTags(html: string) {
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)];
  const meta: Record<string, string> = {};

  for (const [tag] of tags) {
    const attrs = Object.fromEntries(
      [...tag.matchAll(/([^\s=]+)\s*=\s*["']([^"']*)["']/g)].map(([, key, value]) => [
        key.toLowerCase(),
        decodeHtmlEntity(value.trim()),
      ]),
    );

    const lookup = attrs.property ?? attrs.name;
    const content = attrs.content;
    if (!lookup || !content) {
      continue;
    }

    meta[lookup.toLowerCase()] = content;
  }

  return meta;
}

function sanitizePreviewImageUrl(input?: string) {
  if (!input) {
    return undefined;
  }

  const lowered = input.toLowerCase();
  if (
    lowered.includes("transparent.png") ||
    lowered.includes("/blank.") ||
    lowered.includes("pixel.png")
  ) {
    return undefined;
  }

  return input;
}
