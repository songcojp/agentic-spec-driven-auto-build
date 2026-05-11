# FEAT-023 Full Lifecycle Delivery Fidelity — 任务

Feature ID: FEAT-023
来源需求: REQ-087 至 REQ-091
状态: in-progress

## 任务列表

### T-023-01 Mainline lifecycle fidelity specs
状态: done
描述: 更新 PRD、requirements、HLD、skills 文档和 Feature index，定义 Delivery Lifecycle OS、Delivery Fidelity Ledger、agent registry、loss taxonomy 和 v2 contract。
验证: `git diff --check`

### T-023-02 using-agent-skills meta skill
状态: done
描述: 新增 `.agents/skills/using-agent-skills`，用于 lifecycle-first workflow、skill 和 agent persona 路由。
验证: `npm run skills:validate`

### T-023-03 Execution and review skill upgrades
状态: done
描述: 更新 `07.execution.dispatch-adapter`、`08.test.run-tests`、`09.review.test-coverage`、`09.review.evidence-completeness`、`09.review.journey-closure`，要求行为义务、handoff、损失和独立审查证据。
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
范围: `docs/zh-CN/PRD.md`, `docs/zh-CN/requirements.md`, `docs/zh-CN/hld.md`, `docs/features/README.md`, `docs/features/feat-023-full-lifecycle-delivery-fidelity/*`
验证: `git diff --check`
完成标准: `REQ-092` 进入主线追踪矩阵和 M9 映射，FEAT-023 明确承载 Spec Artifact Granularity Gate。

### T-023-08 Spec granularity review skill
状态: todo
描述: 新增 `09.review.spec-granularity`，跨 PRD、requirements、HLD、UI Spec 和 Feature Spec 审计颗粒度，输出 `result.specGranularity` 和 review gap 分类。
关联需求: REQ-092, US-023-04
范围: `.agents/skills/09.review.spec-granularity/SKILL.md`, `docs/zh-CN/agentic-spec-standard.md`
验证: `npm run skills:validate`
完成标准: 粗颗粒度文档输出 `review_needed`，并列出 required refinements。

### T-023-09 Generation and consistency skill upgrades
状态: todo
描述: 更新 PRD、requirements、HLD、UI、Feature 生成 Skill 和 spec-consistency，使每层产物在进入下游前检查颗粒度、interaction matrix、state/data contract、Journey Checkpoint 和 evidence plan。
关联需求: REQ-092
范围: `.agents/skills/01.prd.generate`, `.agents/skills/02.requirements.*`, `.agents/skills/03.hld.generate`, `.agents/skills/04.ui.*`, `.agents/skills/05.feature.*`, `.agents/skills/09.review.spec-consistency`
验证: `npm run skills:validate`; `git diff --check`
完成标准: Skill 文档不再允许“文档存在即可”的 ready 判定。

### T-023-10 Rapid FEAT-016 downstream review repair sample
状态: todo
描述: 将 Rapid FEAT-016 纳入 Spec Artifact Granularity Gate golden sample，记录 App Studio、publish RuntimeBinding、Skill binding、Provider、Runtime、Artifact 和 E2E evidence gaps 的审查修复入口。
关联需求: REQ-092, US-023-05
范围: `/home/john/Projects/rapid-agentic-app-framework/docs/features/FEAT-016/*`, `/home/john/Projects/rapid-agentic-app-framework/docs/features/README.md`
验证: Rapid `jq empty docs/features/FEAT-016/spec-state.json`; Rapid `git diff --check`
完成标准: Rapid 不重开 FEAT-001 至 FEAT-015，FEAT-016 在行为义务未全部关闭前保持 review_needed/ready，而不是伪装 completed。
