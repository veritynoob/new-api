# API Key 审批流程 — 变更设计

## 概述

在现有 API Key 创建流程中增加申请审批机制：用户创建 Key 后默认为"待审核"状态，须经超级管理员审核通过后方可生效使用。同时新增"系统"和"团队"两个必填字段。

---

## 一、数据库变更

### 1.1 Token 表新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `system` | `varchar(255)` | 使用该 Key 的系统，自由文本，必填 |
| `team` | `varchar(255)` | 使用该 Key 的团队名称，自由文本，必填 |
| `review_comment` | `varchar(512)` | 驳回原因，选填，仅驳回时写入 |

### 1.2 新增状态常量

在 `common/constants.go` 新增：

- `TokenStatusPending  = 5` — 待审核
- `TokenStatusRejected = 6` — 已驳回

### 1.3 迁移说明

- 现有 Key 的 `system`、`team` 字段使用空字符串作为默认值
- 现有 Key 的 `status` 保持不变（均为 1）

---

## 二、API 变更

### 2.1 创建 Key — 修改 `POST /api/token/`

**请求新增字段：**

```json
{
  "name": "xxx",
  "system": "xxx (必填)",
  "team": "xxx (必填)",
  "remain_quota": 100,
  ...
}
```

**行为变更：**
- `system` 和 `team` 为必填字段，缺失时返回 400
- 创建后 `status` 设为 `5`（待审核），而非 `1`（启用）
- 创建成功后不发送通知（审批结果出来后才通知）

### 2.2 新增审批接口 `PUT /api/token/:id/review`

- **权限：** `RootAuth()` 中间件，仅超级管理员（role=100）
- **请求体：**

```json
{
  "status": 1,
  "comment": "驳回原因（选填）"
}
```

- `status` 仅允许 `1`（通过）或 `6`（驳回）
- 校验 Key 当前状态必须为 `5`（待审核），否则拒绝
- 通过：status 5 → 1，调用 `NotifyUser()` 通知创建者"申请已通过"
- 驳回：status 5 → 6，保存 `review_comment`，调用 `NotifyUser()` 通知创建者"申请已驳回"（含驳回原因如有）

### 2.3 ValidateUserToken 拦截

在 `model/token.go` 的 `ValidateUserToken` 函数中，增加对状态 `5`（待审核）和 `6`（已驳回）的拦截，返回相应错误信息。

### 2.4 查询接口

复用现有 `GET /api/token/`，该接口已支持 `?status=5` 过滤参数，用于审批页面获取待审核列表。超管可查看所有用户的待审核 Key（需确认当前接口是否需要扩展权限）。

---

## 三、通知变更

### 3.1 新增通知类型

在 `dto/notify.go` 新增：

```go
NotifyTypeTokenReviewed = "token_reviewed"
```

### 3.2 通知发送

审批后调用 `service.NotifyUser()`，传入 Key 创建者的 userId 和 userSetting，通知内容：

- **通过：** 标题"API Key 申请已通过"，内容包含 Key 名称
- **驳回：** 标题"API Key 申请已驳回"，内容包含 Key 名称和驳回原因（如有）

通知走用户已配置的通知渠道（邮件、Webhook、Bark、Gotify）。

---

## 四、前端变更

### 4.1 创建 Key 表单（`ApiKeysMutateDrawer`）

新增两个必填字段：
- **系统** — `Input` 文本输入
- **团队** — `Input` 文本输入

表单提交时携带 `system`、`team` 字段。

### 4.2 Key 列表（`ApiKeysTable`）

- 状态列新增"待审核"（pending / 黄色标签）和"已驳回"（rejected / 红色标签）
- 新增"系统"列和"团队"列

### 4.3 超管审批页面（新增）

- **路由：** `/_authenticated/admin/keys/review/`
- **侧边栏：** Admin 区域下新增"Key 审批"菜单项（仅 role=100 可见）
- **列表：** 展示所有待审核 Key，列包含：申请人、Key 名称、系统、团队、模型限制、申请时间
- **操作：**
  - "通过"按钮 — 调用审批接口 status=1
  - "驳回"按钮 — 弹出 Dialog，选填驳回原因，调用审批接口 status=6
- **Tab/筛选：** 支持查看"待审核"和"已驳回"两种状态的 Key

### 4.4 i18n

新增以下翻译 key（en/zh/fr/ru/ja/vi）：

- 状态：`Pending` / `Rejected`
- 表单：`System` / `Team` / `Select the system using this key` / `Select the team using this key`
- 审批：`Key Review` / `Approve` / `Reject` / `Rejection reason (optional)`
- 通知：`API Key application approved` / `API Key application rejected`

---

## 五、Bug 修复与补充变更

### 5.1 审批列表无法查看所有用户的待审核 Key

**问题：** `GET /api/token/` 仅返回当前用户的 Token，审批页面无法查看其他用户的待审核 Key。

**修复：**
- `controller/token.go` `GetAllTokens`：新增 `?status=` 查询参数支持；当 role=100 的超级管理员请求时，返回所有用户匹配该状态的 Token
- `model/token.go`：新增 `GetAllTokensByStatus`（跨用户查询）和 `GetUserTokensByStatus`（单用户查询）函数

### 5.2 更新 Key 时 System/Team 字段丢失

**问题：** `UpdateToken` 在非 status_only 模式下未将 `System` 和 `Team` 从请求复制到 `cleanToken`，导致更新后这两个字段被清空。

**修复：** `controller/token.go` `UpdateToken`：在非 status_only 分支中添加 `cleanToken.System = token.System` 和 `cleanToken.Team = token.Team`。

### 5.3 审批页面前端路由未注册

**问题：** `routes/_authenticated/admin/keys/review/index.tsx` 未导出 `Route` 对象，TanStack Router 代码生成器无法识别该路由，页面返回 404。

**修复：** 添加 `createFileRoute` Route 导出，并增加 `beforeLoad` 守卫：非超级管理员（role < 100）重定向至 `/403`。

### 5.4 审批列表前端使用客户端筛选

**问题：** 审批页面获取全部 Key（最多 100 条）后在客户端按 status 过滤，而非将 `?status=` 传给 API。

**修复：**
- `types.ts`：`GetApiKeysParams` 新增 `status` 字段
- `api.ts`：`getApiKeys` 支持传递 `status` 查询参数
- `api-keys-review-table.tsx`：直接传 `status: statusFilter` 给 API，不再客户端过滤

### 5.5 更新 Key 后状态变为待审核

**需求：** 用户更新 Key 时，Key 状态应变为"待审核"（pending=5），暂时不可用直到管理员重新审批。

**后端变更：** `controller/token.go` `UpdateToken`：非 status_only 更新时，`cleanToken.Status = common.TokenStatusPending`。

**前端变更：**
- `api-keys-mutate-drawer.tsx`：更新模式下提交前弹出确认对话框：
  - 标题：`Confirm Update`
  - 描述：`Updating this API key will set it to pending status and make it temporarily unavailable until re-approved.`
  - 确认按钮：`Yes, update`
- `en.json` / `zh.json`：新增上述 i18n key

### 5.6 新建 Key 时通知超级管理员

**需求：** 普通用户创建 API Key（pending 状态）后，超级管理员应收

到通知。

**实现：** `controller/token.go` `AddToken`：Token 创建成功后异步调用 `service.NotifyRootUser`，通知内容包含申请人用户名和 Key 名称。

**NotifyRootUser 安全修复：** `service/user_notify.go`：增加 nil 检查，`GetRootUser()` 返回 nil 时记录日志而非 panic。

### 5.7 审批列表缺少申请人列

**问题：** 审批列表未显示 Key 的申请人信息。

**修复：**
- `model/token.go` `Token` 结构体：新增 `UserName` 字段（`gorm:"-"` — 不持久化，仅用于 API 响应）
- `GetAllTokensByStatus`：批量查询 users 表获取用户名，填充到 Token 的 `UserName` 字段
- 前端 `types.ts`：新增 `user_name` 字段
- `api-keys-review-table.tsx`：新增"申请人"列，显示 `user_name`（降级为 `user_id`）

### 5.8 审批列表新增"已通过"筛选

**需求：** 管理员除了查看待审核和已驳回的 Key，还需要查看已通过的 Key。

**修复：** `api-keys-review-table.tsx`：筛选栏新增"Approved"按钮（status=1），与 Pending（status=5）、Rejected（status=6）并列。已通过的 Key 不显示审批操作按钮。
