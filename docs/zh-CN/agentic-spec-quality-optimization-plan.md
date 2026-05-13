# Agentic Spec 质量优化方案

> 状态：方案草案 v1.0
> 适用项目：`agentic-spec-driven-auto-build`
> 核心目标：通过完善 Agentic Spec、质量门禁、证据链和 Adapter 执行边界，提高 AI 自动开发交付质量，避免“文字描述完成但应用不可用”的问题。

> 2026-05-12 实施边界更新：VSCode IDE Webview 是质量闭环主界面。Execution Workbench 与 Feature Spec 详情优先展示质量证据、ReviewItem、Workpad、日志、截图/trace 和 PR/check 状态；Product Console 定位为历史遗留兼容面，除现有接口/测试依赖外不新增主要质量 UI。

---

## 1. 背景

`agentic-spec-driven-auto-build` 的目标不是让 Agent 只生成代码，而是让 AI 软件开发进入可治理、可恢复、可审计、可验证的工程交付流程。

现有仓库已经具备较强的 Agentic Spec 基础：

- `docs/zh-CN/agentic-spec-standard.md` 定义了通用 Agentic Spec 标准。
- `.agents/skills/` 定义了需求、规划、执行、测试、评审、恢复、交付等工作流 Skill。
- `caller-provided output schema and skill-local references/specdrive-output.md` 定义了结构化 Skill 输出契约。
- `src/spec-protocol.ts` 定义了 Feature Spec、File Spec State、Requirement、Acceptance Criteria、Test Scenario 等数据结构。
- `src/status-checker.ts` 已经实现 runner 状态、命令检查、diff 风险、allowed/forbidden files、secret findings、spec alignment 等检查。
- `src/memory.ts` 已经实现 Project Memory、版本记录、压缩、回滚、恢复注入文本。
- `src/projects.ts` 已经实现 Project Constitution，并会写入 `.autobuild/memory/constitution.md`。
- `.agents/templates/project-AGENTS.md` 已经作为目标项目的 SpecDrive 操作合同模板。

本方案参考 `openai/symphony` 的工程化思想，但不照搬其架构。Symphony 的核心启发是：

```text
不要只相信 Agent 的完成声明；
必须用工作区隔离、状态机、Workpad、PR/CI、运行验证、用户旅程证据来证明交付质量。
```

SpecDrive 的方向应更进一步：

```text
用 Spec 定义质量，
用 Skill 执行流程，
用 Evidence 证明结果，
用 Gate 阻止虚假完成，
用 Status Checker 和 Review Center 统一裁决交付状态。
```

---

## 2. 当前主要问题

### 2.1 质量规则较完整，但部分仍停留在 Prompt / Skill 约束层

当前很多质量要求已经写入：

- `agentic-spec-standard.md`
- 旧全局输出合同文件
- `implement-feature/SKILL.md`
- `verify-behavior/SKILL.md`
- `review-delivery-evidence/SKILL.md`

但部分规则仍依赖 Agent 自觉遵守。系统层还需要进一步强制：

- Feature 是否真的满足 `requirementCoverage`。
- Acceptance 是否有直接证据。
- User Journey 是否闭环。
- UI/App 变更是否真实启动、真实交互、真实状态变更。
- Delivery Fidelity 是否存在未关闭损失。
- Git Delivery 是否真的完成 commit / PR / checks / merge / cleanup。
- Project Memory / Constitution 是否以正确方式进入执行上下文。

### 2.2 Status Checker 更偏工程检查，还未完全升级为产品完成检查

当前 `StatusChecker` 已经能判断：

- runner 是否失败。
- required commands 是否缺失。
- diff 是否触碰高风险文件。
- 是否存在 unauthorized / forbidden files。
- 是否存在 secret pattern。
- spec alignment 是否缺失。

但还需要增强对以下内容的一等判断：

- `requirementCoverage`
- `acceptanceEvidence`
- `journeyEvidence`
- `runtimeEvidence`
- `deliveryFidelity`
- `gitDelivery`
- app launch / browser trace / screenshot / state assertion / reload persistence

### 2.3 Project Memory 和 Constitution 已存在，但 Adapter 注入边界需要重新定义

现有项目已经有：

```text
.autobuild/memory/project.md
.autobuild/memory/constitution.md
AGENTS.md
```

因此不应新增一套与它们并列的 `WORKFLOW.md` 或强上下文系统。

更合理的定位是：

```text
CLI / Agent Runtime = 强上下文管理
Adapter Prompt = 弱上下文注入 + 任务执行边界 + 外部状态补丁
```

Adapter Prompt 不应负责把 PRD、HLD、Feature Spec、AGENTS.md、Memory、Constitution 全文塞进 Prompt。CLI 已经具备 repo 文件读取、AGENTS.md 理解、Skill 发现、会话和上下文管理能力。

Adapter Prompt 应只提供 CLI 无法可靠从仓库文件中推断的控制面事实。

---

## 3. 优化目标

### 3.1 总目标

通过完善 Agentic Spec 质量机制，使 AI 自动开发交付从：

```text
Agent 说完成
```

升级为：

```text
Spec 覆盖 + 验收证据 + 用户旅程闭环 + 运行证据 + 独立评审 + Git 交付证据共同证明完成
```

### 3.2 具体目标

1. **阻止虚假完成**

   Agent 返回 `completed` 不等于 Feature 完成，必须经过系统质量门禁裁决。

2. **强化用户旅程闭环**

   UI/App 变更必须证明用户路径可运行、可交互、状态正确、错误路径可处理。

3. **把 Prompt 规则升级为代码门禁**

   关键质量约束不只写在 Skill 里，还必须由 Completion Gate / Status Checker 强制判断。

4. **弱化 Adapter Prompt 的上下文职责**

   Adapter Prompt 只提供任务、边界、外部状态补丁和输出契约，不替代 CLI 的上下文管理。

5. **把 Symphony 式 workflow policy 并入项目记忆体系**

   不新增独立 Workflow Contract，而是利用 Project Memory、Constitution、AGENTS.md 和 Invocation Manifest。

6. **提升可恢复与可审计性**

   每次执行都记录 memory/constitution/agents refs、版本、checksum、质量门禁结果和证据引用。

---

## 4. 设计原则

### P1. Spec 是事实源，但不是执行上下文全文

Spec 文件是事实源。Adapter 不应复制全文，而应传递引用：

```text
传引用，不传全文；
传约束，不传冗余；
传状态，不传重复上下文；
传 Evidence，不传不可验证叙述。
```

### P2. Adapter 是执行适配器，不是 Agent Runtime

Adapter 的职责：

- 构建一次执行 invocation。
- 传递当前任务、边界、运行策略和输出契约。
- 注入控制面外部状态补丁。
- 收集结果、日志和结构化输出。
- 将结果交给 Status Checker / Review Center。

Adapter 不负责：

- 代替 CLI 理解整个仓库。
- 代替 CLI 读取 AGENTS.md。
- 代替 CLI 发现 Skill。
- 代替 CLI 管理长上下文。
- 把所有 Spec 全文塞进 Prompt。

### P3. Completion 只能由 Gate 判定

实现 Agent 可以提出完成，但不能拥有最终完成判定。

```text
Agent Output = Proposal
Evidence = Input
Completion Gate = Product Closure Decision
Status Checker = State Decision
Review Center = Human/Risk Decision
```

### P4. UI/App 质量必须以运行证据为核心

对用户可见功能，不能只检查：

- 文件存在。
- 页面文案存在。
- mock test 通过。
- API fixture 通过。
- 单元测试通过。

必须证明：

- 应用可以启动。
- 目标路由可访问。
- 用户操作可完成。
- 状态真实变化。
- reload 后状态正确。
- 错误/空/权限路径可处理。
- 有 screenshot / trace / log / assertion 证据。

### P5. Project Memory 是恢复投影，不是事实源替代品

Project Memory 用于恢复和执行提示，但不能替代 DB、Git、Spec State、Review Records、Runtime Evidence。

当 memory 与权威事实冲突时：

```text
DB / Git / spec-state / runtime evidence / review records 优先；
memory 需要被修正并记录 correction。
```

---

## 5. 优化方案总览

本方案包含 5 组核心优化：

```text
O1. Feature Completion Gate
O2. Runtime Evidence / App Usability Gate
O3. Status Checker 产品闭环增强
O4. Run Workpad
O5. Invocation Context Manifest：项目记忆、宪章、AGENTS 与 Adapter Prompt 弱上下文集成
```

其中 O5 是对前期“Workflow Contract”设想的修正版：

```text
不新增独立 WORKFLOW.md；
不让 Adapter Prompt 强上下文注入；
将 workflow policy 合并进 Project Memory / Constitution / AGENTS / Invocation Manifest。
```

---

## 6. O1：Feature Completion Gate

### 6.1 目标

防止 Agent 仅通过 `status: completed` 绕过质量检查。

### 6.2 新增模块

建议新增：

```text
src/quality-gates.ts
```

核心函数：

```ts
export type FeatureCompletionGateResult = {
  status: "completed" | "review_needed" | "blocked" | "failed";
  reason?: string;
  triggers: string[];
  details: string[];
};

export function validateFeatureCompletion(input: {
  skillOutput: SkillOutputContract;
  invocation: ExecutionAdapterInvocationV1;
  changedFiles?: string[];
  expectedArtifacts?: SkillArtifactContract[];
  appRuntimePolicy?: AppRuntimePolicy;
}): FeatureCompletionGateResult;
```

### 6.3 强制规则

当 `requestedAction = feature_execution` 时：

1. `contractVersion` 必须是 `skill-contract/v2`。
2. `result.requirementCoverage` 必须是非空数组。
3. `result.acceptanceEvidence` 必须是非空数组。
4. `result.journeyEvidence` 必须是非空数组，除非存在合法 `foundationExemption`。
5. `result.deliveryFidelity` 必须存在。
6. `deliveryFidelity.completionDecision.status` 必须是 `passed` 或 `completed`。
7. 不允许存在 open P0/P1 losses。
8. P2 losses 必须 `closed`、`accepted` 或 `deferred` 并有 owner / evidence。
9. `result.gitDelivery` 必须完整，或存在明确批准过的 `deliveryExemption`。
10. 如果 touched files 命中 UI/App 规则，必须存在 `runtimeEvidence`。

### 6.4 降级规则

```text
缺 requirementCoverage       => review_needed(acceptance_gap)
缺 acceptanceEvidence        => review_needed(acceptance_gap)
缺 journeyEvidence           => review_needed(journey_not_closed)
缺 runtimeEvidence           => review_needed(evidence_missing)
fixture 代替用户旅程          => review_needed(journey_bypassed_by_fixture)
open P0/P1 loss              => review_needed(quality_evidence_gap)
缺 gitDelivery               => review_needed(delivery_evidence_missing)
PR/checks/merge 阻塞          => approval_needed / blocked
```

### 6.5 接入位置

质量门禁应在写入最终执行状态前运行：

```text
Adapter parses SkillOutput
  -> validate SkillOutputContract
  -> validateFeatureCompletion
  -> adjust result.status when gate fails
  -> persist execution_records
  -> update spec-state.json
  -> create Review Center item when needed
```

---

## 7. O2：Runtime Evidence / App Usability Gate

### 7.1 目标

解决“文字描述功能都有，但应用不能用”的核心问题。

### 7.2 新增结构

建议在 `SkillOutputContractV2.result` 中新增：

```json
{
  "runtimeEvidence": {
    "appLaunch": {
      "command": "npm run dev",
      "status": "passed",
      "url": "http://localhost:5173",
      "evidence": [".autobuild/runs/RUN-001/app-launch.log"]
    },
    "journeys": [
      {
        "journeyId": "J-001",
        "status": "passed",
        "mode": "browser",
        "steps": ["open", "click", "submit", "observe", "reload"],
        "evidence": ["trace.zip", "screenshot.png"]
      }
    ],
    "stateAssertions": [
      {
        "assertion": "created item remains visible after reload",
        "status": "passed",
        "evidence": ["trace.zip"]
      }
    ],
    "negativePaths": [
      {
        "scenario": "invalid input shows validation error",
        "status": "passed",
        "evidence": ["screenshot-invalid-input.png"]
      }
    ]
  }
}
```

### 7.3 App-touching 文件判断

默认命中以下路径时要求 runtime evidence：

```text
apps/**
src/pages/**
src/components/**
src/routes/**
src/app/**
src/ui/**
**/*.tsx
**/*.jsx
**/*.vue
**/*.svelte
```

项目可通过 Project Constitution 或 future policy 扩展匹配规则。

### 7.4 验收要求

UI/App 变更至少需要证明：

- 应用启动成功。
- 目标页面或路由可访问。
- 变更相关的主用户路径可完成。
- 至少一个状态变化可观察。
- reload 后关键状态仍正确，除非 Feature 明确是无状态功能。
- 至少一个负向或边界路径被验证。
- 有 screenshot、trace、log 或等效证据。

---

## 8. O3：Status Checker 产品闭环增强

### 8.1 目标

将 `StatusChecker` 从工程执行检查升级为产品完成检查。

### 8.2 类型扩展

建议扩展 `CommandCheckKind`：

```ts
type CommandCheckKind =
  | "build"
  | "unit_test"
  | "integration_test"
  | "browser_e2e"
  | "app_launch"
  | "journey_runtime"
  | "state_assertion"
  | "reload_persistence"
  | "negative_path"
  | "typecheck"
  | "lint"
  | "security_scan"
  | "secret_scan"
  | "custom";
```

在 `StatusCheckerInput` 中增加：

```ts
type CompletionEvidenceInput = {
  requirementCoverage?: unknown[];
  acceptanceEvidence?: unknown[];
  journeyEvidence?: unknown[];
  runtimeEvidence?: unknown;
  deliveryFidelity?: unknown;
  gitDelivery?: unknown;
};
```

### 8.3 决策顺序

新的 Status Checker 决策顺序：

```text
1. runner 是否失败
2. diff/file/security 是否存在阻断风险
3. required command checks 是否完整
4. spec alignment 是否通过
5. requirementCoverage 是否完整
6. acceptanceEvidence 是否完整
7. journeyEvidence 是否完整
8. app runtime evidence 是否完整
9. deliveryFidelity 是否存在 open loss
10. gitDelivery 是否闭环
11. 才允许 done/completed
```

### 8.4 Review Center 路由

新增或复用以下 review triggers：

```text
journey_not_closed
acceptance_gap
evidence_missing
quality_evidence_gap
test_semantics_gap
journey_bypassed_by_fixture
delivery_evidence_missing
delivery_not_closed
```

---

## 9. O4：Run Workpad

### 9.1 目标

为每次长时间执行创建动态工作底稿，承接 Symphony 的 Workpad 思想，但不依赖外部 issue comment。

### 9.2 文件位置

```text
.autobuild/runs/<executionId>/WORKPAD.md
.autobuild/runs/<executionId>/workpad.json
```

`.autobuild/runs/` 已经被初始化逻辑加入 `.gitignore`，适合保存本地运行证据。

### 9.3 Workpad 内容

```markdown
# AutoBuild Workpad

```text
<workspace>@<short-sha>
```

## Plan

- [ ] ...

## Requirement Coverage

- [ ] REQ-001 ...

## Acceptance Criteria

- [ ] AC-001 ...

## Journey Checkpoints

- [ ] J-001: user can complete primary flow

## Runtime Validation

- [ ] App starts
- [ ] Target route opens
- [ ] Primary interaction succeeds
- [ ] State mutation observed
- [ ] Reload persistence verified
- [ ] Negative path verified
- [ ] Screenshot/trace attached

## Review Findings

- [ ] Code review finding resolved
- [ ] Test gap resolved

## Evidence

| Type | Ref | Status |
|---|---|---|

## Confusions

- ...
```

### 9.4 职责分工

```text
Feature Spec = 事实源
Workpad = 本次执行过程事实
SkillOutputContract = 最终结构化结果
Quality Gate = 完成裁决
StatusChecker = 状态裁决
ReviewCenter = 风险/人工裁决
```

### 9.5 Gate 关系

Feature Completion Gate 可读取 Workpad 摘要，但不能只相信 Workpad 勾选项。Workpad 是证据索引和过程记录，不是最终判定者。

---

## 10. O5：Invocation Context Manifest

### 10.1 目标

替代前期“新增独立 Workflow Contract”的思路，将 Symphony 式 workflow policy 合并进已有 Project Memory / Constitution / AGENTS 体系。

Adapter Prompt 应保持弱上下文管理能力。

### 10.2 设计结论

不新增：

```text
WORKFLOW.md
独立 workflow.yaml
全量 Project Context Bundle
```

改为新增：

```text
Invocation Context Manifest
```

它不是大上下文，而是一次执行的清单、边界和外部状态补丁。

### 10.3 分工

```text
AGENTS.md
  静态操作合同。告诉 Agent 应读什么、如何处理 Spec、Memory、Constitution、Skill、Evidence。

Project Memory
  动态恢复投影。记录 current task、board snapshot、last run、blockers、pending approvals、failure patterns。

Project Constitution
  项目治理约束。记录 project goal、engineering principles、boundary rules、approval rules、default constraints。

Adapter Prompt
  本次执行 envelope。只提供 CLI 无法可靠知道的外部状态、任务边界和输出契约。

CLI / Agent Runtime
  负责强上下文管理：读取 repo 文件、理解 AGENTS.md、发现 Skill、分析代码、执行测试、维护会话。
```

### 10.4 CLI 已能管理的上下文

Adapter 不应全文注入以下内容：

```text
AGENTS.md
.agents/skills/*/SKILL.md
docs/PRD.md
docs/requirements.md
docs/hld.md
docs/features/<feature-id>/*
源码文件
测试文件
package.json / scripts
git status
本地 workspace 文件
```

这些由 CLI 自己读取。

### 10.5 CLI 不能可靠推断的上下文

Adapter Prompt 应注入以下最小外部事实：

```text
executionId
schedulerJobId
attempt / retry / resume reason
control plane 当前选中的 project / feature / task
Review Center pending decision
上次失败原因
blockers
prohibited operations
pending approvals
allowed files / forbidden files
required verification
runner policy
adapter policy
output contract
memory / constitution / AGENTS refs + checksum
```

### 10.6 Manifest 类型建议

```ts
export type InvocationContextManifest = {
  run: {
    executionId: string;
    schedulerJobId?: string;
    attempt?: number;
    mode: "first_run" | "retry" | "resume";
    resumeReason?: string;
  };

  project: {
    projectId: string;
    workspaceRoot: string;
    memoryRef?: {
      path: ".autobuild/memory/project.md";
      version?: number;
      checksum?: string;
    };
    constitutionRef?: {
      path: ".autobuild/memory/constitution.md";
      version?: number;
      checksum?: string;
    };
    agentsRef?: {
      path: "AGENTS.md";
      checksum?: string;
    };
  };

  task: {
    featureId?: string;
    taskId?: string;
    requestedAction: string;
    skillName: string;
    sourceRefs: string[];
  };

  controlPlaneFacts: {
    blockers: string[];
    prohibitedOperations: string[];
    pendingApprovals: string[];
    lastRunSummary?: string;
    resumeTarget?: string;
  };

  constraints: {
    allowedFiles: string[];
    forbiddenFiles: string[];
    requiredCommands: string[];
    risk: string;
    sandboxMode: string;
    approvalPolicy: string;
  };

  output: {
    contractVersion: "skill-contract/v1" | "skill-contract/v2";
    requiredFields: string[];
  };
};
```

### 10.7 Adapter Prompt 模板

```text
[AUTOBUILD INVOCATION]

You are executing a SpecDrive AutoBuild task through <adapter-id>.

Do not rely only on this prompt for repository context.
Read the referenced project files directly.

Run:
- executionId: <id>
- schedulerJobId: <id>
- attempt: <n>
- mode: first_run | retry | resume

Project references:
- AGENTS.md
- .autobuild/memory/project.md
- .autobuild/memory/constitution.md
- docs/features/<feature-id>/requirements.md
- docs/features/<feature-id>/design.md
- docs/features/<feature-id>/tasks.md
- docs/features/<feature-id>/spec-state.json

Control-plane facts not guaranteed to be derivable from repo files:
- Current selected Feature: <feature-id>
- Current selected Task: <task-id>
- Resume target: <resume-target>
- Blockers: <compact list>
- Prohibited operations: <compact list>
- Pending approvals: <compact list>
- Last failed run: <compact summary>

Execution boundary:
- Allowed files:
- Forbidden files:
- Required verification:
- Sandbox:
- Approval policy:

Output:
Return exactly one SkillOutputContract.
For feature_execution, return skill-contract/v2 and include:
- requirementCoverage
- acceptanceEvidence
- journeyEvidence
- deliveryFidelity
- gitDelivery
- runtimeEvidence when UI/app behavior is changed

[/AUTOBUILD INVOCATION]
```

### 10.8 AGENTS.md 模板补充

建议在 `.agents/templates/project-AGENTS.md` 中增加：

```md
## Project Memory And Constitution

- Treat `.autobuild/memory/project.md` as a recovery projection, not the authoritative source of truth.
- Treat `.autobuild/memory/constitution.md` as the project governance constraint file.
- Read both files before scheduled execution, recovery, review, or delivery.
- If memory conflicts with DB, Git, Feature `spec-state.json`, Review records, or runtime evidence, prefer authoritative facts and record the correction.
- Do not copy full memory or constitution content into generated specs. Reference paths and preserve evidence.
```

---

## 11. 实施计划

### P0：立即实施

#### P0-1. Feature Completion Gate

新增：

```text
src/quality-gates.ts
tests/quality-gates.test.ts
```

测试覆盖：

- `feature_execution` 使用 v1 contract => `review_needed`
- 缺 `journeyEvidence` => `review_needed(journey_not_closed)`
- 缺 `acceptanceEvidence` => `review_needed(acceptance_gap)`
- `deliveryFidelity` 有 open P1 loss => `review_needed(quality_evidence_gap)`
- `gitDelivery` 缺 PR/commit/checks => `review_needed(delivery_evidence_missing)`
- 合法 `foundationExemption` => 允许完成

#### P0-2. Status Checker 接入 Completion Evidence

修改：

```text
src/status-checker.ts
```

新增 `completionEvidence` 输入和相关 decision logic。

#### P0-3. 更新 SkillOutputContract v2

修改：

```text
caller-provided output schema and skill-local references/specdrive-output.md
.agents/skills/implement-feature/SKILL.md
.agents/skills/verify-behavior/SKILL.md
.agents/skills/review-delivery-evidence/SKILL.md
```

补充 `runtimeEvidence` 字段与 app usability gate 要求。

### P1：短期实施

#### P1-1. Invocation Context Manifest

新增：

```text
src/invocation-context.ts
tests/invocation-context.test.ts
```

修改：

```text
src/scheduler.ts
src/cli-adapter.ts
src/codex-rpc-adapter.ts
src/gemini-rpc-adapter.ts
```

目标：所有 Adapter prompt 都包含 manifest，而不是全文上下文。

#### P1-2. AGENTS.md 模板补充 Memory / Constitution 规则

修改：

```text
.agents/templates/project-AGENTS.md
```

测试：

```text
tests/projects.test.ts
```

#### P1-3. Run Workpad

新增：

```text
src/workpad.ts
tests/workpad.test.ts
```

在 run 创建时生成初始 Workpad。

### P2：中期实施

#### P2-1. VSCode Webview 显示质量门禁

展示：

- Requirement Coverage
- Acceptance Evidence
- Journey Evidence
- Runtime Evidence
- Delivery Fidelity Losses
- Git Delivery
- Workpad
- 日志 / screenshots / traces
- PR / checks
- Review Center 状态

Product Console 只保留历史兼容与系统设置/调试入口，不作为新增质量闭环主 UI，也不得作为 VSCode Webview 的 ViewModel 或组件来源。

#### P2-2. Evidence Pack Browser

支持浏览：

- 命令日志
- screenshots
- traces
- PR links
- review findings
- runtime assertions

#### P2-3. PR Feedback Sweep 集成

参考 Symphony，将 PR comments、inline review、checks 状态纳入 delivery gate。

---

## 12. 测试与验收标准

### 12.1 Invocation Context Manifest 测试

必须验证：

- Prompt 包含 `AUTOBUILD INVOCATION`。
- Prompt 包含 `AGENTS.md` 引用。
- Prompt 包含 `.autobuild/memory/project.md` 引用。
- Prompt 包含 `.autobuild/memory/constitution.md` 引用。
- Prompt 包含 executionId / schedulerJobId / featureId / taskId。
- Prompt 包含 blockers / prohibited operations / pending approvals。
- Prompt 不包含 memory / constitution 全文。

示例：

```ts
assert.match(prompt, /AUTOBUILD INVOCATION/);
assert.match(prompt, /\.autobuild\/memory\/project\.md/);
assert.match(prompt, /\.autobuild\/memory\/constitution\.md/);
assert.match(prompt, /executionId/);
assert.match(prompt, /allowedFiles/);
assert.doesNotMatch(prompt, /# Project Memory:/);
assert.doesNotMatch(prompt, /# .* Constitution/);
```

### 12.2 Completion Gate 测试

必须验证：

- Agent 返回 `completed` 但证据缺失时，系统降级为 `review_needed`。
- UI/App 变更无 `runtimeEvidence` 时，不允许完成。
- 有 open P0/P1 losses 时，不允许完成。
- 缺 Git Delivery 证据时，不允许完成。

### 12.3 Status Checker 测试

必须验证：

- 仅 command checks 通过但无 journey evidence，不允许 `done`。
- 仅 API fixture 通过但无用户旅程证据，返回 `journey_bypassed_by_fixture`。
- runtime evidence 完整且 coverage 完整时，允许进入完成态。

### 12.4 Workpad 测试

必须验证：

- run 创建时生成 Workpad。
- Workpad 包含 Plan / Acceptance / Journey / Runtime Validation / Evidence。
- Workpad 路径写入 execution metadata。
- Workpad 缺失不应直接导致成功，应进入 review 或 warning。

---

## 13. 非目标

本方案不做以下事情：

1. 不新增独立 `WORKFLOW.md` 作为新的事实源。
2. 不把 Adapter Prompt 设计成强上下文注入系统。
3. 不把全部 PRD/HLD/Feature Spec 内容注入 Prompt。
4. 不替代 CLI 的 AGENTS.md / Skill / 文件读取能力。
5. 不把 Project Memory 当作权威事实源。
6. 不让实现 Agent 自己拥有最终完成判定。
7. 不要求所有项目一开始都有完整 UI runtime validation；Foundation Feature 可以通过合法 exemption 过渡。

---

## 14. 最终目标形态

优化完成后，SpecDrive 的质量闭环应为：

```text
Agentic Spec
  定义事实、边界、旅程、验收、证据要求

Project Memory
  提供恢复投影和控制面状态摘要

Project Constitution
  提供项目治理约束和审批边界

AGENTS.md
  提供静态操作合同和文件读取规则

Invocation Context Manifest
  为一次 Adapter 执行提供任务、引用、边界、外部状态补丁和输出契约

Skill
  执行可复用工程流程

Adapter
  连接 Codex / Claude / Gemini / RPC / CLI

Workpad
  记录本次执行过程事实

Evidence
  证明行为真实发生

Quality Gates
  用代码强制判断是否可完成

Status Checker
  统一裁决状态

Review Center
  接管不完整、不可信、高风险交付
```

一句话总结：

```text
Adapter 不做强上下文管理，
Agentic Spec 不只写质量要求，
Completion Gate 必须用证据阻止虚假完成。
```
