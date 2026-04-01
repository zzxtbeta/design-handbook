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
  intent: string;
  prompt: string;
}

const prompt =
  "请基于这张截图的具体使用场景和界面语境，从专业UI/视觉设计角度，提炼 6-8 个最关键的设计关键词。" +
  "关键词必须具体、可检索、可复刻，避免空泛词、常见套话和同义重复。" +
  "关键词必须使用中文短语，不要英文，不要中英混写。" +
  "请尽量覆盖至少 4 类信息：布局结构、组件形态、字体/排版、颜色/光影、材质/质感、交互暗示。" +
  "优先输出这张图真正显著的视觉特征，而不是安全但泛化的描述。" +
  "另外再生成一段可直接复制给文生文或文生图AI的中文风格提示词，用来让AI精准理解这张图的气质与设计语言。" +
  "这段提示词必须是完整自然的一段话，不是标题，不是碎片短语，也不是总结口号。" +
  "必须明确说明：整体氛围、版式结构、排版风格、配色倾向、材质肌理、光影方式，以及应该避免的俗套方向。" +
  "长度控制在 80 到 220 个中文字符之间，要求具体、可执行、可复刻，可以直接复制使用。" +
  "这段提示词必须使用中文，不要英文，不要项目符号，不要 JSON 内嵌列表。" +
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
    "请把它们当成同一条创作脉络来理解，先理清创作者真正想表达的意图，再产出一段可直接复制给更强AI去生成母稿的中文 prompt。",
    "只输出 JSON，不要输出额外解释。",
    '输出格式：{"title":"...","intent":"...","prompt":"..."}',
    "规则：",
    "- title：中文，6到16个字，像一个可继续写的主题。",
    "- intent：中文，一句话说清创作者这批材料真正想表达什么，避免空泛总结。",
    "- prompt：中文，多行字符串，直接写给另一个更强AI用。",
    "- prompt 里必须包含：主题判断、目标读者、语气要求、可用素材提示、文章结构要求、必须保留的真实感。",
    "- prompt 不能是解释，必须是可直接复制粘贴的生成指令。",
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
      ? parsed.promptSummary.trim().slice(0, 600)
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
      terms: ["编辑式留白布局", "纸张纤维肌理", "柔和漫反射阴影", "暖灰中性色调"],
      promptSummary: "整体保持暖灰米白的纸感编辑氛围，用克制留白和轻柔阴影建立安静层次，版式偏杂志编排而不是强功能看板，字体与元素都要有呼吸感，避免高饱和配色、锐利高对比和过满的信息堆叠。",
    },
    {
      terms: ["冷调毛玻璃叠层", "半透明模糊面板", "柔雾边缘", "浅灰蓝光感"],
      promptSummary: "画面以浅灰蓝和雾面白为主，使用半透明叠层卡片与柔和模糊边缘营造冷静的数字空气感，强调轻盈悬浮和细腻过渡，不要出现厚重投影、艳丽颜色或过于科技感的赛博元素。",
    },
    {
      terms: ["海报式大字构图", "克制负空间", "重心偏移排版", "低饱和渐变"],
      promptSummary: "采用海报式大字与大面积留白的版式结构，让视觉重心带一点偏移和呼吸感，色彩保持低饱和柔雾渐变，整体安静而有设计张力，避免满版装饰、复杂组件感和常见互联网运营风格。",
    },
    {
      terms: ["拍立得相纸边框", "手帐拼贴感", "纸胶带点缀", "轻静物陈列"],
      promptSummary: "用拍立得相纸边框、手帐式拼贴和少量纸胶带细节营造轻松文艺的收集感，整体偏低饱和莫兰迪色和柔和纸面肌理，像桌面静物陈列而不是商业广告，避免元素过满和过强的可爱装饰。",
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
    const intent = typeof parsed?.intent === "string" ? parsed.intent.trim().slice(0, 220) : "";
    const prompt = typeof parsed?.prompt === "string" ? parsed.prompt.trim().slice(0, 2400) : "";

    if (!title || !intent || !prompt) {
      return generateMockStorylineInsight(diary, materials);
    }

    return { title, intent, prompt };
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
    intent: diary.trim()
      ? "今天的日记和素材都在指向一个更清楚的主题，值得先把核心判断写出来。"
      : "这批素材里已经有一个共同方向了，适合先收成一个可继续展开的主题。",
    prompt: [
      "请根据下面这些真实素材，帮我写一篇高质量中文母稿。",
      `核心主题：${title}`,
      "先帮我提炼一个清晰判断，不要平铺信息。",
      "目标读者：对这个主题有感受、但还没被说服的人。",
      "语气要求：真实、克制、有判断，不要像知识博主念稿。",
      "结构要求：先抛出核心判断，再用真实素材支撑，最后落到一个值得继续思考的问题。",
      "素材使用要求：优先使用我提供的日记感受和画布素材，不要编造经历。",
      "请先给一个完整母稿，再补 3 个可替换标题。",
    ].join("\n"),
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
