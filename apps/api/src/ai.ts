import { config } from "./config";

export interface GenerateTermsInput {
  imageUrl: string;
}

const prompt =
  "请基于这张截图的具体使用场景和界面语境，从专业UI/视觉设计角度，提炼5到10个最关键的设计关键词。" +
  "重点解析布局结构、组件形态、字体、颜色、材质、层级关系、交互定义。" +
  "避免抽象评价。输出 JSON 数组，每项是一个短关键词。";

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
    console.warn("[ai] provider failed, falling back to mock", error);
    return generateMockTerms(input.imageUrl);
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
            { type: "text", text: `${prompt} 输出格式：{"terms":["..."]}` },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ],
        },
      ],
    }),
  });

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
              text: `${prompt} 输出 JSON：{"terms":["..."]}`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const raw = data?.content?.find?.((item: { type?: string }) => item.type === "text")?.text ?? "{}";
  return parseTermsFromUnknownPayload(raw);
}

async function generateViaGemini(input: GenerateTermsInput) {
  const apiKey = config.ai.geminiApiKey || config.ai.apiKey;
  const model = config.ai.geminiModel;
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
              { text: `${prompt} 输出 JSON：{"terms":["..."]}` },
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

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.litellmModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${prompt} 输出格式：{"terms":["..."]}` },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  return parseTermsFromUnknownPayload(raw);
}

function parseTermsFromUnknownPayload(raw: string) {
  const parsed = JSON.parse(raw);
  const terms = Array.isArray(parsed?.terms) ? parsed.terms : [];
  return sanitizeTerms(terms);
}

function sanitizeTerms(input: string[]) {
  return input
    .map((term) => String(term).trim())
    .filter(Boolean)
    .slice(0, 10);
}

function generateMockTerms(seed: string) {
  const pools = [
    ["editorial layout", "paper texture", "soft shadow", "warm neutral palette"],
    ["glassmorphism", "frosted layer", "cool blur", "translucent panel"],
    ["poster composition", "oversized type", "calm negative space", "soft gradient"],
    ["polaroid framing", "tape accent", "scrapbook feel", "gentle depth"],
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
