# FEAT-023 Full Lifecycle Delivery Fidelity — 任务

Feature ID: FEAT-023
来源需求: REQ-087 至 REQ-094
状态: in-progress

## 任务列表

### T-023-01 Mainline lifecycle fidelity specs
状态: done
描述: 更新 PRD、requirements、HLD、skills 文档和 Feature index，定义 Delivery Lifecycle OS、Delivery Fidelity Ledger、agent registry、loss taxonomy 和 v2 contract。
验证: `git diff --check`

### T-023-02 use-specdrive-lifecycle meta skill
状态: done
描述: 新增 `.agents/skills/use-specdrive-lifecycle`，用于 lifecycle-first workflow、skill 和 agent persona 路由。
验证: `npm run skills:validate`

### T-023-03 Execution and review skill upgrades
状态: done
描述: 更新 `implement-feature`、`verify-behavior`、`review-delivery-evidence`、`review-delivery-evidence`、`review-delivery-evidence`，要求行为义务、handoff、损失和独立审查证据。
验证: `npm run skills:validate`

### T-023-04 Skill contract v2 validation
状态: done
描述: `feature_execution` completed 必须使用 `skill-contract/v2`，并通过 Delivery Fidelity Gate、Journey Closure Gate 和 Git Delivery Gate。
验证: `node --test tests/cli-adapter.test.ts`

### T-023-05 Review routing and aggregation
状态: done
描述: Scheduler / Review Center 支持 `quality_evidence_gap`、`test_semantics_gap`、`journey_bypassed_by_fixture`，Feature Aggregator 将 Delivery Fidelity Gate 纳入 Done 判定。
验证: `node --test tests/scheduler.test.ts tests/orchestration.test.ts`

### T-023-06 Golden negative sample coverage
状态: done
描述: 增加通用反例测试：v1 legacy completed、缺少 fidelity ledger、open P1 loss、fixture-only evidence、self-review-only closure。
验证: `node --test tests/cli-adapter.test.ts tests/scheduler.test.ts`

### T-023-07 Mainline artifact granularity specs
状态: todo
描述: 更新 PRD、requirements、HLD、Feature index 和 FEAT-023，定义 PRD / requirements / HLD / UI Spec / Feature Spec 的逐层颗粒度门禁和 Kiro-style requirements-first 同步规则。
关联需求: REQ-092, US-023-04
范围: `docs/agentic-spec/zh-CN/PRD.md`, `docs/agentic-spec/zh-CN/requirements.md`, `docs/agentic-spec/zh-CN/hld.md`, `docs/agentic-spec/features/README.md`, `docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/*`
验证: `git diff --check`
完成标准: `REQ-092` 进入主线追踪矩阵和 M9 映射，FEAT-023 明确承载 Spec Artifact Granularity Gate。

### T-023-08 Spec granularity review skill
状态: todo
描述: 新增 `review-delivery-evidence`，跨 PRD、requirements、HLD、UI Spec 和 Feature Spec 审计颗粒度，输出 `result.specGranularity` 和 review gap 分类。
关联需求: REQ-092, US-023-04
范围: `.agents/skills/review-delivery-evidence/SKILL.md`, `docs/agentic-spec/zh-CN/agentic-spec-standard.md`
验证: `npm run skills:validate`
完成标准: 粗颗粒度文档输出 `review_needed`，并列出 required refinements。

### T-023-09 Generation and consistency skill upgrades
状态: in-progress
描述: 更新 PRD、requirements、HLD、UI、Feature 生成 Skill 和 spec-consistency，使每层产物在进入下游前检查颗粒度、interaction matrix、state/data contract、Journey Checkpoint、evidence plan 和文档质量修复循环。
关联需求: REQ-092, REQ-094
范围: `.agents/skills/refine-product-intent`, `.agents/skills/convert-ears-requirements and .agents/skills/validate-requirements`, `.agents/skills/design-architecture`, `.agents/skills/design-ui-spec`, `.agents/skills/decompose-feature-specs`, `.agents/skills/review-code-spec`
验证: `npm run skills:validate`; `git diff --check`
完成标准: Skill 文档不再允许“文档存在即可”的 ready 判定。

### T-023-15 Spec document quality repair loop
状态: in-progress
描述: 新增共享 Spec 文档质量检测/修复循环协议，并同步所有核心文档生成 Skill，要求调用方 Skill 选择 Quality Review Skill / Repair Owner，再由 Quality Review Subagent 和 Repair Subagent 在预先声明的 `qualityLoopPlan` 内最多执行 10 轮。
关联需求: REQ-094, US-023-07
范围: `skill-local references/quality-loop.md`, `caller-provided output schema and skill-local references/specdrive-output.md`, `.agents/skills/collect-project-context`, `.agents/skills/refine-product-intent`, `.agents/skills/convert-ears-requirements and .agents/skills/validate-requirements`, `.agents/skills/design-architecture`, `.agents/skills/design-ui-spec`, `.agents/skills/decompose-feature-specs`, `.agents/skills/review-delivery-evidence`, `docs/agentic-spec/zh-CN/*`, `docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/*`
验证: `npm run skills:validate`; `git diff --check`
完成标准: 文档生成 Skill 的结果包含 `qualityRepairLoop` 和调用方选择的 `qualityLoopPlan`；共享 loop 不维护中央路由表；最新质量检测失败时不能返回 completed，也不能继续推进下游。

### T-023-10 Rapid FEAT-016 downstream review repair sample
状态: todo
描述: 将 Rapid FEAT-016 纳入 Spec Artifact Granularity Gate golden sample，记录 App Studio、publish RuntimeBinding、Skill binding、Provider、Runtime、Artifact 和 E2E evidence gaps 的审查修复入口。
关联需求: REQ-092, US-023-05
范围: `/home/john/Projects/rapid-agentic-app-framework/docs/agentic-spec/features/FEAT-016/*`, `/home/john/Projects/rapid-agentic-app-framework/docs/agentic-spec/features/README.md`
验证: Rapid `jq empty docs/agentic-spec/features/FEAT-016/spec-state.json`; Rapid `git diff --check`
完成标准: Rapid 不重开 FEAT-001 至 FEAT-015，FEAT-016 在行为义务未全部关闭前保持 review_needed/ready，而不是伪装 completed。

### T-023-11 Quality gates and runtime evidence
状态: in-progress
描述: 新增集中 `quality-gates`，把 Feature Completion、Journey Closure、Delivery Fidelity、Git Delivery 和 Runtime Evidence 从分散 adapter 逻辑升级为代码门禁。
关联需求: REQ-090, REQ-091, REQ-093, US-023-06
范围: `src/quality-gates.ts`, `src/cli-adapter.ts`, `tests/quality-gates.test.ts`, `tests/cli-adapter.test.ts`
验证: `node --test tests/quality-gates.test.ts tests/cli-adapter.test.ts`
完成标准: UI/App 变更缺 runtime evidence 时不得 completed；foundation/stateless 豁免必须有结构化原因和证据。

### T-023-12 Completion evidence status checking
状态: in-progress
描述: 扩展 Status Checker，加入 completion evidence 输入、runtime check kind 和 ReviewItem trigger 映射。
关联需求: REQ-091, REQ-093
范围: `src/status-checker.ts`, `tests/status-checker.test.ts`
验证: `node --test tests/status-checker.test.ts`
完成标准: requirement coverage、acceptance evidence、journey evidence、runtime evidence、Delivery Fidelity 或 Git delivery 不足时投影 `review_needed`，并创建可读 ReviewItem。

### T-023-13 Invocation manifest and run workpad
状态: in-progress
描述: 新增 `InvocationContextManifest` 与 Run Workpad，Adapter Prompt 只注入控制面 manifest，运行过程记录到 `.autobuild/runs/<executionId>/`。
关联需求: REQ-090, REQ-093
范围: `src/invocation-context.ts`, `src/workpad.ts`, `src/cli-adapter.ts`, `tests/invocation-context.test.ts`, `tests/workpad.test.ts`
验证: `node --test tests/invocation-context.test.ts tests/workpad.test.ts`
完成标准: 每次 CLI Run 生成 Workpad refs，并在 prompt 中包含 execution/project/task/boundary/output refs 而非全文上下文。

### T-023-14 VSCode quality evidence projection
状态: in-progress
描述: 扩展 IDE view model、Execution Workbench 和 Feature Spec Webview，使质量证据从 durable runtime fields 投影并在 VSCode 主界面展示。
关联需求: REQ-084, REQ-093, US-023-06
范围: `src/specdrive-ide.ts`, `apps/vscode-extension/src/types.ts`, `apps/vscode-extension/src/webviews/execution.ts`, `apps/vscode-extension/src/webviews/feature-spec.ts`, `tests/specdrive-ide-webview-boundary.test.ts`, `tests/specdrive-ide.test.ts`
验证: `node --test tests/specdrive-ide-webview-boundary.test.ts tests/specdrive-ide.test.ts`; `npm run ide:build`
完成标准: Execution Workbench / Feature Spec 详情展示 requirement coverage、acceptance evidence、journey evidence、runtime evidence、Delivery Fidelity、Git delivery、Workpad 和 ReviewItem 状态；Product Console 不承载新增主质量 UI。
