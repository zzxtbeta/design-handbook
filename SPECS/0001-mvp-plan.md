# 0001 MVP Plan

## 产品定义

首版产品是一个按周展开的视觉手帐。

用户把截图贴进来，系统自动提取 5-10 个设计术语，并把图片、术语和该周笔记放进一个可回看的时间结构里。

首版不是素材库，不是白板，不是长期分析面板。

## 首版范围

必须有：

- 周视图
- 上一周 / 下一周切换
- 图片粘贴上传
- 图片卡片展示
- 图片异步处理中状态
- Gemini 自动生成术语
- 术语默认折叠展示
- 术语复制
- 术语删除
- 全宽笔记区
- 浅色主题和基础深色模式

明确不做：

- 词频统计
- 偏好轨迹
- 独立词典页
- 搜索
- 分享
- 登录系统
- 多用户协作
- 重型拖拽编排

## 工程结构

- `apps/web`
- `apps/api`
- `packages/db`

保持单仓，全部放在 `handbook` 目录下。

## 数据模型

采用显式手帐模型。

### `weeks`

- `id`
- `week_start`
- `week_end`
- `week_label`
- `created_at`
- `updated_at`

### `entries`

- `id`
- `week_id`
- `day_slot`
  - `mon`
  - `tue`
  - `wed`
  - `thu`
  - `fri`
  - `weekend`
- `image_url`
- `image_width`
- `image_height`
- `status`
  - `processing`
  - `ready`
  - `failed`
- `error_message`
- `decoration_style`
- `source_type`
  - `paste`
  - `upload`
- `created_at`
- `updated_at`

### `entry_terms`

- `id`
- `entry_id`
- `term`
- `position`
- `source`
  - `gemini`
  - `manual`
- `deleted_at`
- `created_at`

### `week_notes`

- `id`
- `week_id`
- `content`
- `created_at`
- `updated_at`

## API 边界

### `POST /api/entries`

创建图片卡片并立刻返回：

- entry id
- 初始状态 `processing`
- 图片元信息
- 真实图片文件 URL

### `POST /api/entries/:id/process`

触发术语生成。

首版可以由服务端在创建后内部触发，不要求前端单独调用。

### `GET /api/weeks/:weekKey`

返回该周：

- 周元信息
- 全部 entry
- entry terms
- week note

### `PATCH /api/entry-terms/:id`

支持术语删除或未来的人工编辑扩展。

### `PUT /api/weeks/:weekKey/note`

保存该周笔记。

### `GET /api/entries/:id`

前端轮询用，查看处理状态。

## AI Provider Boundary

AI 调用必须与业务层解耦。

支持以下接入形态：

- `mock`
- `openai-compatible`
- `anthropic`
- `gemini`
- `litellm`

业务层只依赖：

- 输入一张图片
- 返回 5-10 个设计术语

不能把某个厂商的 SDK、消息格式或 URL 结构渗透到 entry 处理主链路里。

这一步的第一性原理很简单：

- 模型供应商会变
- 产品主链路不能跟着一起重写
- 先抽边界，后换厂商

## 图片存储边界

首版使用本地文件存储。

- 上传后把图片写入 `ARTIFACTS/runtime/uploads`
- entry 内只保存可访问的图片 URL
- 不再把 Data URL 长期塞进业务记录

先把边界做清楚，后续再替换成对象存储。

## 异步处理流

采用数据库驱动的轻异步流，不上独立队列。

```text
用户粘贴图片
   |
   v
POST /api/entries
   |
   +--> 落库 entry(status=processing)
   |
   +--> 保存图片到本地文件边界
   |
   +--> 调用统一 AI provider 边界
            |
            +--> 成功: 写入 entry_terms, entry.status=ready
            |
            +--> 失败: entry.status=failed + error_message
   |
   v
前端立即显示卡片占位
   |
   v
轮询 entry 状态
   |
   +--> ready: 展示术语
   +--> failed: 展示失败态和重试入口
```

## 前端信息架构

```text
Week View
|
+-- Header
|   +-- week label
|   +-- previous / next
|
+-- Row 1
|   +-- Mon
|   +-- Tue
|   +-- Wed
|
+-- Row 2
|   +-- Thu
|   +-- Fri
|   +-- Weekend
|
+-- Row 3
    +-- Weekly Notes
```

### 卡片状态

- `processing`
  - 图片已出现
  - 显示柔和处理中状态
- `ready`
  - 展示术语摘要和展开交互
- `failed`
  - 展示失败提示
  - 支持重试

## 失败模式

- 图片上传成功但 Gemini 超时
  - 卡片保留，状态变 `failed`
- 供应商配置缺失或格式不兼容
  - provider 层失败，回退到 mock 或进入失败态
- Gemini 返回空结果
  - 进入失败态，不写空术语
- 本地文件写入失败
  - entry 创建直接失败，不写半截数据
- 同一周数据过多
  - 首版只保证正常使用规模，不提前做虚拟化
- 深色模式只换颜色不换层次
  - 会直接破坏产品气质，必须单独验证

## 测试计划

### API

- 创建 entry 成功
- `processing -> ready`
- `processing -> failed`
- week note 保存和读取
- 删除术语后不再返回

### Frontend

- 周切换正确
- 粘贴图片后立即出现卡片
- `processing` 状态显示正常
- 术语 ready 后自动更新
- 术语复制成功
- 删除术语后 UI 更新
- 周笔记保存后刷新可见

### UX / Visual

- 卡片在浅色模式下有真实感但不廉价
- 深色模式仍保留温度
- 标签展开不遮挡主要内容
- 长图和小图都不会打破版面

## 里程碑

### Milestone 1

仓库与代码骨架跑通。

### Milestone 2

周视图、图片上传、卡片显示跑通。

### Milestone 3

Gemini 提词异步流跑通。

### Milestone 4

术语交互与笔记区跑通。

### Milestone 5

视觉打磨与深色模式验收。
