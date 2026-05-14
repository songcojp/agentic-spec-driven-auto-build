# 项目级 Skill 说明

本文说明 SpecDrive AutoBuild 当前项目级 Skill 的用途、调用边界和协作关系。项目级 Skill 位于 `.agents/skills/<skill-name>/SKILL.md`，每个目录均遵循 OpenAI / Agent Skills 规范：目录名等于 frontmatter `name`，名称只使用小写字母、数字和连字符，`SKILL.md` 使用 `name` / `description` frontmatter。

## 使用原则

1. 普通问答、简单阅读、小范围文档修正和直接缺陷修复，默认使用普通 Codex 工作流。
2. 只有当用户明确点名 Skill、明确要求项目工作流，或任务需要受治理的 SpecDrive 流程时，才调用项目级 Skill。
3. 提示驱动的规划、拆解、分析、评审、上下文收集或 Git 生命周期编排优先写成 Skill；需要持久状态、结构性约束、状态机、审计记录或可机器查询输出时才写成代码。
4. Skill 产物必须保持可追踪：需求 ID、Feature Spec、任务、证据和交付记录之间要能互相定位。
5. 当仓库事实与规格文档冲突时，先走 `manage-spec-change`，不要绕过规格直接编码。
6. 共享输出 schema 由 Adapter/Runner 代码提供；Skill 只说明如何满足调用端传入的 schema，不在 `.agents/skills` 根目录维护全局合同文件。

## 生命周期视图

| 阶段 | 主要 Skill | 目的 |
| --- | --- | --- |
| 路由 | `use-specdrive-lifecycle` | 选择 Define、Plan、Build、Verify、Review、Ship 生命周期、专业 agent 职责和交付保真要求。 |
| 上下文 | `collect-project-context` | 收集项目、仓库、命令、约束、宪法、依赖和现有实现模式。 |
| 产品意图 | `refine-product-intent` | 整理 PRD、目标、非目标、用户旅程、验收标准和开放问题。 |
| 需求 | `convert-ears-requirements`, `validate-requirements` | 生成 EARS 需求，并检查原子性、可测试性、冲突和追踪。 |
| 变更 | `manage-spec-change` | 治理新增需求、已有需求修订、澄清、废弃、影响分析和重规划入口。 |
| 设计 | `design-architecture`, `design-ui-spec` | 生成 HLD、ADR、数据/状态/Adapter 契约、UI Spec、交互状态和 prototype 映射。 |
| Feature | `decompose-feature-specs`, `plan-feature-execution` | 拆分 Feature Specs，维护 requirements/design/tasks/index/status，并完成执行计划、风险、依赖和可启动性判断。 |
| 实现 | `implement-feature` | 在受控范围内执行代码、测试、配置和必要文档变更，捕获执行事件并更新状态。 |
| 验证 | `verify-behavior` | 生成测试计划，补充测试，运行目标/回归/浏览器/构建/验收验证并分析失败。 |
| 评审 | `review-code-spec`, `review-delivery-evidence` | 检查代码、规格一致性、安全、旅程闭环、测试语义、证据完整性和发布准备度。 |
| 恢复 | `recover-execution` | 分类失败、恢复 checkpoint、标记阻塞、恢复运行并验证恢复结果。 |
| 证据 | `package-evidence` | 收集证据包，更新 requirement/feature/change 矩阵和审计日志。 |
| 发布 | `prepare-release` | 执行发布门、生成 release notes、准备 PR、标记发布和归档运行。 |

## Runtime Contract

Spec Workspace、Feature Pool 或 Runner 调起项目级 Skill 时，通过 `ExecutionAdapterInvocationV1.skillInstruction` 传入任务指令。新代码统一使用 `skillName`，不再接受旧 dotted slug 或 旧 skill slug 字段 fallback。

调用端必须提供 workspace、Feature 级上下文、当前 `specState`、traceability、constraints、输出 schema、`skillInstruction.skillName`、`requestedAction`、`sourcePaths`、`expectedArtifacts` 和可选操作员输入。Skill 不应从数据库反推 Spec 状态。

Skill 输出必须符合调用端传入的 `SkillOutputContractV1` 或 `SkillOutputContractV2`，包含 `contractVersion`、`executionId`、`skillName`、`requestedAction`、`status`、`summary`、`nextAction`、`producedArtifacts`、`traceability` 和 `result`。Feature execution 完成语义使用 `skill-contract/v2`，`implement-feature` 返回 `completed` 时必须提供 Delivery Fidelity、Journey closure、Git delivery 和可复查证据。

## Skill 清单

| Skill | 何时使用 | 主要输出 |
| --- | --- | --- |
| `use-specdrive-lifecycle` | 任务跨越需求、规划、实现、验证、评审或交付，需要生命周期路由时。 | 生命周期计划、agent 分工、必须保留的行为义务和证据。 |
| `collect-project-context` | 需要只读探索仓库事实、命令、约束、依赖、项目章程或实现模式时。 | 有证据的仓库事实、相关路径、命令、风险和未知项。 |
| `refine-product-intent` | PRD、产品 brief 或用户输入需要整理成可下游消费的产品意图时。 | 目标、非目标、用户旅程、验收标准、开放问题和补充建议。 |
| `convert-ears-requirements` | PRD、PR/RP、产品 brief 或自然语言输入需要转为 EARS 需求时。 | `REQ-*`、`NFR-*`、`EDGE-*`、追踪关系、验收标准和开放问题。 |
| `validate-requirements` | Feature Spec 进入 ready 或规划消费需求前。 | 质量结论、冲突、不可测试项、追踪缺口和修复建议。 |
| `manage-spec-change` | 新增、修订、澄清、废弃或重规划需求和规格时。 | 变更分类、受影响文档、更新结果、阻塞项和恢复目标。 |
| `design-architecture` | 需要项目 HLD、ADR、数据/状态/Adapter/API/事件/文件契约时。 | 架构计划、契约、决策记录、风险和需求映射。 |
| `design-ui-spec` | 需要 UI System Design、全页面清单、交互流程、状态矩阵或静态 HTML prototype 时。 | UI System Design、设计 token、页面/状态/交互矩阵、WYSIWYG 静态 HTML、artifact 映射和验证要求。 |
| `decompose-feature-specs` | 需要拆分或维护 Feature `requirements.md`、`design.md`、`tasks.md`、index 或 status 时。 | Feature Specs、任务切片、Journey Checkpoints、索引和 ready 状态建议。 |
| `plan-feature-execution` | 需要依赖解析、风险估计、任务 DAG、执行计划、replan 或自动选择下个 Feature 时。 | 执行计划、可启动性判断、阻塞项、依赖结论和选择理由。 |
| `implement-feature` | 有批准的 Feature Spec、设计约束、允许范围和验证命令，需要执行实现时。 | 代码/测试/配置/文档变更、执行事件、Delivery Fidelity、验证结果和状态更新。 |
| `verify-behavior` | 需要生成测试、运行测试、分析失败或证明行为义务时。 | 命令结果、行为证据、失败分类、覆盖缺口和下一步建议。 |
| `review-code-spec` | 需要代码、规格、安全或实现偏离评审时。 | 阻塞问题、规格漂移、风险、缺失测试和修复建议。 |
| `review-delivery-evidence` | 需要旅程闭环、测试语义、证据完整性或发布准备度评审时。 | closed/not_closed/exempt 结论、证据缺口、open loss 和修复路由。 |
| `recover-execution` | 任务失败、命令失败、状态检查失败或 Runner 报错后。 | 恢复分类、动作、验证证据、剩余重试预算和阻塞结论。 |
| `package-evidence` | 需要汇总交付证据、审计记录或追踪矩阵时。 | Evidence pack、requirement/feature/change matrix 更新和 audit log。 |
| `prepare-release` | 实现、验证和评审完成后，需要发布或 PR closeout 时。 | 发布门结论、release notes、commit/branch/PR/归档证据。 |

## 推荐调用顺序

新产品需求进入系统：

1. `refine-product-intent`
2. `convert-ears-requirements`
3. `validate-requirements`
4. `design-architecture`
5. `design-ui-spec`
6. `decompose-feature-specs`
7. `review-code-spec`
8. `review-delivery-evidence`

单个 Feature 进入实现前规划：

1. `collect-project-context`
2. `plan-feature-execution`
3. `design-architecture`
4. `decompose-feature-specs`
5. `review-code-spec`

已规划任务进入编码交付：

1. `use-specdrive-lifecycle`
2. `implement-feature`
3. `verify-behavior`
4. `recover-execution`，仅当验证失败且允许恢复。
5. `review-code-spec`
6. `review-delivery-evidence`
7. `package-evidence`
8. `prepare-release`

## 维护规则

1. 新增、删除或重命名 Skill 时，同步更新本文、`docs/zh-CN/agentic-spec-standard.md`、校验器、运行时映射和测试。
2. `.agents/skills` 根目录不得放置全局合同文件或旧 `codex.yaml`；共享说明应进入普通 docs 或 Skill 本地 `references/`。
3. 任何新 Skill 都必须通过 `npm run skills:validate` 和 `skill-creator` 的 `quick_validate.py`。
4. 不保留旧 dotted 名称兼容；历史记录可保留旧字符串，但新调度、验证、UI 和测试必须使用 `skillName` 与 OpenAI-style skill name。
