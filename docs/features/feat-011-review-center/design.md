# Design: FEAT-011 Review Center

## Design Summary

Review Center 是高风险、阻塞、澄清和审批动作的统一入口。它接收来自 Scheduler、Safety Gate、Status Checker 和 Recovery Manager 的 Review Needed，展示上下文，并把审批决策作为受控状态命令回写。

## Components

| Component | Responsibility |
|---|---|
| Review Router | 根据风险、权限、diff、失败、歧义和架构变更创建 ReviewItem。 |
| Review Query Service | 聚合 Spec、Runner policy、diff、测试、Evidence 和推荐动作。 |
| Approval Action Handler | 处理批准、拒绝、要求修改、回滚、拆分、更新 Spec 和标记完成。 |
| Review Rule Writer | 记录项目规则写入或 Spec Evolution 入口。 |
| Approval Audit Recorder | 写入审批主体、时间、原因和结果。 |

## Data Ownership

- Owns: ReviewItem、ApprovalRecord、ReviewDecision。
- Reads: Evidence、Task、Feature、Runner policy、Spec、Diff 摘要、Risk Rules。
- Writes: StateTransition 输入、Audit Timeline、Spec Evolution 入口。

## State and Flow

1. 上游组件触发 Review Needed。
2. Review Router 创建 ReviewItem 和 reason。
3. 审批人打开 Review Center 查看上下文。
4. Approval Action Handler 写入决策。
5. 状态机根据决策继续、阻断、恢复或交付。
6. `approve_continue` 恢复到 ReviewItem 保存的 paused Feature/Task 状态；`request_changes` 回到 planning/ready；`reject` 进入 blocked；`rollback` 进入 failed；`split_task` 回到 planning；`update_spec` 保持 review_needed 并进入变更流程。
7. Feature 级审批决策必须同步 Feature `spec-state.json.resumeTarget`、history 和 nextAction；Product Console 与 VSCode Webview 只通过同一个 ReviewItem / ApprovalRecord 事实源展示和操作。

## Dependencies

- FEAT-004 接收审批后的状态转移。
- FEAT-008 提供 Safety Gate 触发。
- FEAT-009 提供 Evidence 和测试结果。
- FEAT-010 执行恢复类审批动作。
- FEAT-013 提供 UI 外壳。

## Review and Evidence

- 审批缺失时，任务不得进入 Done 或 Delivered。
- 审批记录必须进入 Delivery Report 和 Audit Timeline。
