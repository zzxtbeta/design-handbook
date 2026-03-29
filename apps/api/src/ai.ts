import { config } from "./config";

export interface GenerateTermsInput {
  imageUrl: string;
}

export interface DesignInsight {
  terms: string[];
  promptSummary: string | null;
}

const prompt =
  "请基于这张截图的具体使用场景和界面语境，从专业UI/视觉设计角度，提炼 6-8 个最关键的设计关键词。" +
  "关键词必须具体、可检索、可复刻，避免空泛词、常见套话和同义重复。" +
  "请尽量覆盖至少 4 类信息：布局结构、组件形态、字体/排版、颜色/光影、材质/质感、交互暗示。" +
  "优先输出这张图真正显著的视觉特征，而不是安全但泛化的描述。" +
  '另外再生成一句非常简短的检索型 prompt 描述，用于以后快速回忆这张图的感觉，控制在 18 个词以内。' +
  '输出 JSON：{"terms":["..."],"promptSummary":"..."}。每个关键词保持短语，不要写句子，不要重复。';

export async function generateDesignTerms(input: GenerateTermsInput) {
  try {
    switch (config.ai.provider) {
      case "openai-compatible":
        return await generateViaOpenAiCompatible(input);
      case "anthropic":
        return await generateViaAnthropic(input);
      case "gemini":
        return await generateViaGemini(input);
      case "litellm":
        return await generateViaLiteLlm(input);
      case "mock":
      default:
        return generateMockTerms(input.imageUrl);
    }
  } catch (error) {
    if (config.ai.provider === "mock") {
      console.warn("[ai] mock provider generation failed", error);
      return generateMockTerms(input.imageUrl);
    }

    console.error("[ai] provider failed", error);
    throw error;
  }
}

async function generateViaOpenAiCompatible(input: GenerateTermsInput) {
  const apiKey = config.ai.openaiApiKey || config.ai.apiKey;
  const baseUrl =
    config.ai.openaiBaseUrl ||
    config.ai.baseUrl ||
    "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ],
        },
      ],
    }),
  });

  await ensureOk(response, "openai-compatible");
  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  return parseTermsFromUnknownPayload(raw);
}

async function generateViaAnthropic(input: GenerateTermsInput) {
  const apiKey = config.ai.anthropicApiKey || config.ai.apiKey;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.ai.anthropicModel,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: extractMediaType(input.imageUrl),
                data: extractBase64Data(input.imageUrl),
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  await ensureOk(response, "anthropic");
  const data = await response.json();
  const raw = data?.content?.find?.((item: { type?: string }) => item.type === "text")?.text ?? "{}";
  return parseTermsFromUnknownPayload(raw);
}

async function generateViaGemini(input: GenerateTermsInput) {
  const apiKey = config.ai.geminiApiKey || config.ai.apiKey;
  const model = config.ai.geminiModel;
  const baseUrl = config.ai.geminiBaseUrl;

  if (baseUrl) {
    return generateViaOpenAiLikeBaseUrl({
      baseUrl,
      apiKey,
      model,
      input,
      providerName: "gemini-baseurl",
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: extractMediaType(input.imageUrl),
                  data: extractBase64Data(input.imageUrl),
                },
              },
            ],
          },
        ],
      }),
    },
  );

  await ensureOk(response, "gemini");
  const data = await response.json();
  const raw =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "{}";
  return parseTermsFromUnknownPayload(raw);
}

async function generateViaLiteLlm(input: GenerateTermsInput) {
  const apiKey = config.ai.litellmApiKey || config.ai.apiKey;
  const baseUrl =
    config.ai.litellmBaseUrl ||
    config.ai.baseUrl ||
    "http://localhost:4000";

  return generateViaOpenAiLikeBaseUrl({
    baseUrl,
    apiKey,
    model: config.ai.litellmModel,
    input,
    providerName: "litellm",
  });
}

async function generateViaOpenAiLikeBaseUrl({
  baseUrl,
  apiKey,
  model,
  input,
  providerName,
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  input: GenerateTermsInput;
  providerName: string;
}) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const response = await fetch(`${normalizedBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ],
        },
      ],
    }),
  });

  await ensureOk(response, providerName);
  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  return parseTermsFromUnknownPayload(raw);
}

async function ensureOk(response: Response, providerName: string) {
  if (response.ok) {
    return;
  }

  const body = await response.text();
  throw new Error(`[${providerName}] ${response.status} ${response.statusText}: ${body}`);
}

function parseTermsFromUnknownPayload(raw: string): DesignInsight {
  const cleaned = String(raw).trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned);
  const terms = Array.isArray(parsed?.terms) ? parsed.terms : [];
  const promptSummary =
    typeof parsed?.promptSummary === "string"
      ? parsed.promptSummary.trim().slice(0, 180)
      : null;
  return {
    terms: sanitizeTerms(terms),
    promptSummary: promptSummary || null,
  };
}

function sanitizeTerms(input: string[]) {
  return input
    .map((term) => String(term).trim())
    .filter(Boolean)
    .slice(0, 10);
}

function generateMockTerms(seed: string): DesignInsight {
  const pools = [
    {
      terms: ["editorial layout", "paper texture", "soft shadow", "warm neutral palette"],
      promptSummary: "warm editorial board with paper texture",
    },
    {
      terms: ["glassmorphism", "frosted layer", "cool blur", "translucent panel"],
      promptSummary: "soft glass card with translucent layers",
    },
    {
      terms: ["poster composition", "oversized type", "calm negative space", "soft gradient"],
      promptSummary: "minimal poster layout with large type",
    },
    {
      terms: ["polaroid framing", "tape accent", "scrapbook feel", "gentle depth"],
      promptSummary: "scrapbook polaroid card pinned on board",
    },
  ];

  const index = seed.length % pools.length;
  return pools[index];
}

function extractMediaType(dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,/);
  return match?.[1] ?? "image/png";
}

function extractBase64Data(dataUrl: string) {
  return dataUrl.split(",")[1] ?? "";
}
