# Agentic Spec 变种规范 v1.0

本文档定义 `agentic-spec-driven-auto-build` 项目适用于 AI Agent 自动开发的变种 Spec 规范。

传统 Spec 流程通常是：

```text
需求 → 设计 → 任务 → 编码 → 测试
```

该流程默认开发者具有连续上下文、隐式经验和稳定执行能力。但 AI Agent 自动开发面对的是长时间执行、上下文压缩、任务中断、多 Agent 并发、执行状态漂移和需求持续变化。因此，本项目采用面向 AI Agent 的 Agentic Spec Protocol。

核心结论：

```text
Agentic Spec = Mainline Spec + Feature Spec + Execution Spec + State Ledger
```

进一步展开：

```text
PRD 定义产品事实
EARS 定义验收事实
HLD 定义架构事实
UI Spec 定义体验事实
Feature Spec 定义开发事实
Execution Spec 定义运行事实
State Ledger 定义恢复事实
Evidence 定义完成事实
```

---

## 1. 目标与适用范围

### 1.1 目标

Agentic Spec Protocol 的目标是让 AI Agent 在可控、可恢复、可审计的工程流程中持续交付代码。

具体目标：

1. 将自然语言需求转换为完整主线文档。
2. 将主线文档转换为可验收、可测试的 EARS 需求。
3. 通过 HLD、UI Spec 和高保真概念图保证所见即所得。
4. 在开发阶段按 Feature 拆分功能级 Spec。
5. 使用任务调度、状态机、checkpoint 和 evidence 支撑长时间自动开发。
6. 通过状态账本解决任务中断后继续、状态漂移和多 Agent 协作冲突。
7. 所有新增、变更、澄清都遵循文档驱动，先更新主线文档，再同步 Feature Spec 和执行任务。

### 1.2 适用范围

本规范适用于：

- AI Agent 自动编码系统。
- 长时间自主开发任务。
- Spec 驱动的软件交付。
- Web Console 与 VSCode Webview 管理 UI。
- 多 Agent 协作开发。
- 任务中断恢复。
- 需求新增、变更、澄清和追踪。

### 1.3 非目标

本规范不试图替代：

- Git 版本管理。
- CI/CD 系统。
- Issue Tracker。
- 完整项目管理系统。
- 企业级复杂权限系统。

---

## 2. 核心原则

### 2.1 主线文档优先

所有产品级事实必须先进入主线文档。开发阶段不得直接以临时对话或 Agent 判断作为最终事实源。

主线文档包括：

```text
docs/zh-CN/PRD.md
docs/zh-CN/requirements.md
docs/zh-CN/hld.md
docs/zh-CN/ui-spec.md
docs/zh-CN/prototype-spec.md
docs/zh-CN/change-management.md
docs/zh-CN/agentic-spec-protocol.md
```

### 2.2 Feature Spec 是开发事实源

开发阶段以 Feature 为最小交付单元。每个 Feature 必须包含：

```text
docs/features/<feature-id>/requirements.md
docs/features/<feature-id>/design.md
docs/features/<feature-id>/tasks.md
docs/features/<feature-id>/spec-state.json
```

Feature Spec 可以细化主线文档，但不能绕过或覆盖主线文档。

### 2.3 Execution Spec 是运行事实源

每次真实执行必须有 Execution Spec，包括 invocation、checkpoint、result、evidence、recovery plan 和状态事件。

推荐目录：

```text
.autobuild/executions/<execution-id>/
  invocation.json
  checkpoint.json
  result.json
  evidence.json
  recovery-plan.json
  logs/
```

### 2.4 状态必须可恢复

状态不能只存在于 Agent 对话、进程内存或 UI 临时状态中。所有关键状态必须落入文件、SQLite 或事件账本。

### 2.5 Agent 自报不可信

Agent 可以提出完成声明，但不能直接推动任务进入 Done。最终状态必须由 Status Checker / State Aggregator 根据 evidence 判定。

### 2.6 变更必须文档驱动

任何新增、变更、澄清、废弃和追踪修复都必须先判断主线文档影响，然后同步 Feature Spec 和执行任务。

### 2.7 多 Agent 通过事实源协作

Agent 之间不得依赖自然语言上下文直接传递。Agent A 的输出必须落入结构化文件，Agent B 从结构化文件恢复上下文。

---

## 3. 三层 Spec 体系

## 3.1 Mainline Spec：主线文档

主线文档是产品和系统的最高事实源。

| 文档 | 职责 | 是否可被 Feature 覆盖 |
|---|---|---:|
| PRD.md | 产品目标、范围、角色、业务流程、模块、非目标 | 否 |
| requirements.md | EARS 格式可测试需求 | 否 |
| hld.md | 项目级架构、边界、数据域、运行拓扑 | 否 |
| ui-spec.md | 页面、交互、状态、空态、错误态、审批态 | 否 |
| prototype-spec.md | 高保真概念图、布局、视觉原则 | 否 |
| change-management.md | 新增、变更、澄清、废弃流程 | 否 |
| agentic-spec-protocol.md | 本规范本身 | 否 |

主线文档的作用：

1. 定义产品事实。
2. 定义验收事实。
3. 定义架构事实。
4. 定义 UI 与体验事实。
5. 约束所有 Feature Spec。
6. 作为 Spec Alignment Check 的最高依据。

## 3.2 Feature Spec：功能级规格

Feature Spec 是进入开发阶段后的最小产品交付单元。

推荐目录：

```text
docs/features/
  README.md
  feature-pool-queue.json

  F001-project-initialization/
    requirements.md
    design.md
    tasks.md
    spec-state.json
    clarification.md
    decisions.md
    evidence.md
```

| 文件 | 职责 |
|---|---|
| requirements.md | 该 Feature 的需求、验收、EARS 映射 |
| design.md | 该 Feature 的低层设计、接口、数据、边界 |
| tasks.md | 可执行任务清单 |
| spec-state.json | 机器可读状态 |
| clarification.md | Feature 层澄清记录 |
| decisions.md | Feature 层设计决策 |
| evidence.md | 测试、diff、审查、执行证据摘要 |

## 3.3 Execution Spec：执行级规格

Execution Spec 是为长时间 Agent 执行新增的一层。

推荐目录：

```text
.autobuild/
  memory/
    project.md
    project.history/

  executions/
    EXE-20260507-001/
      invocation.json
      checkpoint.json
      result.json
      logs/
      evidence.json
      recovery-plan.json

  state-ledger/
    events.jsonl
    snapshots/
```

| 文件 | 职责 |
|---|---|
| invocation.json | 本次执行输入，包括 Feature、Task、Agent、workspace、allowed files |
| checkpoint.json | 可恢复检查点 |
| result.json | 结构化执行结果 |
| evidence.json | 测试、diff、日志、命令、文件变更证据 |
| recovery-plan.json | 失败恢复方案 |
| events.jsonl | 状态事件账本 |
| snapshots/ | 状态快照 |

---

## 4. 标准 Agentic Spec 流程

### 4.1 阶段 A：需求转主线文档

输入可以是：

```text
自然语言需求
旧 PRD
业务文档
竞品分析
已有代码
已有 README
用户追加要求
```

输出必须包括：

```text
PRD.md
requirements.md
hld.md
ui-spec.md
prototype-spec.md
```

规则：

1. 所有需求先进入 PRD。
2. 所有可验收行为必须进入 EARS requirements。
3. 所有架构级约束必须进入 HLD。
4. 所有用户可见交互必须进入 UI Spec。
5. 所见即所得相关内容必须进入 Prototype Spec。
6. 不允许直接从用户需求进入编码。
7. 不允许 Feature Spec 先于主线文档存在，除非是 Spike / Research Feature。

### 4.2 阶段 B：主线文档评审

主线文档必须通过四类门禁。

| Gate | 检查内容 |
|---|---|
| Product Gate | PRD 是否完整、范围是否清晰 |
| Requirement Gate | EARS 是否可测试、可追踪 |
| Architecture Gate | HLD 是否覆盖关键系统边界 |
| UI Gate | UI Spec / 原型是否足以指导实现 |

未通过主线门禁，不得拆分 Feature。

### 4.3 阶段 C：Feature 拆分

Feature 拆分不是简单按页面或代码模块拆，而是按可独立验收的交付能力拆。

```text
一个 Feature = 一个可被用户或系统观察到的能力闭环
```

推荐拆分维度：

| 维度 | 说明 |
|---|---|
| 用户目标 | 用户能完成一个明确目标 |
| 系统能力 | 系统新增一个可复用能力 |
| 状态边界 | 有独立状态机或生命周期 |
| UI 闭环 | 有独立页面 / 面板 / 工作台能力 |
| 执行闭环 | 能独立编码、测试、验收 |
| 风险边界 | 高风险能力单独拆分 |

不推荐：

```text
F001 实现后端
F002 实现前端
F003 写测试
F004 修 bug
```

推荐：

```text
F001 项目初始化闭环
F002 主线文档生成工作流
F003 Feature Spec 拆分工作流
F004 Scheduler Job 队列
F005 Execution Record 与状态账本
F006 中断恢复机制
F007 VSCode Webview 执行工作台
```

### 4.4 阶段 D：Feature Spec 生成

每个 Feature 生成三件套：

```text
requirements.md
design.md
tasks.md
```

外加机器状态：

```text
spec-state.json
```

### 4.5 阶段 E：任务调度与执行

执行阶段必须遵循：

1. 从 Feature Pool Queue 选择 Feature。
2. 校验 Feature Spec 完整性。
3. 校验依赖、锁、工作区和安全策略。
4. 创建 Execution Record。
5. 写入 invocation.json。
6. 获取必要锁。
7. 创建或绑定 worktree。
8. 执行 Agent / CLI / RPC Adapter。
9. 周期写入 checkpoint。
10. 收集 evidence。
11. 写入 result。
12. 由 Status Checker 判定状态。
13. State Aggregator 聚合 Feature / Task / Execution 状态。
14. 写入 State Ledger。
15. 更新 Project Memory 投影。

### 4.6 阶段 F：验证与交付

验证必须基于 evidence，不基于 Agent 自报。

必须检查：

- 是否覆盖 EARS。
- 是否符合 HLD。
- 是否符合 UI Spec。
- 是否只修改 allowed files。
- 是否运行必要测试。
- 是否存在未批准能力。
- 是否有安全风险。
- 是否更新相关文档。

---

## 5. Feature Spec 标准

### 5.1 requirements.md 标准

必须包含：

```text
Feature Goal
Source Trace
Scope
Out of Scope
Linked Mainline Requirements
EARS Requirements
Acceptance Criteria
Edge Cases
UI Mapping
Test Mapping
```

模板：

```markdown
# Feature Requirements: <Feature Name>

## 1. Feature Goal

## 2. Source Trace

| Source | Section | Requirement ID |
|---|---|---|

## 3. Scope

## 4. Out of Scope

## 5. Linked Mainline Requirements

## 6. EARS Requirements

### REQ-F001-001
WHEN <condition>
THE SYSTEM SHALL <behavior>.

## 7. Acceptance Criteria

## 8. Edge Cases

## 9. UI Mapping

## 10. Test Mapping
```

### 5.2 design.md 标准

必须包含：

```text
Design Goal
Component Boundary
Data Model
State Machine
API / Command Contract
File Ownership
Allowed Files
Integration Points
Failure Handling
Security Rules
Recovery Rules
```

模板：

```markdown
# Feature Design: <Feature Name>

## 1. Design Goal

## 2. Component Boundary

## 3. Data Model

## 4. State Machine

## 5. API / Command Contract

## 6. File Ownership

## 7. Allowed Files

## 8. Forbidden Files

## 9. Integration Points

## 10. Failure Handling

## 11. Security Rules

## 12. Recovery Rules
```

### 5.3 tasks.md 标准

必须包含：

```text
Task ID
Requirement Mapping
Design Mapping
Allowed Files
Forbidden Files
Dependencies
Agent Type
Execution Mode
Checkpoint Policy
Definition of Done
Verification Command
```

模板：

```markdown
# Feature Tasks: <Feature Name>

## Task Execution Rules

- 每个任务必须映射到 Requirement ID。
- 每个任务必须有明确 Definition of Done。
- 每个任务必须声明 allowed files。
- 写入任务必须具备 checkpoint policy。
- Agent 自报完成不能直接进入 Done。

## T-F001-001: <Task Name>

- Requirement: REQ-F001-001
- Design: Section 3, Section 5
- Agent Type: coding-agent
- Execution Mode: isolated-worktree
- Dependencies: None
- Allowed Files:
  - src/example.ts
- Forbidden Files:
  - .env
  - secrets/*
- Checkpoint Policy: required

### Objective

### Steps

### Definition of Done

### Verification Command
```

---

## 6. 状态管理规范

### 6.1 状态事实源分层

| 状态类型 | 主事实源 | 用途 |
|---|---|---|
| 产品事实 | PRD / requirements / HLD / UI Spec | 解释为什么做 |
| Feature 流程状态 | `docs/features/<id>/spec-state.json` | 判断 Feature 是否可执行 |
| Feature 队列状态 | `docs/features/feature-pool-queue.json` | 决定下一个 Feature |
| 执行事实 | SQLite Execution Record | 记录真实执行 |
| 恢复事实 | `.autobuild/executions/*/checkpoint.json` | 中断恢复 |
| 历史事实 | `.autobuild/state-ledger/events.jsonl` | 审计和重放 |
| Agent 恢复投影 | `.autobuild/memory/project.md` | 给 CLI / Agent 续跑使用 |

关键规则：

```text
Project Memory 不是事实源，只是恢复投影。
Execution Result 不是最终事实，必须经 Status Checker 判定。
Agent 自报完成不能直接 Done。
看板状态必须来自 spec-state + execution record 聚合。
```

### 6.2 spec-state.json 标准结构

```json
{
  "schemaVersion": "1.0",
  "featureId": "F006",
  "featureName": "中断恢复机制",
  "status": "implementing",
  "executionStatus": "paused",
  "mainlineVersion": {
    "prd": "2.0.0",
    "requirements": "2.0.0",
    "hld": "2.0.0",
    "uiSpec": "1.0.0"
  },
  "specVersion": "1.2.0",
  "requirementsHash": "sha256:...",
  "designHash": "sha256:...",
  "tasksHash": "sha256:...",
  "dependencies": [
    {
      "featureId": "F004",
      "requiredStatus": "done"
    }
  ],
  "currentTask": "T-006-03",
  "taskSummary": {
    "backlog": 0,
    "ready": 2,
    "scheduled": 0,
    "running": 1,
    "checking": 0,
    "reviewNeeded": 0,
    "blocked": 0,
    "failed": 0,
    "done": 5
  },
  "activeExecutionId": "EXE-20260507-001",
  "lastExecutionId": "EXE-20260507-000",
  "lastResult": {
    "status": "paused",
    "reason": "process_interrupted",
    "nextAction": "resume_from_checkpoint"
  },
  "blockedReason": null,
  "reviewNeededReason": null,
  "resumePolicy": {
    "canResume": true,
    "checkpointRequired": true,
    "resumeFromExecutionId": "EXE-20260507-001"
  },
  "updatedAt": "2026-05-07T00:00:00Z"
}
```

### 6.3 Feature 状态机

正常状态：

```text
draft
  ↓
ready
  ↓
planning
  ↓
tasked
  ↓
implementing
  ↓
checking
  ↓
done
  ↓
delivered
```

异常状态：

```text
blocked
failed
review_needed
stale
superseded
paused
```

### 6.4 Task 状态机

正常状态：

```text
backlog
  ↓
ready
  ↓
scheduled
  ↓
running
  ↓
checking
  ↓
done
```

异常状态：

```text
paused
blocked
failed
review_needed
cancelled
stale
```

### 6.5 Execution 状态机

正常状态：

```text
created
  ↓
queued
  ↓
started
  ↓
heartbeat_active
  ↓
completed
  ↓
checked
  ↓
accepted
```

异常状态：

```text
interrupted
heartbeat_lost
timeout
failed
cancelled
approval_needed
recovery_required
```

---

## 7. State Ledger 规范

### 7.1 目标

State Ledger 用于解决状态漂移、恢复困难和审计不完整问题。

所有状态变化必须写入 append-only event。

推荐位置：

```text
.autobuild/state-ledger/events.jsonl
```

### 7.2 事件格式

```json
{
  "eventId": "EVT-20260507-001",
  "type": "TASK_STATUS_CHANGED",
  "featureId": "F006",
  "taskId": "T-006-03",
  "from": "running",
  "to": "paused",
  "reason": "heartbeat_lost",
  "source": "status-checker",
  "executionId": "EXE-20260507-001",
  "createdAt": "2026-05-07T00:00:00Z"
}
```

### 7.3 事件类型

```text
FEATURE_STATUS_CHANGED
TASK_STATUS_CHANGED
EXECUTION_STATUS_CHANGED
CHECKPOINT_WRITTEN
EVIDENCE_COLLECTED
SPEC_CHANGED
SCR_CREATED
LOCK_ACQUIRED
LOCK_RELEASED
APPROVAL_REQUESTED
APPROVAL_RESOLVED
RECOVERY_CREATED
RECOVERY_COMPLETED
```

### 7.4 快照规则

系统应定期从事件账本生成状态快照。

推荐快照位置：

```text
.autobuild/state-ledger/snapshots/<timestamp>.json
```

快照必须可用于：

- 系统重启恢复。
- Webview 快速加载。
- 审计回放。
- 状态一致性检测。

---

## 8. 中断恢复规范

### 8.1 中断分类

| 类型 | 说明 | 是否可自动恢复 |
|---|---|---:|
| process_exit | CLI 进程退出 | 视结果判断 |
| heartbeat_lost | 心跳丢失 | 是 |
| host_restart | 服务重启 | 是 |
| user_pause | 用户暂停 | 是 |
| approval_wait | 等待审批 | 审批后恢复 |
| conflict | Git 冲突 | 通常需人工 |
| spec_changed | 主线文档或 Feature Spec 变更 | 需重新对齐 |
| test_failed | 测试失败 | 可创建 recovery task |
| unsafe_operation | 安全规则阻断 | 需审批 |

### 8.2 Checkpoint 标准

每个可恢复任务都必须写 checkpoint。

```json
{
  "schemaVersion": "1.0",
  "executionId": "EXE-20260507-001",
  "featureId": "F006",
  "taskId": "T-006-03",
  "agentRole": "coding-agent",
  "workspace": {
    "repoPath": "/workspace/project",
    "worktreePath": "/workspace/.worktrees/F006-T003",
    "branch": "autobuild/F006-T003",
    "baseCommit": "abc123",
    "currentCommit": "def456"
  },
  "progress": {
    "phase": "implementation",
    "completedSteps": [
      "created state ledger",
      "implemented checkpoint writer"
    ],
    "currentStep": "add resume loader",
    "remainingSteps": [
      "write tests",
      "run verification"
    ]
  },
  "changedFiles": [
    "src/execution/checkpoint.ts",
    "src/execution/resume.ts"
  ],
  "commandsRun": [
    "pnpm test checkpoint"
  ],
  "lastKnownGood": {
    "commit": "def456",
    "tests": "partial"
  },
  "resumeInstruction": "Resume from currentStep. Do not recreate completed files. Verify changedFiles before editing.",
  "createdAt": "2026-05-07T00:00:00Z"
}
```

### 8.3 Resume 流程

```text
系统启动 / 用户恢复 / Scheduler 恢复
  ↓
扫描 running / interrupted execution
  ↓
读取 Execution Record
  ↓
读取 checkpoint.json
  ↓
校验 workspace / branch / worktree / diff
  ↓
校验 Spec hash 是否变化
  ↓
若 Spec 未变
    → 注入 Project Memory + checkpoint
    → resume execution
  ↓
若 Spec 已变
    → 标记 task stale
    → 触发 Spec Alignment Check
    → 更新 Feature Spec 或创建变更任务
```

### 8.4 Resume 规则

1. 没有 checkpoint 的 `running` 任务不能直接恢复，只能进入 `recovery_required`。
2. `requirementsHash / designHash / tasksHash` 变化后，不允许盲目续跑。
3. Git diff 与 checkpoint.changedFiles 不一致时，必须进入 `review_needed`。
4. 恢复执行前必须重新注入：
   - 主线文档摘要。
   - Feature Spec 摘要。
   - checkpoint。
   - 当前 Git 状态。
   - 最近失败原因。
   - 禁止重复失败模式。

---

## 9. 多 Agent 协作规范

### 9.1 Agent 不直接共享上下文

多 Agent 协作不能靠聊天上下文共享，而要靠文件化事实源共享。

```text
Agent A 输出 → evidence / decisions / execution result
Agent B 输入 ← spec / state / checkpoint / evidence
```

禁止：

```text
让 Agent B 依赖 Agent A 的自然语言记忆
```

必须：

```text
让 Agent B 从结构化文件中恢复上下文
```

### 9.2 Agent 角色分工

| Agent | 输入 | 输出 | 是否可改代码 |
|---|---|---|---:|
| Product Agent | 用户需求、PRD | PRD / clarification | 否 |
| Requirement Agent | PRD | EARS requirements | 否 |
| Architect Agent | PRD / requirements | HLD / design decision | 否或低风险 |
| UI Agent | PRD / HLD | UI Spec / Prototype Spec | 否 |
| Feature Planner Agent | 主线文档 | Feature Spec | 否 |
| Coding Agent | Feature tasks | code diff | 是 |
| Test Agent | Feature requirements / code | test result / evidence | 是，限测试 |
| Review Agent | diff / evidence / spec | review finding | 否 |
| Recovery Agent | failed execution | recovery plan / patch task | 受限 |
| State Agent | execution result | state transition proposal | 否 |

### 9.3 写入锁规范

为避免多 Agent 写冲突，必须引入资源锁。

```json
{
  "lockId": "LOCK-F006-T003",
  "scope": "file",
  "resource": "src/execution/resume.ts",
  "ownerExecutionId": "EXE-20260507-001",
  "mode": "write",
  "expiresAt": "2026-05-07T01:00:00Z"
}
```

锁类型：

| 锁 | 用途 |
|---|---|
| feature-lock | 同一 Feature 串行推进 |
| task-lock | 同一任务只能一个执行实例 |
| file-lock | 同一文件写入串行 |
| worktree-lock | 同一 worktree 独占 |
| approval-lock | 等待审批时阻止自动推进 |
| spec-lock | 主线文档变更时阻止开发执行 |

### 9.4 并行规则

| 场景 | 是否允许并行 |
|---|---:|
| 多个只读分析 Agent | 是 |
| 不同 Feature、不同文件、独立 worktree | 是 |
| 同一 Feature 内无依赖任务 | 谨慎允许 |
| 同一文件写入 | 否 |
| 同一 worktree 写入 | 否 |
| 涉及迁移、权限、安全、支付、认证 | 否 |
| 主线文档变更期间执行相关 Feature | 否 |

### 9.5 Agent 输出契约

每个 Agent 输出必须是结构化结果，不能只输出自然语言。

```json
{
  "schemaVersion": "1.0",
  "agentRole": "coding-agent",
  "executionId": "EXE-20260507-001",
  "featureId": "F006",
  "taskId": "T-006-03",
  "status": "completed",
  "summary": "实现 checkpoint writer 和 resume loader",
  "filesChanged": [
    "src/execution/checkpoint.ts",
    "src/execution/resume.ts"
  ],
  "commandsRun": [
    "pnpm test src/execution"
  ],
  "tests": {
    "status": "passed",
    "passed": 12,
    "failed": 0
  },
  "risks": [],
  "stateTransitionProposal": {
    "task": "checking",
    "reason": "implementation completed and tests passed"
  },
  "nextActions": [
    "run spec alignment check"
  ]
}
```

核心规则：

```text
Agent 只能提出状态迁移建议，不能直接改最终状态。
最终状态由 State Aggregator / Status Checker 判定。
```

---

## 10. 变更、澄清、新增需求规范

### 10.1 变更必须先进入主线文档

开发过程中出现以下情况，必须先判断是否影响主线文档：

```text
新增需求
需求变更
需求澄清
验收变化
UI 变化
架构变化
状态机变化
数据模型变化
```

规则：

| 变更 | 先改主线文档 | 再改 Feature Spec |
|---|---:|---:|
| 新功能 | 是 | 是 |
| 用户流程变化 | 是 | 是 |
| UI 页面变化 | 是 | 是 |
| HLD 架构变化 | 是 | 是 |
| 任务实现细节变化 | 否 | 是 |
| 测试补充 | 否 | 是 |
| 文案澄清 | 视影响 | 视影响 |
| bug fix | 通常否 | 是 |

### 10.2 Spec Change Request 标准

```markdown
# Spec Change Request

## SCR ID
SCR-20260507-001

## Type
ADD / CHANGE / DEPRECATE / CLARIFY / TRACEABILITY_FIX

## Source
用户反馈 / 测试失败 / Agent 发现 / Review finding / 实现阻塞

## Description
描述新增或变更内容。

## Mainline Impact
- PRD:
- requirements.md:
- HLD:
- UI Spec:
- Prototype Spec:

## Feature Impact
- Affected Feature:
- Affected Requirements:
- Affected Design:
- Affected Tasks:

## Execution Impact
- Active Execution:
- Should Pause:
- Should Resume:
- Should Cancel:
- Should Replan:

## Decision
Accepted / Rejected / Needs Clarification

## Follow-up
- 更新主线文档
- 更新 Feature Spec
- 标记 active task stale
- 创建新任务
```

### 10.3 Active Feature 变更处理

当变更影响正在执行的 Feature：

```text
收到变更
  ↓
创建 SCR
  ↓
暂停相关 Feature / Task
  ↓
更新主线文档
  ↓
更新 Feature Spec
  ↓
更新 spec-state.json
  ↓
标记旧 execution stale
  ↓
重新执行 Spec Alignment Check
  ↓
恢复 / 重开 / 新建任务
```

禁止：

```text
一边改 PRD，一边让旧任务继续执行。
```

---

## 11. UI / Webview 管理规范

管理 UI 分为 Web Console 和 VSCode Webview，其中以 VSCode Webview 为日常执行主入口。

```text
Web Console = 系统配置、全局总览、调试入口
VSCode Webview = 日常执行工作台
```

### 11.1 VSCode Webview 第一屏

第一屏必须围绕 Agentic Execution Workbench，而不是普通项目 Dashboard。

必须展示：

```text
当前项目
当前 Feature
当前任务
当前 Execution
自动执行开关
下一步动作
阻塞原因
审批待办
最近失败
恢复入口
Job 队列
Execution Record
Spec 状态
```

### 11.2 Webview 操作必须走受控命令

例如：

```text
start_auto_run
pause_execution
resume_execution
approve_risk
reject_change
create_spec_change_request
sync_feature_spec
run_status_check
run_spec_alignment_check
```

前端不能直接写：

```text
spec-state.json
feature-pool-queue.json
SQLite
Project Memory
Git workspace
```

---

## 12. 受控命令规范

所有有副作用操作都必须经过 Controlled Command Gateway。

流程：

```text
Command
  ↓
Schema Validation
  ↓
Permission / Safety Check
  ↓
Idempotency Check
  ↓
Audit Event
  ↓
Execution
  ↓
State Ledger
```

受控命令必须包含：

```json
{
  "commandId": "CMD-20260507-001",
  "type": "resume_execution",
  "projectId": "project-001",
  "featureId": "F006",
  "taskId": "T-006-03",
  "executionId": "EXE-20260507-001",
  "requestedBy": "user",
  "idempotencyKey": "resume-EXE-20260507-001",
  "createdAt": "2026-05-07T00:00:00Z"
}
```

---

## 13. Evidence 规范

### 13.1 Evidence 目标

Evidence 用于避免 Agent 自报完成和幻觉式完成。

必须收集：

```text
git diff
changed files
test output
lint output
build output
screenshots
logs
status check result
review findings
```

### 13.2 evidence.json 标准

```json
{
  "schemaVersion": "1.0",
  "executionId": "EXE-20260507-001",
  "featureId": "F006",
  "taskId": "T-006-03",
  "git": {
    "baseCommit": "abc123",
    "headCommit": "def456",
    "changedFiles": [
      "src/execution/checkpoint.ts"
    ],
    "diffSummary": "Added checkpoint writer"
  },
  "commands": [
    {
      "command": "pnpm test checkpoint",
      "exitCode": 0,
      "summary": "12 tests passed"
    }
  ],
  "tests": {
    "status": "passed",
    "passed": 12,
    "failed": 0
  },
  "specAlignment": {
    "status": "passed",
    "checkedRequirements": [
      "REQ-F006-001"
    ]
  },
  "risks": []
}
```

---

## 14. Spec Alignment Checker 规范

Spec Alignment Checker 用于防止代码偏离主线文档和 Feature Spec。

必须检查：

```text
diff 是否只改 allowed files
实现是否覆盖 EARS
测试是否覆盖验收
UI 是否符合 UI Spec
状态机是否符合 HLD
是否引入未批准能力
是否修改 forbidden files
是否遗漏文档同步
```

输出：

```json
{
  "schemaVersion": "1.0",
  "featureId": "F006",
  "taskId": "T-006-03",
  "status": "passed",
  "findings": [],
  "requiredActions": []
}
```

---

## 15. 推荐系统模块

为了支撑本规范，系统应优先实现以下模块。

### 15.1 State Ledger

目的：解决状态漂移和恢复困难。

能力：

```text
append-only event writer
state event schema
state snapshot
state replay
state audit
```

### 15.2 State Aggregator

目的：统一判断 Feature / Task / Execution 状态。

输入：

```text
spec-state.json
tasks.md
execution record
execution result
heartbeat
git status
test result
review result
```

输出：

```text
state transition decision
```

### 15.3 Checkpoint Manager

目的：支持任务中断后继续。

能力：

```text
write checkpoint
load checkpoint
validate checkpoint
detect stale checkpoint
resume instruction generation
```

### 15.4 Resume Manager

目的：从 interrupted / heartbeat_lost / paused 状态恢复。

能力：

```text
恢复执行上下文
校验 Spec hash
校验 worktree
校验 changed files
重新注入 Project Memory
生成 resume invocation
```

### 15.5 Agent Lock Manager

目的：解决多 Agent 写冲突。

能力：

```text
file lock
task lock
feature lock
worktree lock
approval lock
lock timeout
lock release
stale lock cleanup
```

### 15.6 Spec Alignment Checker

目的：防止实现偏离文档事实源。

能力：

```text
allowed files 检查
forbidden files 检查
requirements coverage 检查
UI mapping 检查
HLD alignment 检查
test coverage 检查
```

### 15.7 Evidence Collector

目的：收集完成事实。

能力：

```text
git diff 收集
命令输出收集
测试结果收集
日志收集
截图收集
审查结果收集
```

### 15.8 Controlled Command Gateway

目的：统一 Web Console、VSCode Webview、Scheduler 的副作用入口。

能力：

```text
schema validation
permission check
safety check
idempotency check
audit event
command receipt
```

---

## 16. 推荐新增 Feature 拆分

### F001 Agentic Spec Protocol

目标：将本文规范落地成项目协议。

输出：

```text
docs/zh-CN/agentic-spec-protocol.md
docs/zh-CN/spec-state-standard.md
docs/zh-CN/execution-spec-standard.md
```

### F002 State Ledger & State Aggregator

目标：建立可信状态账本和状态聚合器。

任务：

```text
T001 定义 state event schema
T002 实现 append-only event writer
T003 实现状态快照生成
T004 实现 Feature 状态聚合
T005 实现 Task 状态聚合
T006 实现 Execution 状态聚合
T007 接入 Webview 状态展示
```

### F003 Checkpoint & Resume

目标：支持中断恢复。

任务：

```text
T001 定义 checkpoint schema
T002 执行中定期写 checkpoint
T003 中断时冻结 checkpoint
T004 恢复时校验 Spec hash
T005 恢复时校验 Git worktree
T006 生成 resume invocation
T007 Webview 提供恢复按钮
```

### F004 Multi-Agent Coordination

目标：规范多 Agent 并行和协作。

任务：

```text
T001 定义 agent role contract
T002 实现 lock manager
T003 实现 allowed files 检查
T004 实现 worktree binding
T005 实现并行调度规则
T006 实现冲突检测
T007 实现 stale lock 清理
```

### F005 Spec Change Request Workflow

目标：把新增、变更、澄清流程产品化。

任务：

```text
T001 定义 SCR schema
T002 Webview 创建 SCR
T003 SCR 影响分析
T004 主线文档同步检查
T005 Feature Spec 同步检查
T006 active task stale 标记
T007 变更后恢复或重排任务
```

### F006 VSCode Execution Workbench

目标：以 Webview 为主操作入口。

任务：

```text
T001 设计 Webview 信息架构
T002 当前执行卡片
T003 Job 队列面板
T004 阻塞 / 审批面板
T005 Resume 操作入口
T006 Spec 状态面板
T007 Evidence 查看器
T008 Controlled Command 调用
```

---

## 17. 推荐落地顺序

不要先优化 Agent 能力，先把状态和恢复打牢。

```text
第一优先级：State Ledger
  ↓
第二优先级：Checkpoint / Resume
  ↓
第三优先级：Spec Alignment Checker
  ↓
第四优先级：Agent Lock Manager
  ↓
第五优先级：SCR 变更工作流
  ↓
第六优先级：VSCode Webview Execution Workbench
```

原因：

```text
没有可信状态，就无法判断任务是否完成。
没有 checkpoint，就无法长时间自动执行。
没有锁，就无法多 Agent 协作。
没有 Spec Alignment，就无法防止实现偏离。
没有 SCR，就无法管理开发中不断出现的新增和变更。
```

---

## 18. 最终定义

Agentic Spec 不是传统 Spec 的简单改名，而是为 AI Agent 自动开发增加了运行事实、恢复事实、协作事实和完成事实。

最终公式：

```text
Agentic Spec = Mainline Spec + Feature Spec + Execution Spec + State Ledger
```

其中：

```text
Mainline Spec 负责定义产品、验收、架构和体验。
Feature Spec 负责定义功能级开发边界。
Execution Spec 负责定义每次真实执行。
State Ledger 负责定义状态历史和恢复事实。
Evidence 负责证明任务真的完成。
```

`agentic-spec-driven-auto-build` 后续完善的重点不是继续增强提示词，而是把状态、恢复、协作、证据和变更做成一套强约束工程系统。
