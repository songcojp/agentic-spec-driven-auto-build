# Design: FEAT-010 Failure Recovery

## Design Summary

Recovery Manager 消费 Status Checker 的失败结果，生成 RecoveryTask，并通过 Skill System 和 Subagent Runtime 执行有限恢复。Failure Fingerprint 和 ForbiddenRetryRecord 防止重复失败循环。

## Components

| Component | Responsibility |
|---|---|
| Recovery Router | 判断失败是否可自动恢复、需要审批或直接 failed。 |
| Recovery Task Builder | 生成恢复任务和 recover-execution 输入。 |
| Failure Fingerprint Registry | 记录失败模式、次数和规范化摘要。 |
| Retry Scheduler | 按 2、4、8 分钟退避安排最多 3 次重试。 |
| Forbidden Retry Guard | 阻止重复执行已失败方案、命令和文件范围。 |
| Recovery Result Handler | 处理自动修复、回滚、拆分、降级、审批、Spec 更新或依赖更新结果。 |

## Data Ownership

- Owns: RecoveryTask、FailureFingerprint、ForbiddenRetryRecord、RetrySchedule。
- Reads: EvidencePack、StatusCheckResult、WorktreeRecord、CLI Skill Directory。
- Writes: Recovery Evidence、Task 状态输入、Review Needed 触发。

## State and Flow

1. Status Checker 输出 failed 或可恢复 blocked。
2. Recovery Router 判断恢复路径。
3. Fingerprint Registry 更新失败指纹。
4. Retry Scheduler 判断是否仍可自动重试。
5. Recovery Task Builder 调用 recover-execution。
6. Recovery Result Handler 写 Evidence 并推进状态机。
7. 恢复成功时恢复到 `resumeTarget` 指向的阶段入口；恢复失败、达到重试上限或需要人工判断时，必须写入 `blocked`、`failed` 或 `review_needed`，并保留失败指纹和下一步建议。

## Dependencies

- FEAT-003 提供 recover-execution。
- FEAT-007 提供回滚边界。
- FEAT-009 提供失败 Evidence。
- FEAT-011 处理人工审批路径。

## Review and Evidence

- 重复失败、危险操作、回滚共享状态和 Spec 更新必须路由 Review Center。
- 每个恢复尝试必须能追踪到失败指纹和上一轮 Evidence。
