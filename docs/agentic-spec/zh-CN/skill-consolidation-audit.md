# OpenAI Skill 规范全量重构记录

本文记录项目级 Skill 从 97 个阶段编号 dotted slug 全量重构为 17 个 OpenAI-style Skill 的结论。该变更是破坏性迁移：不保留旧 slug alias、兼容映射或运行时 fallback。

## 1. 结论

- `.agents/skills` 只保留 17 个核心 Skill 目录，每个目录名等于 `SKILL.md` frontmatter `name`。
- Skill 名称只使用小写字母、数字和连字符；禁止旧阶段编号、点号、下划线和空格。
- 每个 Skill 都包含 `SKILL.md`、可选 Agent 配置 `agents/openai.yaml`，以及本地 `references/`。
- `.agents/skills` 根目录不再维护全局 旧全局输出合同文件、旧全局质量循环文件 或 `codex.yaml`。
- 运行时、测试、Product Console、IDE 投影和文档统一使用 `skillName`，不再使用 旧 skill slug 字段。

## 2. 新 Skill 目录

| Skill | 合并职责 |
| --- | --- |
| `use-specdrive-lifecycle` | 生命周期路由、专业 agent 职责、Define/Plan/Build/Verify/Review/Ship handoff。 |
| `collect-project-context` | Intake、约束识别、开放问题、项目章程、只读仓库探索和执行前上下文。 |
| `refine-product-intent` | PRD 生成、完善、目标/非目标抽取、用户旅程、验收标准和完整性检查。 |
| `convert-ears-requirements` | PRD、PR/RP、产品 brief 或自然语言输入到 EARS 需求，包含 normalize、ID 和 traceability。 |
| `validate-requirements` | 需求可测试性、冲突、质量、可追踪性和下游消费检查。 |
| `manage-spec-change` | 需求新增、修订、澄清、废弃、影响分析、证据失效和重规划触发。 |
| `design-architecture` | HLD、ADR、模块、数据流、状态流、Adapter/API/事件/文件契约和架构评审。 |
| `design-ui-spec` | UI System Design、全页面清单、交互流程、状态矩阵、静态 HTML prototype 和映射校验。 |
| `decompose-feature-specs` | Feature 拆分、requirements/design/tasks 生成、index/status 更新和 scope 校验。 |
| `plan-feature-execution` | 任务 DAG、依赖、风险、执行计划、adapter 选择、replan 和自动选择下个 Feature。 |
| `implement-feature` | 执行实现、规格引用绑定、事件捕获、运行监控、结果收集和状态更新。 |
| `verify-behavior` | 测试计划、单元/集成测试生成、验收映射、测试运行和失败分析。 |
| `review-code-spec` | 代码 diff、规格一致性、安全、架构漂移和实现风险评审。 |
| `review-delivery-evidence` | 用户旅程闭环、测试覆盖语义、证据完整性和发布准备度评审。 |
| `recover-execution` | checkpoint 捕获/恢复/校验、失败分类、阻塞标记和恢复运行。 |
| `package-evidence` | 证据收集、evidence pack、requirement/feature/change matrix 和审计日志。 |
| `prepare-release` | 发布门、release notes、PR 准备、发布标记和运行归档。 |

## 3. 运行时变更

- `ExecutionAdapterInvocationV1.skillInstruction` 的公开字段为 `skillName`。
- Adapter prompt、RPC skill item path、Scheduler metadata、Product Console action mapping、IDE projection 和测试数据都使用 OpenAI-style skill name。
- 新调度不会解析旧 dotted slug；历史执行记录中的旧字符串只作为历史事实保留，不参与新调用路由。
- 硬编码 action 映射如下：
  - `generate_ears` -> `convert-ears-requirements`
  - `generate_hld` -> `design-architecture`
  - `generate_ui_spec` -> `design-ui-spec`
  - `split_feature_specs` -> `decompose-feature-specs`
  - `feature_execution` -> `implement-feature`
  - clarification/change actions -> `manage-spec-change`
  - auto-run selection -> `plan-feature-execution`

## 4. 校验策略

`scripts/validate-agentic-spec-skills.mjs` 现在执行以下校验：

1. `.agents/skills` 目录必须且只能包含 17 个必备 Skill 目录。
2. 目录名必须匹配 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。
3. 每个目录必须包含 `SKILL.md`。
4. `SKILL.md` frontmatter 只允许 `name` 和 `description`。
5. `name` 必须等于目录名，`description` 必须非空。
6. `.agents/skills` 根目录不得放置全局文件。
7. 如果存在 `agents/openai.yaml`，必须包含 `interface`、`display_name`、`short_description` 和引用 `$<skill-name>` 的 `default_prompt`。

## 5. 迁移规则

- 不保留旧 dotted 名称兼容。
- 不在新 Skill 中增加 `aliasTo`、`replacement` 或旧 slug 表。
- 新代码、新文档、新测试、新 UI 只使用 `skillName`。
- 共享输出合同和质量循环从 `.agents/skills` 根目录移出：机器 schema 由代码维护，Skill 本地 `references/` 说明如何满足调用端 schema。
- 后续新增 Skill 必须先更新标准文档、校验器和运行时调用，再落目录。

## 6. 验证计划

本次重构应执行：

1. `npm run skills:validate`
2. 对每个新 Skill 目录运行 `quick_validate.py`
3. 运行旧 dotted 名称、旧全局合同文件名和旧字段名引用检查。
4. `node --test tests/cli-adapter.test.ts tests/scheduler.test.ts tests/product-console.test.ts tests/codex-rpc-adapter.test.ts tests/gemini-rpc-adapter.test.ts tests/quality-gates.test.ts tests/specdrive-ide.test.ts`
5. `npm test`
6. `git diff --check`

若第 3 项出现旧字符串，必须区分历史记录与活动规范；活动规范、运行时、校验器、测试和 UI 不得继续依赖旧名称。
