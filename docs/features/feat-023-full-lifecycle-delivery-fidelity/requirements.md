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

## 用户故事

- US-023-01：作为 SpecDrive 用户，我希望系统在需求、设计、任务、实现、测试、审查和交付每一步都保留原始意图，而不是最后才发现实现偏差。
- US-023-02：作为执行 agent，我需要知道当前任务应使用哪些 skill、agent persona 和生命周期检查，避免把复杂交付压成单次编码。
- US-023-03：作为 reviewer，我需要看到质量损失发生在哪个 lifecycle handoff、由谁负责、缺什么证据和如何关闭。

## 验收标准

- [ ] 主线 PRD、requirements、HLD 和 skills 文档定义 Delivery Lifecycle OS、Delivery Fidelity Ledger、agent registry、loss taxonomy 和 v2 输出契约。
- [ ] `.agents/skills/using-agent-skills` 作为元技能存在，并能把任务路由到 Define、Plan、Build、Verify、Review、Ship 生命周期。
- [ ] `07.execution.dispatch-adapter`、`08.test.run-tests`、`09.review.test-coverage`、`09.review.evidence-completeness`、`09.review.journey-closure` 明确消费或产出 Delivery Fidelity 证据。
- [ ] `feature_execution` 的 completed 输出必须使用 `skill-contract/v2`，并在 `result.deliveryFidelity` 中提供完整账本。
- [ ] 缺少 Delivery Fidelity、存在 open P0/P1 loss、fixture-only evidence、entry/text-only evidence 或 self-review-only closure 时，Execution Record 进入 `review_needed`。
- [ ] ReviewItem trigger 能区分 `quality_evidence_gap`、`test_semantics_gap` 和 `journey_bypassed_by_fixture`。
- [ ] Feature 状态聚合把 Delivery Fidelity Gate 作为 Done 判定条件之一。

## 非目标

- 不修复任何目标项目的具体业务缺陷。
- 不把上游 `agent-skills` 的命令体系全量照搬为 SpecDrive 的唯一入口。
- 不为旧的浅层 feature execution completed 输出提供兼容豁免。
