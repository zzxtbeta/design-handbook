import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type {
  DaySlot,
  ReactorBoard,
  ReactorDay,
  ReactorMaterial,
  ReactorMaterialMeta,
  ReactorMaterialType,
  WeekData,
  WeekEntry,
} from "./types";

const dayGroups = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["weekend", "Weekend"],
] as const;

const reactorQuickTags = [
  "角度",
  "参考",
  "结构",
  "语气",
  "视觉",
  "跟进",
  "主题",
  "提示词",
] as const;

const reactorWhyKeepPresets = [
  "Worth revisiting",
  "Use later",
  "Strong angle",
  "Good reference",
  "Keep the tone",
] as const;

interface ReactorStorylineInsight {
  title: string;
  intent: string;
  prompt: string;
}

type ViewMode = "week" | "day";
type BoardMode = "aesthetic" | "reactor" | "longform";
type LongformViewMode = "shelf" | "detail";
type ToolId = "xhs-layout" | "screenshot-rebuild";

interface BoardLayout {
  x: number;
  y: number;
  width: number;
  z: number;
}

type WeekCardSizes = Record<string, number>;

interface ReactorPet {
  id: string;
  rarity: "common" | "rare" | "legendary";
  bubble: "cloud" | "notch" | "soft" | "ticket" | "star";
  mode: "peek" | "perch" | "float";
  species: "fox" | "sprout" | "moth" | "slime" | "pup" | "owl";
  palette: [string, string, string];
}

interface LongformReference {
  id: string;
  category: string;
  eyebrow: string;
  title: string;
  summary: string;
  coverLabel: string;
  palette: [string, string, string];
  accent: string;
  author: string;
  date: string;
  content: string[];
  whyItWorks: string;
  framework: string[];
  resonance: string[];
  reusableMoves: string[];
}

interface LongformAnalysis {
  whyItWorks: string;
  framework: string[];
  resonance: string[];
  reusableMoves: string[];
}

interface LongformDraft {
  title: string;
  summary: string;
  author: string;
  date: string;
  rawContent: string;
  content: string[];
  coverLabel: string;
  coverUrl: string | null;
  analysis: LongformAnalysis;
}

const reactorPets: ReactorPet[] = [
  { id: "mochi", rarity: "common", bubble: "cloud", mode: "peek", species: "slime", palette: ["#f1dfb6", "#d8bd7a", "#513927"] },
  { id: "mint", rarity: "common", bubble: "soft", mode: "perch", species: "sprout", palette: ["#d2e7c8", "#90b77d", "#41563a"] },
  { id: "pebble", rarity: "common", bubble: "ticket", mode: "peek", species: "pup", palette: ["#e1d2c5", "#bc8d63", "#5a3f31"] },
  { id: "pip", rarity: "common", bubble: "notch", mode: "float", species: "moth", palette: ["#ead8ee", "#b291cc", "#523e63"] },
  { id: "lulu", rarity: "common", bubble: "cloud", mode: "perch", species: "fox", palette: ["#f6d9cb", "#d47e66", "#5f372f"] },
  { id: "bobo", rarity: "common", bubble: "soft", mode: "peek", species: "owl", palette: ["#d9d9ef", "#8f90c6", "#404069"] },
  { id: "pico", rarity: "common", bubble: "ticket", mode: "float", species: "slime", palette: ["#d4e3db", "#82ab96", "#355346"] },
  { id: "toto", rarity: "common", bubble: "star", mode: "peek", species: "pup", palette: ["#f2dfc8", "#ca9f6a", "#614734"] },
  { id: "nori", rarity: "common", bubble: "cloud", mode: "float", species: "moth", palette: ["#d4ebe3", "#87b3a6", "#365249"] },
  { id: "mugi", rarity: "common", bubble: "notch", mode: "perch", species: "fox", palette: ["#f0deb1", "#d19b4f", "#66461f"] },
  { id: "yuzu", rarity: "common", bubble: "soft", mode: "float", species: "sprout", palette: ["#f4e6b7", "#d8b85c", "#63512a"] },
  { id: "kiki", rarity: "common", bubble: "star", mode: "perch", species: "owl", palette: ["#e0d5eb", "#a88dbe", "#4b3f60"] },
  { id: "momo", rarity: "rare", bubble: "cloud", mode: "float", species: "fox", palette: ["#ffd7e3", "#ea8da8", "#65364a"] },
  { id: "sumi", rarity: "rare", bubble: "ticket", mode: "perch", species: "pup", palette: ["#dce4ef", "#89a6c9", "#334b63"] },
  { id: "puff", rarity: "rare", bubble: "soft", mode: "peek", species: "slime", palette: ["#ece6ff", "#b9a6ff", "#51426e"] },
  { id: "beta", rarity: "rare", bubble: "star", mode: "float", species: "moth", palette: ["#daf4e4", "#7cc79b", "#2e5b44"] },
  { id: "nova", rarity: "legendary", bubble: "notch", mode: "float", species: "sprout", palette: ["#ffe7a8", "#f7b63f", "#77531d"] },
  { id: "gigi", rarity: "legendary", bubble: "cloud", mode: "perch", species: "owl", palette: ["#fff0b9", "#f3c44d", "#70541e"] },
];

const longformReferences: LongformReference[] = [
  {
    id: "khosla-hiring",
    category: "Hiring",
    eyebrow: "Featured Essay",
    title: "The art of hiring: insights from Khosla Ventures, Airbnb, Ramp and Traba",
    summary: "把一个常见话题写出高级感，不靠鸡汤，而靠视角、节奏和强信息密度。",
    coverLabel: "Editorial Interview",
    palette: ["#f2eee8", "#d8dfe6", "#4f5b6a"],
    accent: "#111111",
    author: "Lina Linder",
    date: "12 January 2025",
    content: [
      "在拥有无数招聘建议的时代，真正能留下来的文章不是再重复一遍“要招对人”，而是把招聘这件事放进组织气质、判断力和创始人节奏里去写。",
      "这篇文章成立，不是因为它信息最多，而是因为它把几个强名字放在一起后，没有滑向八卦或流水账，而是很快建立了一个更高的命题：顶级公司到底是怎么判断人的。",
      "它在结构上保持了非常稳定的编辑感。标题先给出足够强的名词密度，随后正文快速进入可感知的观察，再逐段把经验拆成读者能拿走的判断。",
      "阅读时会有一种很强的“我在看一篇认真做过采访和整理的东西”的信任感。这种信任感，本身就是长文最重要的钩子之一。"
    ],
    whyItWorks: "它成立的核心，不在于信息新，而在于把“招聘”从实用话题拉成了一个关于组织判断力的高级命题。",
    framework: [
      "大命题标题先建立阅读价值",
      "用具体公司与人物建立可信度",
      "把零散观点整理成连续的判断链",
      "最后回到读者可迁移的结论"
    ],
    resonance: [
      "读者会感觉自己不是在看技巧，而是在接近一套更高级的判断标准",
      "它打中了“想把事情做深”的人，而不是只想要 checklist 的人"
    ],
    reusableMoves: [
      "把常见话题抬高一个抽象层级",
      "标题里放进高密度的可信名词",
      "段落之间保持编辑式节奏，不急于抖观点",
      "用结论感强的句子做每段收束"
    ],
  },
  {
    id: "one-person-company",
    category: "AI Cognition",
    eyebrow: "Reference Sample",
    title: "一人公司的幻觉与真相",
    summary: "典型的“反常识命题 + 数据反证 + 历史类比”结构，适合拆写法。",
    coverLabel: "Counter Thesis",
    palette: ["#efebe3", "#d9d0c6", "#695247"],
    accent: "#7a4c3b",
    author: "嘉叔养生",
    date: "31 March 2026",
    content: [
      "这篇长文的厉害之处，在于它没有停在“AI 降低门槛”这种已经被说烂的结论，而是把门槛重新定义成认知、分发和信任。",
      "它的推进也非常稳：先承认大众想象，再用数据做反证，然后给出摄影术与印象派的历史类比，最后把价值重新定义。",
      "这样的结构会让读者产生一种被重新校准的感觉。不是简单被说服，而是觉得自己过去理解错了什么。",
      "所以它的传播潜力，来自认知反差，也来自它让读者获得了一种更锋利的表达方式。"
    ],
    whyItWorks: "它最成立的地方是“把门槛从做出来重新定义到被看见、被相信”，这个重定义动作非常强。",
    framework: [
      "先承认大众幻想",
      "用数据和现实打掉旧叙事",
      "给历史类比建立可信迁移",
      "重定义价值坐标",
      "落回读者下一步该积累什么"
    ],
    resonance: [
      "它打中了普通人最深的焦虑：学会工具后仍然没有优势怎么办",
      "它也给了读者一种新的自我安放方式：慢能力并没有过时"
    ],
    reusableMoves: [
      "标题制造幻觉与真相的反差",
      "先站在读者一边再翻转判断",
      "用历史类比提高说服力",
      "把结论落成新的价值词汇"
    ],
  },
  {
    id: "real-expression",
    category: "Expression",
    eyebrow: "Reference Sample",
    title: "真实表达不是更用力，而是更少修饰",
    summary: "一句话命题足够锋利，适合作为社论式短长文样本。",
    coverLabel: "Tone Study",
    palette: ["#f3f0ec", "#d8d5d0", "#7d7770"],
    accent: "#1c1c1c",
    author: "Internal Note",
    date: "01 April 2026",
    content: [
      "很多表达不成立，不是因为内容太少，而是因为修饰太多。每一句都想证明自己在思考，结果反而把真正想说的东西埋掉了。",
      "这类文章如果写得好，往往是先找到一个足够干净的命题，然后用最少的形容词去托住它。句子一旦变轻，观点反而更重。",
      "读者会觉得这种文字像在直接对自己说话，因为作者没有拼命摆出写作姿态。真实感，常常来自放弃表演。"
    ],
    whyItWorks: "它好在命题本身足够短、足够狠，所以读者很快就能感到一种判断力。",
    framework: [
      "一句锋利命题开场",
      "解释常见误区",
      "提出一个更本质的判断",
      "用很轻的收束句留下余味"
    ],
    resonance: [
      "它会让读者想到自己过去那些写得太满、太急于证明的表达",
      "它打中了大家想更真诚但又不知道怎么做减法的状态"
    ],
    reusableMoves: [
      "把命题压缩到一句话",
      "少举例，多做判断",
      "去掉不必要的修饰词",
      "让句子像口头判断，不像稿件表演"
    ],
  },
  {
    id: "dwarkesh-profile",
    category: "Profile",
    eyebrow: "Reference Sample",
    title: "一个 23 岁的播客新星，凭什么让硅谷大佬排队上他节目？",
    summary: "人物长文的经典样本：用强悬念标题、场景化叙述和连续推进做出阅读粘性。",
    coverLabel: "Profile Breakdown",
    palette: ["#f1efe9", "#d8d4cf", "#5f5b57"],
    accent: "#101010",
    author: "Prompt Example",
    date: "02 April 2026",
    content: [
      "这类人物长文最难的是，既要让读者迅速进入一个具体的人，又不能写成履历堆砌。这篇样本的好，在于它从第一句就把人放进了一个强悬念里。",
      "紧接着，它没有急着解释，而是用一连串更具体的事实去抬高这个悬念，让读者自然产生“他到底特别在哪里”的追问。",
      "这时候作者再把成长路径、内容策略和时代背景慢慢补进来，整个阅读就变成了一次连续的理解过程，而不是信息灌输。"
    ],
    whyItWorks: "它把人物报道写成了问题驱动式阅读，让读者始终处在想继续往下看的状态里。",
    framework: ["一个强问题开场", "连续抬高悬念", "补足背景信息", "回到人物方法论"],
    resonance: ["让读者觉得自己在接近一个时代人物", "满足了对成功路径和判断力的双重好奇"],
    reusableMoves: ["人物题用问题开场", "先制造张力再补资料", "把经历写成判断演化"],
  },
  {
    id: "xhs-layout-method",
    category: "Prompt Method",
    eyebrow: "Reference Sample",
    title: "我写了一个 prompt，让 AI 一键排版小红书长文",
    summary: "方法论型爆文样本：问题直给、解决方案极短、可复制性极强。",
    coverLabel: "Prompt Method",
    palette: ["#efeee8", "#d7d4ca", "#79685b"],
    accent: "#8d4e3d",
    author: "Creator Sample",
    date: "02 April 2026",
    content: [
      "这类内容好，是因为它把一个具体痛点讲得足够直白：排版太难用。读者在第一句就知道这篇东西是替自己解决麻烦的。",
      "接下来作者没有长篇铺垫，而是快速给出方法和原理，让读者相信这不是空洞技巧，而是真可复用的操作方案。",
      "最后再把可迁移场景打开，小红书之外，PPT、海报、商品详情页都能用，传播价值就一下被放大了。"
    ],
    whyItWorks: "它用一个真实痛点作为入口，又用高度可复用的方法论把单点经验升级成普适技巧。",
    framework: ["痛点开门", "给出三步法", "展示效果", "拉高到更多场景"],
    resonance: ["读者会觉得这就是‘我也能马上用起来’的内容", "它同时满足效率感和掌控感"],
    reusableMoves: ["痛点-方法-迁移三段式", "用效果图做信任背书", "把工具感表达成生活技巧"],
  },
  {
    id: "ai-notetaking",
    category: "Workflow",
    eyebrow: "Reference Sample",
    title: "把乱序笔记喂给 AI，它能帮你找出真正该写的那条主线",
    summary: "创作者工作流样本：把碎片输入、AI 整理和表达判断串成一个有说服力的闭环。",
    coverLabel: "Workflow Essay",
    palette: ["#f5f0ed", "#ddd3ce", "#7f6d67"],
    accent: "#2b211d",
    author: "Internal Draft",
    date: "02 April 2026",
    content: [
      "创作者最痛苦的不是没灵感，而是灵感太多，最后谁都没长成作品。这类文章的价值，在于它能把混乱输入重新定义成一种优势。",
      "写得好的地方不是把 AI 神化，而是把 AI 放在恰当的位置：不是替你表达，而是帮你整理、归并、看见主线。",
      "只要这个角色定义清楚，整篇文章就会有一种很强的产品判断感，读者也更容易把它迁移到自己的工作流里。"
    ],
    whyItWorks: "它把 AI 从‘万能写手’拉回‘素材剪辑师’，因此观点更稳，也更可信。",
    framework: ["提出真实痛点", "重新定义问题", "给 AI 一个清晰角色", "落到个人工作流闭环"],
    resonance: ["创作者会觉得被理解，因为这就是他们每天的真实状态", "它给了一个不焦虑的 AI 使用方式"],
    reusableMoves: ["先写混乱，再写判断", "定义 AI 边界", "用闭环表达产品价值"],
  },
];

function parseLongformContent(raw: string) {
  return raw
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.replace(/\n+/g, " ").trim())
    .filter(Boolean);
}

function formatLongformDate() {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function deriveLongformAnalysis(title: string, paragraphs: string[]): LongformAnalysis {
  const joined = paragraphs.join(" ");
  const hasQuestion = /[？?]/.test(title);
  const hasNumbers = /\d/.test(title + joined);
  const hasContrast = /(不是|而是|真相|幻觉|反而|重新定义|却)/.test(joined);

  return {
    whyItWorks: hasQuestion
      ? "这篇素材最强的地方，是它先抛出一个读者会立刻想继续看的问题，再在正文里不断补充判断和证据，让阅读带着追问往前走。"
      : hasContrast
        ? "这篇素材成立，是因为它不只是提供信息，而是通过反差和重定义，把读者熟悉的话题重新校准成一个更值得传播的命题。"
        : "这篇素材写得好，主要在于它的信息组织很稳：开头先给阅读价值，中段持续递进，结尾留下可迁移的判断。",
    framework: [
      hasQuestion ? "用问题式标题制造阅读动机" : "先亮出一个清晰命题",
      hasNumbers ? "中段用数据或事实抬高可信度" : "中段用案例或观察推进论证",
      "每一段都围绕同一条主线继续收束",
      "结尾把理解落成一个读者可复用的判断",
    ],
    resonance: [
      "它不是空泛地讲道理，而是把读者熟悉的焦虑、欲望或判断困境写得很具体。",
      "读者读完会感觉自己获得了一种更锋利的表达方式，而不只是看完一段信息。",
    ],
    reusableMoves: [
      "标题先给出冲突或悬念",
      "正文里持续做命题收束，不让段落散掉",
      "少堆结论，多做节奏推进",
      "最后留下一个适合被引用和转述的判断句",
    ],
  };
}

function buildLongformDraft(item: LongformReference): LongformDraft {
  const rawContent = item.content.join("\n\n");
  return {
    title: item.title,
    summary: item.summary,
    author: item.author,
    date: item.date,
    rawContent,
    content: item.content,
    coverLabel: item.coverLabel,
    coverUrl: null,
    analysis: {
      whyItWorks: item.whyItWorks,
      framework: item.framework,
      resonance: item.resonance,
      reusableMoves: item.reusableMoves,
    },
  };
}

const toolsCatalog: Array<{
  id: ToolId;
  title: string;
  eyebrow: string;
  summary: string;
  prompt: string;
  steps: string[];
}> = [
  {
    id: "xhs-layout",
    eyebrow: "Layout Prompt",
    title: "小红书长文排版",
    summary: "把文章内容塞进一个高保真的 HTML 排版 prompt，复制给更强 AI 直接出可截图发布的页面。",
    steps: [
      "复制这份 prompt 全文",
      "把文章正文替换进 <user_content> 标签",
      "丢给 Gemini / Claude / 豆包这类可预览 HTML 的模型",
    ],
    prompt: `你是一位精通 HTML/CSS 的前端开发与网页布局专家。你的任务是将用户提供的文章内容按照以下样式规范生成完整的HTML页面。页面应呈现为深色背景中的白色卡片，具有现代感和良好的阅读体验。

## 一、整体布局

### 页面背景
- 深色渐变背景：\`linear-gradient(135deg, #1e1e2e 0%, #2d2b55 50%, #3e3a5f 100%)\`
- 背景固定：\`background-attachment: fixed\`
- 使用 Flexbox 居中布局

### 主容器（白色卡片）
- 尺寸：\`600px × 1000px\`
- 背景：白色 \`#ffffff\`
- 圆角：\`12px\`
- 三层立体阴影：

\`\`\`
box-shadow:
  0 25px 50px rgba(0, 0, 0, 0.4),
  0 10px 30px rgba(0, 10, 20, 0.3),
  0 5px 15px rgba(0, 5, 15, 0.25);
\`\`\`

### 内容区
- 内边距：\`50px\`
- 可垂直滚动
- 自定义滚动条：8px 宽，半透明灰色

## 二、字体系统

### 引入字体

需要从 Google Fonts 引入：
- **Noto Serif SC**（思源宋体）：weight 700
- **Inter**：weight 300, 400, 700, 800
- **JetBrains Mono**：weight 400, 700

### 字体使用规则
- 正文默认：系统字体栈（-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto 等）
- H1 主标题：Noto Serif SC（思源宋体）
- H2 副标题：Times New Roman
- 英文标题：Inter
- 代码：JetBrains Mono

## 三、文本样式规范

### 标题层级

| 元素 | 字体 | 大小 | 颜色 | 粗细 | 行高 | 外边距 |
|------|------|------|------|------|------|--------|
| h1 | Noto Serif SC | 48px | #000000 | 700 | 1.3 | bottom: 30px |
| h2 | Times New Roman | 26px | #000000 | 700 | - | top: 40px, bottom: 20px |
| h3 | 默认 | 22px | #2c3e50 | 600 | - | top: 30px, bottom: 15px |
| h4 | 默认 | 20px | #5a6c7d | 600 | - | top: 25px, bottom: 12px |

### 正文
- 字号：\`24px\`
- 颜色：\`#333333\`
- 行高：\`1.8\`
- 段落间距：\`margin-bottom: 20px\`

### 特殊文本类

英文标题（\`.en-title\`）
- 字体：Inter
- 字号：20px
- 颜色：#888888
- 字重：300

元数据（\`.metadata\`）
- 字号：14px
- 颜色：#888

## 四、强调与标记

### 链接（a）
- 颜色：\`#4a9eff\`（蓝色）
- 默认无下划线
- 悬停显示下划线
- 过渡：\`0.2s ease\`

### 强调（em）
- 颜色：\`#000000\`（黑色）
- 字体样式：\`normal\`（非斜体）
- 用于需要强调但不高亮的文本

### 粗体（strong）
- 用于重要关键词

### 高亮标记（mark）
- 背景色：\`#fff59d\`（浅黄色）
- 文字颜色：\`#000000\`
- 粗体：bold
- 底边框：\`2px solid #ff9800\`（橙色）
- 圆角：\`4px\`
- 内边距：\`2px 6px\`

## 五、列表与引用

### 列表（ul，ol）
- 字号：22px
- 左内边距：20px
- 底部间距：20px

### 列表项（li）
- 项间距：\`margin-bottom: 8px\`

### 引用块（blockquote）
- 左边框：\`4px solid #4a9eff\`（蓝色竖线）
- 左内边距：20px
- 字体样式：斜体
- 上下外边距：\`20px 0\`

## 六、响应式设计

断点：\`650px\` 及以下

调整项：
- Body 内边距：20px → 10px
- Body 字号：24px → 20px
- 容器宽度：600px → 100%
- 容器高度：1000px → auto（最小 80vh）
- 内容区内边距：50px → 30px
- H1 字号：48px → 36px
- H2 字号：26px → 24px
- 列表字号：22px → 20px
- 代码块字号：17px → 15px，内边距：20px → 15px

\`// Crafted by lbog (miaomiao)\`

---

## 以下是用户提供的文章内容：

\`\`\`
<user_content>
<!-- 用户将在此处提供需要排版的文本内容 -->
<!-- 可能包含：标题、段落、列表、代码、链接等 -->
</user_content>
\`\`\`

请开始生成完整的HTML文件`,
  },
  {
    id: "screenshot-rebuild",
    eyebrow: "Reverse Prompt",
    title: "封面还原专家 prompt",
    summary: "把参考截图和你想放上封面的文本一起交给 AI，让它按原样式高保真还原并替换成你的内容。",
    steps: [
      "准备一张你喜欢的网页或排版截图",
      "把截图、这份 prompt，以及你想放上封面的文字内容一起发给 Gemini / Claude 这类能生成网页的模型",
      "让 AI 按截图样式还原页面，并直接替换成你的封面内容",
    ],
    prompt: `你是一名资深的前端逆向工程专家，具备设计系统思维。你擅长从各类网页截图中逆向推导完整实现：精确还原视觉设计（HTML/CSS），从静态画面推断交互逻辑与状态变化（必要时使用JavaScript），并识别设计系统的完整性与合理性。你的目标是创建一个在视觉保真度、功能完整性和用户体验上都高度还原原始设计的网页实现。

请仔细观察所提供的网页截图（可能是组件、卡片、页面布局或文字排版等）。你的任务是：通过系统化的逆向工程分析，完整还原截图中的视觉元素、配色，并推断必要的交互行为，最终生成一个完整且可运行的HTML页面（包含CSS样式，必要时包含JavaScript交互）。你生成的网页需要在视觉保真度、功能完整性和使用流畅度上都高度还原原始设计。如果用户同时提供了希望放入封面的文本内容，请在保持截图版式、视觉层级和设计语言一致的前提下，将这些内容自然替换进还原后的页面中，使其成为一张可直接截图使用的中文封面。

在给出最终代码之前，请使用下面的思考步骤进行系统化分析：

## 系统分析步骤：

1. 整体结构与布局分析：
- 确定主要的布局体系（flexbox、grid、float 等）
- 判断容器结构与内容层级
- 估算各部分的尺寸与比例
- 识别间距模式及 margin/padding 系统

2. 视觉设计系统分析：
- 提取配色方案（背景、文字、边框、阴影等）
- 分析字体系统（字体族、字号、字重、行高）
- 识别圆角、阴影及其他视觉特效
- 观察图标风格与图像处理方式

3. 组件与交互分析：
- 识别页面中的 UI 组件及其状态
- 推测悬停（hover）、聚焦（focus）或动画效果
- 分析响应式设计的可能线索
- 判断交互性元素的类型与功能

4. 技术实现策略：
- 选择合适的 HTML 语义结构
- 规划 CSS 架构与组织方式
- 判断可能使用的 CSS 框架或设计体系
- 考虑可用的现代 CSS 特性（如变量、grid、clamp 等）

5. 上下文与设计意图推断：
- 用途与交互语境识别（Functional Context）：包括该网页的应用场景，核心任务、信息流动方式、功能实用性
- 设计体系与风格映射（Design System Mapping）：包括该设计是否遵循特定的设计体系（如 Material Design、Notion/Obsidian 风格、Neumorphism、Skeuomorphism 等）。从布局、留白、组件、层次等特征判断该体系中其他相关的细节设置。
- 目标受众与体验意图（Audience & UX Intent）：根据视觉气质与内容表达方式推断目标受众，从中提炼受众需要的功能、体验、美学感受如何与整体视觉/交互相符。
- 排版原则的语言适配（Typography Principle Localization）：当截图内容为纯英文文本时，识别其遵循的西文排版原则（如行高比例、字间距系统、段落韵律等），并将这些原则转换为中文排版的对等实现。例如：英文的 line-height: 1.5 对应中文的 1.7-1.8；英文的紧凑字距对应中文需保留更宽松的字间呼吸空间。目标是保持跨语言场景下一致的阅读舒适度和视觉韵律。

## 基于上述分析，请生成一个完整的 HTML 文件，需包括以下内容：

1. 语义化的 HTML 结构 —— 准确反映内容层级；
2. 完整的 CSS 样式 —— 内嵌于 <style> 标签中，高度还原视觉设计；
3. 适度的响应式设计 —— 适配不同屏幕尺寸；
4. 可访问性特征 —— 包含合理的 alt 文本和语义标记。

### 实现要求：
- 使用现代 CSS 技术（flexbox、grid、自定义属性等）；
- 实现截图中可推测的悬停状态与交互反馈；
- 在间距、颜色与排版上做到像素级还原；
- 采用语义化的 HTML 元素以提升可访问性；
- 在 CSS 中添加注释，解释关键设计决策；
- 对截图中未能明确的细节做出合理假设。

现在，请你开始思考，然后生成html文件。如果用户还提供了封面文案，请在生成结果中直接使用这些文案，而不是保留截图中的原始占位内容。`,
  },
];

export function App() {
  const [week, setWeek] = useState<WeekData | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDay, setActiveDay] = useState<DaySlot>("mon");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [boardMode, setBoardMode] = useState<BoardMode>("aesthetic");
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reactorBoard, setReactorBoard] = useState<ReactorBoard | null>(null);
  const [reactorLoading, setReactorLoading] = useState(false);
  const [reactorError, setReactorError] = useState<string | null>(null);
  const [reactorViewMode, setReactorViewMode] = useState<ViewMode>("week");
  const [activeReactorDayKey, setActiveReactorDayKey] = useState(todayDateKey());
  const [reactorLayouts, setReactorLayouts] = useState<Record<string, BoardLayout>>({});
  const [reactorDiaryDraft, setReactorDiaryDraft] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<ReactorMaterialType>("idea");
  const [composerDayKey, setComposerDayKey] = useState(todayDateKey());
  const [composerContent, setComposerContent] = useState("");
  const [composerNote, setComposerNote] = useState("");
  const [composerTagsDraft, setComposerTagsDraft] = useState("");
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [reactorFeedback, setReactorFeedback] = useState<string | null>(null);
  const [reactorExportOpen, setReactorExportOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState<ToolId | null>(null);
  const [copiedToolPrompt, setCopiedToolPrompt] = useState<ToolId | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingImportant, setEditingImportant] = useState(false);
  const [editingNoteDraft, setEditingNoteDraft] = useState("");
  const [editingTagsDraft, setEditingTagsDraft] = useState("");
  const [isSavingMaterialEdit, setIsSavingMaterialEdit] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [dayNoteDraft, setDayNoteDraft] = useState("");
  const [notesHeight, setNotesHeight] = useState(250);
  const [boardLayouts, setBoardLayouts] = useState<Record<string, BoardLayout>>({});
  const [weekCardSizes, setWeekCardSizes] = useState<WeekCardSizes>({});
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [activeLongformId, setActiveLongformId] = useState(longformReferences[0]?.id ?? "");
  const [longformViewMode, setLongformViewMode] = useState<LongformViewMode>("shelf");
  const [longformDraft, setLongformDraft] = useState<LongformDraft>(() =>
    buildLongformDraft(longformReferences[0]),
  );
  const [longformFeedback, setLongformFeedback] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [zoomedEntry, setZoomedEntry] = useState<WeekEntry | null>(null);
  const [processingStage, setProcessingStage] = useState("Preparing image...");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const longformCoverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void loadWeek();
  }, [weekOffset]);

  useEffect(() => {
    void loadReactorBoard();
  }, [boardMode, weekOffset]);

  useEffect(() => {
    if (!week) {
      return;
    }

    setNoteDraft(week.note);
    setDayNoteDraft(week.dayNotes[activeDay] ?? "");
  }, [week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    const storageKey = layoutStorageKey(week.weekKey, activeDay);
    const parsed = readStoredJson<Record<string, BoardLayout>>(storageKey, {});
    const entries = week.entries.filter((entry) => entry.daySlot === activeDay);
    const merged: Record<string, BoardLayout> = {};

    entries.forEach((entry, index) => {
      merged[entry.id] = parsed[entry.id] ?? defaultBoardLayout(entry, index);
    });

    setBoardLayouts(merged);
  }, [activeDay, week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    const stored = readStoredJson<WeekCardSizes>(weekCardStorageKey(week.weekKey), {});
    const validIds = new Set(week.entries.map((entry) => entry.id));
    setWeekCardSizes(
      Object.fromEntries(Object.entries(stored).filter(([entryId]) => validIds.has(entryId))),
    );
  }, [week]);

  useEffect(() => {
    if (!week || Object.keys(boardLayouts).length === 0) {
      return;
    }

    window.localStorage.setItem(
      layoutStorageKey(week.weekKey, activeDay),
      JSON.stringify(boardLayouts),
    );
  }, [activeDay, boardLayouts, week]);

  useEffect(() => {
    if (!reactorFeedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setReactorFeedback(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [reactorFeedback]);

  useEffect(() => {
    if (!week) {
      return;
    }

    window.localStorage.setItem(weekCardStorageKey(week.weekKey), JSON.stringify(weekCardSizes));
  }, [week, weekCardSizes]);

  useEffect(() => {
    const activeMaterials =
      reactorBoard?.days.find((day) => day.dayKey === activeReactorDayKey)?.materials ?? [];
    if (activeMaterials.length === 0) {
      setReactorLayouts({});
      return;
    }

    const parsed = readStoredJson<Record<string, BoardLayout>>(reactorLayoutStorageKey(activeReactorDayKey), {});
    const merged: Record<string, BoardLayout> = {};

    activeMaterials.forEach((material, index) => {
      merged[material.id] = parsed[material.id] ?? findOpenReactorLayout(merged, material, index);
    });

    setReactorLayouts(merged);
  }, [activeReactorDayKey, reactorBoard]);

  useEffect(() => {
    setReactorDiaryDraft(window.localStorage.getItem(reactorDiaryStorageKey(activeReactorDayKey)) ?? "");
  }, [activeReactorDayKey]);

  useEffect(() => {
    if (Object.keys(reactorLayouts).length === 0) {
      return;
    }

    window.localStorage.setItem(
      reactorLayoutStorageKey(activeReactorDayKey),
      JSON.stringify(reactorLayouts),
    );
  }, [activeReactorDayKey, reactorLayouts]);

  useEffect(() => {
    async function handlePaste(event: ClipboardEvent) {
      if (!event.clipboardData) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (isEditableTarget(target)) {
        return;
      }

      if (boardMode === "reactor" && reactorViewMode === "day") {
        const imageItem = [...event.clipboardData.items].find((item) => item.type.startsWith("image/"));
        const textValue = event.clipboardData.getData("text/plain").trim();

        if (imageItem) {
          const file = imageItem.getAsFile();
          if (!file) {
            return;
          }

          event.preventDefault();
          const reader = new FileReader();
          reader.onload = async () => {
            const imageDataUrl = String(reader.result ?? "");
            const dimensions = await readImageSize(imageDataUrl);
            await createReactorMaterialRequest({
              dayKey: activeReactorDayKey,
              type: "image",
              content: "Image",
              imageDataUrl,
              meta: {
                imageWidth: dimensions.width,
                imageHeight: dimensions.height,
              },
            });
          };
          reader.readAsDataURL(file);
          return;
        }

        if (textValue) {
          event.preventDefault();
          await createReactorMaterialRequest(
            isProbablyUrl(textValue)
              ? {
                  dayKey: activeReactorDayKey,
                  type: "link",
                  content: textValue,
                  meta: {
                    sourceUrl: normalizeUrl(textValue),
                  },
                }
              : {
                  dayKey: activeReactorDayKey,
                  type: "idea",
                  content: textValue,
                },
          );
        }

        return;
      }

      const imageItem = [...event.clipboardData.items].find((item) => item.type.startsWith("image/"));
      if (!imageItem) {
        return;
      }

      const file = imageItem.getAsFile();
      if (!file || !week) {
        return;
      }

      event.preventDefault();
      setIsPasting(true);

      const reader = new FileReader();
      reader.onload = async () => {
        const imageDataUrl = String(reader.result ?? "");
        await submitImage(imageDataUrl);
      };

      reader.readAsDataURL(file);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeDay, week, boardMode, reactorViewMode, activeReactorDayKey]);

  useEffect(() => {
    const activeProcessingCount = week
      ? week.entries.filter((entry) => entry.status === "processing").length
      : 0;

    if (!isPasting && activeProcessingCount === 0) {
      return;
    }

    const stages = [
      "Preparing image...",
      "Uploading snapshot...",
      "Reading layout cues...",
      "Extracting design language...",
    ];
    let index = 0;
    setProcessingStage(stages[0]);

    const interval = window.setInterval(() => {
      index = Math.min(index + 1, stages.length - 1);
      setProcessingStage(stages[index]);
    }, 900);

    return () => window.clearInterval(interval);
  }, [isPasting, week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    setDayNoteDraft(week.dayNotes[activeDay] ?? "");
  }, [activeDay, week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    const processingIds = week.entries
      .filter((entry) => entry.status === "processing")
      .map((entry) => entry.id);

    if (processingIds.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      void Promise.all(processingIds.map((id) => fetch(`/api/entries/${id}`)))
        .then((responses) => Promise.all(responses.map((response) => response.json())))
        .then((entries: WeekEntry[]) => {
          if (entries.some((entry) => entry.status !== "processing")) {
            void loadWeek();
          }
        });
    }, 1200);

    return () => window.clearInterval(interval);
  }, [week]);

  useEffect(() => {
    if (!copiedTerm) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedTerm(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [copiedTerm]);

  useEffect(() => {
    if (!copiedToolPrompt) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedToolPrompt(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [copiedToolPrompt]);

  useEffect(() => {
    function closeExpandedTerms() {
      setExpandedEntryId(null);
    }

    window.addEventListener("click", closeExpandedTerms);
    return () => window.removeEventListener("click", closeExpandedTerms);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = appearance;
  }, [appearance]);

  const entriesByDay = useMemo(() => {
    if (!week) {
      return new Map<DaySlot, WeekEntry[]>();
    }

    return new Map<DaySlot, WeekEntry[]>(
      dayGroups.map(([slot]) => [
        slot,
        week.entries.filter((entry) => entry.daySlot === slot),
      ]),
    );
  }, [week]);

  const reactorWeek = useMemo(
    () => buildReactorWeek(reactorBoard?.days ?? [], weekOffset),
    [reactorBoard, weekOffset],
  );
  const activeReactorDay = reactorWeek.get(reactorSlotForDate(activeReactorDayKey));
  const activeReactorMaterials =
    reactorBoard?.days.find((day) => day.dayKey === activeReactorDayKey)?.materials ?? [];
  const reactorMaterialsById = useMemo(
    () =>
      new Map(
        (reactorBoard?.days ?? [])
          .flatMap((day) => day.materials)
          .map((material) => [material.id, material] as const),
      ),
    [reactorBoard],
  );
  const editingMaterial = editingMaterialId ? reactorMaterialsById.get(editingMaterialId) ?? null : null;
  const activeEntries = week
    ? week.entries.filter((entry) => entry.daySlot === activeDay)
    : [];
  const processingCount = week ? week.entries.filter((entry) => entry.status === "processing").length : 0;
  const weeklySummary = useMemo(() => buildWeeklySummary(week), [week]);
  const reactorWeeklySummary = useMemo(() => buildReactorWeeklySummary(reactorBoard), [reactorBoard]);
  const activeLongformReference =
    longformReferences.find((item) => item.id === activeLongformId) ?? longformReferences[0];

  useEffect(() => {
    setLongformDraft(buildLongformDraft(activeLongformReference));
  }, [activeLongformReference]);

  useEffect(() => {
    if (!longformFeedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setLongformFeedback(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [longformFeedback]);

  useEffect(() => {
    if (!reactorBoard) {
      return;
    }

    const validDayKeys = new Set(reactorBoard.days.map((day) => day.dayKey));
    if (validDayKeys.has(activeReactorDayKey)) {
      return;
    }

    setActiveReactorDayKey(
      weekOffset === 0 ? todayDateKey() : (reactorBoard.days[0]?.dayKey ?? todayDateKey()),
    );
  }, [activeReactorDayKey, reactorBoard, weekOffset]);

  async function loadWeek() {
    try {
      const response = await fetch(`/api/weeks/offset-${weekOffset}`);

      if (!response.ok) {
        throw new Error(`Week load failed with status ${response.status}`);
      }

      const data = (await response.json()) as WeekData;
      setWeek(data);
      setLoadError(null);
    } catch (error) {
      console.error("[web] loadWeek failed", error);
      setLoadError("Aesthetic Board 暂时读不到数据，Reactor 仍然可以先看方向。");
      setWeek(null);
    }
  }

  async function loadReactorBoard() {
    try {
      setReactorLoading(true);
      const response = await fetch(`/api/reactor/days?days=7&offset=${weekOffset}`);

      if (!response.ok) {
        throw new Error(`Reactor load failed with status ${response.status}`);
      }

      const data = (await response.json()) as ReactorBoard;
      setReactorBoard(data);
      setReactorError(null);
    } catch (error) {
      console.error("[web] loadReactorBoard failed", error);
      setReactorError("Creator Reactor is unavailable right now.");
    } finally {
      setReactorLoading(false);
    }
  }

  function handleLongformDraftField<K extends keyof LongformDraft>(field: K, value: LongformDraft[K]) {
    setLongformDraft((current) => ({ ...current, [field]: value }));
  }

  function handleLongformContentChange(value: string) {
    setLongformDraft((current) => ({
      ...current,
      rawContent: value,
      content: parseLongformContent(value),
    }));
  }

  async function handleLongformImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    handleLongformContentChange(text);
    setLongformFeedback("Imported");
    event.target.value = "";
  }

  function handleLongformCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    setLongformDraft((current) => ({ ...current, coverUrl: url }));
    setLongformFeedback("Cover updated");
    event.target.value = "";
  }

  function handleLongformAnalyze() {
    const analysis = deriveLongformAnalysis(longformDraft.title, longformDraft.content);
    setLongformDraft((current) => ({ ...current, analysis }));
    setLongformFeedback("AI extracted");
  }

  function openComposer(type: ReactorMaterialType, dayKey = activeReactorDayKey) {
    setComposerType(type);
    setComposerDayKey(dayKey);
    setComposerTagsDraft("");
    setIsComposerOpen(true);
  }

  async function handleSaveMaterial() {
    if (composerContent.trim() === "") {
      return;
    }

    try {
      await createReactorMaterialRequest({
        dayKey: composerDayKey,
        type: composerType,
        content: composerContent,
        important: false,
        note: composerNote,
        manualTags: composerTagsDraft
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setComposerContent("");
      setComposerNote("");
      setComposerTagsDraft("");
      setIsComposerOpen(false);
      setReactorFeedback("已保存");
    } catch (error) {
      console.error("[web] handleSaveMaterial failed", error);
      setReactorError("Could not save this note. Please try again.");
    }
  }

  async function createReactorMaterialRequest(input: {
    dayKey: string;
    type: ReactorMaterialType;
    content: string;
    important?: boolean;
    note?: string;
    manualTags?: string[];
    meta?: ReactorMaterialMeta | null;
    imageDataUrl?: string;
  }) {
    setIsSavingMaterial(true);
    try {
      const response = await fetch("/api/reactor/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...input,
          important: Boolean(input.important),
          manualTags: input.manualTags ?? [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Reactor create failed with status ${response.status}`);
      }

      await loadReactorBoard();
    } finally {
      setIsSavingMaterial(false);
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    try {
      await fetch(`/api/reactor/materials/${materialId}`, {
        method: "DELETE",
      });
      setReactorLayouts((current) => {
        const next = { ...current };
        delete next[materialId];
        return next;
      });
      if (editingMaterialId === materialId) {
        setEditingMaterialId(null);
      }
      await loadReactorBoard();
    } catch (error) {
      console.error("[web] handleDeleteMaterial failed", error);
      setReactorError("Could not delete this note. Please try again.");
    }
  }

  function openMaterialEditor(materialId: string) {
    const material = reactorMaterialsById.get(materialId);
    if (!material) {
      return;
    }

    setEditingMaterialId(materialId);
    setEditingImportant(Boolean(material.important));
    setEditingNoteDraft(material.note ?? "");
    setEditingTagsDraft(material.manualTags?.join(", ") ?? "");
  }

  async function handleSaveMaterialEdit() {
    if (!editingMaterialId) {
      return;
    }

    try {
      setIsSavingMaterialEdit(true);
      const response = await fetch(`/api/reactor/materials/${editingMaterialId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          important: editingImportant,
          note: editingNoteDraft,
          manualTags: editingTagsDraft
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error(`Reactor update failed with status ${response.status}`);
      }

      setEditingMaterialId(null);
      setReactorFeedback("已保存");
      await loadReactorBoard();
    } catch (error) {
      console.error("[web] handleSaveMaterialEdit failed", error);
      setReactorError("Could not update this note. Please try again.");
    } finally {
      setIsSavingMaterialEdit(false);
    }
  }

  function handleSaveReactorDiary() {
    window.localStorage.setItem(reactorDiaryStorageKey(activeReactorDayKey), reactorDiaryDraft);
    setReactorFeedback("日记已保存");
  }

  function handleApplyQuickTag(tag: string) {
    const current = editingTagsDraft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const exists = current.some((item) => item.toLowerCase() === tag.toLowerCase());
    const next = exists
      ? current.filter((item) => item.toLowerCase() !== tag.toLowerCase())
      : [...current, tag];
    setEditingTagsDraft(next.join(", "));
  }

  async function handleToggleImportant(materialId: string) {
    const material = reactorMaterialsById.get(materialId);
    if (!material) {
      return;
    }

    try {
      const response = await fetch(`/api/reactor/materials/${materialId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          important: !material.important,
        }),
      });

      if (!response.ok) {
        throw new Error(`Reactor important toggle failed with status ${response.status}`);
      }

      await loadReactorBoard();
    } catch (error) {
      console.error("[web] handleToggleImportant failed", error);
      setReactorError("Could not update importance right now.");
    }
  }

  async function handleDeleteTerm(termId: string) {
    await fetch(`/api/entry-terms/${termId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "delete" }),
    });

    await loadWeek();
  }

  async function handleDeleteEntry(entryId: string) {
    await fetch(`/api/entries/${entryId}`, {
      method: "DELETE",
    });

    setBoardLayouts((current) => {
      const next = { ...current };
      delete next[entryId];
      return next;
    });

    await loadWeek();
  }

  async function handleMoveEntryToDay(entryId: string, daySlot: DaySlot) {
    await fetch(`/api/entries/${entryId}/day-slot`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ daySlot }),
    });

    setActiveDay(daySlot);
    await loadWeek();
  }

  async function handleSaveNote() {
    if (!week) {
      return;
    }

    const response = await fetch(`/api/weeks/${week.weekKey}/note`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: noteDraft }),
    });

    const updated = (await response.json()) as WeekData;
    setWeek(updated);
  }

  async function handleSaveDayNote() {
    if (!week) {
      return;
    }

    const response = await fetch(`/api/weeks/${week.weekKey}/day-notes/${activeDay}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: dayNoteDraft }),
    });

    const updated = (await response.json()) as WeekData;
    setWeek(updated);
  }

  async function handleCopyTerm(term: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(term);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = term;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = term;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedTerm(term);
  }

  async function submitImage(imageDataUrl: string) {
    if (!week) {
      return;
    }

    setIsPasting(true);
    const dimensions = await readImageSize(imageDataUrl);

    await fetch("/api/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        weekKey: week.weekKey,
        daySlot: activeDay,
        imageDataUrl,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      }),
    });

    setIsPasting(false);
    await loadWeek();
  }

  function handleUpdateLayout(entryId: string, next: Partial<BoardLayout>) {
    setBoardLayouts((current) => ({
      ...current,
      [entryId]: {
        ...(current[entryId] ?? defaultBoardLayout(activeEntries[0], 0)),
        ...next,
      },
    }));
  }

  function handleUpdateWeekCardSize(entryId: string, width: number) {
    setWeekCardSizes((current) => ({
      ...current,
      [entryId]: width,
    }));
  }

  function handleFocusTodayBoard() {
    setWeekOffset(0);
    setActiveDay(todaySlot());
    setViewMode("day");
  }

  return (
    <main className={`app-shell app-shell-${appearance}`}>
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <section className="board">
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            const reader = new FileReader();
            reader.onload = async () => {
              await submitImage(String(reader.result ?? ""));
              event.target.value = "";
            };
            reader.readAsDataURL(file);
          }}
        />
        <input
          ref={longformCoverInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleLongformCoverUpload}
        />
        <header className="topbar">
          <div className="title-block">
            <h1>
              {boardMode === "aesthetic"
                ? "Aesthetic Board"
                : boardMode === "reactor"
                  ? "Creator Reactor"
                  : "Longform Library"}
            </h1>
            <span className="title-side-note">
              {boardMode === "reactor"
                ? "Drop loose thoughts into the week."
                : boardMode === "aesthetic"
                  ? "Collect visual cues into the week."
                  : "Collect sharp essays worth studying."}
            </span>
            <p className="date-range">
              {boardMode === "aesthetic"
                ? week?.label ?? "Weekly Board"
                : boardMode === "reactor"
                  ? week?.label ?? ""
                  : "Editorial Reference Room"}
            </p>
          </div>
          <div className="week-actions">
            <div className="week-actions-top">
              <>
                <button className="nav-button icon-only" onClick={() => setWeekOffset((value) => value - 1)}>
                  ‹
                </button>
                <button
                  className="today-button week-chip-button"
                  onClick={() => {
                    setWeekOffset(0);
                    if (boardMode === "aesthetic") {
                      handleFocusTodayBoard();
                    } else {
                      setReactorViewMode("week");
                      setActiveReactorDayKey(todayDateKey());
                    }
                  }}
                >
                  {week ? `Week ${week.weekNumber}` : "This Week"}
                </button>
                <button className="nav-button icon-only" onClick={() => setWeekOffset((value) => value + 1)}>
                  ›
                </button>
              </>
            </div>
          </div>
        </header>
        <aside className="board-side-rail" aria-label="Board actions">
          <button
            className={`board-side-button ${boardMode === "aesthetic" ? "active" : ""}`}
            onClick={() => setBoardMode("aesthetic")}
            title="Aesthetic Board"
            aria-label="Aesthetic Board"
          >
            ◫
          </button>
          <button
            className={`board-side-button ${boardMode === "reactor" ? "active" : ""}`}
            onClick={() => setBoardMode("reactor")}
            title="Creator Reactor"
            aria-label="Creator Reactor"
          >
            ✎
          </button>
          <button
            className={`board-side-button ${boardMode === "longform" ? "active" : ""}`}
            onClick={() => setBoardMode("longform")}
            title="Longform Library"
            aria-label="Longform Library"
          >
            ❐
          </button>
          <button
            className={`board-side-button ${toolsOpen || activeToolId ? "active" : ""}`}
            onClick={() => setToolsOpen((value) => !value)}
            title="Tools"
            aria-label="Tools"
          >
            ✦
          </button>
          <button
            className="board-side-button"
            onClick={() => setShowSummary(true)}
            title={boardMode === "aesthetic" ? "Weekly Summary" : "Weekly Digest"}
            aria-label={boardMode === "aesthetic" ? "Weekly Summary" : "Weekly Digest"}
          >
            ◎
          </button>
          <button
            className="board-side-button"
            onClick={() => setAppearance((current) => (current === "light" ? "dark" : "light"))}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            ☾
          </button>
        </aside>
        {toolsOpen ? (
          <div className="board-tools-popover">
            {toolsCatalog.map((tool) => (
              <button
                key={tool.id}
                className="board-tool-row"
                onClick={() => {
                  setActiveToolId(tool.id);
                  setToolsOpen(false);
                }}
              >
                <span className="board-tool-eyebrow">{tool.eyebrow}</span>
                <strong>{tool.title}</strong>
                <span>{tool.summary}</span>
              </button>
            ))}
          </div>
        ) : null}

        <motion.section
          className="paper-sheet"
          animate={{
            filter: showSummary || processingCount > 0 ? "blur(8px)" : "blur(0px)",
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <AnimatePresence mode="wait">
            {boardMode === "aesthetic" ? (
              !week ? (
                <BoardUnavailable
                  message={loadError ?? "正在加载本周手帐..."}
                  onOpenReactor={() => setBoardMode("reactor")}
                  onRetry={() => void loadWeek()}
                />
              ) : viewMode === "week" ? (
                <motion.div
                  key="week-view"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  style={{ transformOrigin: focusOrigin(activeDay) }}
                >
              <section className="week-grid">
                <div className="week-row">
                  {dayGroups.slice(0, 3).map(([slot, label]) => (
                    <DayColumn
                      key={slot}
                      dayLabel={label}
                      daySlot={slot}
                      dayNumber={week.dayNumbers[slot]}
                      isActive={activeDay === slot}
                      onOpenDay={(day) => {
                        setActiveDay(day);
                        setViewMode("day");
                      }}
                      onSelectDay={setActiveDay}
                      onDeleteTerm={handleDeleteTerm}
                      onDeleteEntry={handleDeleteEntry}
                      onMoveEntry={handleMoveEntryToDay}
                      onCopyTerm={handleCopyTerm}
                      onOpenImage={setZoomedEntry}
                      weekCardSizes={weekCardSizes}
                      onResizeCard={handleUpdateWeekCardSize}
                      expandedEntryId={expandedEntryId}
                      onToggleExpandedEntry={setExpandedEntryId}
                      entries={entriesByDay.get(slot) ?? []}
                    />
                  ))}
                </div>

                <div className="week-row">
                  {dayGroups.slice(3).map(([slot, label]) => (
                    <DayColumn
                      key={slot}
                      dayLabel={label}
                      daySlot={slot}
                      dayNumber={week.dayNumbers[slot]}
                      isActive={activeDay === slot}
                      onOpenDay={(day) => {
                        setActiveDay(day);
                        setViewMode("day");
                      }}
                      onSelectDay={setActiveDay}
                      onDeleteTerm={handleDeleteTerm}
                      onDeleteEntry={handleDeleteEntry}
                      onMoveEntry={handleMoveEntryToDay}
                      onCopyTerm={handleCopyTerm}
                      onOpenImage={setZoomedEntry}
                      weekCardSizes={weekCardSizes}
                      onResizeCard={handleUpdateWeekCardSize}
                      expandedEntryId={expandedEntryId}
                      onToggleExpandedEntry={setExpandedEntryId}
                      entries={entriesByDay.get(slot) ?? []}
                      isWeekend={slot === "weekend"}
                    />
                  ))}
                </div>
              </section>

              <section className="notes-panel">
                <div className="notes-header">
                  <span>NOTES</span>
                  <span className="notes-meta">
                    {isPasting ? "正在贴图..." : `当前贴图列: ${labelForDay(activeDay)}`}
                  </span>
                </div>
                <button
                  className="notes-resize-handle"
                  aria-label="调整笔记高度"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    const startY = event.clientY;
                    const startHeight = notesHeight;

                    const handleMove = (moveEvent: MouseEvent) => {
                      const nextHeight = Math.max(
                        180,
                        Math.min(520, startHeight + (moveEvent.clientY - startY)),
                      );
                      setNotesHeight(nextHeight);
                    };

                    const handleUp = () => {
                      window.removeEventListener("mousemove", handleMove);
                      window.removeEventListener("mouseup", handleUp);
                    };

                    window.addEventListener("mousemove", handleMove);
                    window.addEventListener("mouseup", handleUp);
                  }}
                >
                  <span />
                </button>
                <textarea
                  className="notes-textarea"
                  style={{ minHeight: `${notesHeight}px` }}
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                />
                <div className="notes-actions">
                  <div className="notes-inline-actions">
                    <button className="ghost-action" onClick={() => setShowSummary(true)}>周总结</button>
                  </div>
                  <button className="today-button" onClick={() => void handleSaveNote()}>
                    保存本周笔记
                  </button>
                </div>
              </section>
                </motion.div>
              ) : (
                <motion.div
                  key="day-view"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  style={{ transformOrigin: focusOrigin(activeDay) }}
                >
                  <DayCanvas
                    dayLabel={labelForDay(activeDay)}
                    dayNumber={week.dayNumbers[activeDay]}
                    entries={activeEntries}
                    layouts={boardLayouts}
                    onBack={() => setViewMode("week")}
                    dayNoteDraft={dayNoteDraft}
                    onDayNoteChange={setDayNoteDraft}
                    onSaveDayNote={() => void handleSaveDayNote()}
                    onDeleteTerm={handleDeleteTerm}
                    onDeleteEntry={handleDeleteEntry}
                    onCopyTerm={handleCopyTerm}
                    onOpenImage={setZoomedEntry}
                    expandedEntryId={expandedEntryId}
                    onToggleExpandedEntry={setExpandedEntryId}
                    onUpdateLayout={handleUpdateLayout}
                  />
                </motion.div>
              )
            ) : boardMode === "reactor" ? (
              <motion.div
                key="reactor-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <ReactorBoardView
                  week={reactorWeek}
                  activeDay={activeReactorDay}
                  activeMaterials={activeReactorMaterials}
                  viewMode={reactorViewMode}
                  layouts={reactorLayouts}
                  isLoading={reactorLoading}
                  error={reactorError}
                  isComposerOpen={isComposerOpen}
                  composerDayKey={composerDayKey}
                  composerType={composerType}
                  composerContent={composerContent}
                  composerNote={composerNote}
                  composerTagsDraft={composerTagsDraft}
                  isSavingMaterial={isSavingMaterial}
                  feedback={reactorFeedback}
                  diaryDraft={reactorDiaryDraft}
                  onRetry={() => void loadReactorBoard()}
                  onOpenComposer={openComposer}
                  onDeleteMaterial={(id) => void handleDeleteMaterial(id)}
                  onEditMaterial={openMaterialEditor}
                  onToggleImportant={(id) => void handleToggleImportant(id)}
                  onSelectDay={(dayKey) => setActiveReactorDayKey(dayKey)}
                  onOpenDay={(dayKey) => {
                    setActiveReactorDayKey(dayKey);
                    setReactorViewMode("day");
                  }}
                  onBackToWeek={() => setReactorViewMode("week")}
                  onCloseComposer={() => setIsComposerOpen(false)}
                  onSaveDiary={handleSaveReactorDiary}
                  onDiaryChange={setReactorDiaryDraft}
                  onComposerTypeChange={setComposerType}
                  onComposerContentChange={setComposerContent}
                  onComposerNoteChange={setComposerNote}
                  onComposerTagsChange={setComposerTagsDraft}
                  onSaveMaterial={() => void handleSaveMaterial()}
                  exportOpen={reactorExportOpen}
                  onToggleExportOpen={() => setReactorExportOpen((value) => !value)}
                  onUpdateLayout={(materialId, next) =>
                    setReactorLayouts((current) => ({
                      ...current,
                      [materialId]: {
                        ...(current[materialId] ?? defaultReactorLayout(0)),
                        ...next,
                      },
                    }))
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="longform-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <LongformReferenceView
                  items={longformReferences}
                  activeId={activeLongformReference.id}
                  activeItem={activeLongformReference}
                  viewMode={longformViewMode}
                  draft={longformDraft}
                  feedback={longformFeedback}
                  onSelect={(id) => {
                    setActiveLongformId(id);
                    setLongformViewMode("detail");
                  }}
                  onBack={() => setLongformViewMode("shelf")}
                  onDraftFieldChange={handleLongformDraftField}
                  onContentChange={handleLongformContentChange}
                  onImport={handleLongformImport}
                  onAnalyze={handleLongformAnalyze}
                  onOpenCoverPicker={() => longformCoverInputRef.current?.click()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <AnimatePresence>
          {(isPasting || processingCount > 0) && (
            <motion.div
              className="processing-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="processing-modal"
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 10 }}
              >
                <div className="processing-orb">✦</div>
                <strong>{processingStage}</strong>
                <div className="processing-bar">
                  <motion.span
                    animate={{ x: ["-30%", "110%"] }}
                    transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingMaterialId ? (
            <motion.div
              className="summary-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMaterialId(null)}
            >
              <motion.section
                className="reactor-edit-sheet"
                initial={{ scale: 0.92, y: 22 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 10 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="reactor-edit-sheet-header">
                  <strong>编辑素材</strong>
                  <button className="ghost-action" onClick={() => setEditingMaterialId(null)}>关闭</button>
                </div>
                {editingMaterial ? (
                  <div className="reactor-edit-meta">
                    <span className="reactor-edit-meta-label">{labelForMaterialTypeZh(editingMaterial.type)}</span>
                    {editingMaterial.type === "link" ? (
                      <>
                        <p className="reactor-edit-content">{editingMaterial.content}</p>
                        <a
                          className="reactor-edit-link"
                          href={editingMaterial.meta?.sourceUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {editingMaterial.meta?.sourceUrl ?? editingMaterial.content}
                        </a>
                      </>
                    ) : editingMaterial.type === "image" ? (
                      <button
                        className="reactor-edit-image"
                        onClick={() => window.open(editingMaterial.meta?.imageUrl, "_blank", "noopener,noreferrer")}
                        >
                          {editingMaterial.meta?.imageUrl ? (
                            <img src={editingMaterial.meta.imageUrl} alt={editingMaterial.content} />
                          ) : null}
                        <span>查看大图</span>
                      </button>
                    ) : (
                      <p className="reactor-edit-content">{editingMaterial.content}</p>
                    )}
                  </div>
                ) : null}
                <textarea
                  className="reactor-compose-textarea"
                  value={editingNoteDraft}
                  onChange={(event) => setEditingNoteDraft(event.target.value)}
                  placeholder="Why keep it"
                />
                <div className="reactor-quick-tags">
                  {reactorWhyKeepPresets.map((preset) => (
                    <button
                      key={preset}
                      className={`top-tool ${editingNoteDraft === preset ? "active" : ""}`}
                      onClick={() => setEditingNoteDraft(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  className="reactor-compose-input"
                  value={editingTagsDraft}
                  onChange={(event) => setEditingTagsDraft(event.target.value)}
                  placeholder="Optional tags"
                />
                <div className="reactor-quick-tags">
                  {reactorQuickTags.map((tag) => (
                    <button
                      key={tag}
                      className={`top-tool ${
                        editingTagsDraft.toLowerCase().includes(tag.toLowerCase()) ? "active" : ""
                      }`}
                      onClick={() => handleApplyQuickTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="reactor-compose-actions">
                  <button className="top-tool" onClick={() => setEditingMaterialId(null)}>取消</button>
                  <button className="today-button" onClick={() => void handleSaveMaterialEdit()} disabled={isSavingMaterialEdit}>
                    {isSavingMaterialEdit ? "保存中..." : "保存"}
                  </button>
                </div>
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {zoomedEntry ? (
            <motion.div
              className="image-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedEntry(null)}
            >
              <motion.section
                className="image-lightbox-card"
                initial={{ scale: 0.94, y: 18 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.98, y: 10 }}
                onClick={(event) => event.stopPropagation()}
              >
                <button className="image-lightbox-close" onClick={() => setZoomedEntry(null)}>
                  ×
                </button>
                <img className="image-lightbox-img" src={zoomedEntry.imageUrl} alt={zoomedEntry.title} />
                <div className="image-lightbox-meta">
                  <div className="image-lightbox-title">{zoomedEntry.title}</div>
                  {zoomedEntry.promptSummary ? (
                    <button
                      className="image-lightbox-prompt"
                      onClick={() => void handleCopyTerm(zoomedEntry.promptSummary ?? "")}
                      title="点击复制风格提示词"
                    >
                      <span className="image-lightbox-prompt-copy">
                        <strong>风格提示词</strong>
                        <span>{zoomedEntry.promptSummary}</span>
                      </span>
                      <span className="summary-copy">⧉</span>
                    </button>
                  ) : null}
                </div>
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {activeToolId ? (
            <motion.div
              className="summary-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveToolId(null)}
            >
              <motion.section
                className="tool-card"
                initial={{ scale: 0.92, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 10 }}
                onClick={(event) => event.stopPropagation()}
              >
                <button className="summary-close" onClick={() => setActiveToolId(null)}>
                  ×
                </button>
                {(() => {
                  const tool = toolsCatalog.find((item) => item.id === activeToolId);
                  if (!tool) {
                    return null;
                  }

                  return (
                    <>
                      <span className="board-tool-eyebrow board-tool-eyebrow-modal">{tool.eyebrow}</span>
                      <h2>{tool.title}</h2>
                      <p>{tool.summary}</p>
                      <div className="tool-steps">
                        {tool.steps.map((step, index) => (
                          <div key={step} className="tool-step">
                            <strong>{index + 1}</strong>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                      <div className="tool-prompt-preview tool-prompt-markdown">
                        {renderToolPromptMarkdown(tool.prompt)}
                      </div>
                      <div className="tool-actions">
                        <button
                          className={`today-button ${copiedToolPrompt === tool.id ? "active" : ""}`}
                          onClick={async () => {
                            await navigator.clipboard.writeText(tool.prompt);
                            setCopiedToolPrompt(tool.id);
                          }}
                        >
                          {copiedToolPrompt === tool.id ? "Copied" : "Copy prompt"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </motion.section>
            </motion.div>
          ) : null}
          {showSummary && ((boardMode === "aesthetic" && week) || (boardMode === "reactor" && reactorBoard)) ? (
            <motion.div
              className="summary-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSummary(false)}
            >
              <motion.section
                className="summary-card"
                initial={{ scale: 0.9, y: 28 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                onClick={(event) => event.stopPropagation()}
              >
                <button className="summary-close" onClick={() => setShowSummary(false)}>
                  ×
                </button>
                {boardMode === "aesthetic" && week ? (
                  <>
                    <h2>Week {week.weekNumber} Summary</h2>
                    <p>{week.label}</p>
                    <div className="summary-stats">
                      <div>
                        <span>Total Items</span>
                        <strong>{weeklySummary.totalItems}</strong>
                      </div>
                      <div>
                        <span>Terms Found</span>
                        <strong>{weeklySummary.totalTerms}</strong>
                      </div>
                    </div>
                    <div className="summary-list">
                      {weeklySummary.topTerms.map((item, index) => (
                        <button
                          key={item.term}
                          className="summary-row"
                          onClick={() => void handleCopyTerm(item.term)}
                        >
                          <span className="summary-rank">{index + 1}</span>
                          <span className="summary-term">{item.term}</span>
                          <span className="summary-row-tail">
                            <span className="summary-count">{item.count}x</span>
                            <span className="summary-copy">⧉</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h2>{reactorWeekTitle(weekOffset)}</h2>
                    <p>A quick read on what accumulated this week.</p>
                    <div className="summary-stats">
                      <div>
                        <span>Total Notes</span>
                        <strong>{reactorWeeklySummary.totalItems}</strong>
                      </div>
                      <div>
                        <span>Active Days</span>
                        <strong>{reactorWeeklySummary.activeDays}</strong>
                      </div>
                    </div>
                    <div className="summary-list">
                      {reactorWeeklySummary.topTypes.map((item, index) => (
                        <div key={item.label} className="summary-row">
                          <span className="summary-rank">{index + 1}</span>
                          <span className="summary-term">{item.label}</span>
                          <span className="summary-row-tail">
                            <span className="summary-count">{item.count}x</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </main>
  );
}

function DayColumn({
  daySlot,
  dayNumber,
  dayLabel,
  entries,
  isActive,
  onOpenDay,
  onSelectDay,
  onDeleteTerm,
  onDeleteEntry,
  onMoveEntry,
  onCopyTerm,
  onOpenImage,
  weekCardSizes,
  onResizeCard,
  expandedEntryId,
  onToggleExpandedEntry,
  isWeekend = false,
}: {
  daySlot: DaySlot;
  dayNumber: string;
  dayLabel: string;
  entries: WeekEntry[];
  isActive: boolean;
  onOpenDay: (day: DaySlot) => void;
  onSelectDay: (day: DaySlot) => void;
  onDeleteTerm: (termId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onMoveEntry: (entryId: string, day: DaySlot) => void;
  onCopyTerm: (term: string) => void;
  onOpenImage: (entry: WeekEntry) => void;
  weekCardSizes: WeekCardSizes;
  onResizeCard: (entryId: string, width: number) => void;
  expandedEntryId: string | null;
  onToggleExpandedEntry: (entryId: string | null) => void;
  isWeekend?: boolean;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);

  return (
    <section
      className={`day-column ${isWeekend ? "day-column-weekend" : ""} ${
        isActive ? "day-column-active" : ""
      } ${isDropTarget ? "day-column-drop-target" : ""} day-column-${daySlot}`}
      onClick={() => onSelectDay(daySlot)}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDropTarget(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!isDropTarget) {
          setIsDropTarget(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDropTarget(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDropTarget(false);
        const entryId = event.dataTransfer.getData("text/entry-id");
        if (!entryId) {
          return;
        }

        onSelectDay(daySlot);
        void onMoveEntry(entryId, daySlot);
      }}
    >
      <header className="day-header">
        <button
          className="day-jump-target"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDay(daySlot);
          }}
        >
          <div className="day-number">{dayNumber}</div>
          <div className="day-name">{dayLabel}</div>
        </button>
      </header>
      <div className="entry-stack">
        {entries.map((entry, index) => (
          <JournalCard
            key={entry.id}
            entry={entry}
            index={index}
            daySlot={daySlot}
            onDeleteTerm={onDeleteTerm}
            onDeleteEntry={onDeleteEntry}
            onCopyTerm={onCopyTerm}
            onOpenImage={onOpenImage}
            draggableInWeek
            resizedWidth={weekCardSizes[entry.id]}
            onResizeWidth={onResizeCard}
            isExpanded={expandedEntryId === entry.id}
            onToggleExpanded={onToggleExpandedEntry}
          />
        ))}
      </div>
    </section>
  );
}

function ReactorBoardView({
  week,
  activeDay,
  activeMaterials,
  viewMode,
  layouts,
  isLoading,
  error,
  isComposerOpen,
  composerDayKey,
  composerType,
  composerContent,
  composerNote,
  composerTagsDraft,
  isSavingMaterial,
  feedback,
  diaryDraft,
  onRetry,
  onOpenComposer,
  onDeleteMaterial,
  onEditMaterial,
  onToggleImportant,
  onOpenDay,
  onSelectDay,
  onBackToWeek,
  onCloseComposer,
  onSaveDiary,
  onDiaryChange,
  onComposerTypeChange,
  onComposerContentChange,
  onComposerNoteChange,
  onComposerTagsChange,
  onSaveMaterial,
  exportOpen,
  onToggleExportOpen,
  onUpdateLayout,
}: {
  week: Map<DaySlot, ReactorDay>;
  activeDay: ReactorDay | undefined;
  activeMaterials: ReactorDay["materials"];
  viewMode: ViewMode;
  layouts: Record<string, BoardLayout>;
  isLoading: boolean;
  error: string | null;
  isComposerOpen: boolean;
  composerDayKey: string;
  composerType: ReactorMaterialType;
  composerContent: string;
  composerNote: string;
  composerTagsDraft: string;
  isSavingMaterial: boolean;
  feedback: string | null;
  diaryDraft: string;
  onRetry: () => void;
  onOpenComposer: (type: ReactorMaterialType, dayKey?: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  onEditMaterial: (materialId: string) => void;
  onToggleImportant: (materialId: string) => void;
  onOpenDay: (dayKey: string) => void;
  onSelectDay: (dayKey: string) => void;
  onBackToWeek: () => void;
  onCloseComposer: () => void;
  onSaveDiary: () => void;
  onDiaryChange: (value: string) => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onSaveMaterial: () => void;
  exportOpen: boolean;
  onToggleExportOpen: () => void;
  onUpdateLayout: (materialId: string, next: Partial<BoardLayout>) => void;
}) {
  return viewMode === "week" ? (
    <section className="reactor-shell">
      {feedback ? <div className="reactor-feedback-toast">{feedback}</div> : null}
      <section className="week-grid reactor-week-grid">
        <div className="week-row">
          {dayGroups.slice(0, 3).map(([slot, label]) => (
            <ReactorDayColumn
              key={slot}
              day={week.get(slot) ?? emptyReactorDay(slot)}
              dayLabel={label}
              onOpenDay={onOpenDay}
              onOpenComposer={onOpenComposer}
              onDeleteMaterial={onDeleteMaterial}
              onEditMaterial={onEditMaterial}
              onToggleImportant={onToggleImportant}
              isActive={activeDay?.dayKey === (week.get(slot)?.dayKey ?? emptyReactorDay(slot).dayKey)}
              onSelectDay={onSelectDay}
              isComposerOpen={
                isComposerOpen &&
                composerDayKey === (week.get(slot)?.dayKey ?? emptyReactorDay(slot).dayKey)
              }
              composerType={composerType}
              composerContent={composerContent}
              composerNote={composerNote}
              composerTagsDraft={composerTagsDraft}
              isSavingMaterial={isSavingMaterial}
              onCloseComposer={onCloseComposer}
              onComposerTypeChange={onComposerTypeChange}
              onComposerContentChange={onComposerContentChange}
              onComposerNoteChange={onComposerNoteChange}
              onComposerTagsChange={onComposerTagsChange}
              onSaveMaterial={onSaveMaterial}
            />
          ))}
        </div>
        <div className="week-row">
          {dayGroups.slice(3).map(([slot, label]) => (
            <ReactorDayColumn
              key={slot}
              day={week.get(slot) ?? emptyReactorDay(slot)}
              dayLabel={label}
              onOpenDay={onOpenDay}
              onOpenComposer={onOpenComposer}
              onDeleteMaterial={onDeleteMaterial}
              onEditMaterial={onEditMaterial}
              onToggleImportant={onToggleImportant}
              isActive={activeDay?.dayKey === (week.get(slot)?.dayKey ?? emptyReactorDay(slot).dayKey)}
              onSelectDay={onSelectDay}
              isComposerOpen={
                isComposerOpen &&
                composerDayKey === (week.get(slot)?.dayKey ?? emptyReactorDay(slot).dayKey)
              }
              composerType={composerType}
              composerContent={composerContent}
              composerNote={composerNote}
              composerTagsDraft={composerTagsDraft}
              isSavingMaterial={isSavingMaterial}
              onCloseComposer={onCloseComposer}
              onComposerTypeChange={onComposerTypeChange}
              onComposerContentChange={onComposerContentChange}
              onComposerNoteChange={onComposerNoteChange}
              onComposerTagsChange={onComposerTagsChange}
              onSaveMaterial={onSaveMaterial}
            />
          ))}
        </div>
      </section>

      {isLoading ? <p className="reactor-status">Loading daily board...</p> : null}
      {error ? (
        <div className="reactor-status reactor-status-error">
          <span>{error}</span>
          <button className="ghost-action" onClick={onRetry}>Retry</button>
        </div>
      ) : null}
    </section>
  ) : (
    <ReactorDayCanvas
      day={activeDay}
      materials={activeMaterials}
      layouts={layouts}
      feedback={feedback}
      diaryDraft={diaryDraft}
      isComposerOpen={isComposerOpen}
      composerType={composerType}
      composerContent={composerContent}
      composerNote={composerNote}
      composerTagsDraft={composerTagsDraft}
      isSavingMaterial={isSavingMaterial}
      onBack={onBackToWeek}
      onOpenComposer={onOpenComposer}
      onDeleteMaterial={onDeleteMaterial}
      onEditMaterial={onEditMaterial}
      onToggleImportant={onToggleImportant}
      onUpdateLayout={onUpdateLayout}
      onCloseComposer={onCloseComposer}
      onSaveDiary={onSaveDiary}
      onDiaryChange={onDiaryChange}
      onComposerTypeChange={onComposerTypeChange}
      onComposerContentChange={onComposerContentChange}
      onComposerNoteChange={onComposerNoteChange}
      onComposerTagsChange={onComposerTagsChange}
      onSaveMaterial={onSaveMaterial}
      exportOpen={exportOpen}
      onToggleExportOpen={onToggleExportOpen}
    />
  );
}

function LongformReferenceView({
  items,
  activeId,
  activeItem,
  viewMode,
  draft,
  feedback,
  onSelect,
  onBack,
  onDraftFieldChange,
  onContentChange,
  onImport,
  onAnalyze,
  onOpenCoverPicker,
}: {
  items: LongformReference[];
  activeId: string;
  activeItem: LongformReference;
  viewMode: LongformViewMode;
  draft: LongformDraft;
  feedback: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onDraftFieldChange: <K extends keyof LongformDraft>(field: K, value: LongformDraft[K]) => void;
  onContentChange: (value: string) => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onOpenCoverPicker: () => void;
}) {
  const shelfItems = items.slice(0, 6);
  const hero = shelfItems[0];
  const secondary = shelfItems.slice(1);

  return viewMode === "shelf" ? (
    <section className="longform-shell longform-shell-shelf">
      <section className="longform-shelf">
        <article className="longform-hero-panel">
          <div className="longform-hero-copy">
            <span className="longform-eyebrow">Editorial Shelf</span>
            <h2>Longform references worth stealing from.</h2>
            <p>最多六篇，先被标题和气质吸引，再进入详情页拆为什么它写得好。</p>
            <button className="today-button" onClick={() => onSelect(hero.id)}>
              Open featured
            </button>
          </div>
          <div
            className="longform-hero-visual"
            style={{
              ["--longform-a" as string]: hero.palette[0],
              ["--longform-b" as string]: hero.palette[1],
              ["--longform-c" as string]: hero.palette[2],
            }}
          >
            <span className="longform-hero-orb longform-hero-orb-a" />
            <span className="longform-hero-orb longform-hero-orb-b" />
            <span className="longform-hero-orb longform-hero-orb-c" />
            <span className="longform-hero-label">{hero.coverLabel}</span>
          </div>
        </article>
        <div className="longform-card-stream">
          {secondary.map((item, index) => (
            <button
              key={item.id}
              className={`longform-reference-card ${activeId === item.id ? "active" : ""} ${
                index % 3 === 1 ? "wide" : ""
              }`}
              onClick={() => onSelect(item.id)}
            >
              <div
                className="longform-reference-art"
                style={{
                  ["--longform-a" as string]: item.palette[0],
                  ["--longform-b" as string]: item.palette[1],
                  ["--longform-c" as string]: item.palette[2],
                }}
              >
                <span className="longform-reference-glass" />
              </div>
              <div className="longform-reference-copy">
                <span className="longform-reference-kicker">{item.category}</span>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  ) : (
    <section className="longform-shell longform-shell-detail">
      <div className="longform-detail-topbar">
        <button className="nav-button" onClick={onBack}>Back to Shelf</button>
        {feedback ? <span className="longform-status-chip">{feedback}</span> : null}
      </div>

      <section className="longform-detail">
        <aside className="longform-detail-side">
          <span className="longform-eyebrow">Reference Controls</span>
          <section className="longform-control-card">
            <strong>Content</strong>
            <label className="longform-field">
              <span>Title</span>
              <input
                value={draft.title}
                onChange={(event) => onDraftFieldChange("title", event.target.value)}
              />
            </label>
            <label className="longform-field">
              <span>Summary</span>
              <textarea
                rows={3}
                value={draft.summary}
                onChange={(event) => onDraftFieldChange("summary", event.target.value)}
              />
            </label>
            <label className="longform-field">
              <span>Paste article</span>
              <textarea
                rows={10}
                value={draft.rawContent}
                onChange={(event) => onContentChange(event.target.value)}
              />
            </label>
            <div className="longform-inline-actions">
              <label className="today-button longform-upload-button">
                Import text
                <input type="file" accept=".txt,.md,.markdown,text/plain" hidden onChange={onImport} />
              </label>
              <button className="nav-button" onClick={onAnalyze}>AI analyse</button>
            </div>
          </section>

          <section className="longform-control-card">
            <strong>Cover</strong>
            <label className="longform-field">
              <span>Label</span>
              <input
                value={draft.coverLabel}
                onChange={(event) => onDraftFieldChange("coverLabel", event.target.value)}
              />
            </label>
            <button className="nav-button" onClick={onOpenCoverPicker}>Upload cover</button>
            <label className="longform-field">
              <span>Author</span>
              <input
                value={draft.author}
                onChange={(event) => onDraftFieldChange("author", event.target.value)}
              />
            </label>
          </section>
        </aside>

        <div className="longform-detail-main">
          <header className="longform-detail-hero">
            <div className="longform-detail-heading">
              <span className="longform-eyebrow">{activeItem.eyebrow}</span>
              <h2>{draft.title}</h2>
              <div className="longform-byline">
                <span>{draft.author}</span>
                <span>{draft.date || formatLongformDate()}</span>
              </div>
              <p className="longform-detail-summary">{draft.summary}</p>
            </div>
            <div
              className="longform-detail-visual"
              style={{
                ["--longform-a" as string]: activeItem.palette[0],
                ["--longform-b" as string]: activeItem.palette[1],
                ["--longform-c" as string]: activeItem.palette[2],
              }}
            >
              {draft.coverUrl ? (
                <img className="longform-detail-cover" src={draft.coverUrl} alt={draft.title} />
              ) : null}
              <span className="longform-detail-visual-label">{draft.coverLabel}</span>
            </div>
          </header>

          <section className="longform-reading-grid">
            <article className="longform-reading-article">
              {draft.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
            <aside className="longform-analysis-panel">
              <section>
                <span className="longform-analysis-kicker">Why it works</span>
                <p>{draft.analysis.whyItWorks}</p>
              </section>
              <section>
                <span className="longform-analysis-kicker">Framework</span>
                <ul>
                  {draft.analysis.framework.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section>
                <span className="longform-analysis-kicker">Resonance</span>
                <ul>
                  {draft.analysis.resonance.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section>
                <span className="longform-analysis-kicker">Reusable moves</span>
                <ul>
                  {draft.analysis.reusableMoves.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </aside>
          </section>
        </div>
      </section>
    </section>
  );
}

function ReactorComposer({
  compact = false,
  dock = false,
  composerType,
  composerContent,
  composerNote,
  composerTagsDraft,
  isSavingMaterial,
  onCloseComposer,
  onComposerTypeChange,
  onComposerContentChange,
  onComposerNoteChange,
  onComposerTagsChange,
  onApplyNotePreset,
  onSaveMaterial,
}: {
  compact?: boolean;
  dock?: boolean;
  composerType: ReactorMaterialType;
  composerContent: string;
  composerNote: string;
  composerTagsDraft: string;
  isSavingMaterial: boolean;
  onCloseComposer: () => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onApplyNotePreset: (value: string) => void;
  onSaveMaterial: () => void;
}) {
  return (
    <section
      className={`reactor-compose-panel ${compact ? "reactor-compose-panel-compact" : ""} ${
        dock ? "reactor-compose-panel-dock" : ""
      }`}
    >
      {dock ? <span className="reactor-dock-handle" aria-hidden="true" /> : null}
      <div className="reactor-compose-header">
        <strong>{labelForMaterialTypeZh(composerType)}</strong>
        <button className="ghost-action" onClick={onCloseComposer}>关闭</button>
      </div>
      <div className="reactor-compose-types">
        {(["idea", "prompt", "link", "sample"] as ReactorMaterialType[]).map((type) => (
          <button
            key={type}
            className={`top-tool ${composerType === type ? "active" : ""}`}
            onClick={() => onComposerTypeChange(type)}
          >
            {labelForMaterialTypeZh(type)}
          </button>
        ))}
      </div>
      <textarea
        className="reactor-compose-textarea"
        value={composerContent}
        onChange={(event) => onComposerContentChange(event.target.value)}
        placeholder={dock ? "Paste a link, image, or thought..." : "Write the line you do not want to lose."}
      />
      <input
        className="reactor-compose-input"
        value={composerNote}
        onChange={(event) => onComposerNoteChange(event.target.value)}
        placeholder="Why keep it"
      />
      <div className="reactor-quick-tags">
        {reactorWhyKeepPresets.map((preset) => (
          <button
            key={preset}
            className={`top-tool ${composerNote === preset ? "active" : ""}`}
            onClick={() => onApplyNotePreset(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
      <input
        className="reactor-compose-input"
        value={composerTagsDraft}
        onChange={(event) => onComposerTagsChange(event.target.value)}
        placeholder="Optional tags"
      />
      <div className="reactor-compose-actions">
        <button className="top-tool" onClick={onCloseComposer}>取消</button>
        <button className="today-button" onClick={onSaveMaterial} disabled={isSavingMaterial}>
          {isSavingMaterial ? "保存中..." : "保存"}
        </button>
      </div>
    </section>
  );
}

function ReactorDayColumn({
  day,
  dayLabel,
  onOpenDay,
  onSelectDay,
  onOpenComposer,
  onDeleteMaterial,
  onEditMaterial,
  onToggleImportant,
  isActive,
  isComposerOpen,
  composerType,
  composerContent,
  composerNote,
  composerTagsDraft,
  isSavingMaterial,
  onCloseComposer,
  onComposerTypeChange,
  onComposerContentChange,
  onComposerNoteChange,
  onComposerTagsChange,
  onSaveMaterial,
}: {
  day: ReactorDay;
  dayLabel: string;
  onOpenDay: (dayKey: string) => void;
  onSelectDay: (dayKey: string) => void;
  onOpenComposer: (type: ReactorMaterialType, dayKey?: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  onEditMaterial: (materialId: string) => void;
  onToggleImportant: (materialId: string) => void;
  isActive: boolean;
  isComposerOpen: boolean;
  composerType: ReactorMaterialType;
  composerContent: string;
  composerNote: string;
  composerTagsDraft: string;
  isSavingMaterial: boolean;
  onCloseComposer: () => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onSaveMaterial: () => void;
}) {
  const visibleMaterials = day.materials.slice(0, 4);
  const hiddenCount = Math.max(0, day.materials.length - visibleMaterials.length);
  const visiblePets = visibleMaterials.map((material) => petForMaterial(material));
  const hasLegendary = visiblePets.some((pet) => pet.rarity === "legendary");
  const hasRareEvent = hasLegendary || visiblePets.filter((pet) => pet.rarity === "rare").length >= 2;

  return (
    <section
      className={`day-column reactor-day-column ${hasRareEvent ? "reactor-day-column-event" : ""} ${
        isActive ? "day-column-active" : ""
      }`}
      onClick={() => onSelectDay(day.dayKey)}
    >
      <header className="day-header reactor-day-column-header">
        <button
          className="day-jump-target"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDay(day.dayKey);
          }}
        >
          <div className="day-number">{formatDayKey(day.dayKey).split(" / ")[1] ?? ""}</div>
          <div className="day-name">{dayLabel}</div>
        </button>
        <button
          className="day-open-button"
          onClick={(event) => {
            event.stopPropagation();
            onSelectDay(day.dayKey);
            onOpenComposer("idea", day.dayKey);
          }}
        >
          ＋
        </button>
      </header>
      <div className="reactor-day-stack">
        {isComposerOpen ? (
          <ReactorComposer
            compact
            composerType={composerType}
            composerContent={composerContent}
            composerNote={composerNote}
            composerTagsDraft={composerTagsDraft}
            isSavingMaterial={isSavingMaterial}
            onCloseComposer={onCloseComposer}
            onComposerTypeChange={onComposerTypeChange}
            onComposerContentChange={onComposerContentChange}
            onComposerNoteChange={onComposerNoteChange}
            onComposerTagsChange={onComposerTagsChange}
            onApplyNotePreset={onComposerNoteChange}
            onSaveMaterial={onSaveMaterial}
          />
        ) : null}
        {visibleMaterials.map((material, index) => (
          <ReactorMaterialCard
            key={material.id}
            material={material}
            index={index}
            weekMode
            onDelete={() => onDeleteMaterial(material.id)}
            onEdit={() => onEditMaterial(material.id)}
            onToggleImportant={() => onToggleImportant(material.id)}
          />
        ))}
        {hiddenCount > 0 ? (
          <button
            className={`reactor-more-hint ${hasRareEvent ? "reactor-more-hint-event" : ""}`}
            onClick={() => onOpenDay(day.dayKey)}
            aria-label="Open more notes"
          >
            <span className="reactor-more-dots">
              <span />
              <span />
              <span />
            </span>
            <span className="reactor-more-count">+{hiddenCount}</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ReactorDayCanvas({
  day,
  materials,
  layouts,
  feedback,
  diaryDraft,
  isComposerOpen,
  composerType,
  composerContent,
  composerNote,
  composerTagsDraft,
  isSavingMaterial,
  onBack,
  onOpenComposer,
  onDeleteMaterial,
  onEditMaterial,
  onToggleImportant,
  onUpdateLayout,
  onCloseComposer,
  onSaveDiary,
  onDiaryChange,
  onComposerTypeChange,
  onComposerContentChange,
  onComposerNoteChange,
  onComposerTagsChange,
  onSaveMaterial,
  exportOpen,
  onToggleExportOpen,
}: {
  day: ReactorDay | undefined;
  materials: ReactorDay["materials"];
  layouts: Record<string, BoardLayout>;
  feedback: string | null;
  diaryDraft: string;
  isComposerOpen: boolean;
  composerType: ReactorMaterialType;
  composerContent: string;
  composerNote: string;
  composerTagsDraft: string;
  isSavingMaterial: boolean;
  onBack: () => void;
  onOpenComposer: (type: ReactorMaterialType, dayKey?: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  onEditMaterial: (materialId: string) => void;
  onToggleImportant: (materialId: string) => void;
  onUpdateLayout: (materialId: string, next: Partial<BoardLayout>) => void;
  onCloseComposer: () => void;
  onSaveDiary: () => void;
  onDiaryChange: (value: string) => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onSaveMaterial: () => void;
  exportOpen: boolean;
  onToggleExportOpen: () => void;
}) {
  const dayKey = day?.dayKey ?? todayDateKey();
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [pocketOpen, setPocketOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const [selectedAiIds, setSelectedAiIds] = useState<string[]>([]);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedStudioPrompt, setCopiedStudioPrompt] = useState(false);
  const [isGeneratingStoryline, setIsGeneratingStoryline] = useState(false);
  const [storylineInsight, setStorylineInsight] = useState<ReactorStorylineInsight | null>(null);

  useEffect(() => {
    setSelectedExportIds(materials.map((material) => material.id));
    setSelectedAiIds(materials.filter((material) => material.important).map((material) => material.id));
  }, [dayKey, materials]);

  useEffect(() => {
    if (!copiedMarkdown) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopiedMarkdown(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copiedMarkdown]);

  useEffect(() => {
    if (!copiedStudioPrompt) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopiedStudioPrompt(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copiedStudioPrompt]);

  const selectedExportMaterials = useMemo(
    () => materials.filter((material) => selectedExportIds.includes(material.id)),
    [materials, selectedExportIds],
  );
  const exportMarkdown = useMemo(
    () => buildReactorMarkdownExport(dayKey, selectedExportMaterials),
    [dayKey, selectedExportMaterials],
  );
  const selectedAiMaterials = useMemo(
    () => materials.filter((material) => selectedAiIds.includes(material.id)),
    [materials, selectedAiIds],
  );

  function handleOrganizeCanvas() {
    const nextLayouts = organizeReactorLayouts(materials, layouts);
    Object.entries(nextLayouts).forEach(([materialId, next]) => {
      onUpdateLayout(materialId, next);
    });
  }

  async function handleGenerateStoryline() {
    if (!diaryDraft.trim() && selectedAiMaterials.length === 0) {
      return;
    }

    try {
      setIsGeneratingStoryline(true);
      const response = await fetch("/api/reactor/assist/storyline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diary: diaryDraft,
          materials: selectedAiMaterials.map((material) => ({
            type: material.type,
            content: material.content,
            note: material.note,
            tags: material.manualTags,
            important: material.important,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Storyline assist failed with status ${response.status}`);
      }

      const data = (await response.json()) as ReactorStorylineInsight;
      setStorylineInsight(data);
    } catch (error) {
      console.error("[web] handleGenerateStoryline failed", error);
    } finally {
      setIsGeneratingStoryline(false);
    }
  }

  return (
    <section className="day-canvas">
      {feedback ? <div className="reactor-feedback-toast reactor-feedback-toast-day">{feedback}</div> : null}
      <header className="day-canvas-header">
        <div>
          <p className="day-canvas-kicker">Focused Day</p>
          <h2>{formatDayKey(dayKey)} · Daily Canvas</h2>
        </div>
        <div className="day-canvas-actions">
          <button className="nav-button" onClick={onBack}>Back to Week</button>
          <button className="nav-button" onClick={handleOrganizeCanvas}>
            <span className="nav-button-icon" aria-hidden="true">☷</span>
            Organize
          </button>
          <button
            className={`nav-button icon-only ${exportOpen ? "active" : ""}`}
            onClick={onToggleExportOpen}
            title="Download"
            aria-label="Download"
          >
            ↓
          </button>
          <div className="canvas-zoom-controls">
            <button className="nav-button" onClick={() => setCanvasScale((value) => Math.max(0.65, value - 0.1))}>－</button>
            <span>{Math.round(canvasScale * 100)}%</span>
            <button className="nav-button" onClick={() => setCanvasScale((value) => Math.min(3, value + 0.1))}>＋</button>
          </div>
        </div>
      </header>
      {exportOpen ? (
        <section className="reactor-export-sheet">
          <div className="reactor-export-header">
            <div>
              <strong>Export source pack</strong>
              <span>Pick notes to turn into a clean markdown bundle.</span>
            </div>
            <button className="ghost-action" onClick={onToggleExportOpen}>Close</button>
          </div>
          <div className="reactor-export-grid">
            <div className="reactor-export-list">
              {materials.map((material) => (
                <label key={material.id} className="reactor-export-item">
                  <input
                    type="checkbox"
                    checked={selectedExportIds.includes(material.id)}
                    onChange={() =>
                      setSelectedExportIds((current) =>
                        current.includes(material.id)
                          ? current.filter((id) => id !== material.id)
                          : [...current, material.id],
                      )
                    }
                  />
                  <span className="reactor-export-item-type">{labelForMaterialType(material.type)}</span>
                  <span className="reactor-export-item-title">{material.content}</span>
                </label>
              ))}
            </div>
            <div className="reactor-export-preview">
              <pre>{exportMarkdown}</pre>
              <div className="reactor-export-actions">
                <button
                  className={`top-tool ${copiedMarkdown ? "active" : ""}`}
                  onClick={async () => {
                    await navigator.clipboard.writeText(exportMarkdown);
                    setCopiedMarkdown(true);
                  }}
                >
                  {copiedMarkdown ? "Copied" : "Copy Markdown"}
                </button>
                <button
                  className="today-button"
                  onClick={() =>
                    downloadTextFile(
                      `reactor-${dayKey}.md`,
                      exportMarkdown,
                    )
                  }
                >
                  Download .md
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
      <div className={`reactor-canvas-stage ${pocketOpen ? "reactor-canvas-stage-generate" : ""}`}>
      <div
        className={`day-canvas-board reactor-canvas-board ${pocketOpen ? "reactor-canvas-board-generate" : ""}`}
        onWheel={(event) => {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.08 : 0.08;
            setCanvasScale((value) => Math.max(0.65, Math.min(3, value + delta)));
            return;
          }

          setCanvasOffset((current) => ({
            x: current.x - event.deltaX,
            y: current.y - event.deltaY,
          }));
        }}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest(".day-board-card, .reactor-canvas-composer")) {
            return;
          }

          const startX = event.clientX;
          const startY = event.clientY;
          const origin = canvasOffset;

          const handleMove = (moveEvent: MouseEvent) => {
            setCanvasOffset({
              x: origin.x + (moveEvent.clientX - startX),
              y: origin.y + (moveEvent.clientY - startY),
            });
          };

          const handleUp = () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
          };

          window.addEventListener("mousemove", handleMove);
          window.addEventListener("mouseup", handleUp);
        }}
      >
        <div className="reactor-canvas-toolbar">
          <button
            className={`reactor-canvas-fab ${isComposerOpen ? "active" : ""}`}
            onClick={() => (isComposerOpen ? onCloseComposer() : onOpenComposer("idea", dayKey))}
            aria-label={isComposerOpen ? "Close capture" : "Open capture"}
          >
            <span aria-hidden="true">{isComposerOpen ? "×" : "+"}</span>
          </button>
          {isComposerOpen ? (
            <div className="reactor-canvas-panel">
              <ReactorComposer
                dock
                composerType={composerType}
                composerContent={composerContent}
                composerNote={composerNote}
                composerTagsDraft={composerTagsDraft}
                isSavingMaterial={isSavingMaterial}
                onCloseComposer={onCloseComposer}
                onComposerTypeChange={onComposerTypeChange}
                onComposerContentChange={onComposerContentChange}
                onComposerNoteChange={onComposerNoteChange}
                onComposerTagsChange={onComposerTagsChange}
                onApplyNotePreset={onComposerNoteChange}
                onSaveMaterial={onSaveMaterial}
              />
            </div>
          ) : null}
        </div>
        <div
          className="reactor-canvas-content"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          }}
        >
        {materials.map((material, index) => {
          const layout = layouts[material.id] ?? defaultReactorLayout(index);
          return (
            <motion.article
              key={material.id}
              className={`day-board-card reactor-board-card ${
                selectedAiIds.includes(material.id) && pocketOpen ? "reactor-board-card-selected" : ""
              }`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}
              style={{
                left: `${layout.x}px`,
                top: `${layout.y}px`,
                width: `${layout.width}px`,
                zIndex: layout.z,
                rotate: entryRotation(index),
              }}
              onClick={(event) => {
                if (!pocketOpen) {
                  return;
                }

                if ((event.target as HTMLElement).closest("button, a, .resize-handle, input, textarea")) {
                  return;
                }

                onUpdateLayout(material.id, { z: Date.now() + 1000 });
                setSelectedAiIds((current) =>
                  current.includes(material.id)
                    ? current.filter((id) => id !== material.id)
                    : [...current, material.id],
                );
              }}
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest("button, a, .resize-handle")) {
                  return;
                }

                const startX = event.clientX;
                const startY = event.clientY;
                const startLeft = layout.x;
                const startTop = layout.y;
                const baseZ = Date.now();
                onUpdateLayout(material.id, { z: baseZ + 100 });

                const handleMove = (moveEvent: MouseEvent) => {
                  const dx = (moveEvent.clientX - startX) / canvasScale;
                  const dy = (moveEvent.clientY - startY) / canvasScale;
                  onUpdateLayout(material.id, {
                    x: startLeft + dx,
                    y: startTop + dy,
                  });
                };

                const handleUp = () => {
                  window.removeEventListener("mousemove", handleMove);
                  window.removeEventListener("mouseup", handleUp);
                };

                window.addEventListener("mousemove", handleMove);
                window.addEventListener("mouseup", handleUp);
              }}
            >
              <ReactorMaterialCard
                material={material}
                index={index}
                selected={selectedAiIds.includes(material.id)}
                pocketMode={pocketOpen}
                onDelete={() => onDeleteMaterial(material.id)}
                onEdit={() => onEditMaterial(material.id)}
                onToggleImportant={() => onToggleImportant(material.id)}
              />
              <button
                className="resize-handle resize-handle-corner"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  const startX = event.clientX;
                  const startWidth = layout.width;
                  onUpdateLayout(material.id, { z: Date.now() });
                  const handleMove = (moveEvent: MouseEvent) => {
                    onUpdateLayout(material.id, {
                      width: Math.max(220, Math.min(460, startWidth + (moveEvent.clientX - startX) / canvasScale)),
                    });
                  };
                  const handleUp = () => {
                    window.removeEventListener("mousemove", handleMove);
                    window.removeEventListener("mouseup", handleUp);
                  };
                  window.addEventListener("mousemove", handleMove);
                  window.addEventListener("mouseup", handleUp);
                }}
              />
            </motion.article>
          );
        })}
        </div>
      </div>
      </div>
      <section className="reactor-diary-panel">
        <div className="reactor-diary-header">
          <div>
            <span className="reactor-side-kicker">Diary</span>
            <strong>Write before sorting.</strong>
          </div>
          <div className="reactor-diary-actions">
            <button className="ghost-action" onClick={onSaveDiary}>Save diary</button>
          </div>
        </div>
        <textarea
          className="reactor-diary-textarea"
          value={diaryDraft}
          onChange={(event) => onDiaryChange(event.target.value)}
          placeholder="Write the scattered parts of today before you try to explain them."
        />
        <div className="reactor-diary-footer">
          <div className={`reactor-generate-dock reactor-generate-dock-inline ${pocketOpen ? "open" : ""}`}>
            {pocketOpen ? (
              <>
                <span className="reactor-pocket-count" aria-label={`${selectedAiIds.length} selected materials`}>
                  📎 {selectedAiIds.length}
                </span>
                <button
                  className="today-button"
                  onClick={() => void handleGenerateStoryline()}
                  disabled={isGeneratingStoryline || (!diaryDraft.trim() && selectedAiIds.length === 0)}
                >
                  {isGeneratingStoryline ? "..." : "Start"}
                </button>
                <button className="top-tool" onClick={() => setPocketOpen(false)}>Close</button>
              </>
            ) : (
              <button
                className="today-button reactor-generate-trigger"
                onClick={() => setPocketOpen(true)}
              >
                Generate
              </button>
            )}
          </div>
        </div>
      </section>
      {storylineInsight ? (
        <div className="summary-overlay" onClick={() => setStorylineInsight(null)}>
          <section className="reactor-pocket-result" onClick={(event) => event.stopPropagation()}>
            <div className="reactor-ai-studio-header">
              <div>
                <span className="reactor-side-kicker">Generate</span>
                <strong>{storylineInsight.title}</strong>
              </div>
              <button className="ghost-action" onClick={() => setStorylineInsight(null)}>Close</button>
            </div>
            <p>{storylineInsight.intent}</p>
            <pre>{storylineInsight.prompt}</pre>
            <div className="reactor-ai-actions">
              <button
                className={`today-button ${copiedStudioPrompt ? "active" : ""}`}
                onClick={async () => {
                  await navigator.clipboard.writeText(storylineInsight.prompt);
                  setCopiedStudioPrompt(true);
                }}
              >
                {copiedStudioPrompt ? "Copied" : "Copy prompt"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ReactorMaterialCard({
  material,
  index,
  weekMode = false,
  selected = false,
  pocketMode = false,
  onDelete,
  onEdit,
  onToggleImportant,
}: {
  material: ReactorDay["materials"][number];
  index: number;
  weekMode?: boolean;
  selected?: boolean;
  pocketMode?: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggleImportant: () => void;
}) {
  const pet = petForMaterial(material);
  const weekCardStyle = weekMode ? reactorWeekCardStyle(material, index) : undefined;
  const imageUrl = material.meta?.imageUrl ?? material.meta?.previewImageUrl ?? null;
  const cardTitle = material.type === "link"
    ? material.meta?.previewTitle ?? material.content
    : material.type === "image"
      ? material.note || material.content
      : material.content;
  const cardMeta = material.type === "link"
    ? material.meta?.siteName ?? material.meta?.sourceUrl ?? material.note
    : material.note;
  const [imageVisible, setImageVisible] = useState(Boolean(imageUrl));
  const [copiedLink, setCopiedLink] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setImageVisible(Boolean(imageUrl));
  }, [imageUrl]);

  useEffect(() => {
    if (!copiedLink) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCopiedLink(false);
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [copiedLink]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <article
      className={`reactor-card reactor-card-material reactor-card-style-${entryDecoration(index)} ${
        weekMode ? "reactor-card-week" : "reactor-card-canvas"
      } reactor-bubble-${pet.bubble} reactor-rarity-${pet.rarity} ${
        pocketMode ? "reactor-card-pocket" : ""
      } ${selected && pocketMode ? "reactor-card-selected" : ""}`}
      onMouseLeave={() => setNoteOpen(false)}
      style={weekCardStyle}
    >
      <div className={`reactor-bubble-tail reactor-bubble-tail-${pet.bubble}`} />
      <div
        className={`reactor-pet reactor-pet-${pet.mode} reactor-pet-rarity-${pet.rarity} ${
          weekMode ? "reactor-pet-week" : "reactor-pet-canvas"
        } ${material.important ? "reactor-pet-important" : ""} ${
          selected && pocketMode ? "reactor-pet-pocketed" : ""
        }`}
        aria-hidden="true"
      >
        <PixelPetSprite pet={pet} size={weekMode ? 54 : 60} />
        {material.important ? <span className="reactor-pet-crown" aria-hidden="true">✦</span> : null}
        {selected && pocketMode ? <span className="reactor-pet-pocket-mark" aria-hidden="true">✦</span> : null}
      </div>
      <button
        className={`entry-important ${material.important ? "active" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleImportant();
        }}
        title={material.important ? "Unmark important" : "Mark important"}
      >
        ★
      </button>
      <div
        ref={menuRef}
        className={`entry-menu ${menuOpen ? "open" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="entry-menu-trigger"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
          aria-label="Open card menu"
          title="More"
        >
          ⋯
        </button>
        {menuOpen ? (
          <div className="entry-menu-panel">
            <button
              className="entry-menu-item"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                onEdit();
              }}
            >
              编辑
            </button>
            {material.type === "link" && material.meta?.sourceUrl ? (
              <button
                className={`entry-menu-item ${copiedLink ? "copied" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  void navigator.clipboard.writeText(material.meta?.sourceUrl ?? "");
                  setCopiedLink(true);
                }}
              >
                {copiedLink ? "Copied" : "Copy link"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <button
        className="entry-delete"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        ×
      </button>
      {material.type === "link" && material.meta?.sourceUrl ? (
        <a
          className="reactor-card-link-open"
          href={material.meta.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          {imageUrl && imageVisible ? (
            <div className="reactor-card-image reactor-card-image-link">
              <img src={imageUrl} alt={cardTitle} onError={() => setImageVisible(false)} />
            </div>
          ) : (
            <div className="reactor-card-link-fallback">
              <span className="reactor-card-link-favicon">{(material.meta?.siteName ?? "Link").slice(0, 1)}</span>
              <span>{material.meta?.siteName ?? "Link preview unavailable"}</span>
            </div>
          )}
          <p className="reactor-card-title">{cardTitle}</p>
          {!weekMode && cardMeta ? <p className="reactor-card-meta">{cardMeta}</p> : null}
        </a>
      ) : (
        <>
          {imageUrl && imageVisible ? (
            <div className={`reactor-card-image ${material.type === "link" ? "reactor-card-image-link" : ""}`}>
              <img src={imageUrl} alt={cardTitle} onError={() => setImageVisible(false)} />
            </div>
          ) : material.type === "link" ? (
            <div className="reactor-card-link-fallback">
              <span className="reactor-card-link-favicon">{(material.meta?.siteName ?? "Link").slice(0, 1)}</span>
              <span>{material.meta?.siteName ?? "Link preview unavailable"}</span>
            </div>
          ) : null}
          <p className="reactor-card-title">{cardTitle}</p>
          {!weekMode && cardMeta ? <p className="reactor-card-meta">{cardMeta}</p> : null}
        </>
      )}
      {!weekMode && material.note ? (
        <div className={`reactor-card-note-preview ${noteOpen ? "open" : ""}`}>
          <button
            className="reactor-card-note-toggle"
            onClick={(event) => {
              event.stopPropagation();
              setNoteOpen((value) => !value);
            }}
            title={material.note}
          >
            <span>{noteOpen ? material.note : reactorNotePreview(material.note)}</span>
            <span className="reactor-card-note-hint">{noteOpen ? "Hide" : "Note"}</span>
          </button>
        </div>
      ) : null}
      <span className="reactor-card-type reactor-card-type-footer">
        {labelForMaterialType(material.type).toLowerCase()}
      </span>
    </article>
  );
}

function defaultMaterialTags(_type: ReactorMaterialType) {
  return [];
}

function meaningfulTagForMaterial(material: ReactorMaterial) {
  const reserved = new Set([
    labelForMaterialType(material.type).toLowerCase(),
    labelForMaterialTypeZh(material.type).toLowerCase(),
  ]);

  const tag = material.manualTags.find((entry) => {
    const normalized = entry.trim().toLowerCase();
    return normalized && !reserved.has(normalized);
  });

  return tag ?? labelForMaterialTypeZh(material.type);
}

function organizeReactorLayouts(
  materials: ReactorMaterial[],
  currentLayouts: Record<string, BoardLayout>,
) {
  const grouped = new Map<string, ReactorMaterial[]>();

  materials.forEach((material) => {
    const key = meaningfulTagForMaterial(material);
    const current = grouped.get(key) ?? [];
    current.push(material);
    grouped.set(key, current);
  });

  const orderedGroups = [...grouped.entries()].sort((left, right) => {
    if (right[1].length !== left[1].length) {
      return right[1].length - left[1].length;
    }
    return left[0].localeCompare(right[0], "zh-Hans-CN");
  });

  let cursorX = 120;
  let cursorY = 120;
  let rowHeight = 0;
  const canvasMaxWidth = 3600;
  const nextLayouts: Record<string, BoardLayout> = {};

  orderedGroups.forEach(([_, group], groupIndex) => {
    const items = [...group].sort((left, right) => {
      if (Number(right.important) !== Number(left.important)) {
        return Number(right.important) - Number(left.important);
      }
      return left.content.localeCompare(right.content, "zh-Hans-CN");
    });

    const columnWidth = 300;
    const columnGap = 34;
    const groupWidth = items.length > 1 ? columnWidth * 2 + columnGap : columnWidth;
    const xLimit = cursorX + groupWidth;

    if (xLimit > canvasMaxWidth) {
      cursorX = 120;
      cursorY += rowHeight + 88;
      rowHeight = 0;
    }

    const columnHeights = [cursorY, cursorY];
    items.forEach((material, itemIndex) => {
      const height = defaultReactorCardHeight(material);
      const columnIndex = columnHeights[0] <= columnHeights[1] ? 0 : 1;
      const useSingleColumn = items.length === 1;
      const x = cursorX + (useSingleColumn ? 0 : columnIndex * (columnWidth + columnGap));
      const y = useSingleColumn ? columnHeights[0] : columnHeights[columnIndex];

      nextLayouts[material.id] = {
        ...(currentLayouts[material.id] ?? defaultReactorLayout(itemIndex)),
        x,
        y,
        width: Math.max(260, Math.min(340, currentLayouts[material.id]?.width ?? columnWidth)),
        z: groupIndex * 10 + itemIndex + 1,
      };

      columnHeights[useSingleColumn ? 0 : columnIndex] = y + height + 28;
      if (useSingleColumn) {
        columnHeights[1] = columnHeights[0];
      }
    });

    const groupHeight = Math.max(...columnHeights) - cursorY;
    rowHeight = Math.max(rowHeight, groupHeight);
    cursorX += groupWidth + 72;
  });

  return nextLayouts;
}

function buildReactorMarkdownExport(dayKey: string, materials: ReactorMaterial[]) {
  const grouped = new Map<ReactorMaterialType, ReactorMaterial[]>();
  materials.forEach((material) => {
    const current = grouped.get(material.type) ?? [];
    current.push(material);
    grouped.set(material.type, current);
  });

  const orderedTypes: ReactorMaterialType[] = ["idea", "diary", "prompt", "sample", "link", "image"];
  const sections = orderedTypes
    .map((type) => {
      const items = grouped.get(type) ?? [];
      if (items.length === 0) {
        return null;
      }

      const body = items
        .map((material) => materialToMarkdown(material))
        .join("\n\n");
      return `## ${pluralLabelForMaterialType(type)}\n\n${body}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return `# Reactor Export · ${dayKey}\n\n${sections}`.trim();
}

function materialToMarkdown(material: ReactorMaterial) {
  const lines = [`- ${material.content}`];

  if (material.note) {
    lines.push(`  - Why keep: ${material.note}`);
  }

  if (material.manualTags.length > 0) {
    lines.push(`  - Tags: ${material.manualTags.join(", ")}`);
  }

  if (material.important) {
    lines.push("  - Important: yes");
  }

  if (material.type === "link" && material.meta?.sourceUrl) {
    lines.push(`  - URL: ${material.meta.sourceUrl}`);
  }

  if (material.type === "image" && material.meta?.imageUrl) {
    lines.push(`  - Image: ${material.meta.imageUrl}`);
  }

  return lines.join("\n");
}

function pluralLabelForMaterialType(type: ReactorMaterialType) {
  switch (type) {
    case "idea":
      return "Ideas";
    case "prompt":
      return "Prompts";
    case "link":
      return "Links";
    case "sample":
      return "Samples";
    case "image":
      return "Images";
    default:
      return "Notes";
  }
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function PixelPetSprite({
  pet,
  size,
}: {
  pet: ReactorPet;
  size: number;
}) {
  const pixels = spriteForPet(pet);

  return (
    <svg
      className={`reactor-pet-sprite reactor-pet-sprite-${pet.id}`}
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {pixels.map((pixel, index) => (
        <rect
          key={`${pet.id}-${index}-${pixel.x}-${pixel.y}`}
          x={pixel.x}
          y={pixel.y}
          width="1"
          height="1"
          fill={pixel.fill}
        />
      ))}
    </svg>
  );
}

function BoardUnavailable({
  message,
  onOpenReactor,
  onRetry,
}: {
  message: string;
  onOpenReactor: () => void;
  onRetry: () => void;
}) {
  return (
    <section className="board-unavailable">
      <p className="board-unavailable-kicker">Aesthetic Board</p>
      <h2>Week data is not ready yet.</h2>
      <p>{message}</p>
      <div className="board-unavailable-actions">
        <button className="today-button" onClick={onOpenReactor}>
          Open Reactor
        </button>
        <button className="top-tool" onClick={onRetry}>
          Retry
        </button>
      </div>
    </section>
  );
}

function DayCanvas({
  dayLabel,
  dayNumber,
  entries,
  layouts,
  onBack,
  dayNoteDraft,
  onDayNoteChange,
  onSaveDayNote,
  onDeleteTerm,
  onDeleteEntry,
  onCopyTerm,
  onOpenImage,
  expandedEntryId,
  onToggleExpandedEntry,
  onUpdateLayout,
}: {
  dayLabel: string;
  dayNumber: string;
  entries: WeekEntry[];
  layouts: Record<string, BoardLayout>;
  onBack: () => void;
  dayNoteDraft: string;
  onDayNoteChange: (value: string) => void;
  onSaveDayNote: () => void;
  onDeleteTerm: (termId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onCopyTerm: (term: string) => void;
  onOpenImage: (entry: WeekEntry) => void;
  expandedEntryId: string | null;
  onToggleExpandedEntry: (entryId: string | null) => void;
  onUpdateLayout: (entryId: string, next: Partial<BoardLayout>) => void;
}) {
  return (
    <section className="day-canvas">
      <header className="day-canvas-header">
        <div>
          <p className="day-canvas-kicker">Focused Day</p>
          <h2>
            {dayNumber} · {dayLabel}
          </h2>
        </div>
        <div className="day-canvas-actions">
          <button className="nav-button" onClick={onBack}>
            Back to Week
          </button>
        </div>
      </header>
      <div className="day-canvas-board">
        {entries.map((entry, index) => {
          const layout = layouts[entry.id] ?? defaultBoardLayout(entry, index);
          const ratio = imageRatio(entry);
          const cardHeight = Math.max(190, layout.width / ratio + 88);

          return (
            <motion.article
              key={entry.id}
              className="day-board-card"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                left: `${layout.x}px`,
                top: `${layout.y}px`,
                width: `${layout.width}px`,
                height: `${cardHeight}px`,
                zIndex: layout.z,
                rotate: entryRotation(index),
              }}
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest(".resize-handle")) {
                  return;
                }

                const startX = event.clientX;
                const startY = event.clientY;
                const startLeft = layout.x;
                const startTop = layout.y;
                onUpdateLayout(entry.id, { z: Date.now() });

                const handleMove = (moveEvent: MouseEvent) => {
                  onUpdateLayout(entry.id, {
                    x: Math.max(0, startLeft + (moveEvent.clientX - startX)),
                    y: Math.max(0, startTop + (moveEvent.clientY - startY)),
                  });
                };

                const handleUp = () => {
                  window.removeEventListener("mousemove", handleMove);
                  window.removeEventListener("mouseup", handleUp);
                };

                window.addEventListener("mousemove", handleMove);
                window.addEventListener("mouseup", handleUp);
              }}
            >
              <JournalCard
                entry={entry}
                index={index}
                daySlot="mon"
                onDeleteTerm={onDeleteTerm}
                onDeleteEntry={onDeleteEntry}
                onCopyTerm={onCopyTerm}
                onOpenImage={onOpenImage}
                isExpanded={expandedEntryId === entry.id}
                onToggleExpanded={onToggleExpandedEntry}
                canvasMode
              />
              <button
                className="resize-handle resize-handle-corner"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  const startX = event.clientX;
                  const startWidth = layout.width;
                  onUpdateLayout(entry.id, { z: Date.now() });

                  const handleMove = (moveEvent: MouseEvent) => {
                    onUpdateLayout(entry.id, {
                      width: Math.max(180, Math.min(420, startWidth + (moveEvent.clientX - startX))),
                    });
                  };

                  const handleUp = () => {
                    window.removeEventListener("mousemove", handleMove);
                    window.removeEventListener("mouseup", handleUp);
                  };

                  window.addEventListener("mousemove", handleMove);
                  window.addEventListener("mouseup", handleUp);
                }}
              />
              <button
                className="resize-handle resize-handle-edge"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  const startX = event.clientX;
                  const startWidth = layout.width;
                  onUpdateLayout(entry.id, { z: Date.now() });

                  const handleMove = (moveEvent: MouseEvent) => {
                    onUpdateLayout(entry.id, {
                      width: Math.max(180, Math.min(420, startWidth + (moveEvent.clientX - startX))),
                    });
                  };

                  const handleUp = () => {
                    window.removeEventListener("mousemove", handleMove);
                    window.removeEventListener("mouseup", handleUp);
                  };

                  window.addEventListener("mousemove", handleMove);
                  window.addEventListener("mouseup", handleUp);
                }}
              />
            </motion.article>
          );
        })}
      </div>
      <section className="day-note-panel">
        <div className="day-note-header">
          <span>Day Notes</span>
          <button className="ghost-action" onClick={onSaveDayNote}>
            保存当日笔记
          </button>
        </div>
        <textarea
          className="day-note-textarea"
          value={dayNoteDraft}
          onChange={(event) => onDayNoteChange(event.target.value)}
          placeholder="记下今天这组灵感的感觉..."
        />
      </section>
    </section>
  );
}

function JournalCard({
  entry,
  index,
  daySlot,
  onDeleteTerm,
  onDeleteEntry,
  onCopyTerm,
  onOpenImage,
  draggableInWeek = false,
  resizedWidth,
  onResizeWidth,
  isExpanded,
  onToggleExpanded,
  canvasMode = false,
}: {
  entry: WeekEntry;
  index: number;
  daySlot: DaySlot;
  onDeleteTerm: (termId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onCopyTerm: (term: string) => void;
  onOpenImage: (entry: WeekEntry) => void;
  draggableInWeek?: boolean;
  resizedWidth?: number;
  onResizeWidth?: (entryId: string, width: number) => void;
  isExpanded: boolean;
  onToggleExpanded: (entryId: string | null) => void;
  canvasMode?: boolean;
}) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const canExpandSummary = (entry.promptSummary?.length ?? 0) > 58;
  const terms = visibleTerms(entry);

  return (
    <article
      className={`entry-card entry-card-${entry.status} ${canvasMode ? "entry-card-canvas" : ""} ${
        isExpanded ? "entry-card-expanded" : ""
      }`}
      style={canvasMode ? undefined : entryStyle(index, daySlot, entry, resizedWidth)}
      draggable={draggableInWeek}
      onDragStart={(event) => {
        if (!draggableInWeek) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/entry-id", entry.id);
      }}
    >
      <div className={`tape tape-${entry.decorationStyle}`} />
      <div className={`pin pin-${entry.decorationStyle}`} />
      <div className={`paper-clip paper-clip-${entry.decorationStyle}`} />
      <button
        className="entry-delete"
        onClick={(event) => {
          event.stopPropagation();
          void onDeleteEntry(entry.id);
        }}
      >
        ×
      </button>
      <button
        className="image-frame image-frame-button"
        onClick={(event) => {
          event.stopPropagation();
          onOpenImage(entry);
        }}
        aria-label={`放大查看 ${entry.title}`}
      >
        <img className="entry-image" src={entry.imageUrl} alt={entry.title} />
      </button>
      {entry.promptSummary ? (
        <div className={`entry-summary-chip ${isSummaryExpanded ? "entry-summary-chip-expanded" : ""}`}>
          <button
            className="entry-summary-button"
            title={entry.promptSummary}
            onClick={(event) => {
              event.stopPropagation();
              if (canExpandSummary) {
                setIsSummaryExpanded((current) => !current);
              } else {
                void onCopyTerm(entry.promptSummary ?? "");
              }
            }}
          >
            <span>{entry.promptSummary}</span>
            <span className="entry-summary-actions">
              {canExpandSummary ? (
                <span className="entry-summary-toggle">{isSummaryExpanded ? "收起" : "展开"}</span>
              ) : null}
              <span className="term-copy">⧉</span>
            </span>
          </button>
          {isSummaryExpanded ? (
            <button
              className="entry-summary-copy"
              onClick={(event) => {
                event.stopPropagation();
                void onCopyTerm(entry.promptSummary ?? "");
              }}
            >
              复制描述
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="term-cluster">
        {terms.length > 0 ? (
          <div className="term-summary">
            {isExpanded ? (
              <div className="term-hover-list is-open">
                {terms.map((term, termIndex) => (
                  <button
                    key={term.id}
                    className="term-pill floating"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onCopyTerm(term.term);
                    }}
                    title={`复制关键词 ${term.term}`}
                    style={{
                      marginTop: termIndex === 0 ? 0 : undefined,
                    }}
                  >
                    <span>{term.term}</span>
                    <span className="term-copy">⧉</span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                className="term-pill primary"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpanded(isExpanded ? null : entry.id);
                }}
              >
                <span>{terms[0].term}</span>
                {terms.length > 1 ? (
                  <span className="term-count">+{terms.length - 1}</span>
                ) : null}
              </button>
            )}
          </div>
        ) : (
          <span className="processing-copy">
            {entry.status === "failed"
              ? entry.errorMessage ?? "处理失败"
              : "正在把感觉翻译成设计语言..."}
          </span>
        )}
      </div>
      {!canvasMode && onResizeWidth ? (
        <button
          className="resize-handle resize-handle-week"
          onMouseDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
            const startX = event.clientX;
            const startWidth = resizedWidth ?? defaultCardWidth(entry);

            const handleMove = (moveEvent: MouseEvent) => {
              onResizeWidth(entry.id, Math.max(118, Math.min(220, startWidth + (moveEvent.clientX - startX))));
            };

            const handleUp = () => {
              window.removeEventListener("mousemove", handleMove);
              window.removeEventListener("mouseup", handleUp);
            };

            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleUp);
          }}
          aria-label="调整周视图卡片宽度"
        />
      ) : null}
    </article>
  );
}

function labelForDay(day: DaySlot) {
  return {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    weekend: "Weekend",
  }[day];
}

function todaySlot(): DaySlot {
  const day = new Date().getDay();

  if (day === 1) {
    return "mon";
  }

  if (day === 2) {
    return "tue";
  }

  if (day === 3) {
    return "wed";
  }

  if (day === 4) {
    return "thu";
  }

  if (day === 5) {
    return "fri";
  }

  return "weekend";
}

function visibleTerms(entry: WeekEntry) {
  return entry.terms.filter((term) => !term.deletedAt);
}

function entryRotation(index: number) {
  const angles = [-3, 2, -1, 3, -2];
  return angles[index % angles.length];
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const output: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      output.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      output.push(<strong key={`strong-${tokenIndex++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      output.push(<code key={`code-${tokenIndex++}`}>{token.slice(1, -1)}</code>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    output.push(text.slice(lastIndex));
  }

  return output;
}

function renderToolPromptMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];
  let codeBuffer: string[] = [];
  let inCodeBlock = false;

  function flushParagraph() {
    if (paragraphBuffer.length === 0) {
      return;
    }

    const text = paragraphBuffer.join(" ").trim();
    if (text) {
      nodes.push(<p key={`p-${nodes.length}`}>{renderInlineMarkdown(text)}</p>);
    }
    paragraphBuffer = [];
  }

  function flushList() {
    if (listBuffer.length === 0) {
      return;
    }

    nodes.push(
      <ul key={`ul-${nodes.length}`}>
        {listBuffer.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }

  function flushCode() {
    if (codeBuffer.length === 0) {
      return;
    }

    nodes.push(
      <pre key={`pre-${nodes.length}`} className="tool-prompt-code">
        <code>{codeBuffer.join("\n")}</code>
      </pre>,
    );
    codeBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("---")) {
      flushParagraph();
      flushList();
      nodes.push(<hr key={`hr-${nodes.length}`} />);
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      nodes.push(<h3 key={`h3-${nodes.length}`}>{renderInlineMarkdown(line.slice(4))}</h3>);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push(<h2 key={`h2-${nodes.length}`}>{renderInlineMarkdown(line.slice(3))}</h2>);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      listBuffer.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }

    if (line.startsWith("|") && line.endsWith("|")) {
      flushParagraph();
      flushList();
      nodes.push(
        <p key={`table-${nodes.length}`} className="tool-prompt-table-line">
          {line}
        </p>,
      );
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushCode();

  return nodes;
}

function entryStyle(index: number, daySlot: DaySlot, entry: WeekEntry, resizedWidth?: number) {
  const width = resizedWidth ?? defaultCardWidth(entry);

  return {
    transform: `rotate(${[-1.4, 0.6, -0.8, 0.8][index % 4]}deg)`,
    width: `min(100%, ${width}px)`,
  };
}

function defaultCardWidth(entry: WeekEntry) {
  const ratio = imageRatio(entry);
  return ratio > 1.25 ? 168 : ratio < 0.9 ? 150 : 160;
}

function imageRatio(entry: WeekEntry) {
  const width = entry.imageWidth ?? 280;
  const height = entry.imageHeight ?? 220;
  return width / height;
}

function defaultBoardLayout(entry: WeekEntry | undefined, index: number): BoardLayout {
  const baseWidth = entry ? Math.max(200, Math.min(340, (entry.imageWidth ?? 260) * 0.78)) : 240;
  const col = index % 3;
  const row = Math.floor(index / 3);

  return {
    x: 44 + col * 250 + (index % 2 === 0 ? 18 : -12),
    y: 72 + row * 220 + (index % 3) * 18,
    width: baseWidth,
    z: index + 1,
  };
}

function layoutStorageKey(weekKey: string, day: DaySlot) {
  return `ai-journal-layout:${weekKey}:${day}`;
}

function labelForMaterialType(type: ReactorMaterialType) {
  return {
    diary: "Diary",
    idea: "Idea",
    prompt: "Prompt",
    link: "Link",
    sample: "Sample",
    image: "Image",
  }[type];
}

function labelForMaterialTypeZh(type: ReactorMaterialType) {
  return {
    diary: "日记",
    idea: "点子",
    prompt: "提示词",
    link: "链接",
    sample: "样本",
    image: "图片",
  }[type];
}

function todayDateKey() {
  return localDateKey(new Date());
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfCurrentWeek(offset = 0) {
  const today = new Date();
  const start = new Date(today);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff + offset * 7);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildReactorWeek(days: ReactorDay[], offset = 0) {
  const start = startOfCurrentWeek(offset);
  const byKey = new Map(days.map((day) => [day.dayKey, day]));
  const week = new Map<DaySlot, ReactorDay>();

  dayGroups.forEach(([slot], index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    if (slot === "weekend") {
      const sunday = new Date(start);
      sunday.setDate(start.getDate() + 6);
      const saturdayKey = localDateKey(date);
      const sundayKey = localDateKey(sunday);
      const materials = [
        ...(byKey.get(saturdayKey)?.materials ?? []),
        ...(byKey.get(sundayKey)?.materials ?? []),
      ];

      week.set(slot, {
        dayKey: saturdayKey,
        label: "Weekend",
        itemCount: materials.length,
        materials,
      });
      return;
    }

    const dayKey = localDateKey(date);
    week.set(slot, byKey.get(dayKey) ?? emptyReactorDay(slot));
  });

  return week;
}

function reactorSlotForDate(dayKey: string): DaySlot {
  const date = new Date(`${dayKey}T00:00:00`);
  const day = date.getDay();

  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";

  return "weekend";
}

function emptyReactorDay(slot: DaySlot): ReactorDay {
  const start = startOfCurrentWeek();
  const offset = slot === "weekend" ? 5 : dayGroups.findIndex(([value]) => value === slot);
  const date = new Date(start);
  date.setDate(start.getDate() + Math.max(offset, 0));

  return {
    dayKey: localDateKey(date),
    label: labelForDay(slot),
    itemCount: 0,
    materials: [],
  };
}

function reactorLayoutStorageKey(dayKey: string) {
  return `creator-reactor-layout:${dayKey}`;
}

function reactorDiaryStorageKey(dayKey: string) {
  return `creator-reactor-diary:${dayKey}`;
}

function reactorNotePreview(note: string) {
  return note.length > 80 ? `${note.slice(0, 80).trim()}…` : note;
}

function readStoredJson<T>(key: string, fallback: T) {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function defaultReactorLayout(index: number): BoardLayout {
  const col = index % 5;
  const row = Math.floor(index / 5);

  return {
    x: 56 + col * 308 + (index % 2 === 0 ? 8 : -10),
    y: 88 + row * 232 + (index % 3) * 10,
    width: 258,
    z: index + 1,
  };
}

function findOpenReactorLayout(
  existingLayouts: Record<string, BoardLayout>,
  material: ReactorDay["materials"][number],
  index: number,
): BoardLayout {
  const width = defaultReactorCardWidth(material);
  const height = defaultReactorCardHeight(material);
  const placements = Object.values(existingLayouts);
  const columns = [56, 372, 688, 1004, 1320, 1636, 1952, 2268, 2584];

  for (let row = 0; row < 12; row += 1) {
    const y = 88 + row * 232;

    for (const x of columns) {
      const candidate = { x, y, width, z: placements.length + index + 1 };
      if (!isReactorLayoutOccupied(candidate, height, placements)) {
        return candidate;
      }
    }
  }

  return {
    x: 56 + (index % 6) * 304,
    y: 88 + Math.floor(index / 6) * 232,
    width,
    z: placements.length + index + 1,
  };
}

function defaultReactorCardWidth(material: ReactorDay["materials"][number]) {
  if (material.type === "image") {
    return 300;
  }
  if (material.type === "link") {
    return 284;
  }
  return 258;
}

function defaultReactorCardHeight(material: ReactorDay["materials"][number]) {
  if (material.type === "image") {
    return 284;
  }
  if (material.type === "link") {
    return material.meta?.previewImageUrl ? 276 : 228;
  }
  return 186;
}

function isReactorLayoutOccupied(
  candidate: BoardLayout,
  candidateHeight: number,
  layouts: BoardLayout[],
) {
  return layouts.some((layout) => {
    const layoutHeight = 230;
    return !(
      candidate.x + candidate.width + 24 < layout.x ||
      layout.x + layout.width + 24 < candidate.x ||
      candidate.y + candidateHeight + 24 < layout.y ||
      layout.y + layoutHeight + 24 < candidate.y
    );
  });
}

function buildReactorWeeklySummary(board: ReactorBoard | null) {
  const materials = board?.days.flatMap((day) => day.materials) ?? [];
  const activeDays = board?.days.filter((day) => day.materials.length > 0).length ?? 0;
  const typeCount = new Map<string, number>();

  materials.forEach((material) => {
    const label = labelForMaterialType(material.type);
    typeCount.set(label, (typeCount.get(label) ?? 0) + 1);
  });

  return {
    totalItems: materials.length,
    activeDays,
    topTypes: Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count })),
  };
}

function reactorWeekTitle(offset: number) {
  const start = startOfCurrentWeek(offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${monthDayLabel(start)} - ${monthDayLabel(end)} Digest`;
}

function monthDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isEditableTarget(target: HTMLElement | null) {
  if (!target) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
}

function isProbablyUrl(input: string) {
  try {
    new URL(input);
    return true;
  } catch {
    return /^(https?:\/\/|www\.)/i.test(input);
  }
}

function normalizeUrl(input: string) {
  try {
    return new URL(input).toString();
  } catch {
    return new URL(`https://${input}`).toString();
  }
}

function entryDecoration(index: number) {
  const styles = ["amber", "pink", "sage", "blue"] as const;
  return styles[index % styles.length];
}

function petForMaterial(material: ReactorDay["materials"][number]) {
  const value = hashString(`${material.id}:${material.type}`);
  const bucket = value % 1000;
  const legendary = reactorPets.filter((pet) => pet.rarity === "legendary");
  const rare = reactorPets.filter((pet) => pet.rarity === "rare");
  const common = reactorPets.filter((pet) => pet.rarity === "common");

  if (bucket < 30) {
    return legendary[value % legendary.length];
  }

  if (bucket < 300) {
    return rare[value % rare.length];
  }

  return common[value % common.length];
}

function reactorWeekCardStyle(material: ReactorDay["materials"][number], index: number) {
  const contentLength = material.content.trim().length + material.note.trim().length * 0.65;
  const width = Math.max(46, Math.min(74, 50 + Math.min(contentLength, 72) * 0.2));
  const align = ["start", "center", "end"][index % 3] as "start" | "center" | "end";

  return {
    ["--reactor-card-width" as string]: `${width}%`,
    ["--reactor-card-align" as string]: align,
  };
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function spriteForPet(pet: ReactorPet) {
  const [base, accent, shade] = pet.palette;
  const eye = "#2f241f";
  const blush = "rgba(255, 214, 214, 0.85)";
  const highlight = "#fffaf1";
  const pixels: Array<{ x: number; y: number; fill: string }> = [];

  const paint = (coords: Array<[number, number]>, fill: string) => {
    coords.forEach(([x, y]) => {
      pixels.push({ x, y, fill });
    });
  };

  const speciesPixels: Record<
    ReactorPet["species"],
    {
      body: Array<[number, number]>;
      accent?: Array<[number, number]>;
      shade?: Array<[number, number]>;
      eyes: Array<[number, number]>;
      cheeks?: Array<[number, number]>;
      highlight?: Array<[number, number]>;
    }
  > = {
    slime: {
      body: [
        [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6],
        [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
        [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
        [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [14, 9],
        [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10],
        [7, 11], [8, 11], [9, 11], [10, 11], [11, 11], [12, 11],
      ],
      accent: [[7, 7], [12, 7], [8, 11], [11, 11]],
      shade: [[6, 10], [13, 10], [7, 11], [12, 11]],
      eyes: [[8, 9], [11, 9]],
      cheeks: [[7, 10], [12, 10]],
      highlight: [[8, 7], [9, 7], [10, 7]],
    },
    fox: {
      body: [
        [7, 4], [12, 4],
        [6, 5], [7, 5], [8, 5], [11, 5], [12, 5], [13, 5],
        [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
        [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
        [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8],
        [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9],
        [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10],
        [12, 11], [13, 11], [14, 11],
      ],
      accent: [[7, 4], [12, 4], [13, 11], [14, 11]],
      shade: [[6, 7], [13, 7], [7, 10], [11, 10]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 6], [10, 6]],
    },
    sprout: {
      body: [
        [9, 3], [10, 3],
        [8, 4], [9, 4], [10, 4], [11, 4],
        [8, 5], [9, 5], [10, 5], [11, 5],
        [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6],
        [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
        [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8],
        [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9],
        [8, 10], [9, 10], [10, 10], [11, 10],
      ],
      accent: [[8, 4], [11, 4], [9, 3], [10, 3]],
      shade: [[7, 8], [12, 8], [8, 9], [11, 9]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 5], [10, 5]],
    },
    moth: {
      body: [
        [6, 5], [13, 5],
        [4, 6], [5, 6], [6, 6], [7, 6], [12, 6], [13, 6], [14, 6], [15, 6],
        [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [11, 7], [12, 7], [13, 7], [14, 7], [15, 7], [16, 7],
        [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [15, 8],
        [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [14, 9],
        [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10],
      ],
      accent: [[4, 7], [15, 7], [6, 6], [13, 6]],
      shade: [[6, 9], [13, 9], [8, 10], [11, 10]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 7], [10, 7]],
    },
    pup: {
      body: [
        [7, 4], [12, 4],
        [6, 5], [7, 5], [8, 5], [11, 5], [12, 5], [13, 5],
        [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
        [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
        [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
        [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9],
        [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10],
        [6, 11], [7, 11], [12, 11], [13, 11],
      ],
      accent: [[7, 4], [12, 4], [6, 11], [13, 11]],
      shade: [[6, 8], [13, 8], [7, 10], [12, 10]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 6], [10, 6]],
    },
    owl: {
      body: [
        [8, 4], [11, 4],
        [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],
        [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
        [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
        [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8],
        [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9],
        [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10],
        [7, 11], [8, 11], [11, 11], [12, 11],
      ],
      accent: [[8, 4], [11, 4], [7, 11], [12, 11]],
      shade: [[6, 8], [13, 8], [8, 10], [11, 10]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 6], [10, 6]],
    },
  };

  const template = speciesPixels[pet.species];

  paint(template.body, base);
  paint(template.accent ?? [], accent);
  paint(template.shade ?? [], shade);
  paint(template.highlight ?? [], highlight);
  paint(template.cheeks ?? [], blush);
  paint(template.eyes, eye);

  paint(
    [
      [9, 9],
      [10, 9],
    ],
    highlight,
  );

  if (pet.rarity === "legendary") {
    paint(
      [
        [15, 3],
        [16, 4],
        [15, 5],
        [14, 4],
      ],
      "#f7d56d",
    );
  }

  return pixels;
}

function formatDayKey(dayKey: string) {
  const [, month = "", day = ""] = dayKey.split("-");
  return `${month} / ${day}`;
}

function weekCardStorageKey(weekKey: string) {
  return `ai-journal-week-card:${weekKey}`;
}

function focusOrigin(day: DaySlot) {
  return {
    mon: "17% 24%",
    tue: "50% 24%",
    wed: "83% 24%",
    thu: "17% 64%",
    fri: "50% 64%",
    weekend: "83% 64%",
  }[day];
}

function buildWeeklySummary(week: WeekData | null) {
  if (!week) {
    return {
      totalItems: 0,
      totalTerms: 0,
      topTerms: [] as Array<{ term: string; count: number }>,
    };
  }

  const counter = new Map<string, number>();
  let totalTerms = 0;

  week.entries.forEach((entry) => {
    visibleTerms(entry).forEach((term) => {
      totalTerms += 1;
      counter.set(term.term, (counter.get(term.term) ?? 0) + 1);
    });
  });

  return {
    totalItems: week.entries.length,
    totalTerms,
    topTerms: [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term, count]) => ({ term, count })),
  };
}

async function readImageSize(imageDataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height,
      });
    };
    image.src = imageDataUrl;
  });
}
