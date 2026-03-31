import { config } from "./config";

export interface GenerateTermsInput {
  imageUrl: string;
}

export interface DesignInsight {
  terms: string[];
  promptSummary: string | null;
}

export interface ReactorClusterMaterialInput {
  type: string;
  content: string;
  note?: string | null;
  tags?: string[];
  important?: boolean;
}

export interface ReactorClusterInsight {
  title: string;
  note: string;
  subsetHint: string | null;
}

const prompt =
  "请基于这张截图的具体使用场景和界面语境，从专业UI/视觉设计角度，提炼 6-8 个最关键的设计关键词。" +
  "关键词必须具体、可检索、可复刻，避免空泛词、常见套话和同义重复。" +
  "关键词必须使用中文短语，不要英文，不要中英混写。" +
  "请尽量覆盖至少 4 类信息：布局结构、组件形态、字体/排版、颜色/光影、材质/质感、交互暗示。" +
  "优先输出这张图真正显著的视觉特征，而不是安全但泛化的描述。" +
  '另外再生成一句非常简短的中文风格备注，用于以后快速回忆这张图的感觉，控制在 12 到 20 个中文字符以内。' +
  '这句备注必须是中文，不要英文，不要句号，不要过度抽象。' +
  '输出 JSON：{"terms":["..."],"promptSummary":"..."}。每个关键词保持短语，不要写句子，不要重复。';

const reactorClusterPrompt = (materials: ReactorClusterMaterialInput[]) =>
  [
    "You are helping a solo creator tidy a loose idea board.",
    "Given a small group of notes, infer the most likely shared thread.",
    "Return concise JSON only.",
    'Output shape: {"title":"...","note":"...","subsetHint":"...|null"}',
    "Rules:",
    '- title: 2-5 English words, crisp, not generic.',
    '- note: one short sentence in English, practical and creator-focused.',
    "- subsetHint: either null or one short sentence that points out if one note looks like support/subset/redundant detail under another.",
    "- Do not mention AI. Do not be verbose.",
    "",
    "Materials:",
    JSON.stringify(materials),
  ].join("\n");

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

export async function generateReactorClusterInsight(input: {
  materials: ReactorClusterMaterialInput[];
}): Promise<ReactorClusterInsight> {
  const materials = input.materials.slice(0, 8);

  try {
    switch (config.ai.provider) {
      case "openai-compatible":
        return await generateClusterViaOpenAiCompatible(materials);
      case "anthropic":
        return await generateClusterViaAnthropic(materials);
      case "gemini":
        return await generateClusterViaGemini(materials);
      case "litellm":
        return await generateClusterViaLiteLlm(materials);
      case "mock":
      default:
        return generateMockClusterInsight(materials);
    }
  } catch (error) {
    console.error("[ai] cluster insight failed", error);
    return generateMockClusterInsight(materials);
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

async function generateClusterViaOpenAiCompatible(materials: ReactorClusterMaterialInput[]) {
  const apiKey = config.ai.openaiApiKey || config.ai.apiKey;
  const baseUrl = config.ai.openaiBaseUrl || config.ai.baseUrl || "https://api.openai.com/v1";

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
          content: reactorClusterPrompt(materials),
        },
      ],
    }),
  });

  await ensureOk(response, "openai-compatible");
  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  return parseClusterInsight(raw, materials);
}

async function generateClusterViaAnthropic(materials: ReactorClusterMaterialInput[]) {
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
      max_tokens: 240,
      messages: [
        {
          role: "user",
          content: reactorClusterPrompt(materials),
        },
      ],
    }),
  });

  await ensureOk(response, "anthropic");
  const data = await response.json();
  const raw = data?.content?.find?.((item: { type?: string }) => item.type === "text")?.text ?? "{}";
  return parseClusterInsight(raw, materials);
}

async function generateClusterViaGemini(materials: ReactorClusterMaterialInput[]) {
  const apiKey = config.ai.geminiApiKey || config.ai.apiKey;
  const model = config.ai.geminiModel;
  const baseUrl = config.ai.geminiBaseUrl;

  if (baseUrl) {
    const result = await generateTextViaOpenAiLikeBaseUrl({
      baseUrl,
      apiKey,
      model,
      promptText: reactorClusterPrompt(materials),
      providerName: "gemini-baseurl",
    });
    return parseClusterInsight(result, materials);
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
            parts: [{ text: reactorClusterPrompt(materials) }],
          },
        ],
      }),
    },
  );

  await ensureOk(response, "gemini");
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return parseClusterInsight(raw, materials);
}

async function generateClusterViaLiteLlm(materials: ReactorClusterMaterialInput[]) {
  const apiKey = config.ai.litellmApiKey || config.ai.apiKey;
  const baseUrl = config.ai.litellmBaseUrl || config.ai.baseUrl || "http://localhost:4000";
  const result = await generateTextViaOpenAiLikeBaseUrl({
    baseUrl,
    apiKey,
    model: config.ai.litellmModel,
    promptText: reactorClusterPrompt(materials),
    providerName: "litellm",
  });
  return parseClusterInsight(result, materials);
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

async function generateTextViaOpenAiLikeBaseUrl({
  baseUrl,
  apiKey,
  model,
  promptText,
  providerName,
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  promptText: string;
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
          content: promptText,
        },
      ],
    }),
  });

  await ensureOk(response, providerName);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "{}";
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
      promptSummary: "暖调纸感编辑墙",
    },
    {
      terms: ["glassmorphism", "frosted layer", "cool blur", "translucent panel"],
      promptSummary: "冷调毛玻璃叠层卡片",
    },
    {
      terms: ["poster composition", "oversized type", "calm negative space", "soft gradient"],
      promptSummary: "大字留白海报构图",
    },
    {
      terms: ["polaroid framing", "tape accent", "scrapbook feel", "gentle depth"],
      promptSummary: "拍立得拼贴手帐感",
    },
  ];

  const index = seed.length % pools.length;
  return pools[index];
}

function parseClusterInsight(raw: string, materials: ReactorClusterMaterialInput[]): ReactorClusterInsight {
  try {
    const cleaned = String(raw).trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned);
    const title = typeof parsed?.title === "string" ? parsed.title.trim().slice(0, 80) : "";
    const note = typeof parsed?.note === "string" ? parsed.note.trim().slice(0, 180) : "";
    const subsetHint =
      typeof parsed?.subsetHint === "string" && parsed.subsetHint.trim()
        ? parsed.subsetHint.trim().slice(0, 180)
        : null;

    if (!title || !note) {
      return generateMockClusterInsight(materials);
    }

    return { title, note, subsetHint };
  } catch {
    return generateMockClusterInsight(materials);
  }
}

function generateMockClusterInsight(materials: ReactorClusterMaterialInput[]): ReactorClusterInsight {
  const tags = materials.flatMap((material) => material.tags ?? []).filter(Boolean);
  const topTag = mostCommon(tags);
  const topType = mostCommon(materials.map((material) => material.type));

  if (topTag) {
    return {
      title: topTag,
      note: "These notes look ready to distill into one direction.",
      subsetHint: materials.length >= 3 ? "One note here likely works better as support, not the main thread." : null,
    };
  }

  return {
    title: `${capitalize(topType ?? "idea")} thread`,
    note: "A loose direction is forming here. Worth shaping before you lose it.",
    subsetHint: materials.length >= 3 ? "There may be one detail note here that belongs under a stronger lead note." : null,
  };
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function capitalize(value: string) {
  return value ? `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}` : value;
}

function extractMediaType(dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,/);
  return match?.[1] ?? "image/png";
}

function extractBase64Data(dataUrl: string) {
  return dataUrl.split(",")[1] ?? "";
}
