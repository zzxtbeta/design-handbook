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

export interface ReactorStorylineInsight {
  title: string;
  summary: string;
  structure: string[];
  nextStep: string;
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
    "你在帮助内容创作者整理一个乱序素材白板。",
    "给定一小组已经靠近的素材，请判断它们最可能指向的共同主题。",
    "只输出 JSON，不要输出额外解释。",
    '输出格式：{"title":"...","note":"...","subsetHint":"...|null"}',
    "规则：",
    "- title：中文，6到16个字，像一个可继续展开的主题，不要空泛。",
    "- note：中文，一句简短建议，明确说明这组素材为什么值得留下或往哪个方向整理。",
    "- subsetHint：中文；如果看得出其中一条更像补充、子集或可并入另一条，就指出来；否则返回 null。",
    "- 语气要像在帮创作者判断，不要像总结报告，不要提到AI。",
    "",
    "素材：",
    JSON.stringify(materials),
  ].join("\n");

const reactorStorylinePrompt = (input: {
  diary: string;
  materials: ReactorClusterMaterialInput[];
}) =>
  [
    "你在帮助内容创作者整理一天的乱序素材。",
    "输入包含两部分：当天日记，以及创作者从画布中挑选出来的素材。",
    "请把它们当成同一条创作脉络来理解，输出一个可继续写的结构草案。",
    "只输出 JSON，不要输出额外解释。",
    '输出格式：{"title":"...","summary":"...","structure":["...","...","..."],"nextStep":"..."}',
    "规则：",
    "- title：中文，6到16个字，像一个可继续写的主题。",
    "- summary：中文，一句话说明这批材料真正值得写的核心。",
    "- structure：中文，3条，像内容结构或段落顺序，每条控制在24字以内。",
    "- nextStep：中文，一句非常具体的建议，告诉创作者接下来最该做什么。",
    "- 语气像成熟编辑，不要像AI助手，不要空泛，不要鸡汤。",
    "",
    "日记：",
    input.diary || "（空）",
    "",
    "素材：",
    JSON.stringify(input.materials),
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

export async function generateReactorStorylineInsight(input: {
  diary: string;
  materials: ReactorClusterMaterialInput[];
}): Promise<ReactorStorylineInsight> {
  const materials = input.materials.slice(0, 10);

  try {
    switch (config.ai.provider) {
      case "openai-compatible":
        return await generateStorylineViaOpenAiCompatible(input.diary, materials);
      case "anthropic":
        return await generateStorylineViaAnthropic(input.diary, materials);
      case "gemini":
        return await generateStorylineViaGemini(input.diary, materials);
      case "litellm":
        return await generateStorylineViaLiteLlm(input.diary, materials);
      case "mock":
      default:
        return generateMockStorylineInsight(input.diary, materials);
    }
  } catch (error) {
    console.error("[ai] storyline insight failed", error);
    return generateMockStorylineInsight(input.diary, materials);
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

async function generateStorylineViaOpenAiCompatible(diary: string, materials: ReactorClusterMaterialInput[]) {
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
          content: reactorStorylinePrompt({ diary, materials }),
        },
      ],
    }),
  });

  await ensureOk(response, "openai-compatible");
  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  return parseStorylineInsight(raw, diary, materials);
}

async function generateStorylineViaAnthropic(diary: string, materials: ReactorClusterMaterialInput[]) {
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
      max_tokens: 280,
      messages: [
        {
          role: "user",
          content: reactorStorylinePrompt({ diary, materials }),
        },
      ],
    }),
  });

  await ensureOk(response, "anthropic");
  const data = await response.json();
  const raw = data?.content?.find?.((item: { type?: string }) => item.type === "text")?.text ?? "{}";
  return parseStorylineInsight(raw, diary, materials);
}

async function generateStorylineViaGemini(diary: string, materials: ReactorClusterMaterialInput[]) {
  const apiKey = config.ai.geminiApiKey || config.ai.apiKey;
  const model = config.ai.geminiModel;
  const baseUrl = config.ai.geminiBaseUrl;

  if (baseUrl) {
    const result = await generateTextViaOpenAiLikeBaseUrl({
      baseUrl,
      apiKey,
      model,
      promptText: reactorStorylinePrompt({ diary, materials }),
      providerName: "gemini-baseurl",
    });
    return parseStorylineInsight(result, diary, materials);
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
            parts: [{ text: reactorStorylinePrompt({ diary, materials }) }],
          },
        ],
      }),
    },
  );

  await ensureOk(response, "gemini");
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return parseStorylineInsight(raw, diary, materials);
}

async function generateStorylineViaLiteLlm(diary: string, materials: ReactorClusterMaterialInput[]) {
  const apiKey = config.ai.litellmApiKey || config.ai.apiKey;
  const baseUrl = config.ai.litellmBaseUrl || config.ai.baseUrl || "http://localhost:4000";
  const result = await generateTextViaOpenAiLikeBaseUrl({
    baseUrl,
    apiKey,
    model: config.ai.litellmModel,
    promptText: reactorStorylinePrompt({ diary, materials }),
    providerName: "litellm",
  });
  return parseStorylineInsight(result, diary, materials);
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
      note: "这组素材已经有共同指向了，适合先收成一个可写的方向。",
      subsetHint: materials.length >= 3 ? "这里可能有一条更像补充说明，适合挂到主线素材下面。" : null,
    };
  }

  return {
    title: `${capitalize(topType ?? "idea")}主线`,
    note: "这里已经开始形成一个方向了，值得趁还新鲜时先整理出来。",
    subsetHint: materials.length >= 3 ? "这里可能有一条细节素材，更适合并到更强的主卡片下面。" : null,
  };
}

function parseStorylineInsight(
  raw: string,
  diary: string,
  materials: ReactorClusterMaterialInput[],
): ReactorStorylineInsight {
  try {
    const cleaned = String(raw).trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned);
    const title = typeof parsed?.title === "string" ? parsed.title.trim().slice(0, 80) : "";
    const summary = typeof parsed?.summary === "string" ? parsed.summary.trim().slice(0, 180) : "";
    const structure = Array.isArray(parsed?.structure)
      ? parsed.structure.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 3)
      : [];
    const nextStep = typeof parsed?.nextStep === "string" ? parsed.nextStep.trim().slice(0, 160) : "";

    if (!title || !summary || structure.length === 0 || !nextStep) {
      return generateMockStorylineInsight(diary, materials);
    }

    return { title, summary, structure, nextStep };
  } catch {
    return generateMockStorylineInsight(diary, materials);
  }
}

function generateMockStorylineInsight(
  diary: string,
  materials: ReactorClusterMaterialInput[],
): ReactorStorylineInsight {
  const topTag = mostCommon(materials.flatMap((material) => material.tags ?? []).filter(Boolean));
  const title = topTag || (diary.trim() ? "今天最该写的线索" : "这组素材的可写方向");

  return {
    title,
    summary: diary.trim()
      ? "今天的日记和素材都在指向一个更清楚的主题，值得先把核心判断写出来。"
      : "这批素材里已经有一个共同方向了，适合先收成一个可继续展开的主题。",
    structure: [
      "先写今天最强的观察或感受",
      "再接一条最能支撑它的素材",
      "最后落到一个可继续展开的问题",
    ],
    nextStep: "先把第一段写成一句明确判断，再决定哪些素材真的需要留下。",
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
