# FEAT-023 Full Lifecycle Delivery Fidelity — 设计

Feature ID: FEAT-023
来源需求: REQ-087 至 REQ-094
HLD 参考: Delivery Lifecycle OS、Execution Adapter Layer、Status Checker、Review Center、VSCode SpecDrive Extension、Skill Output Contract

## 1. 架构决策

- 保留现有 00-14 skill 编号作为内部兼容层，新增 lifecycle-first 视图作为调度、技能选择和审查的主心智模型。
- 新增 `.agents/skills/use-specdrive-lifecycle` 元技能，负责根据任务跨度选择 Define、Plan、Build、Verify、Review、Ship 生命阶段、项目 skills 和 agent persona。
- `implement-feature` 的 `feature_execution` completed 输出升级为 `skill-contract/v2`，通过 `result.deliveryFidelity` 表达全流程保真账本。
- UI/App 变更必须通过 `result.runtimeEvidence` 证明 app launch、route、用户操作、状态变化、reload 持久化或等价断言、负向/边界路径和 screenshot / trace / log 证据；foundation/stateless 只能通过 `runtimeExemption` 显式豁免。
- Control Plane 不接管 prompt 推理，但必须校验结构性不变式：v2 契约、未关闭损失、独立审查、fixture 旁路、证据 artifact refs 和完成决策。
- Review Center 将 Delivery Fidelity / Runtime Evidence 失败投影为可查询 ReviewItem trigger，使用户能看到损失发生阶段而不是只看到“证据不足”。
- VSCode Execution Workbench 与 Feature Spec Webview 是新增质量证据主界面；Product Console 只保留历史兼容入口，不新增主质量 UI。
- Spec 文档生成 Skill 的完成语义增加 `qualityRepairLoop`：调用方 Skill 选择本次 Quality Review Skill / Repair Owner，owner thread 定义 `qualityLoopPlan` 和可见 subagent dispatch 名称，并在运行时支持时显式调用平台 subagent/Task 工具；Quality Review Subagent 判断 gap，Repair Subagent 只修复范围内且来源可证明的 gap，最多 10 轮。

## 2. Delivery Fidelity Ledger

`result.deliveryFidelity` 包含：

| 字段 | 说明 |
|---|---|
| `sourceIntent` | 进入工作流的产品意图、需求、评审或操作员输入。 |
| `journeys` | 从 source intent 保留下来的用户或系统旅程。 |
| `behaviorObligations` | 可执行、可测试的行为义务。 |
| `handoffs` | Define -> Plan -> Build -> Verify -> Review -> Ship 的交接记录。 |
| `losses` | 一等质量损失：intent、journey、interaction、state、data、task、implementation shortcut、test bypass、review gap、delivery gap。 |
| `evidence` | 结构化证明行，包含 type、mode、assertion、source、covers、status、artifactRefs。 |
| `agentReviews` | 独立 Test/QA/Review/Release agent 或 owner-thread 等价 pass。 |
| `completionDecision` | 完成决策、理由、决策角色和未关闭损失。 |

## 3. Agent Registry

| Agent | 责任 |
|---|---|
| Product Interpreter | 保留用户、边界、成功样例和非目标。 |
| Requirement Critic | 检查需求是否原子、可观察、可测试、可追踪。 |
| Interaction Designer | 将旅程落到 UI/API/state/data 行为。 |
| Task Slicer | 拆成垂直行为义务，标明 fixture 边界。 |
| Implementation Agent | 实现 scoped 变更，不自证完成。 |
| Test Engineer | 设计测试义务、负向样本和命令路径。 |
| Browser QA | 验证真实或等价 runtime interaction。 |
| Code Reviewer | 审查代码、架构、安全、spec drift 和测试缺口。 |
| Release Reviewer | 判断交付证据、PR/merge/cleanup 和未关闭损失。 |

## 4. 校验策略

- `validateSkillOutputContract` 对 `feature_execution` completed 要求 `skill-contract/v2`。
- `quality-gates.ts` 集中实现 Feature Completion、Journey Closure、Delivery Fidelity、Git Delivery 和 Runtime Evidence Gate；`cli-adapter` 只调用集中门禁，不再内嵌分散完成判断。
- `assessDeliveryFidelityGate` 拒绝缺失账本、open P0/P1 loss、open P2 loss、未验证行为义务、断裂 handoff、fixture-only evidence、entry/text-only evidence、缺 artifact refs 和 self-review-only closure。
- `assessRuntimeEvidenceGate` 在 UI/App 变更中拒绝缺少 app launch、journey runtime、state assertion、negative path 或 evidence refs 的 completed 输出。
- Scheduler 将 `quality_evidence_gap`、`test_semantics_gap`、`journey_bypassed_by_fixture` 路由到 `review_needed`。
- Status Checker 在工程命令和 spec alignment 之外接收 completion evidence，证据不足时创建 `risk_review_needed` ReviewItem，并把具体 trigger 写入 body。
- Feature Aggregator 把 Delivery Fidelity Gate 与 acceptance、Journey Closure、Git Delivery、Spec Alignment、required tests 一起作为 Done 条件。

## 4.1 Invocation Manifest 与 Run Workpad

- `InvocationContextManifest` 是 Adapter Prompt 的控制面摘要，只包含 executionId、project / Feature / Task、边界、阻塞、审批、验证要求、输出契约和 AGENTS / memory / constitution 引用，不注入 PRD、HLD 或 Feature Spec 全文。
- 每次 Run 创建 `.autobuild/runs/<executionId>/WORKPAD.md` 与 `workpad.json`，用于记录计划、requirement coverage、acceptance、journey checkpoints、runtime validation、review findings 和 evidence index。
- Workpad 路径作为 raw log refs 暴露给 VSCode Webview 和 ReviewItem，保持 `.autobuild/runs/` 本地证据目录不进入 Git。

## 5. Spec Artifact Granularity Gate

`review-delivery-evidence` 是 Delivery Fidelity 的上游 Plan/ready 门。它不检查“文件是否存在”，而是检查每层文档是否足够向下传递：

| Artifact | Owns | Fails When |
|---|---|---|
| PRD | 用户、目标、业务流程、大模块子能力、成功/失败样例、非目标、优先级。 | 只写模块名、页面名、愿景句或没有失败样例。 |
| requirements | 详细 `US-*`、原子 `REQ-*` / `NFR-*` / `EDGE-*`、`CQ-*`、验收、证据类型和来源追踪。 | 用户故事只有功能区/模块名/愿望句，需求需要解释才能测试、缺故事/证据映射、缺 EDGE 负向路径、缺 CQ 决策，或只写“支持配置”。 |
| HLD | 系统级子系统、数据事实源、状态流、接口/事件、运行拓扑、质量策略和 Feature 拆分指导。 | 只有组件列表、页面列表或技术名。 |
| UI Spec | 页面/视图/弹窗、状态、用户动作、interaction matrix、数据绑定、保存/校验/reload 断言、浏览器验收。 | 只有概念图、截图、入口或 happy path。 |
| Feature Spec | 垂直 journey、Feature-scoped design、parser-compatible tasks、Journey Checkpoint、evidence plan。 | P1 journey 没有 requirement row、design path、task block 或 evidence plan。 |

`docs/agentic-spec/requirements/user-stories-standard.md` 是通用用户故事内容生成主线 artifact。该文件不要求固定 Markdown 结构，而是要求 Must `US-*` 具备 actor、context、goal、reason/value、trigger、main scenario、alternate/negative scenarios、done signal、source refs 和 priority，并要求 `REQ-*` / `NFR-*` / `EDGE-*` 从详细故事派生为原子、可测、可追踪的行为义务。缺少该文件、用户故事过粗、缺少 EDGE/CQ/traceability，或只有形式看似结构化但行为仍不可观察时，requirements 不得进入 HLD、UI Spec、Feature Spec、tasks 或 execution。

`docs/agentic-spec/ui/ui-spec.md` 是通用 UI System Design 主线 artifact。该文件必须明确项目声明的 primary / secondary / compatibility surface、surface inventory、workflow-level interaction matrix、state matrix、data-binding contract、prototype artifact index 和 UI ready gate。缺少该文件、缺少 workflow 矩阵，或只存在概念图 / 截图 / 页面清单时，UI 相关 Feature 不得进入 `ready`。

`result.specGranularity` 必须包含 `decision`、`artifactLevelFindings`、`missingUserScenarios`、`missingBehaviorRequirements`、`missingStateDataContracts`、`missingInteractionMatrix`、`missingAcceptanceEvidence` 和 `requiredRefinements`。失败原因使用 `intent_gap`、`story_gap`、`atomicity_gap`、`behavior_gap`、`traceability_gap`、`clarification_gap`、`conflict_gap`、`architecture_gap`、`interaction_gap`、`state_data_gap`、`task_gap`、`evidence_gap`。

## 5.1 Spec Document Quality Repair Loop

`skill-local references/quality-loop.md` 是所有 Spec 文档生成/更新 Skill 的共享协议。它适用于项目章程、PRD、requirements、HLD、UI Spec、Feature Spec `requirements.md` / `design.md` / `tasks.md`、Feature index、Feature Pool Queue、ADR 和后续向规划或执行传递的 Markdown / JSON 规格产物。

Pattern-First Skill 质量改造是该门禁的上游输入策略。`docs/agentic-spec/zh-CN/skill-refact.md` 定义如何把成熟 Skill 的澄清压缩、默认假设、Open Questions 和 Blocking Open Questions 做法吸收到 `refine-product-intent`、`generate-user-stories` 和 `validate-requirements` 中；它不改变 FEAT-023 的 Delivery Fidelity、Granularity Gate 或 quality repair loop 职责，也不表示当前 runtime 已直接调用外部 system skills。

运行职责：

- Owner thread：由调用方 Skill 选择 `qualityReviewSkill` / `repairOwner`，定义 `qualityLoopPlan`，为每个 review / repair dispatch 设置可见 `displayName` 和 `dispatchDescription`，通过平台 subagent/Task 工具调度 subagent、合并 compact result，并决定继续或退出。
- Quality Review Subagent：读取引用文件，执行调用方选择的质量门，按 `in_scope_repairable`、`in_scope_not_repairable`、`out_of_scope` 分类 gap。
- Repair Subagent：只修改 `qualityLoopPlan.allowedArtifacts`，只处理来源文件足以证明的 `in_scope_repairable` gap，不新增产品意图、架构决策或跨范围同步。

退出规则：

- 最新质量检测 `pass` 才能返回 `completed`。
- 单次文档生成最多 10 轮 review/repair。
- 没有范围内可修复 gap、修复会越过 scope、需要新产品/架构决策、同一 gap 指纹重复或达到 10 轮时，返回 `clarification_needed`、`review_needed`、`risk_review_needed` 或 `blocked`。
- 最新质量检测失败时，不得继续推进到 HLD、UI Spec、Feature split、tasks、ready、planning 或 execution。

## 6. Rapid Review Repair Golden Sample

Rapid 的 FEAT-016 是本门禁的下游样例。审计规则必须能判断：

- App Studio 只展示配置步骤、只高亮第一个步骤、只读字段、只提供 validate/publish 或只检查文字，不能关闭 `REQ-006` 至 `REQ-010` 和 `REQ-068`。
- FEAT-016 需要保持 `review_needed` 或 `ready`，直到 BO-016 behavior matrix 的 App Studio、publish RuntimeBinding、Skill binding、Provider、Runtime、Artifact 和 E2E fidelity 均有独立证据。
- API fixture 和 seed demo 只能是前置条件，不能替代用户操作、状态变更、connector/database truth、reload/revisit 证据。

## 7. 验证策略

- Contract tests 覆盖 v2、deliveryFidelity 缺失、runtimeEvidence 缺失、未关闭损失、fixture-only evidence、self-review-only closure。
- Scheduler tests 覆盖 Delivery Fidelity 失败创建 ReviewItem。
- Orchestration tests 覆盖 Delivery Fidelity Gate 参与 Done 判定。
- Status Checker tests 覆盖 completion evidence 不足时投影 `review_needed`。
- VSCode Webview tests 覆盖质量证据分组、Workpad refs、ReviewItem 可读性和不复用 Product Console。
- Skill validation 覆盖新增元技能和更新后的 Skill 文档。
- Golden samples 覆盖模块名式 PRD、不可测试 requirement、只有组件列表的 HLD、无 interaction matrix UI Spec、只有任务标题的 Feature Spec，以及 Rapid FEAT-016 下游审查样例。
- Spec 文档生成 Skill 覆盖 `qualityRepairLoop`：调用方选择质检/修复 owner、带可见名称的 subagent 质检、带可见名称的 subagent 修复、10 轮上限、无可修复项退出和 scope 越界退出。
