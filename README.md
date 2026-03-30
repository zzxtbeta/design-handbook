# Design Handbook

一个面向 AI-first 创作流程的视觉手帐项目。

它的目标不是“再做一个灵感收藏夹”，而是把这条真实工作流做顺：

`贴图 / 上传截图 -> AI 提炼设计关键词 + 简短风格描述 -> 按周历沉淀 -> 回看 / 复用`

当前仓库重点服务三件事：

- 让 Agent 能在一个清晰、低歧义的项目结构里稳定推进
- 让图片、关键词、周笔记、日笔记都进入真实持久化
- 让 AI 结果不是一次性聊天记录，而是可回看、可复制、可继续生成的素材

## 当前能力

- 周视图 / 日视图双层浏览
- 粘贴图片或上传图片
- AI 自动生成设计关键词
- AI 自动生成简短 `promptSummary`
- 周笔记持久化
- 日笔记持久化
- 周视图跨天拖拽
- 图片放大查看
- Weekly Summary 词频统计

## 仓库结构

```text
apps/
  api/        Express API + AI 调用 + 数据读写
  web/        React 前端
packages/
  db/         Drizzle schema / client / migrations
ARTIFACTS/
  runtime/    本地上传图片、运行日志
WORKLOG/      每日工作日志
.learnings/   每日反思
```

## 技术栈

- 前端：React 18 + TypeScript + Vite
- 后端：Node.js + Express
- 数据库：PostgreSQL + Drizzle ORM
- AI：Gemini 网关，按 LiteLLM / OpenAI-compatible 方式接入
- 运行时：Bun workspace

## 本地启动

### 1. 安装依赖

```bash
bun install
```

### 2. 启动数据库

```bash
bun run db:up
```

默认会启动一个本地 PostgreSQL：

- Host: `127.0.0.1`
- Port: `54329`
- DB: `handbook`
- User: `handbook`
- Password: `handbook`

### 3. 配置环境变量

复制一份环境变量：

```bash
cp .env.example .env
```

如果你走当前项目默认的 Gemini 网关形态，核心是：

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_BASE_URL=...
GEMINI_MODEL_NAME=...
```

注意：

- 这里虽然叫 `gemini`，但当前接入协议是 LiteLLM / OpenAI-compatible 风格
- 如果真实 provider 返回错误，系统现在会显式失败，不再静默回退 mock

### 4. 执行数据库迁移

```bash
bun run db:migrate
```

当前 migration 已做幂等处理：

- 新库可以直接初始化
- 已有本地库重复执行也不会因为已存在的列 / 表而直接炸掉

### 5. 启动前后端

新开两个终端：

```bash
bun run dev:api
```

```bash
bun run dev:web -- --host 127.0.0.1 --port 4174
```

启动后访问：

- 前端：[http://127.0.0.1:4174/](http://127.0.0.1:4174/)
- 后端健康检查：[http://127.0.0.1:8787/api/health](http://127.0.0.1:8787/api/health)

## 常用命令

```bash
# 类型检查
bun run typecheck:web
bun run typecheck:api

# 构建
bun run build:web
bun run build:api

# 数据库
bun run db:up
bun run db:down
bun run db:migrate
```

## 数据存储原则

第一性原则是：**凡是用户会认为“这已经是正式内容”的数据，就必须进入真实存储。**

当前真实落库内容：

- weeks
- entries
- entry_terms
- week_notes
- day_notes

当前本地文件存储：

- 上传图片会写入 `ARTIFACTS/runtime/uploads/YYYY/MM/DD/`
- 删除 entry 时，会同步删除对应磁盘文件，避免上传目录持续堆积

## AI 输出原则

AI 不只输出关键词，还要输出一句简洁、可直接复用的描述。

也就是：

- `terms`: 用于检索、复刻、风格拆解
- `promptSummary`: 用于快速回忆、直接拿去继续生成

## 当前确认已收口的技术债

- 历史 mock / seed 图片已从数据库清空
- 日笔记不再停留在 `localStorage`
- AI provider 失败不再静默回退 mock
- 数据库迁移对本地已有库做了幂等收口

## 当前仍然保留的轻债

- `lint` 还没正式接线
- `test` 还没正式接线
- 还缺一套自动化“上传两张不同图片 -> 验证结果明显不同”的回归脚本

这三个属于下一轮应补，但它们已经不再阻塞当前项目继续健康推进。
