# FEAT-023 Full Lifecycle Delivery Fidelity — 需求

Feature ID: FEAT-023
Feature 名称: Full Lifecycle Delivery Fidelity
状态: in-progress
里程碑: M9
依赖: FEAT-002、FEAT-004、FEAT-008、FEAT-011、FEAT-012

## 目标

将 Agentic Spec 从“阶段文档 + 最终质量门”升级为 lifecycle-first 的交付保真系统。系统必须在 Define、Plan、Build、Verify、Review、Ship 每个 handoff 中保留产品意图、用户/系统旅程、行为义务、证据与损失记录，避免质量损失在全流程累积后才被最终 gate 发现。

## 来源需求

| 需求 ID | 描述 | 来源 |
|---|---|---|
| REQ-087 | 以 Delivery Lifecycle OS 组织 Agentic 交付流程 | 用户指令“不要被 agentic spec 束缚，参考技能、agent、工作流优化” |
| REQ-088 | 建立 Delivery Fidelity Ledger 记录意图、行为义务、handoff、损失、证据和完成决策 | 用户指令“全流程每个环节都有质量损失，需要全流程审查” |
| REQ-089 | 使用 lifecycle-first skill/agent routing 选择专用工作流与角色 | 用户指令“参考项目已经是别人实践过的最佳路径” |
| REQ-090 | `feature_execution` completed 输出升级到 `skill-contract/v2` | 用户指令“破坏性升级，保证最佳实践” |
| REQ-091 | 审查与调度必须定位质量损失发生阶段并进入 Review Center | 用户指令“不是仅依靠质量守门” |
| REQ-092 | 建立 Spec Artifact Granularity Gate，阻止粗颗粒度主线文档和 Feature Spec 进入执行 | 用户指令“主线文档和 feature spec 的设计不够详细”；Kiro Requirements-First workflow |
| REQ-093 | 以 VSCode IDE Webview 承载质量证据闭环，Product Console 仅作历史兼容 | 用户指令“Product Console 为历史遗留，UI 应该参考 vscode ide webview” |
| REQ-094 | Spec 文档生成必须由调用方 Skill 选择质检/修复 owner，并执行 subagent 质量检测与修复循环，最多 10 轮，无范围内可修复项时退出 | 用户指令“spec 的所有文档生成操作都需要完成质量检测和修复的循环逻辑”“质检和修复采用 subagent 执行”及“不建议在 loop 中维护这个表，应该调用 loop 的技能来选择” |

## 用户故事

- US-023-01：作为 SpecDrive 用户，我希望系统在需求、设计、任务、实现、测试、审查和交付每一步都保留原始意图，而不是最后才发现实现偏差。
- US-023-02：作为执行 agent，我需要知道当前任务应使用哪些 skill、agent persona 和生命周期检查，避免把复杂交付压成单次编码。
- US-023-03：作为 reviewer，我需要看到质量损失发生在哪个 lifecycle handoff、由谁负责、缺什么证据和如何关闭。
- US-023-04：作为 SpecDrive 用户，我希望 PRD、requirements、HLD、UI Spec 和 Feature Spec 每一层都有明确颗粒度标准，避免只写模块名或页面名就进入实现。
- US-023-05：作为 reviewer，我需要用同一套规则审计 Rapid FEAT-016 这类下游项目，判断 App Studio 等复杂模块为什么仍需 review repair。
- US-023-06：作为 VSCode IDE 用户，我需要在 Execution Workbench 和 Feature Spec 详情中直接看到质量证据、Workpad、Runtime Evidence 和 ReviewItem 缺口，而不是跳到 Product Console 或只看执行摘要。
- US-023-07：作为 Spec 文档生成流程的 owner，我需要由调用方 Skill 选择本次质检 Skill 和修复 owner，再把质量检测和修复委派给 subagent，并在 10 轮内根据 `qualityLoopPlan` 决定通过、继续修复或退出，避免中央路由表、无限修补或越权修改。

## 验收标准

- [ ] 主线 PRD、requirements、HLD 和 skills 文档定义 Delivery Lifecycle OS、Delivery Fidelity Ledger、agent registry、loss taxonomy 和 v2 输出契约。
- [ ] `.agents/skills/using-agent-skills` 作为元技能存在，并能把任务路由到 Define、Plan、Build、Verify、Review、Ship 生命周期。
- [ ] `07.execution.dispatch-adapter`、`08.test.run-tests`、`09.review.test-coverage`、`09.review.evidence-completeness`、`09.review.journey-closure` 明确消费或产出 Delivery Fidelity 证据。
- [ ] `feature_execution` 的 completed 输出必须使用 `skill-contract/v2`，并在 `result.deliveryFidelity` 中提供完整账本。
- [ ] UI/App 变更的 `feature_execution` completed 输出必须提供 `result.runtimeEvidence`；foundation/stateless 变更必须提供 `result.runtimeExemption` 和证据引用。
- [ ] 缺少 Delivery Fidelity、存在 open P0/P1 loss、fixture-only evidence、entry/text-only evidence 或 self-review-only closure 时，Execution Record 进入 `review_needed`。
- [ ] ReviewItem trigger 能区分 `quality_evidence_gap`、`test_semantics_gap` 和 `journey_bypassed_by_fixture`。
- [ ] Feature 状态聚合把 Delivery Fidelity Gate 作为 Done 判定条件之一。
- [ ] Status Checker 接收 completion evidence，并在 requirement coverage、acceptance evidence、journey evidence、runtime evidence、Delivery Fidelity 或 Git delivery 不足时投影 `review_needed`。
- [ ] 每次 Run 创建 `.autobuild/runs/<executionId>/WORKPAD.md` 和 `workpad.json`，作为执行过程、验收、旅程、runtime 验证和证据索引。
- [ ] VSCode Execution Workbench 和 Feature Spec 详情展示质量证据、Workpad、日志、截图/trace、PR/check 和 ReviewItem 状态；Product Console 不新增主质量 UI。
- [ ] 主线 PRD、requirements、HLD、UI Spec 和 Feature Spec 都定义最小颗粒度：PRD 写用户/流程/子能力/样例/非目标；requirements 写 EARS 行为单元；HLD 写系统级事实源/状态/接口/运行/测试；UI Spec 写 interaction matrix；Feature Spec 写垂直 journey、design path、task block、Journey Checkpoint 和 evidence plan。
- [ ] 新增 `09.review.spec-granularity`，跨 PRD -> requirements -> HLD -> UI Spec -> Feature Spec 审计颗粒度，失败时输出 `review_needed` 和 `intent_gap`、`behavior_gap`、`architecture_gap`、`interaction_gap`、`state_data_gap`、`task_gap`、`evidence_gap`。
- [ ] Rapid FEAT-016 作为下游 golden sample，审计能解释 App Studio 旧实现为何失败、FEAT-016 为什么不能伪装 completed，以及每个 BO-016 义务如何关闭。
- [ ] 所有 Spec 文档生成/更新 Skill 返回 `completed` 前都执行 `.agents/skills/SPEC_DOC_QUALITY_LOOP.md`，由调用方 Skill 声明 `qualityLoopPlan`，选择本次 `qualityReviewSkill` / `repairOwner`，再由 Quality Review Subagent 和 Repair Subagent 执行最多 10 轮检测/修复。
- [ ] `.agents/skills/SPEC_DOC_QUALITY_LOOP.md` 不维护产物类型到质检 Skill 的中央路由表；若调用方未声明可用质检 Skill 或修复 owner，必须返回 blocked / review_needed。
- [ ] 质量循环没有 `in_scope_repairable` gap、下一次修复越过 scope、需要新产品/架构决策、重复同一 gap 指纹或达到 10 轮时，必须返回 `clarification_needed`、`review_needed`、`risk_review_needed` 或 `blocked`，不得继续推进下游。
- [ ] 生成 Skill 的 `result.qualityRepairLoop` 必须记录 `qualityLoopPlan`、subagent 使用情况、已用轮次、最终决策、剩余 gap 和退出原因。

## 非目标

- 不修复任何目标项目的具体业务缺陷。
- 不把上游 `agent-skills` 的命令体系全量照搬为 SpecDrive 的唯一入口。
- 不为旧的浅层 feature execution completed 输出提供兼容豁免。
- 不把 Rapid 的 App Studio 单点修复混入 SpecDrive 本体代码；Rapid 只作为下游审查修复样例和验收证据。
