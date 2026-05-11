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
