# Agentic Spec Standard v1.2

> 面向 AI Agent 自动化软件开发的通用规范。
> 目标：让 AI Agent 的需求、设计、任务、执行、审批、恢复、审计、验收全过程具备标准化、可追踪、可恢复、可治理能力。
> 本规范同时区分：
>
> 1. **Agentic Spec Standard**：通用标准。
> 2. **agentic-spec-driven-auto-build**：基于该标准实现的管理、调度、可视化产品。

---

# 0. v1.2 修订摘要

相对 v1.0，v1.2 主要优化如下：

## 0.1 标准与产品解耦

v1.0 中混入了较多 `agentic-spec-driven-auto-build` 项目自身的产品功能。
v1.2 明确拆分为：

```text
Agentic Spec Standard
  = 通用标准、目录、状态机、审计模型、Adapter Contract、Checkpoint 恢复机制、Skill Contract

agentic-spec-driven-auto-build
  = 实现 / 管理 / 可视化 / 调度 Agentic Spec 的具体产品
```

标准不绑定任何具体 Web Console、看板、VSCode Webview、Codex CLI 或自研调度系统。
这些能力属于实现层或产品层。

---

## 0.2 High-fidelity Concept / Prototype 修正

v1.2 将 `High-fidelity Concept` 明确升级为：

```text
High-fidelity Concept / Prototype
```

并规定必须包含以下至少一种产物：

```text
PNG 高保真原型图
或
HTML 高保真交互原型
```

不能只写文字说明。

---

## 0.3 输入输出简化

v1.2 不再要求 Agent / Adapter / Skill 输入输出中重复携带大量文档正文。

原因是：

```text
Execution Adapter 集成的 CLI / RPC / MCP / Sandbox / Codex 等工具，本身通常具备上下文读取、文件访问、会话状态和工具调用能力。
```

因此标准改为：

```text
传引用，不传全文；
传约束，不传冗余；
传状态，不传重复上下文；
传 Evidence，不传不可验证叙述。
```

---

## 0.4 补齐完整过程链路

v1.0 的阶段设计较完整，但状态流转没有完全串联。
v1.2 新增：

1. 端到端过程链路。
2. 主流程状态流。
3. 澄清流程。
4. 新增需求流程。
5. 变更流程。
6. 执行失败恢复流程。
7. 审批中断恢复流程。
8. Spec 与代码不一致修复流程。
9. 任务重规划流程。

---

## 0.5 Subagent 与 Skill 对齐 OpenAI 标准

v1.2 对 Subagent 和 Skill 做标准化约束：

1. Subagent 应遵循 Agent / Tool / Handoff / Guardrail / Session / Run State 模型。
2. Skill 应作为可复用工作流，而不是项目专用提示词碎片。
3. Skill 不应内置 `agentic-spec-driven-auto-build` 的产品逻辑。
4. Skill 必须具备规范命名、触发条件、输入引用、输出契约和验收规则。

OpenAI Agents SDK 中，Agent 是由 instructions、tools、handoffs、guardrails、structured outputs 等能力配置出来的运行单元；handoffs 用于将任务委派给专门 Agent；tools 用于让 Agent 执行外部动作；RunState 可用于中断后恢复运行。Agentic Spec v1.2 的 Agent / Subagent / Adapter 设计应兼容这类模型。([openai.github.io][1])

OpenAI 对 Skills 的定义是可复用、可共享的工作流，可包含 instructions、examples、code，并遵循 Agent Skills open standard；因此 Agentic Spec 的 Skill 也应保持通用、可迁移、可组合，而不是绑定某一个具体产品。([OpenAI Help Center][2])

---

# 1. 规范定位

## 1.1 名称

```text
Agentic Spec Standard v1.2
```

中文名称：

```text
Agentic Spec 标准规范 v1.2
```

---

## 1.2 适用范围

本规范适用于：

1. AI Agent 自动软件开发。
2. Spec-driven Coding。
3. Spec-driven Auto-build。
4. 多 Agent 协同开发。
5. 长时间运行任务。
6. 可恢复 Agent 执行。
7. 可审批 Agent 工作流。
8. 可审计 Agent 工程过程。
9. CLI / RPC / MCP / Sandbox / Codex 等执行工具的统一编排。
10. 基于 Spec 的自动化开发管理平台。

---

## 1.3 不适用范围

Agentic Spec Standard 不规定：

1. 必须使用哪种前端框架。
2. 必须使用哪种后端框架。
3. 必须使用哪种数据库。
4. 必须使用 Codex CLI。
5. 必须使用 OpenAI Agents SDK。
6. 必须实现 Web Console。
7. 必须实现 VSCode 插件。
8. 必须实现看板。
9. 必须采用某种特定 UI。
10. 必须使用某个具体产品形态。

这些属于实现层选择。

---

# 2. 标准分层

Agentic Spec v1.2 分为五层。

```text
L1. Spec Layer
L2. State Layer
L3. Execution Layer
L4. Governance Layer
L5. Product Implementation Layer
```

---

## 2.1 L1：Spec Layer

负责定义事实源。

包括：

1. Project Intake。
2. PRD。
3. EARS Requirements。
4. HLD。
5. UI Specification。
6. High-fidelity Concept / Prototype。
7. Feature Spec。
8. Task Spec。
9. Change Request。
10. ADR。

---

## 2.2 L2：State Layer

负责定义所有对象的状态。

包括：

1. Document State。
2. Requirement State。
3. Feature State。
4. Task State。
5. Agent Run State。
6. Adapter Run State。
7. Approval State。
8. Change State。
9. Checkpoint State。
10. Release State。

---

## 2.3 L3：Execution Layer

负责执行任务。

包括：

1. Agent。
2. Subagent。
3. Skill。
4. Execution Adapter。
5. CLI Adapter。
6. RPC Adapter。
7. MCP Adapter。
8. Sandbox Adapter。
9. Codex Adapter。
10. Test Runner。
11. Evidence Collector。

---

## 2.4 L4：Governance Layer

负责治理。

包括：

1. 审批。
2. 变更控制。
3. 权限控制。
4. 审计日志。
5. Evidence Pack。
6. Traceability Matrix。
7. Checkpoint。
8. Recovery。
9. Human-in-the-loop。
10. Policy / Guardrail。

---

## 2.5 L5：Product Implementation Layer

负责具体产品实现。

例如：

```text
agentic-spec-driven-auto-build
```

它可以实现：

1. 标准管理。
2. Spec 管理。
3. Feature 管理。
4. Agent Run 调度。
5. 看板。
6. 审批台。
7. 审计台。
8. 可视化状态流。
9. Web Console。
10. VSCode / IDE 插件。

但这些不是 Agentic Spec Standard 的一部分。

---

# 3. 核心原则

## P1. Spec 是事实源

Agent 不应仅凭聊天上下文执行开发。

所有正式开发必须基于：

```text
Approved Spec
```

包括：

1. Approved PRD。
2. Approved Requirements。
3. Approved HLD。
4. Approved UI Spec。
5. Approved Prototype。
6. Approved Feature Spec。
7. Approved Task Spec。

---

## P2. 先治理，后执行

任何影响范围、需求、设计、验收、任务边界的变化，必须先进入治理流程。

```text
Change / Clarification / New Requirement
  → Impact Analysis
  → Spec Update
  → Task Re-plan
  → Execution
```

---

## P3. Spec 约束，Skill 执行，Adapter 落地

```text
Spec = 定义目标、边界、验收
Skill = 定义可复用工作流
Agent = 推理、规划、调用 Skill
Adapter = 连接真实执行环境
Evidence = 证明结果
```

---

## P4. 传引用，不传全文

Agentic Spec v1.2 的输入输出应尽量使用引用。

推荐：

```yaml
spec_refs:
  - specs/mainline/01-prd.md#8.1
  - specs/features/FEAT-001/requirements.md
```

不推荐：

```yaml
full_prd_content: "..."
full_hld_content: "..."
full_ui_spec_content: "..."
```

---

## P5. 所有执行必须可恢复

每个长时间任务必须具备：

1. Run ID。
2. State。
3. Checkpoint。
4. Resume Point。
5. Adapter State。
6. Evidence。
7. Audit Log。

---

## P6. 所有完成必须可证明

不能只说“已完成”。

必须证明：

1. 改了什么。
2. 为什么改。
3. 根据哪个 Spec 改。
4. 执行了哪些命令。
5. 通过了哪些测试。
6. 未通过哪些测试。
7. 是否满足验收标准。
8. 是否产生风险。
9. 是否需要人工审批。

---

# 4. 核心对象模型

## 4.1 Project

项目是 Agentic Spec 的顶层对象。

```yaml
project:
  id: PROJ-001
  name: example-project
  spec_version: "1.2"
  status: active
```

---

## 4.2 Spec

Spec 是规范化文档单元。

```yaml
spec:
  id: SPEC-PRD-001
  type: prd
  path: specs/mainline/01-prd.md
  status: approved
  version: "1.0.0"
```

---

## 4.3 Requirement

Requirement 是可测试需求单元。

```yaml
requirement:
  id: REQ-001
  type: functional
  priority: must
  status: approved
  source: PRD-8.1
```

---

## 4.4 Feature

Feature 是可独立实现和验收的功能单元。

```yaml
feature:
  id: FEAT-001
  name: Project Intake Generator
  status: ready
  requirements:
    - REQ-001
    - REQ-002
```

---

## 4.5 Task

Task 是 Agent 可执行的最小工作单元。

```yaml
task:
  id: TASK-001
  feature_id: FEAT-001
  status: ready
  adapter: codex-cli
```

---

## 4.6 Agent Run

Agent Run 是一次 Agent 执行实例。

```yaml
agent_run:
  id: RUN-20260509-0001
  task_id: TASK-001
  status: executing
  checkpoint_policy: enabled
```

---

## 4.7 Adapter Run

Adapter Run 是某个执行适配器的一次调用。

```yaml
adapter_run:
  id: ADP-20260509-0001
  run_id: RUN-20260509-0001
  adapter_type: cli
  status: running
```

---

## 4.8 Evidence Pack

Evidence Pack 是验收和审计证据包。

```yaml
evidence:
  id: EVD-20260509-0001
  run_id: RUN-20260509-0001
  feature_id: FEAT-001
  status: complete
```

---

# 5. 标准目录结构

## 5.1 通用标准目录

```text
.
├── specs/
│   ├── mainline/
│   │   ├── 00-project-intake.md
│   │   ├── 01-prd.md
│   │   ├── 02-ears-requirements.md
│   │   ├── 03-hld.md
│   │   ├── 04-ui-specification.md
│   │   ├── 05-high-fidelity-prototype/
│   │   │   ├── prototype-index.md
│   │   │   ├── screens/
│   │   │   │   ├── dashboard.png
│   │   │   │   ├── feature-detail.png
│   │   │   │   └── run-detail.png
│   │   │   └── html/
│   │   │       ├── index.html
│   │   │       ├── assets/
│   │   │       └── README.md
│   │   └── 06-feature-index.md
│   │
│   ├── features/
│   │   └── FEAT-001-example-feature/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       ├── tasks.md
│   │       ├── status.yaml
│   │       └── evidence.md
│   │
│   ├── changes/
│   │   └── CR-001.md
│   │
│   ├── adr/
│   │   └── ADR-001-example.md
│   │
│   └── traceability/
│       ├── requirement-matrix.md
│       ├── feature-matrix.md
│       └── change-matrix.md
│
├── runs/
│   └── RUN-20260509-0001/
│       ├── run.yaml
│       ├── checkpoint.yaml
│       ├── adapter-events.jsonl
│       ├── audit.jsonl
│       ├── evidence.md
│       └── result.yaml
│
└── .agentic-spec/
    ├── config.yaml
    ├── workflow.yaml
    ├── skills.yaml
    ├── adapters.yaml
    ├── policies.yaml
    └── state.yaml
```

---

## 5.2 标准目录不得包含产品专属功能

标准目录中不应出现：

```text
web-console/
kanban/
vscode-webview/
admin-dashboard/
billing/
user-management/
```

这些属于具体产品实现，不属于标准。

---

# 6. 主线文档规范

## 6.1 Project Intake

文件：

```text
specs/mainline/00-project-intake.md
```

用途：

收集项目目标、背景、边界、技术约束和初始问题。

必须包含：

```markdown
# Project Intake

## 1. Project Name

## 2. Product Vision

## 3. Problem Statement

## 4. Target Users

## 5. Business Goals

## 6. Technical Goals

## 7. Constraints

## 8. Existing Assets

## 9. Out of Scope

## 10. Open Questions
```

---

## 6.2 PRD

文件：

```text
specs/mainline/01-prd.md
```

必须包含：

```markdown
# Product Requirements Document

## 1. Overview

## 2. Background

## 3. Goals

## 4. Non-goals

## 5. Target Users

## 6. User Scenarios

## 7. User Journeys

## 8. Functional Requirements

## 9. Non-functional Requirements

## 10. Data Requirements

## 11. Permission & Security Requirements

## 12. Integration Requirements

## 13. UI / UX Requirements

## 14. Operational Requirements

## 15. Acceptance Criteria

## 16. Milestones

## 17. Risks

## 18. Open Questions
```

---

## 6.3 EARS Requirements

文件：

```text
specs/mainline/02-ears-requirements.md
```

Requirement 模板：

```markdown
## REQ-001: Requirement Title

- Type: Functional | Non-functional | Security | UI | Data | Integration
- Source: PRD Section X.X
- Priority: Must | Should | Could
- Status: Draft | Review | Approved | Changed | Deprecated

### EARS

When <trigger>,
the system shall <response>.

### Acceptance Criteria

- [ ] ...
- [ ] ...

### Traceability

- PRD:
- HLD:
- UI:
- Feature:
- Test:
```

---

## 6.3.1 Delivery Fidelity And Journey Closure

Agentic Spec 不允许仅凭任务勾选、提交、PR、单元测试或执行 Skill 自我声明来判定 Feature 完成。Feature 完成必须经过全流程 Delivery Fidelity 审查和独立的用户旅程闭环验收。质量不是最后一道门，而是 Define、Plan、Build、Verify、Review、Ship 每次 handoff 都要保留的交付事实。

该 Gate 借鉴成熟 Agent/Skill 库中的分层模式：执行 Agent/Skill 负责实现和收集证据，eval / QA / critic 类 Skill 负责独立判断完成度。SpecDrive 中对应的独立 Gate 是：

```text
review-delivery-evidence
```

职责边界：

- `decompose-feature-specs`：按用户故事纵切 Feature，在 `requirements.md` 生成 `User Journey Coverage`，在 `tasks.md` 生成 `Journey Checkpoint` 和 `Git Delivery Checkpoint`。
- `use-specdrive-lifecycle`：根据任务跨度选择 lifecycle、Skill 和 Product Interpreter / Requirement Critic / Interaction Designer / Task Slicer / Implementation Agent / Test Engineer / Browser QA / Code Reviewer / Release Reviewer 等职责。
- `implement-feature`：实现、测试、更新任务状态，管理 Feature worktree / branch / commit / PR / merge / cleanup，并收集 `requirementCoverage`、`acceptanceEvidence`、`journeyEvidence`、`deliveryFidelity`、`gitDelivery` 或合法 `foundationExemption`。
- `review-code-spec`：检查规划产物一致性和 Journey Checkpoint 覆盖。
- `review-code-spec`：检查 diff、spec drift 和缺失的 Journey evidence。
- `review-delivery-evidence`：只判断用户旅程、需求、任务、验收场景和证据是否闭环，不实现功能。

Feature execution 返回 `completed` 时，必须使用 `skill-contract/v2`，专用 `result` 必须包含：

```json
{
  "requirementCoverage": [],
  "acceptanceEvidence": [],
  "journeyEvidence": [],
  "deliveryFidelity": {
    "sourceIntent": [],
    "journeys": [],
    "behaviorObligations": [],
    "handoffs": [],
    "losses": [],
    "evidence": [],
    "agentReviews": [],
    "completionDecision": {
      "status": "passed",
      "reason": "...",
      "decidedBy": "release-reviewer",
      "unresolvedLosses": []
    }
  },
  "foundationExemption": null,
  "gitDelivery": {
    "ownerWorkspace": "...",
    "implementationWorkspace": "...",
    "worktree": "...",
    "branch": "...",
    "commitHash": "...",
    "prUrl": "...",
    "checks": "passed",
    "merge": "merged",
    "remoteBranchCleanup": "completed",
    "localBranchCleanup": "completed",
    "worktreeCleanup": "cleaned",
    "deliveryExemption": null
  }
}
```

Skill output traceability 仍只包含 `featureId`。`REQ-*`、任务 ID、验收场景、Journey Checkpoint、截图、日志、测试命令、PR/commit 证据全部放入专用 `result` 或产物摘要中。`skill-contract/v1` 只作为 legacy 或非 feature execution 输出读取，不得作为新 Feature completed 的依据。

若用户旅程未闭环，Scheduler、Execution Record 和 Feature `spec-state.json` 必须投影为 `review_needed`。原因使用：

- `journey_not_closed`
- `acceptance_gap`
- `evidence_missing`
- `quality_evidence_gap`
- `test_semantics_gap`
- `journey_bypassed_by_fixture`
- `delivery_evidence_missing`
- `delivery_not_closed`

Foundation Feature 可以声明 `foundationExemption`，但必须说明为什么没有直接用户旅程、列出下游闭环 Feature，并提供集成验证点。Foundation exemption 不能替代下游用户旅程验收。

---

## 6.4 HLD

文件：

```text
specs/mainline/03-hld.md
```

必须包含：

```markdown
# High Level Design

## 1. Architecture Overview

## 2. System Context

## 3. Module Decomposition

## 4. Module Responsibilities

## 5. Data Flow

## 6. State Flow

## 7. Agent Model

## 8. Skill Model

## 9. Execution Adapter Model

## 10. Scheduling Model

## 11. Approval Model

## 12. Recovery Model

## 13. Audit Model

## 14. Storage Model

## 15. Security Model

## 16. Observability

## 17. Risks & Trade-offs

## 18. Requirement Mapping
```

---

### 6.4.1 HLD / Feature Design / LLD Policy

主线 HLD 是项目级架构事实源，只负责系统地图和跨 Feature 约束：

- 系统边界、运行拓扑、信任边界和外部依赖。
- 模块/子系统职责、事实源、状态流、数据域和集成策略。
- 安全、审批、恢复、审计、可观测性、测试质量策略。
- Feature Spec 拆分边界、依赖顺序和需求覆盖方向。

主线 HLD 不生成主线 LLD，不创建 `docs/lld.md`、`docs/<language>/lld.md`，也不承载以下内容：

- 函数签名、字段级 payload、数据库迁移细节。
- UI 组件内部结构、页面局部布局实现细节。
- 单个 Feature 的任务步骤、文件编辑清单或算法实现。
- 可直接交给编码 Agent 执行的低层实现计划。

低层设计只在需要时进入 Feature 级文档或规划结果：

- Feature `requirements.md` 负责可验收对象：`User Story Coverage`、`User Journey Coverage`、REQ/US/Acceptance 映射、Foundation Exemption。
- Feature `design.md` 负责闭环实现路径：用户旅程如何落到 UI/API/状态/数据/错误/恢复/证据；高风险 Feature 的低层设计也写在这里。
- Feature `tasks.md` 负责可执行闭环任务：按 P1/P2/P3 用户故事纵切，包含 Journey Checkpoint、Git Delivery Checkpoint 和 evidence expectation。

如果实现、评审或规划发现需要改变项目级架构边界，应走 HLD / requirements 的 Spec Evolution；如果只是 Feature 内部实现细化，不得回写主线 HLD 或创建主线 LLD。

---

## 6.5 UI Specification

文件：

```text
specs/mainline/04-ui-specification.md
```

必须包含：

```markdown
# UI Specification

## 1. Design Goals

## 2. Information Architecture

## 3. Page List

## 4. Navigation Model

## 5. Layout Rules

## 6. Component Rules

## 7. Interaction Rules

## 8. State Rules

## 9. Empty State

## 10. Loading State

## 11. Error State

## 12. Permission State

## 13. Approval Interaction

## 14. Recovery Interaction

## 15. Audit Interaction

## 16. Responsive Rules

## 17. Accessibility Rules
```

---

## 6.6 High-fidelity Concept / Prototype

文件夹：

```text
specs/mainline/05-high-fidelity-prototype/
```

### 6.6.1 必须包含 PNG 或 HTML

每个核心页面必须至少提供：

```text
PNG 高保真原型图
```

或者：

```text
HTML 高保真交互原型
```

推荐两者同时存在：

```text
screens/*.png
html/index.html
```

---

### 6.6.2 PNG 原型要求

PNG 文件要求：

1. 页面尺寸明确。
2. 页面名称明确。
3. 状态明确。
4. 与 UI Spec 页面 ID 对应。
5. 与 Requirement / Feature 可追踪。
6. 包含关键组件、布局、视觉层级。
7. 对复杂交互提供多状态截图。

示例：

```text
screens/
  dashboard-default.png
  dashboard-loading.png
  dashboard-empty.png
  dashboard-error.png
  feature-detail-approved.png
  agent-run-failed.png
```

---

### 6.6.3 HTML 原型要求

HTML 原型要求：

1. 可以本地打开。
2. 能表达核心交互。
3. 不要求生产级代码。
4. 不应混入业务后端逻辑。
5. 不应替代正式前端实现。
6. 必须在 README 中说明使用方式。

结构：

```text
html/
  index.html
  assets/
  README.md
```

---

### 6.6.4 Prototype Index 模板

```markdown
# High-fidelity Prototype Index

## 1. Overview

## 2. Prototype Type

- PNG: Yes / No
- HTML: Yes / No

## 3. Screen Mapping

| Screen ID | Screen Name | PNG | HTML Route | Related Requirement | Related Feature |
|---|---|---|---|---|---|

## 4. Interaction Mapping

| Interaction | Source UI Spec | Prototype Evidence |
|---|---|---|

## 5. State Mapping

| State | Screen | Prototype File |
|---|---|---|

## 6. Notes
```

---

# 7. Feature Spec 规范

每个 Feature 必须独立成目录。

```text
specs/features/FEAT-001-example-feature/
  requirements.md
  design.md
  tasks.md
  status.yaml
  evidence.md
```

---

## 7.1 requirements.md

```markdown
# FEAT-001: Feature Requirements

## 1. Overview

## 2. Source Mapping

| Source Type | Source ID | Description |
|---|---|---|
| PRD | Section 8.1 | ... |
| EARS | REQ-001 | ... |
| HLD | Module X | ... |
| UI Spec | Screen X | ... |
| Prototype | dashboard-default.png | ... |

## 3. Functional Requirements

### FR-001

When <trigger>,
the system shall <response>.

## 4. Non-functional Requirements

## 5. Edge Cases

## 6. Acceptance Criteria

- [ ] ...

## 7. Out of Scope

## 8. Open Questions
```

---

## 7.2 design.md

```markdown
# FEAT-001: Feature Design

## 1. Design Overview

## 2. Related Architecture

## 3. Components

## 4. Data Model

## 5. API / Interface

## 6. State Transitions

## 7. Execution Adapter Usage

## 8. Error Handling

## 9. Security Considerations

## 10. Test Strategy

## 11. Implementation Notes

## 12. Alternatives Considered
```

---

## 7.3 tasks.md

v1.2 中 Task 输入输出不再冗余复制完整上下文。
Feature Spec 拆分必须使用 `decompose-feature-specs/templates/feature-spec-template.md`
作为文件和任务结构契约：Feature 目录固定为
`docs/features/feat-<nnn>-<kebab-title>/`，必需文件固定为
`requirements.md`、`design.md`、`tasks.md` 和 `spec-state.json`。
`tasks.md` 必须包含至少一个可解析任务块，任务标题固定使用
`### TASK-<nnn>: <title>` 或 `### T-<feature-nnn>-<task-nn>: <title>`，
并保留 `Status`、`Description`、`Requirements`、`Spec Refs`、
`Allowed Paths`、`Forbidden Paths`、`Verification` 和 `Acceptance`
字段；不得输出 `taskes`、`task.md`、`plan.md` 等替代文件名。

```markdown
# FEAT-001: Feature Tasks

## Metadata

- Feature ID: FEAT-001
- Status: Ready
- Priority: Must
- Depends On:
- Adapter: codex-cli | cli | rpc | mcp | sandbox | manual
- Approval Required: true | false

## Tasks

### TASK-001: Implement core service

- Type: Implementation
- Status: Ready
- Spec Refs:
  - specs/features/FEAT-001/requirements.md#FR-001
  - specs/features/FEAT-001/design.md#components
- Allowed Paths:
  - src/intake/**
  - tests/intake/**
- Forbidden Paths:
  - src/auth/**
  - src/billing/**
- Adapter:
  - type: codex-cli
  - profile: default
- Acceptance:
  - [ ] Implementation satisfies FR-001
  - [ ] Unit tests pass
  - [ ] Evidence Pack updated
- [ ] No forbidden paths changed
```

---

## 7.4 Spec Artifact Granularity Gate

Agentic Spec 不只要求 PRD、requirements、HLD、UI Spec 和 Feature Spec
“存在”，还要求每一层达到能向下游传递的颗粒度。推荐采用
requirements-first 顺序：

```text
PRD intent
  -> EARS requirements
  -> HLD / UI Spec
  -> Feature requirements / design
  -> tasks
  -> execution
```

当 requirements 变化时，必须先 refine design，再 sync tasks。不得用
Quick Plan 或直接编码绕过 requirements analysis、design review 和 task
sync。

### 7.4.1 Artifact 粒度责任

| Artifact | Minimum granularity | Review failure |
|---|---|---|
| PRD | 用户、目标、业务流程、大模块子能力、成功样例、失败样例、非目标、优先级。 | 只写模块名、页面名、愿景句或没有失败样例。 |
| requirements | `REQ-*` / `NFR-*` / `EDGE-*` 原子 EARS 行为、`US-*` 映射、验收、边界/错误路径、证据类型。 | 需求需要解释才能测试。 |
| HLD | 系统级子系统、事实源数据、状态流、接口/事件策略、运行拓扑、恢复和测试策略。 | 只有组件名、页面名或技术名。 |
| UI Spec | 页面、视图、弹窗、状态、用户动作、interaction matrix、数据绑定、保存/校验/reload 断言、浏览器验收。 | 只有概念图、截图、入口或 happy path。 |
| Feature Spec | 垂直用户旅程、Feature-scoped design、parser-compatible tasks、Journey Checkpoints、验收证据计划。 | P1 journey 没有 requirement row、design path、task block 或 evidence plan。 |

`review-delivery-evidence` 负责跨层审查。失败原因使用
`intent_gap`、`behavior_gap`、`architecture_gap`、`interaction_gap`、
`state_data_gap`、`task_gap`、`evidence_gap`。失败时 Feature 或相关
workflow 必须进入 `review_needed` / `clarification_needed` /
`risk_review_needed`，不得进入 `ready` 或 `feature_execution`。

### 7.4.2 Document Generation Quality Repair Loop

所有生成或更新 Spec 文档的 Skill 都必须在返回完成前执行质量检测与修复
循环。适用文档包括 Project Intake、PRD、requirements、HLD、UI Spec、
Feature Spec `requirements.md` / `design.md` / `tasks.md`、Feature index、
queue plan、ADR 和其他向下游规划或执行传递的 Markdown / JSON 规格产物。

循环由 owner thread 编排，但质量检测和修复必须交给隔离 subagent。共享 loop
只规定循环机制，不维护产物类型到质检 Skill 的中央路由表；调用 loop 的生成
Skill 必须选择本次 Quality Review Skill 和 Repair Owner。

1. owner thread 先定义 `qualityLoopPlan`：允许产物、来源事实、禁止文件、
   允许 gap 类型、风险上限、ID 策略、是否允许下游同步、调用方选择的
   `qualityReviewSkill` / `repairOwner` 及选择理由。
2. 调用方选择的 Quality Review Subagent 读取引用文件并输出 compact gap 结果，按
   `in_scope_repairable`、`in_scope_not_repairable`、`out_of_scope` 分类。
3. 调用方选择的 Repair Subagent / Repair Owner 只处理
   `in_scope_repairable` gap，只能修改允许产物，并必须给出证据引用。
4. 再次调用 Quality Review Subagent 复查。
5. 最多循环 10 轮。

通过最新质量检测后才允许返回 `completed`。没有可修复项、剩余项超出
`qualityLoopPlan`、需要新产品意图/架构决策、同一 gap 指纹重复或达到 10 轮时，
必须退出到 `clarification_needed`、`review_needed`、`risk_review_needed`
或 `blocked`。最新质量检测失败时，不得继续推进到 HLD、UI Spec、
Feature 拆分、任务生成、ready、planning 或 execution。

生成 Skill 的结果应包含 `result.qualityRepairLoop`，记录最大轮次、已用
轮次、最终决策、`qualityLoopPlan`、subagent 使用情况、剩余 gap 和退出原因。

---

## 7.5 status.yaml

```yaml
feature_id: FEAT-001
name: Example Feature
status: ready

spec:
  requirements: approved
  design: approved
  tasks: approved

traceability:
  requirements:
    - REQ-001
  prototype:
    - specs/mainline/05-high-fidelity-prototype/screens/dashboard-default.png

execution:
  current_task: null
  current_run: null
  adapter: codex-cli

quality:
  tests_passing: false
  evidence_ready: false
  accepted: false

audit:
  created_at: ""
  updated_at: ""
  last_run_id: ""
```

---

# 8. 端到端过程链路

## 8.1 总流程

```text
User Input
  ↓
Project Intake
  ↓
PRD Draft
  ↓
EARS Requirements Draft
  ↓
HLD Draft
  ↓
UI Specification Draft
  ↓
High-fidelity Prototype
  ↓
Mainline Spec Review
  ↓
Mainline Spec Approved
  ↓
Feature Decomposition
  ↓
Feature Requirements
  ↓
Feature Design
  ↓
Feature Tasks
  ↓
Feature Ready Gate
  ↓
Task Scheduling
  ↓
Execution Adapter Dispatch
  ↓
Agent / Subagent / Skill Execution
  ↓
Checkpoint / Audit / Evidence Collection
  ↓
Test & Verification
  ↓
Review Gate
  ↓
Acceptance
  ↓
Release
```

---

## 8.2 主流程状态流

```text
Drafting
  → Reviewing
  → Approved
  → Planning
  → Ready
  → Scheduled
  → Running
  → Checkpointed
  → Implemented
  → Verifying
  → Reviewed
  → Accepted
  → Released
```

---

## 8.3 异常分支总览

主流程中任何阶段都可能进入异常分支。

```text
Any Stage
  → Needs Clarification
  → Clarification Resolved
  → Return to Previous Stage
```

```text
Any Stage
  → Change Requested
  → Impact Analysis
  → Spec Updated
  → Re-plan
  → Return to Execution
```

```text
Any Stage
  → New Requirement
  → Requirement Intake
  → Mainline Spec Update
  → Feature Re-decomposition
  → Re-plan
```

```text
Running
  → Failed
  → Recovery Analysis
  → Restore Checkpoint
  → Resume / Retry / Blocked
```

```text
Running
  → Approval Required
  → Human Review
  → Approved / Rejected
  → Resume / Abort / Re-plan
```

---

## 8.4 状态迁移事件契约

所有状态迁移都必须能被机器和人工同时复核。一次迁移至少包含：

```yaml
state_transition:
  from: Running
  to: Review Needed
  trigger_event: skill_output_review_needed
  fact_source: runs/RUN-001/result.yaml
  evidence_refs:
    - runs/RUN-001/report.json
  allowed_side_effects:
    - create_review_item
    - pause_auto_continue
  resume_target: Running
  terminal_condition: human_decision_recorded
```

规则：

1. `from` 和 `to` 必须来自对应对象的状态机。
2. `trigger_event` 必须说明是用户指令、Skill 输出、Adapter 事件、Status Check、Review 决策、Recovery 结果还是交付动作。
3. `fact_source` 必须指向文件、运行记录、审批记录或审计记录，不能只引用聊天上下文。
4. `evidence_refs` 必须引用可复核产物。
5. `allowed_side_effects` 只能列出本次迁移允许触发的副作用。
6. `resume_target` 用于 `waiting_input`、`approval_needed`、`review_needed`、`blocked`、`failed`、`paused` 等中断状态。
7. `terminal_condition` 必须说明该状态如何结束、如何恢复或为何不可恢复。

---

## 8.5 标准状态与产品投影边界

Agentic Spec Standard 只定义通用对象状态、迁移事件和恢复规则，不规定具体产品必须使用哪种数据库、队列或 UI。

`agentic-spec-driven-auto-build` 的产品投影规则是：

```text
feature-pool-queue.json
  = Feature 依赖、优先级和全局队列事实源

docs/features/<feature-id>/spec-state.json
  = 单个 Feature 的文件化生命周期、当前 Job、lastResult、resumeTarget 和 operator-facing nextAction

SQLite scheduler_job_records
  = 队列 Job 运行事实

SQLite execution_records
  = 真实执行实例事实

SQLite review_items / approval_records
  = Review Needed 与审批事实

Product Console / VSCode Webview
  = 查询投影和受控命令入口，不直接拥有状态事实
```

当这些投影冲突时，必须先核查运行事实、文件状态、Git/worktree 和审计记录，再修正派生投影。

---

# 9. 状态机规范

## 9.1 Document State

```text
Draft
  → Review
  → Approved
  → Changed
  → Re-review
  → Re-approved
  → Deprecated
```

说明：

| 状态          | 含义       |
| ----------- | -------- |
| Draft       | 初稿       |
| Review      | 待审查      |
| Approved    | 已批准      |
| Changed     | 已发生变更    |
| Re-review   | 变更后待重新审查 |
| Re-approved | 重新批准     |
| Deprecated  | 废弃       |

---

## 9.2 Requirement State

```text
Proposed
  → Draft
  → Approved
  → Implemented
  → Verified
  → Accepted
```

异常状态：

```text
Clarification Needed
Changed
Deprecated
Rejected
```

---

## 9.3 Feature State

```text
Proposed
  → Analyzing
  → Spec Draft
  → Spec Review
  → Ready
  → Scheduled
  → In Progress
  → Implemented
  → Verifying
  → Verified
  → Accepted
  → Released
```

异常状态：

```text
Blocked
Change Required
Re-planning
Deprecated
```

---

## 9.4 Task State

```text
Todo
  → Ready
  → Dispatching
  → Running
  → Done
  → Verified
```

异常状态：

```text
Waiting Clarification
Waiting Approval
Paused
Failed
Recovering
Cancelled
```

---

## 9.5 Agent Run State

```text
Created
  → Context Bound
  → Adapter Prepared
  → Executing
  → Checkpointed
  → Completed
  → Verified
  → Archived
```

异常状态：

```text
Interrupted
Pending Approval
Failed
Recovering
Blocked
Aborted
```

---

## 9.6 Adapter Run State

```text
Created
  → Prepared
  → Invoked
  → Streaming
  → Completed
```

异常状态：

```text
Tool Error
Timeout
Permission Denied
Approval Required
Failed
Cancelled
```

---

## 9.7 Approval State

```text
Not Required
Required
Pending
Approved
Rejected
Expired
Superseded
```

---

## 9.8 Change State

```text
Proposed
  → Impact Analysis
  → Approved
  → Applied
  → Verified
  → Closed
```

异常状态：

```text
Rejected
Deferred
Superseded
```

---

## 9.9 Checkpoint State

```text
Captured
  → Validated
  → Restoring
  → Replayed
  → Resumed
```

异常状态：

```text
Invalid
Expired
Abandoned
```

---

# 10. Spec 流程扩展

v1.2 明确：真实开发不会只有正常主线流程。
必须支持以下交叉流程。

---

## 10.1 澄清流程

适用于：

1. 需求含糊。
2. 验收标准不明确。
3. UI 行为不确定。
4. 技术边界不明确。
5. Agent 无法安全推断。

流程：

```text
Agent detects ambiguity
  ↓
Create Clarification Item
  ↓
Mark Requirement / Feature / Task as Waiting Clarification
  ↓
Human or Product Agent answers
  ↓
Update Spec
  ↓
Update Traceability
  ↓
Update Feature Spec / Tasks
  ↓
Set Feature Spec Ready
  ↓
UI Schedules Execution
```

Clarification Item 模板：

```markdown
# Clarification: CLAR-001

## 1. Context

## 2. Ambiguous Point

## 3. Affected Specs

## 4. Options

## 5. Decision

## 6. Required Spec Updates

## 7. Resume Target
```

---

## 10.2 新增需求流程

适用于：

1. 用户新增功能。
2. 发现遗漏能力。
3. 新增业务规则。
4. 新增集成对象。
5. 新增 UI 页面。

流程：

```text
New Requirement Submitted
  ↓
Requirement Intake
  ↓
PRD Update
  ↓
EARS Update
  ↓
HLD / UI Spec Impact Check
  ↓
Feature Index Update
  ↓
Feature Spec Create / Update
  ↓
Task Re-plan
  ↓
Set Feature Spec Ready
  ↓
UI Schedules Execution
```

规则：

1. 新增需求不得直接进入编码。
2. 必须有 Requirement ID。
3. 必须进入 Traceability Matrix。
4. 必须判断是否影响已有 Feature。
5. 必须判断是否影响已完成任务。
6. 若影响已接受 Feature，必须创建 Change Request。

---

## 10.3 需求变更流程

适用于：

1. 改变原需求。
2. 调整业务规则。
3. 调整验收标准。
4. 调整范围。
5. 改变优先级。

流程：

```text
Change Request
  ↓
Impact Analysis
  ↓
Approval
  ↓
Update Mainline Specs
  ↓
Update Feature Specs
  ↓
Update Tasks
  ↓
Set Feature Spec Ready
  ↓
UI Schedules Execution
  ↓
Invalidate Affected Evidence
  ↓
Re-run Affected Tasks
  ↓
Re-verify
```

核心规则：

```text
凡是影响已批准 Spec 的变更，都必须进入 Change Request。
需求新增、需求变更和澄清完成后不得停留在主线文档层；必须同步到可直接实现的 Feature Spec、Feature Pool Queue 和 `spec-state.json` ready 状态，除非明确返回 blocked / review_needed。
```

---

## 10.4 设计变更流程

适用于：

1. 架构调整。
2. 数据模型调整。
3. 模块边界调整。
4. Adapter 变更。
5. 状态机变更。

流程：

```text
Design Change Proposed
  ↓
HLD Impact Analysis
  ↓
ADR Required?
  ↓
Update HLD
  ↓
Update Feature Design
  ↓
Update Tasks
  ↓
Review
  ↓
Execution
```

需要 ADR 的情况：

1. 架构方向变化。
2. 数据库选择变化。
3. 执行框架变化。
4. 安全边界变化。
5. 成本模型变化。
6. 影响多个 Feature 的设计决策。

---

## 10.5 UI / Prototype 变更流程

适用于：

1. 页面结构变化。
2. 交互变化。
3. 状态展示变化。
4. 高保真原型变化。
5. HTML 原型变化。

流程：

```text
UI Change Requested
  ↓
Update UI Specification
  ↓
Update PNG / HTML Prototype
  ↓
Update Prototype Index
  ↓
Update Feature Mapping
  ↓
Update UI Tasks
  ↓
Re-verify
```

规则：

```text
有 UI 的功能，不能只有文字 Spec，必须有 PNG 或 HTML 原型证据。
```

---

## 10.6 执行失败恢复流程

流程：

```text
Agent Run Failed
  ↓
Capture Failure Evidence
  ↓
Read Last Checkpoint
  ↓
Classify Failure
  ↓
Recoverable?
  ├─ Yes → Restore Checkpoint → Resume
  └─ No  → Mark Blocked → Human Review / Re-plan
```

失败分类：

| 类型                    | 说明                   |
| --------------------- | -------------------- |
| Tool Failure          | CLI / RPC / MCP 工具失败 |
| Test Failure          | 测试失败                 |
| Permission Failure    | 权限不足                 |
| Spec Conflict         | Spec 冲突              |
| Context Missing       | 上下文缺失                |
| Adapter Timeout       | 适配器超时                |
| Unsafe Operation      | 触发安全策略               |
| Human Approval Needed | 需要人工批准               |

---

## 10.7 审批中断恢复流程

流程：

```text
Execution Requires Approval
  ↓
Run State = Pending Approval
  ↓
Serialize Run State
  ↓
Human Approves / Rejects
  ↓
Resume with Decision
```

OpenAI Agents SDK 的 RunResult 可暴露 pending approvals，并可通过 `to_state()` 捕获可恢复 RunState，再在审批后继续运行；Agentic Spec 的审批恢复流程应兼容这种“中断—序列化—审批—恢复”的模式。([openai.github.io][3])

---

## 10.8 Spec 与代码不一致修复流程

适用于：

1. 实现行为偏离已批准 Spec。
2. 测试或 Review 发现 Spec Alignment 不通过。
3. 运行证据证明旧 Spec 已过时。
4. 已完成 Feature 的验收结论被新证据推翻。

流程：

```text
Spec / Code Drift Detected
  ↓
Capture Drift Evidence
  ↓
Classify: Code Fix or Spec Evolution?
  ├─ Code Fix → Re-open Feature / Task → Execute → Verify
  └─ Spec Evolution → Change Request → Impact Analysis → Update Specs → Re-plan
  ↓
Invalidate Affected Evidence
  ↓
Update Traceability
  ↓
Resume from recorded resumeTarget
```

规则：

1. 如果 Spec 仍正确，修代码，不改 Spec。
2. 如果实现证据推翻 Spec，先走 Change Request，不得静默修改代码绕过。
3. 已完成或已交付 Feature 被影响时，必须记录 follow-up、reopening 或 Spec Evolution。
4. 受影响的 Evidence、StatusCheckResult、ReviewItem 和 Delivery Report 必须能追溯到本次漂移修复。

---

## 10.9 任务重规划流程

适用于：

1. Feature 依赖变化。
2. Feature 被 skip、blocked、failed 或 review_needed 后需要选择下一项。
3. 用户要求 resume 指定 Feature。
4. Spec 变更使当前执行计划失效。

流程：

```text
Re-plan Requested
  ↓
Read Feature Queue
  ↓
Read Feature spec-state
  ↓
Read Latest Execution / Review / Recovery Facts
  ↓
Select Next Feature
  ↓
Code Safety Gate
  ├─ Pass → Enqueue Execution Adapter Job
  └─ Block → Record blocked reason and resumeTarget
```

规则：

1. Feature 队列事实来自 `feature-pool-queue.json` 或等价机器可读队列文件。
2. 单个 Feature 的当前状态来自 `spec-state` 类文件或等价机器可读状态文件。
3. LLM/Skill 可以提供选择建议，但代码必须执行结构校验、安全闸和去重。
4. `blocked`、`failed`、`review_needed` 和 `approval_needed` 不得被自动反复选择，除非有明确 resume/skip hint。

---

## 10.10 暂停、取消、跳过与恢复流程

```text
Running / Queued
  → Paused
  → Resume
  → Running / Queued
```

```text
Queued / Running / Approval Required
  → Cancelled
  → Terminal or Re-plan
```

```text
Blocked / Failed / Review Needed
  → Skipped
  → Select Next Feature
```

规则：

1. `paused` 必须保留 `resumeTarget`，恢复后回到暂停前入口。
2. `cancelled` 必须记录操作者、原因和是否允许 retry。
3. `skipped` 不删除 Feature，不删除历史，只让调度器选择下一项。
4. `retry` 必须关联上一次 Execution、失败原因、恢复结果和重试预算。
5. UI 只能提交受控命令；状态事实必须由控制面、状态机或运行记录写入。

---

# 11. Execution Adapter Contract

Execution Adapter 是 Agentic Spec 与真实执行环境之间的接口。

它可以连接：

1. CLI。
2. RPC 服务。
3. MCP Server。
4. Sandbox。
5. Codex CLI。
6. Codex Cloud。
7. 自研 Agent Runtime。
8. CI / Test Runner。
9. Git Provider。
10. Deployment Tool。

Codex CLI 本身可以在本地终端读取代码、修改文件、运行命令，并支持审批模式、subagents、MCP、脚本化执行等能力；因此 Agentic Spec 的 Adapter 不应重复实现这些能力，而应通过契约进行编排。([OpenAI Developers][4])

---

## 11.1 Adapter 类型

```yaml
adapter_types:
  cli:
    description: "Run local shell commands or CLI tools"

  rpc:
    description: "Call remote procedure services"

  mcp:
    description: "Connect to MCP tools and context providers"

  sandbox:
    description: "Run in isolated workspace"

  codex_cli:
    description: "Delegate implementation or review to Codex CLI"

  codex_cloud:
    description: "Delegate implementation to remote Codex environment"

  manual:
    description: "Human-executed task"
```

---

## 11.2 Adapter Input Contract

v1.2 使用精简输入。

```yaml
adapter_input:
  run_id: RUN-20260509-0001
  task_id: TASK-001
  feature_id: FEAT-001

  spec_refs:
    - specs/features/FEAT-001/requirements.md#FR-001
    - specs/features/FEAT-001/design.md#components
    - specs/features/FEAT-001/tasks.md#TASK-001

  workspace:
    root: "."
    branch: "feat/feat-001"

  scope:
    allowed_paths:
      - src/intake/**
      - tests/intake/**
    forbidden_paths:
      - src/auth/**
      - src/billing/**

  policies:
    approval_mode: on-request
    network_access: restricted
    destructive_actions: deny
    checkpoint_required: true

  output_contract:
    format: agentic_spec_result_v1
    evidence_required: true
    test_required: true
```

---

## 11.3 Adapter Output Contract

```yaml
adapter_output:
  run_id: RUN-20260509-0001
  adapter_run_id: ADP-20260509-0001
  status: completed

  summary:
    - "Implemented intake schema"
    - "Added tests"

  changed_files:
    - path: src/intake/schema.ts
      change_type: created
    - path: tests/intake/schema.test.ts
      change_type: created

  commands:
    - command: "npm test -- tests/intake/schema.test.ts"
      status: passed

  checkpoints:
    - runs/RUN-20260509-0001/checkpoint.yaml

  evidence:
    - runs/RUN-20260509-0001/evidence.md

  state_delta:
    task: done
    feature: implemented

  risks:
    - "No integration test yet"
```

---

## 11.4 Adapter Event Stream

Adapter 应输出事件流。

```json
{"type":"adapter.started","run_id":"RUN-001","timestamp":"..."}
{"type":"context.bound","spec_refs":["..."],"timestamp":"..."}
{"type":"command.started","command":"npm test","timestamp":"..."}
{"type":"command.finished","status":"passed","timestamp":"..."}
{"type":"checkpoint.captured","path":"runs/RUN-001/checkpoint.yaml","timestamp":"..."}
{"type":"adapter.completed","status":"completed","timestamp":"..."}
```

---

# 12. Agent / Subagent 标准

## 12.1 Agent 定义

Agent 是具备以下能力的执行单元：

1. Instructions。
2. Tools。
3. Optional Handoffs。
4. Optional Guardrails。
5. Optional Structured Output。
6. Optional Memory / Session State。
7. Optional Adapter Access。

---

## 12.2 Subagent 定义

Subagent 是被主 Agent 委派的专门 Agent。

Subagent 应用于：

1. 大任务拆分。
2. 专业领域隔离。
3. 并行执行。
4. 审查任务。
5. 测试任务。
6. UI 任务。
7. 安全分析。
8. 恢复分析。

---

## 12.3 Subagent 调用方式

推荐两种方式：

### 方式一：Handoff

适用于主控权转移。

```text
Orchestrator Agent
  → handoff
  → Specialist Agent
```

OpenAI Agents SDK 中 handoffs 用于将任务委派给专门 Agent，并以工具形式暴露给模型；Agentic Spec 的 Subagent Handoff 应使用明确的职责描述、输入约束和返回契约。([openai.github.io][5])

---

### 方式二：Agent as Tool

适用于主 Agent 保持控制权。

```text
Orchestrator Agent
  → call Reviewer Agent as Tool
  → receive structured result
```

---

## 12.4 Subagent Input Contract

```yaml
subagent_input:
  parent_run_id: RUN-001
  sub_run_id: RUN-001-SUB-001
  role: test-agent

  objective: "Generate and run unit tests for FEAT-001"

  spec_refs:
    - specs/features/FEAT-001/requirements.md
    - specs/features/FEAT-001/design.md

  scope:
    allowed_paths:
      - tests/intake/**
    readonly_paths:
      - src/intake/**
    forbidden_paths:
      - src/auth/**

  expected_output:
    schema: subagent_result_v1
```

---

## 12.5 Subagent Output Contract

```yaml
subagent_result:
  sub_run_id: RUN-001-SUB-001
  status: completed

  findings:
    - "Unit test added for valid intake schema"

  changed_files:
    - tests/intake/schema.test.ts

  evidence:
    - runs/RUN-001/subagents/RUN-001-SUB-001/evidence.md

  risks: []
```

---

# 13. Skill 标准

## 13.1 Skill 定义

Skill 是可复用、可组合、可迁移的工作流能力。

Skill 不等于：

1. 一段临时 prompt。
2. 某个项目的硬编码流程。
3. 某个产品的功能模块。
4. 某个 UI 页面。
5. 某个 Agent 的私有提示词。

Skill 应该是：

```text
可复用工作流 + 输入契约 + 输出契约 + 触发条件 + 约束 + 验收规则
```

---

## 13.2 Skill 命名规范

Agentic Spec Skill 必须采用 OpenAI / Agent Skills 目录规范：

1. 每个 Skill 是 `.agents/skills/<skill-name>/` 下的独立目录。
2. 每个 Skill 必须包含 `SKILL.md`。
3. `SKILL.md` frontmatter 只使用 `name` 与 `description`。
4. `name` 必须等于目录名。
5. `name` 只允许小写字母、数字和连字符，禁止点号、阶段编号前缀、空格和下划线。
6. 可选的 Agent 适配配置放在 `agents/openai.yaml`。
7. 长合同、示例和质量循环说明应放在 Skill 本地 `references/*.md`；模板放在 `assets/`；确定性辅助脚本放在 `scripts/`。

命名格式：

```text
<verb>-<domain>-<object>
```

示例：

```text
refine-product-intent
convert-ears-requirements
decompose-feature-specs
implement-feature
recover-execution
```

---

## 13.3 Agentic Spec 必备 Skill 清单

必备目录必须与下表完全一致；不保留旧阶段编号、dotted slug、alias 或 replacement 映射。

| Skill | 职责 |
| --- | --- |
| `use-specdrive-lifecycle` | 路由 Define、Plan、Build、Verify、Review、Ship 生命周期和专业 agent 职责。 |
| `collect-project-context` | 只读收集项目、仓库、命令、约束、宪法和实现上下文。 |
| `refine-product-intent` | 整理 PRD、目标、非目标、用户旅程、验收标准和开放问题。 |
| `convert-ears-requirements` | 将 PRD、PR/RP、产品 brief 或自然语言输入转换为 EARS 需求。 |
| `validate-requirements` | 检查需求原子性、可测试性、冲突、追踪和下游可消费性。 |
| `manage-spec-change` | 治理新增、修订、澄清、废弃、影响分析和重规划入口。 |
| `design-architecture` | 生成或更新 HLD、ADR、数据流、状态流、Adapter/API/事件/文件契约。 |
| `design-ui-spec` | 生成 UI Spec、页面清单、交互/状态规则和 prototype/artifact 映射。 |
| `decompose-feature-specs` | 拆分 Feature Specs，生成或维护 requirements/design/tasks/index/status。 |
| `plan-feature-execution` | 处理依赖、风险、任务 DAG、执行计划、可启动性、replan 和自动选择。 |
| `implement-feature` | 执行受控实现，绑定规格引用，捕获事件，收集结果并更新执行状态。 |
| `verify-behavior` | 生成测试计划，补充测试，运行目标/回归/浏览器/构建/验收验证并分析失败。 |
| `review-code-spec` | 评审代码 diff、安全、规格一致性和实现偏离。 |
| `review-delivery-evidence` | 评审用户旅程闭环、测试覆盖、证据完整性和发布准备度。 |
| `recover-execution` | 分类失败，恢复 checkpoint，标记阻塞，恢复运行并验证恢复结果。 |
| `package-evidence` | 收集证据，生成 evidence pack，更新 requirement/feature/change 矩阵和审计日志。 |
| `prepare-release` | 执行发布门、生成 release notes、准备 PR、标记发布和归档运行。 |

---

# 14. Change Request 规范

## 14.1 Change Request 模板

```markdown
# Change Request: CR-001

## 1. Summary

## 2. Type

- Clarification
- New Requirement
- Requirement Change
- Scope Extension
- Scope Reduction
- Design Change
- UI Change
- Prototype Change
- Technical Constraint Change
- Bug-driven Change
- Test-driven Change

## 3. Reason

## 4. Current Spec

## 5. Proposed Change

## 6. Impact Analysis

### PRD Impact

### EARS Impact

### HLD Impact

### UI Spec Impact

### Prototype Impact

### Feature Impact

### Task Impact

### Test Impact

### Evidence Impact

### Release Impact

## 7. Required Updates

- [ ] Update PRD
- [ ] Update EARS Requirements
- [ ] Update HLD
- [ ] Update UI Specification
- [ ] Update Prototype
- [ ] Update Feature Spec
- [ ] Update Tasks
- [ ] Update Tests
- [ ] Invalidate Evidence
- [ ] Re-run Verification

## 8. Decision

- Status:
- Decided By:
- Date:

## 9. Resume Plan
```

---

# 15. Checkpoint 恢复机制

## 15.1 Checkpoint 内容

```yaml
checkpoint:
  id: CKPT-001
  run_id: RUN-001
  task_id: TASK-001
  feature_id: FEAT-001
  state: captured

spec_refs:
  - specs/features/FEAT-001/requirements.md
  - specs/features/FEAT-001/design.md

progress:
  completed:
    - "Created schema"
  current:
    - "Adding tests"
  remaining:
    - "Run tests"
    - "Update evidence"

workspace:
  branch: feat/feat-001
  changed_files:
    - src/intake/schema.ts

adapter:
  type: codex-cli
  adapter_run_id: ADP-001
  resume_supported: true

recovery:
  resume_from: "Adding tests"
  safe_to_retry: true
  idempotency_key: "TASK-001-tests"
```

---

## 15.2 恢复流程

```text
Read Failed Run
  ↓
Read Last Valid Checkpoint
  ↓
Validate Workspace
  ↓
Validate Spec Version
  ↓
Validate Changed Files
  ↓
Detect Partial Work
  ↓
Restore / Resume
  ↓
Run Verification
  ↓
Update Evidence
```

---

## 15.3 不可恢复条件

以下情况不得自动恢复：

1. Spec 已变更且未重新批准。
2. 关键文件被人工修改且无法判断意图。
3. Checkpoint 已失效。
4. Adapter 不支持恢复且工作区不一致。
5. 触发安全策略。
6. 涉及破坏性操作。
7. 需要人工审批但未审批。

---

# 16. Evidence Pack 规范

## 16.1 Evidence Pack 模板

```markdown
# Evidence Pack

## 1. Metadata

- Evidence ID:
- Run ID:
- Feature ID:
- Task ID:
- Adapter:
- Created At:

## 2. Spec References

## 3. Work Summary

## 4. Files Changed

| File | Change Type | Reason |
|---|---|---|

## 5. Commands Run

| Command | Result | Notes |
|---|---|---|

## 6. Test Results

| Test | Result | Related Requirement |
|---|---|---|

## 7. Acceptance Check

| Criteria | Status | Evidence |
|---|---|---|

## 8. Prototype Evidence

| Screen / HTML | Related Feature | Status |
|---|---|---|

## 9. Spec Consistency Check

## 10. Risks

## 11. Follow-ups

## 12. Final Status
```

---

# 17. Traceability Matrix

## 17.1 Requirement Matrix

```markdown
# Requirement Traceability Matrix

| Requirement ID | PRD | HLD | UI Spec | Prototype | Feature | Task | Test | Status |
|---|---|---|---|---|---|---|---|---|
| REQ-001 | 8.1 | Module A | Screen A | dashboard.png | FEAT-001 | TASK-001 | test-001 | Verified |
```

---

## 17.2 Feature Matrix

```markdown
# Feature Traceability Matrix

| Feature ID | Requirements | Design | Tasks | Code | Tests | Evidence | Status |
|---|---|---|---|---|---|---|---|
| FEAT-001 | REQ-001 | design.md | tasks.md | src/intake | tests/intake | evidence.md | Accepted |
```

---

## 17.3 Change Matrix

```markdown
# Change Traceability Matrix

| Change ID | Type | Affected Specs | Affected Features | Affected Tasks | Status |
|---|---|---|---|---|---|
| CR-001 | Requirement Change | PRD, EARS | FEAT-001 | TASK-001 | Applied |
```

---

# 18. Definition of Ready

Feature 进入执行前必须满足：

```markdown
# Definition of Ready

- [ ] Feature 已登记
- [ ] 需求已批准
- [ ] 设计已批准
- [ ] 任务已批准
- [ ] 有明确 Spec Refs
- [ ] 有明确 Allowed Paths
- [ ] 有明确 Forbidden Paths
- [ ] 有明确 Adapter
- [ ] 有明确验收标准
- [ ] 有测试策略
- [ ] 有审批策略
- [ ] 有 Checkpoint 策略
- [ ] 无阻塞 Open Questions
```

---

# 19. Definition of Done

Feature 完成必须满足：

```markdown
# Definition of Done

- [ ] 所有任务完成
- [ ] 所有任务验证通过
- [ ] 所有验收标准通过
- [ ] 测试通过
- [ ] Evidence Pack 完整
- [ ] Audit Log 完整
- [ ] Traceability Matrix 已更新
- [ ] Prototype 证据已更新，若适用
- [ ] 无 forbidden paths 违规
- [ ] 无未处理 Change Request
- [ ] Review Gate 通过
- [ ] Feature 状态为 Accepted
```

---

# 20. agentic-spec-driven-auto-build 产品章节

本章不是 Agentic Spec Standard 的一部分，而是基于该标准的一个具体产品实现建议。

产品名称：

```text
agentic-spec-driven-auto-build
```

定位：

```text
实现 / 管理 / 可视化 / 调度 Agentic Spec 的自动化构建管理系统。
```

---

## 20.1 产品边界

agentic-spec-driven-auto-build 可以实现：

1. Agentic Spec 项目初始化。
2. 主线文档管理。
3. Feature Spec 管理。
4. Skill Registry。
5. Adapter Registry。
6. Agent Run 调度。
7. Subagent 调度。
8. Task DAG。
9. 状态看板。
10. 审批中心。
11. Checkpoint 管理。
12. Recovery 控制台。
13. Audit Log 查看。
14. Evidence Pack 查看。
15. Traceability Matrix 可视化。
16. Web Console。
17. IDE 插件。
18. CLI。
19. RPC API。
20. 与 Codex CLI / MCP / CI / Git Provider 集成。

---

## 20.2 产品功能模块

```text
agentic-spec-driven-auto-build
  ├── Spec Manager
  ├── Feature Manager
  ├── Task Planner
  ├── Workflow Engine
  ├── Skill Registry
  ├── Adapter Registry
  ├── Agent Runtime Orchestrator
  ├── Subagent Dispatcher
  ├── Checkpoint Manager
  ├── Recovery Manager
  ├── Approval Center
  ├── Evidence Center
  ├── Audit Center
  ├── Traceability Viewer
  ├── Web Console
  ├── IDE Extension
  └── CLI / API
```

---

## 20.3 不应混入标准的内容

以下内容不得写入 Agentic Spec Standard 的通用模板：

1. 产品自己的页面设计。
2. 产品自己的数据库表。
3. 产品自己的用户角色。
4. 产品自己的商业模式。
5. 产品自己的部署方案。
6. 产品自己的看板交互。
7. 产品自己的权限模型。
8. 产品自己的运营后台。
9. 产品自己的菜单结构。
10. 产品自己的 UI 组件库。

这些应进入：

```text
agentic-spec-driven-auto-build 的 PRD / HLD / UI Spec / Feature Spec
```

---

# 21. 最小合规标准

一个项目符合 Agentic Spec Standard v1.2，至少需要：

```text
specs/mainline/00-project-intake.md
specs/mainline/01-prd.md
specs/mainline/02-ears-requirements.md
specs/mainline/03-hld.md
specs/mainline/06-feature-index.md
specs/features/<FEATURE-ID>/requirements.md
specs/features/<FEATURE-ID>/design.md
specs/features/<FEATURE-ID>/tasks.md
specs/features/<FEATURE-ID>/status.yaml
specs/features/<FEATURE-ID>/evidence.md
.agentic-spec/config.yaml
.agentic-spec/workflow.yaml
.agentic-spec/skills.yaml
.agentic-spec/adapters.yaml
runs/<RUN-ID>/checkpoint.yaml
runs/<RUN-ID>/audit.jsonl
runs/<RUN-ID>/evidence.md
```

如果项目包含 UI，还必须包含：

```text
specs/mainline/04-ui-specification.md
specs/mainline/05-high-fidelity-prototype/
```

并且 `05-high-fidelity-prototype/` 中必须至少包含：

```text
PNG 高保真原型
或
HTML 高保真原型
```

---

# 22. 一句话总结

**Agentic Spec Standard v1.2 是一套面向 AI Agent 自动化软件开发的通用工程标准：它以 Spec 为事实源，以状态机串联全过程，以 Skill 规范化复用能力，以 Execution Adapter 连接真实工具，以 Checkpoint 实现恢复，以 Evidence Pack 和 Audit Log 保证可验收、可追踪、可审计；而 agentic-spec-driven-auto-build 是该标准的一个具体管理和调度产品实现，不应与标准本身混淆。**

[1]: https://openai.github.io/openai-agents-python/agents/?utm_source=chatgpt.com "OpenAI Agents SDK"
[2]: https://help.openai.com/en/articles/20001066-skills-in-chatgpt?utm_source=chatgpt.com "Skills in ChatGPT"
[3]: https://openai.github.io/openai-agents-python/results/?utm_source=chatgpt.com "Results - OpenAI Agents SDK"
[4]: https://developers.openai.com/codex/cli?utm_source=chatgpt.com "Codex CLI"
[5]: https://openai.github.io/openai-agents-python/handoffs/?utm_source=chatgpt.com "Handoffs - OpenAI Agents SDK"
