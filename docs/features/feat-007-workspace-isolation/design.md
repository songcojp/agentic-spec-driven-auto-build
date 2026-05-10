# Design: FEAT-007 Workspace Isolation

## Design Summary

Workspace Manager 是写入型任务和共享测试资源的隔离记录边界。Feature 实现的 Git worktree、分支、commit、PR、merge 和 cleanup 由 `07.execution.dispatch-adapter` 执行；Workspace Manager 通过 worktree / branch / PR 证据记录、冲突检测、测试环境隔离记录、合并前检查和清理状态，保证并行写入可追踪、可恢复、可审计。

## Components

| Component | Responsibility |
|---|---|
| Worktree Evidence Recorder | 记录执行 Skill 返回的 Feature / worker worktree、分支、base commit、目标分支、PR、merge 和 cleanup 状态。 |
| Conflict Classifier | 判断文件范围、schema、锁文件、公共配置和共享资源是否冲突。 |
| Test Environment Isolation Recorder | 记录集成测试和端到端测试的环境标识、连接串、容器名和清理策略。 |
| Merge Readiness Checker | 合并前执行冲突检测、Spec Alignment 和必要测试入口。 |
| Rollback Boundary Manager | 记录 diff、base commit 和回滚所需信息。 |
| Cleanup Manager | 由实现技能在交付或回滚后标记并执行安全清理，避免误删用户修改。 |

## Data Ownership

- Owns: WorktreeRecord、ConflictCheckResult、TestEnvironmentIsolationRecord、MergeReadinessResult。
- Reads: RepositoryStatus、TaskGraph、Runner policy、StatusCheckResult。
- Writes: worktree/branch/PR 证据记录、workspace 生命周期审计；不直接替执行 Skill 创建 Feature worktree 或 PR。

## State and Flow

1. Subagent Runtime 请求写入型 workspace。
2. Conflict Classifier 判断是否可并行。
3. Runner 使用允许访问 Git 元数据的 sandbox 启动实现技能；实现技能从 owner workspace 创建 Feature sibling worktree，或记录显式 fallback reason。
4. Workspace Manager 记录执行 Skill 返回的 worktree、路径、分支、PR、merge 和清理状态，并供 UI / Status Checker / Delivery Report 查询。
5. Test Environment Isolation Recorder 将集成测试和端到端测试隔离信息写入 workspace schema 和 Evidence Pack。
6. Status Checker 产出检测结果。
7. Merge Readiness Checker 判断是否允许合并或交付。
8. Cleanup Manager 在交付或回滚后记录执行 Skill 返回的 dirty 检查和 cleanup 状态；clean worktree 由执行 Skill 清理，dirty worktree 保留并标记 `cleanup_blocked`。

## Dependencies

- FEAT-001 提供仓库连接和 Git 状态。
- FEAT-004 提供任务图文件边界，FEAT-008 提供 Runner policy。
- FEAT-009 提供 Spec Alignment 和测试结果。
- FEAT-010 使用回滚边界执行恢复。

## Review and Evidence

- 高风险文件、冲突、未通过测试或回滚动作必须进入 Evidence 和审计。
- 任何清理动作必须记录关联 Feature/Task 和目标路径。
