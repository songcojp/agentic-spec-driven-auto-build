# Product Usability Autonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build FEAT-024 so SpecDrive proves product usability with protocol-backed skill wrappers, durable decision/gap/evidence records, gate/status enforcement, ReviewItem projection, and Execution Workbench evidence display.

**Architecture:** Add a protocol convergence layer that turns mature skill-library practices into SpecDrive-owned structures: `LifecycleHandoff`, `SkillWrapperContract`, `DecisionLog`, `ProtocolGap`, `UsabilityEvidence`, and `ReferencePatternMap`. The docs define the human protocol; `src/` defines TypeScript contracts, validators, gate inputs, ReviewItem payloads, and IDE view-model structures. Product Usability Gate extends the existing FEAT-023 quality gates and feeds Scheduler, Review Center, Status Checker, and VSCode Execution Workbench.

**Tech Stack:** Markdown Feature Specs, project-local `SKILL.md` files, TypeScript on Node, `node:test`, SQLite-backed execution/review projection, VSCode Webview TypeScript, existing `npm run skills:validate`, `npm run ide:build`.

---

## File Structure

- Create: `docs/agentic-spec/features/feat-024-product-usability-autonomy/requirements.md`
  - Responsibility: FEAT-024 requirements, user stories, acceptance criteria, and non-goals.
- Create: `docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md`
  - Responsibility: protocol convergence design, data flow, structures, runtime integration, and IDE projection.
- Create: `docs/agentic-spec/features/feat-024-product-usability-autonomy/tasks.md`
  - Responsibility: implementation tasks matching this plan.
- Create: `docs/agentic-spec/features/feat-024-product-usability-autonomy/spec-state.json`
  - Responsibility: machine-readable Feature lifecycle state.
- Modify: `docs/agentic-spec/features/README.md`
  - Responsibility: add FEAT-024 to Feature index and dependency tree.
- Modify: `docs/agentic-spec/features/feature-pool-queue.json`
  - Responsibility: add FEAT-024 as a P0 feature after FEAT-023.
- Modify: `docs/agentic-spec/zh-CN/agentic-spec-standard.md`
  - Responsibility: define Product Usability Autonomy and protocol convergence primitives in the mainline standard.
- Modify: `docs/agentic-spec/zh-CN/skills.md`
  - Responsibility: define SkillWrapperContract expectations for local skills.
- Modify: `docs/agentic-spec/zh-CN/skill-refact.md`
  - Responsibility: point Pattern-First Phase 1 toward FEAT-024 bidirectional convergence.
- Create: `docs/agentic-spec/references/mature-skill-pattern-map.md`
  - Responsibility: source-backed skill/workflow-level ReferencePatternMap.
- Create: `src/product-usability.ts`
  - Responsibility: protocol types, validators, normalizers, and Product Usability Gate assessment.
- Modify: `src/quality-gates.ts`
  - Responsibility: call Product Usability Gate from `validateFeatureCompletion`.
- Modify: `src/cli-adapter.ts`
  - Responsibility: include Product Usability contract validation reasons in SkillOutputContract validation.
- Modify: `src/status-checker.ts`
  - Responsibility: include Product Usability evidence in completion evidence checks.
- Modify: `src/review-center.ts`
  - Responsibility: add `product_usability_gap` and carry protocol gap payloads.
- Modify: `src/scheduler.ts`
  - Responsibility: classify Product Usability Gate failures as `risk_review_needed`.
- Modify: `src/specdrive-ide.ts`
  - Responsibility: project `DecisionLog`, `ProtocolGap`, `UsabilityEvidence`, `LifecycleHandoff`, and Product Usability Gate result into IDE execution detail and feature nodes.
- Modify: `apps/vscode-extension/src/types.ts`
  - Responsibility: mirror the IDE protocol evidence types used by Webviews.
- Modify: `apps/vscode-extension/src/webviews/execution.ts`
  - Responsibility: render Product Usability evidence in Execution Workbench.
- Modify: `.agents/skills/refine-product-intent/SKILL.md`
  - Responsibility: require SkillWrapperContract fields, decision log, and Open Question classification.
- Modify: `.agents/skills/generate-user-stories/SKILL.md`
  - Responsibility: require story/journey/usability evidence handoff.
- Modify: `.agents/skills/validate-requirements/SKILL.md`
  - Responsibility: enforce Blocking Open Question and product usability readiness.
- Modify: `.agents/skills/decompose-feature-specs/SKILL.md`
  - Responsibility: require lifecycle handoffs and Product Usability Gate evidence plan.
- Modify: `.agents/skills/implement-feature/SKILL.md`
  - Responsibility: require protocol-backed completion evidence for P0/P1 stories.
- Modify: `.agents/skills/verify-behavior/SKILL.md`
  - Responsibility: require user journey and runtime evidence verification.
- Modify: `.agents/skills/review-delivery-evidence/SKILL.md`
  - Responsibility: review Product Usability Gate, protocol gaps, and decision logs.
- Modify: `.agents/skills/use-specdrive-lifecycle/SKILL.md`
  - Responsibility: route lifecycle-wide work through Product Usability Autonomy when scope crosses product usability, protocol convergence, and IDE evidence.
- Create: `tests/product-usability.test.ts`
  - Responsibility: protocol validators and Product Usability Gate unit coverage.
- Modify: `tests/quality-gates.test.ts`
  - Responsibility: Product Usability Gate integration with Feature Completion Gate.
- Modify: `tests/status-checker.test.ts`
  - Responsibility: completion evidence status projection.
- Modify: `tests/review-center.test.ts`
  - Responsibility: ReviewItem trigger/payload projection.
- Modify: `tests/scheduler.test.ts`
  - Responsibility: `review_needed` classification for Product Usability gaps.
- Modify: `tests/specdrive-ide.test.ts`
  - Responsibility: IDE view-model projection of protocol structures.
- Modify: `tests/specdrive-ide-webview-boundary.test.ts`
  - Responsibility: static Webview coverage for Product Usability evidence UI.

## Task 1: Create FEAT-024 Spec And Mainline Index

**Files:**
- Create: `docs/agentic-spec/features/feat-024-product-usability-autonomy/requirements.md`
- Create: `docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md`
- Create: `docs/agentic-spec/features/feat-024-product-usability-autonomy/tasks.md`
- Create: `docs/agentic-spec/features/feat-024-product-usability-autonomy/spec-state.json`
- Modify: `docs/agentic-spec/features/README.md`
- Modify: `docs/agentic-spec/features/feature-pool-queue.json`

- [ ] **Step 1: Confirm FEAT-024 does not already exist**

Run:

```bash
test ! -d docs/agentic-spec/features/feat-024-product-usability-autonomy
```

Expected: command exits `0`.

- [ ] **Step 2: Create the Feature Spec directory and files**

Create `docs/agentic-spec/features/feat-024-product-usability-autonomy/requirements.md` with:

```markdown
# FEAT-024 Product Usability Autonomy — Requirements

Feature ID: FEAT-024
Feature Name: Product Usability Autonomy
Status: ready
Milestone: M10
Dependencies: FEAT-002, FEAT-004, FEAT-008, FEAT-011, FEAT-012, FEAT-021, FEAT-023

## Goal

Upgrade SpecDrive AutoBuild from spec-complete delivery to product-usable delivery by converging mature skill-library practices with Agentic Spec protocol structures that are durable, machine-queryable, status-affecting, and visible in the VSCode IDE Execution Workbench.

## Source Requirements

| Requirement ID | Description | Source |
|---|---|---|
| REQ-095 | Mature skill-library practices and Agentic Spec protocol must converge through required protocol structures, not prompt-only guidance. | User approved Product Usability Autonomy design, 2026-05-15 |
| REQ-096 | The protocol structures `LifecycleHandoff`, `SkillWrapperContract`, `DecisionLog`, `ProtocolGap`, `UsabilityEvidence`, and `ReferencePatternMap` must be defined in docs and represented in `src/` contracts or validators. | User selected protocol-level implementation and docs/src double source of truth |
| REQ-097 | Docs/runtime drift tests must fail when critical protocol fields declared by the docs are missing from runtime or IDE-consumable structures. | User selected docs + `src/` synchronization |
| REQ-098 | Product Usability Gate must affect `completed`, `done`, and `review_needed` decisions for P0/P1 user stories. | User selected gate/status/IDE runtime depth |
| REQ-099 | ReviewItem and VSCode Execution Workbench must show concrete story, journey, checkpoint, decision, gap, evidence, and resume details. | User selected Execution Workbench golden journey |
| REQ-100 | Mature skill-library practices must be mapped at skill/workflow granularity to local SpecDrive rules, skill wrappers, gates, and evidence. | User selected Skill/Workflow-level ReferencePatternMap |
| REQ-101 | Critical project-local skills must implement `SkillWrapperContract` and produce or preserve decision logs, protocol gaps, usability evidence, and handoff readiness where relevant. | User selected mature skill and protocol convergence |
| REQ-102 | FEAT-024 must prove a hybrid golden journey: spec-document generation closure and Execution Workbench quality evidence display. | User selected mixed golden journey |

## User Stories

- US-024-01: As a SpecDrive user, I need P0/P1 user stories to remain traceable from source intent to runtime evidence so that completed Features are actually usable.
- US-024-02: As an agentic worker, I need local skills to expose clear source, decision, gap, evidence, and handoff requirements so that I cannot silently skip hard delivery obligations.
- US-024-03: As a reviewer, I need ReviewItems to show protocol gaps and usability evidence so that I know exactly why a Feature cannot continue.
- US-024-04: As a VSCode IDE user, I need Execution Workbench to show Product Usability Gate results, decisions, gaps, evidence, and resume guidance without reading raw logs.
- US-024-05: As a protocol maintainer, I need docs and runtime contracts to stay synchronized so that Agentic Spec remains both human-readable and machine-enforceable.

## Acceptance Criteria

- [ ] The six protocol structures are documented and represented in TypeScript contracts or validators.
- [ ] Product Usability Gate rejects completed Feature execution when P0/P1 stories lack usable journey/runtime evidence.
- [ ] Product Usability Gate results create concrete ReviewItems with `product_usability_gap` triggers.
- [ ] Execution Workbench renders Product Usability Gate result, `DecisionLog`, `ProtocolGap`, `UsabilityEvidence`, and resume guidance.
- [ ] Skill wrappers require source refs, lifecycle stage, autonomous decision scope, Open Question policy, anti-rationalization checks, output schema, handoff readiness, and verification evidence.
- [ ] ReferencePatternMap maps selected Superpowers, Agent Skills, and Everything Claude Code workflows to SpecDrive rules at skill/workflow granularity.
- [ ] Drift tests fail when docs-declared critical protocol structures are not represented in runtime or IDE types.
- [ ] Hybrid golden journey tests prove both spec-document generation closure and Execution Workbench evidence display.

## Non-Goals

- Do not vendor external skill libraries.
- Do not implement runtime direct delegation to external skills.
- Do not replace Agentic Spec with any external command taxonomy.
- Do not make Product Console the primary quality UI.
- Do not retrofit every historical Feature Spec.
```

Create `docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md` with:

```markdown
# FEAT-024 Product Usability Autonomy — Design

Feature ID: FEAT-024
Source Requirements: REQ-095 to REQ-102
Design Source: `docs/superpowers/specs/2026-05-15-product-usability-autonomy-design.md`

## 1. Architecture Decisions

- Treat mature skill libraries as reference patterns and Agentic Spec as the durable protocol layer.
- Define protocol convergence structures in docs and `src/`.
- Keep external libraries out of runtime dependencies.
- Use Product Usability Gate as an additional completion gate on top of Delivery Fidelity.
- Make VSCode Execution Workbench the primary product evidence display.

## 2. Protocol Structures

| Structure | Runtime Responsibility |
|---|---|
| `LifecycleHandoff` | Preserve lifecycle stage inputs, outputs, owner, losses, and evidence. |
| `SkillWrapperContract` | Define local skill anatomy and readiness obligations. |
| `DecisionLog` | Record auto decisions, repairs, human approvals, Open Questions, and Blocking Open Questions. |
| `ProtocolGap` | Normalize source/story/journey/interaction/state/test/runtime/review/ship gaps. |
| `UsabilityEvidence` | Prove story, journey, checkpoint, interaction, state/data, runtime, review, and ship usability. |
| `ReferencePatternMap` | Map mature skill workflows to SpecDrive protocol rules and local wrappers. |

## 3. Data Flow

```text
spec source
  -> SkillWrapperContract
  -> DecisionLog / ProtocolGap / UsabilityEvidence
  -> Product Usability Gate
  -> ReviewItem / status projection
  -> Execution Workbench quality evidence display
```

## 4. Runtime Integration

- `src/product-usability.ts` owns the structures and validation.
- `src/quality-gates.ts` invokes Product Usability Gate from `validateFeatureCompletion`.
- `src/scheduler.ts` routes Product Usability Gate failure to `review_needed`.
- `src/review-center.ts` stores concrete protocol gap details in the ReviewItem body.
- `src/specdrive-ide.ts` projects usability evidence into IDE view models.
- `apps/vscode-extension/src/webviews/execution.ts` renders the evidence.

## 5. Error Handling

- Safe defaults are recorded as `auto_decided`.
- Source-backed in-scope fixes are recorded as `autonomous_repair`.
- Safe unresolved ambiguity is recorded as `open_question`.
- Product, security, permission, data deletion, scope-expanding, or fake-completion risks are recorded as `blocking_open_question` and block downstream status.

## 6. Testing

- Protocol unit tests cover validators and gate failure categories.
- Gate integration tests cover Feature completion.
- Scheduler and Review Center tests cover ReviewItem routing.
- IDE tests cover view-model projection and Webview rendering.
- Drift tests compare docs-declared structures with runtime structures.
```

Create `docs/agentic-spec/features/feat-024-product-usability-autonomy/tasks.md` with task rows matching this plan:

```markdown
# FEAT-024 Product Usability Autonomy — Tasks

Feature ID: FEAT-024
Status: ready

## Task List

### T-024-01 Feature Spec and mainline index
Status: ready
Verification: `git diff --check`

### T-024-02 Protocol contracts and drift tests
Status: ready
Verification: `node --test tests/product-usability.test.ts`

### T-024-03 Product Usability Gate integration
Status: ready
Verification: `node --test tests/product-usability.test.ts tests/quality-gates.test.ts`

### T-024-04 ReviewItem and scheduler projection
Status: ready
Verification: `node --test tests/scheduler.test.ts tests/review-center.test.ts`

### T-024-05 Status checker and IDE view model projection
Status: ready
Verification: `node --test tests/status-checker.test.ts tests/specdrive-ide.test.ts`

### T-024-06 Execution Workbench evidence display
Status: ready
Verification: `node --test tests/specdrive-ide-webview-boundary.test.ts`; `npm run ide:build`

### T-024-07 Skill wrapper and ReferencePatternMap docs
Status: ready
Verification: `npm run skills:validate`; `git diff --check`

### T-024-08 Hybrid golden journey and closeout
Status: ready
Verification: `node --test tests/product-usability.test.ts tests/specdrive-ide.test.ts`; `npm run skills:validate`; `npm run ide:build`; `git diff --check`
```

Create `docs/agentic-spec/features/feat-024-product-usability-autonomy/spec-state.json` with:

```json
{
  "schemaVersion": 1,
  "featureId": "FEAT-024",
  "status": "ready",
  "executionStatus": "ready",
  "updatedAt": "2026-05-15T00:00:00.000Z",
  "reason": "Feature Spec approved for Product Usability Autonomy implementation.",
  "dependencies": [
    "FEAT-002",
    "FEAT-004",
    "FEAT-008",
    "FEAT-011",
    "FEAT-012",
    "FEAT-021",
    "FEAT-023"
  ]
}
```

- [ ] **Step 3: Add FEAT-024 to the Feature index**

In `docs/agentic-spec/features/README.md`, add this table row immediately after FEAT-023:

```markdown
| FEAT-024 | Product Usability Autonomy | `feat-024-product-usability-autonomy` | ready | REQ-095 至 REQ-102 | M10 | FEAT-002、FEAT-004、FEAT-008、FEAT-011、FEAT-012、FEAT-021、FEAT-023 |
```

Add this update note after the 2026-05-11 delivery fidelity update:

```markdown
2026-05-15 product usability autonomy update：FEAT-024 将成熟技能库实践与 Agentic Spec 协议双向收敛。该 Feature 要求 `LifecycleHandoff`、`SkillWrapperContract`、`DecisionLog`、`ProtocolGap`、`UsabilityEvidence` 和 `ReferencePatternMap` 同时具备 human-readable spec 与 machine-readable runtime contract，并通过 Product Usability Gate、ReviewItem 和 VSCode Execution Workbench 证明 P0/P1 用户故事真正可用。
```

Append this row to Direct Dependencies:

```markdown
| FEAT-024 | FEAT-002、FEAT-004、FEAT-008、FEAT-011、FEAT-012、FEAT-021、FEAT-023 |
```

- [ ] **Step 4: Add FEAT-024 to the Feature pool queue**

In `docs/agentic-spec/features/feature-pool-queue.json`, append:

```json
{
  "id": "FEAT-024",
  "priority": "P0",
  "dependencies": [
    "FEAT-002",
    "FEAT-004",
    "FEAT-008",
    "FEAT-011",
    "FEAT-012",
    "FEAT-021",
    "FEAT-023"
  ]
}
```

Update `updatedAt` to `2026-05-15T00:00:00.000Z`.

- [ ] **Step 5: Validate docs**

Run:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('docs/agentic-spec/features/feature-pool-queue.json','utf8')); JSON.parse(require('node:fs').readFileSync('docs/agentic-spec/features/feat-024-product-usability-autonomy/spec-state.json','utf8'));"
git diff --check -- docs/agentic-spec/features/feat-024-product-usability-autonomy docs/agentic-spec/features/README.md docs/agentic-spec/features/feature-pool-queue.json
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit Task 1**

```bash
git add docs/agentic-spec/features/feat-024-product-usability-autonomy docs/agentic-spec/features/README.md docs/agentic-spec/features/feature-pool-queue.json
git commit -m "docs(spec): add product usability autonomy feature"
```

## Task 2: Protocol Contracts And Drift Tests

**Files:**
- Create: `src/product-usability.ts`
- Create: `tests/product-usability.test.ts`
- Modify: `docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md`

- [ ] **Step 1: Write failing protocol validation tests**

Create `tests/product-usability.test.ts` with:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PRODUCT_USABILITY_PROTOCOL_STRUCTURES,
  assessProductUsabilityGate,
  validateDecisionLog,
  validateLifecycleHandoffs,
  validateProtocolGaps,
  validateReferencePatternMap,
  validateUsabilityEvidence,
  type ProductUsabilityGateInput,
} from "../src/product-usability.ts";

test("protocol structures declared in docs are represented in runtime constants", () => {
  const design = readFileSync("docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md", "utf8");
  for (const structure of [
    "LifecycleHandoff",
    "SkillWrapperContract",
    "DecisionLog",
    "ProtocolGap",
    "UsabilityEvidence",
    "ReferencePatternMap",
  ]) {
    assert.match(design, new RegExp(`\\b${structure}\\b`));
    assert.equal(PRODUCT_USABILITY_PROTOCOL_STRUCTURES.includes(structure), true);
  }
});

test("decision log validation rejects missing source refs", () => {
  const result = validateDecisionLog([
    {
      id: "DL-1",
      type: "auto_decided",
      summary: "Use existing IDE Webview as primary UI.",
      rationale: "AGENTS.md states VSCode IDE Webview is primary.",
      risk: "low",
      affectedArtifacts: ["docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md"],
      verification: ["git diff --check"],
      status: "accepted",
    },
  ]);

  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, ["DecisionLog DL-1 requires sourceRefs."]);
});

test("protocol gap validation accepts concrete product usability gap", () => {
  const result = validateProtocolGaps([
    {
      id: "GAP-1",
      category: "runtime_gap",
      severity: "P1",
      status: "open",
      message: "Execution Workbench does not show usability evidence.",
      affectedStories: ["US-024-04"],
      affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
      evidenceRefs: ["tests/specdrive-ide.test.ts"],
      resumeStage: "Verify",
    },
  ]);

  assert.equal(result.valid, true);
  assert.deepEqual(result.reasons, []);
});

test("usability evidence validation rejects fixture-only P0 story evidence", () => {
  const result = validateUsabilityEvidence([
    {
      id: "UE-1",
      userStoryId: "US-024-04",
      journeyId: "JOURNEY-EXECUTION-WORKBENCH-EVIDENCE",
      checkpointId: "CP-1",
      mode: "fixture",
      status: "passed",
      assertion: "Seeded text exists.",
      evidenceRefs: ["seed.json"],
    },
  ]);

  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, ["UsabilityEvidence UE-1 cannot use fixture-only evidence for product usability."]);
});

test("lifecycle handoff validation requires preserved obligations", () => {
  const result = validateLifecycleHandoffs([
    {
      id: "LH-1",
      from: "Define",
      to: "Plan",
      owner: "Product Interpreter",
      inputRefs: ["docs/agentic-spec/zh-CN/PRD.md"],
      outputRefs: ["docs/agentic-spec/features/feat-024-product-usability-autonomy/requirements.md"],
      evidenceRefs: ["docs/superpowers/specs/2026-05-15-product-usability-autonomy-design.md"],
      status: "passed",
    },
  ]);

  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, ["LifecycleHandoff LH-1 requires preservedObligations."]);
});

test("reference pattern map validates selected mature workflows", () => {
  const result = validateReferencePatternMap([
    {
      source: "superpowers",
      workflow: "brainstorming",
      specdriveStage: "Define",
      localRule: "Require design approval before implementation.",
      localSkill: "use-specdrive-lifecycle",
      evidenceField: "LifecycleHandoff",
    },
    {
      source: "agent-skills",
      workflow: "verification-evidence",
      specdriveStage: "Verify",
      localRule: "Runtime evidence must support product usability.",
      localSkill: "verify-behavior",
      evidenceField: "UsabilityEvidence",
    },
    {
      source: "everything-claude-code",
      workflow: "continuous-learning",
      specdriveStage: "Review",
      localRule: "Protocol gaps must become durable review records.",
      localSkill: "review-delivery-evidence",
      evidenceField: "ProtocolGap",
    },
  ]);

  assert.equal(result.valid, true);
  assert.deepEqual(result.reasons, []);
});

test("product usability gate blocks open P1 runtime gaps", () => {
  const input: ProductUsabilityGateInput = {
    priorityStories: ["US-024-04"],
    decisionLog: [],
    protocolGaps: [
      {
        id: "GAP-1",
        category: "runtime_gap",
        severity: "P1",
        status: "open",
        message: "No Execution Workbench evidence display.",
        affectedStories: ["US-024-04"],
        affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
        evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
        resumeStage: "Verify",
      },
    ],
    usabilityEvidence: [],
    lifecycleHandoffs: [],
    referencePatternMap: [],
  };

  const result = assessProductUsabilityGate(input);

  assert.equal(result.passed, false);
  assert.equal(result.reason, "product_usability_gap");
  assert.equal(result.triggers.includes("product_usability_gap"), true);
  assert.equal(result.gaps[0]?.id, "GAP-1");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
node --test tests/product-usability.test.ts
```

Expected: FAIL with a module resolution error for `../src/product-usability.ts`.

- [ ] **Step 3: Implement protocol types and validators**

Create `src/product-usability.ts` with:

```ts
export const PRODUCT_USABILITY_PROTOCOL_STRUCTURES = [
  "LifecycleHandoff",
  "SkillWrapperContract",
  "DecisionLog",
  "ProtocolGap",
  "UsabilityEvidence",
  "ReferencePatternMap",
] as const;

export type ProductUsabilityProtocolStructure = typeof PRODUCT_USABILITY_PROTOCOL_STRUCTURES[number];
export type LifecycleStage = "Define" | "Plan" | "Build" | "Verify" | "Review" | "Ship";
export type ProductUsabilityRisk = "low" | "medium" | "high";
export type ProductUsabilitySeverity = "P0" | "P1" | "P2" | "P3";
export type ProductUsabilityEvidenceMode = "browser" | "manual" | "unit" | "integration" | "fixture" | "seed" | "text";
export type ProtocolGapCategory =
  | "source_gap"
  | "story_gap"
  | "journey_gap"
  | "interaction_gap"
  | "state_data_gap"
  | "test_semantics_gap"
  | "runtime_gap"
  | "review_gap"
  | "ship_gap";

export type DecisionLogType =
  | "auto_decided"
  | "open_question"
  | "blocking_open_question"
  | "autonomous_repair"
  | "human_approved"
  | "rejected_or_deferred";

export type DecisionLogEntry = {
  id: string;
  type: DecisionLogType;
  summary: string;
  sourceRefs?: string[];
  rationale: string;
  rejectedAlternatives?: string[];
  risk: ProductUsabilityRisk;
  affectedArtifacts: string[];
  verification: string[];
  status: "accepted" | "open" | "blocked" | "closed" | "deferred";
};

export type ProtocolGap = {
  id: string;
  category: ProtocolGapCategory;
  severity: ProductUsabilitySeverity;
  status: "open" | "closed" | "deferred" | "accepted";
  message: string;
  affectedStories: string[];
  affectedJourneys: string[];
  evidenceRefs: string[];
  resumeStage: LifecycleStage;
};

export type UsabilityEvidence = {
  id: string;
  userStoryId: string;
  journeyId: string;
  checkpointId: string;
  mode: ProductUsabilityEvidenceMode;
  status: "passed" | "failed" | "blocked";
  assertion: string;
  evidenceRefs: string[];
};

export type LifecycleHandoff = {
  id: string;
  from: LifecycleStage;
  to: LifecycleStage;
  owner: string;
  inputRefs: string[];
  outputRefs: string[];
  preservedObligations?: string[];
  evidenceRefs: string[];
  status: "passed" | "failed" | "blocked";
};

export type ReferencePatternMapEntry = {
  source: "superpowers" | "agent-skills" | "everything-claude-code";
  workflow: string;
  specdriveStage: LifecycleStage;
  localRule: string;
  localSkill: string;
  evidenceField: ProductUsabilityProtocolStructure;
};

export type ProductUsabilityGateInput = {
  priorityStories: string[];
  decisionLog?: DecisionLogEntry[];
  protocolGaps?: ProtocolGap[];
  usabilityEvidence?: UsabilityEvidence[];
  lifecycleHandoffs?: LifecycleHandoff[];
  referencePatternMap?: ReferencePatternMapEntry[];
};

export type ProductUsabilityValidationResult = {
  valid: boolean;
  reasons: string[];
};

export type ProductUsabilityGateResult = {
  passed: boolean;
  reason?: "product_usability_gap";
  triggers: string[];
  details: string[];
  gaps: ProtocolGap[];
};

export function validateDecisionLog(entries: DecisionLogEntry[] | undefined): ProductUsabilityValidationResult {
  const reasons: string[] = [];
  for (const entry of entries ?? []) {
    if (!nonEmptyArray(entry.sourceRefs)) reasons.push(`DecisionLog ${entry.id} requires sourceRefs.`);
    if (!nonEmptyArray(entry.affectedArtifacts)) reasons.push(`DecisionLog ${entry.id} requires affectedArtifacts.`);
    if (!nonEmptyArray(entry.verification)) reasons.push(`DecisionLog ${entry.id} requires verification.`);
  }
  return { valid: reasons.length === 0, reasons };
}

export function validateProtocolGaps(entries: ProtocolGap[] | undefined): ProductUsabilityValidationResult {
  const reasons: string[] = [];
  for (const entry of entries ?? []) {
    if (!nonEmptyArray(entry.affectedStories)) reasons.push(`ProtocolGap ${entry.id} requires affectedStories.`);
    if (!nonEmptyArray(entry.affectedJourneys)) reasons.push(`ProtocolGap ${entry.id} requires affectedJourneys.`);
    if (!nonEmptyArray(entry.evidenceRefs)) reasons.push(`ProtocolGap ${entry.id} requires evidenceRefs.`);
  }
  return { valid: reasons.length === 0, reasons };
}

export function validateUsabilityEvidence(entries: UsabilityEvidence[] | undefined): ProductUsabilityValidationResult {
  const reasons: string[] = [];
  for (const entry of entries ?? []) {
    if (!nonEmptyArray(entry.evidenceRefs)) reasons.push(`UsabilityEvidence ${entry.id} requires evidenceRefs.`);
    if (entry.status === "passed" && ["fixture", "seed", "text"].includes(entry.mode)) {
      reasons.push(`UsabilityEvidence ${entry.id} cannot use fixture-only evidence for product usability.`);
    }
  }
  return { valid: reasons.length === 0, reasons };
}

export function validateLifecycleHandoffs(entries: LifecycleHandoff[] | undefined): ProductUsabilityValidationResult {
  const reasons: string[] = [];
  for (const entry of entries ?? []) {
    if (!nonEmptyArray(entry.preservedObligations)) reasons.push(`LifecycleHandoff ${entry.id} requires preservedObligations.`);
    if (!nonEmptyArray(entry.evidenceRefs)) reasons.push(`LifecycleHandoff ${entry.id} requires evidenceRefs.`);
  }
  return { valid: reasons.length === 0, reasons };
}

export function validateReferencePatternMap(entries: ReferencePatternMapEntry[] | undefined): ProductUsabilityValidationResult {
  const reasons: string[] = [];
  const sources = new Set((entries ?? []).map((entry) => entry.source));
  for (const source of ["superpowers", "agent-skills", "everything-claude-code"] as const) {
    if (!sources.has(source)) reasons.push(`ReferencePatternMap requires at least one ${source} workflow.`);
  }
  for (const entry of entries ?? []) {
    if (!PRODUCT_USABILITY_PROTOCOL_STRUCTURES.includes(entry.evidenceField)) {
      reasons.push(`ReferencePatternMap ${entry.source}:${entry.workflow} references unknown evidenceField ${entry.evidenceField}.`);
    }
  }
  return { valid: reasons.length === 0, reasons };
}

export function assessProductUsabilityGate(input: ProductUsabilityGateInput | undefined): ProductUsabilityGateResult {
  if (!input) return { passed: true, triggers: [], details: ["Product usability evidence not provided."], gaps: [] };
  const validationReasons = [
    ...validateDecisionLog(input.decisionLog).reasons,
    ...validateProtocolGaps(input.protocolGaps).reasons,
    ...validateUsabilityEvidence(input.usabilityEvidence).reasons,
    ...validateLifecycleHandoffs(input.lifecycleHandoffs).reasons,
    ...validateReferencePatternMap(input.referencePatternMap).reasons,
  ];
  const openCriticalGaps = (input.protocolGaps ?? []).filter((gap) =>
    gap.status === "open" && (gap.severity === "P0" || gap.severity === "P1")
  );
  const priorityStories = new Set(input.priorityStories);
  const coveredStories = new Set((input.usabilityEvidence ?? [])
    .filter((entry) => entry.status === "passed" && !["fixture", "seed", "text"].includes(entry.mode))
    .map((entry) => entry.userStoryId));
  const missingStories = [...priorityStories].filter((story) => !coveredStories.has(story));
  const syntheticGaps = missingStories.map((story): ProtocolGap => ({
    id: `missing-usability-evidence-${story}`,
    category: "runtime_gap",
    severity: "P1",
    status: "open",
    message: `P0/P1 story ${story} lacks runtime or equivalent usability evidence.`,
    affectedStories: [story],
    affectedJourneys: [],
    evidenceRefs: [],
    resumeStage: "Verify",
  }));
  const gaps = [...openCriticalGaps, ...syntheticGaps];
  const details = [
    ...validationReasons,
    ...gaps.map((gap) => `${gap.id}: ${gap.message}`),
  ];
  if (details.length > 0) {
    return {
      passed: false,
      reason: "product_usability_gap",
      triggers: ["product_usability_gap", ...gaps.map((gap) => gap.category)],
      details,
      gaps,
    };
  }
  return { passed: true, triggers: [], details: ["Product Usability Gate passed."], gaps: [] };
}

function nonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}
```

- [ ] **Step 4: Run unit tests**

Run:

```bash
node --test tests/product-usability.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/product-usability.ts tests/product-usability.test.ts docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md
git commit -m "feat(protocol): add product usability contracts"
```

## Task 3: Product Usability Gate Integration

**Files:**
- Modify: `src/quality-gates.ts`
- Modify: `src/cli-adapter.ts`
- Modify: `tests/quality-gates.test.ts`
- Modify: `tests/product-usability.test.ts`

- [ ] **Step 1: Add failing quality gate integration test**

Append to `tests/quality-gates.test.ts`:

```ts
test("feature completion gate rejects open product usability gaps", () => {
  const result = validateFeatureCompletion({
    invocation: invocation(),
    skillOutput: output({
      productUsability: {
        priorityStories: ["US-024-04"],
        protocolGaps: [{
          id: "GAP-EXECUTION-WORKBENCH",
          category: "runtime_gap",
          severity: "P1",
          status: "open",
          message: "Execution Workbench does not display usability evidence.",
          affectedStories: ["US-024-04"],
          affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
          evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
          resumeStage: "Verify",
        }],
        usabilityEvidence: [],
        decisionLog: [],
        lifecycleHandoffs: [],
        referencePatternMap: [],
      },
    }),
    changedFiles: ["apps/vscode-extension/src/webviews/execution.ts"],
  });

  assert.equal(result.status, "review_needed");
  assert.equal(result.triggers.includes("product_usability_gap"), true);
  assert.equal(result.details.some((detail) => detail.includes("Product Usability Gate failed")), true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test tests/quality-gates.test.ts
```

Expected: FAIL because `validateFeatureCompletion` does not yet invoke Product Usability Gate.

- [ ] **Step 3: Import and call Product Usability Gate in `src/quality-gates.ts`**

At the top of `src/quality-gates.ts`, add:

```ts
import { assessProductUsabilityGate, type ProductUsabilityGateInput } from "./product-usability.ts";
```

In `validateFeatureCompletion`, after Runtime Evidence Gate, insert:

```ts
  const productUsability = assessProductUsabilityGate(asProductUsabilityGateInput(output.result.productUsability));
  if (!productUsability.passed) {
    triggers.push(productUsability.reason ?? "product_usability_gap");
    triggers.push(...productUsability.triggers);
    details.push(`Product Usability Gate failed: ${productUsability.details.join("; ")}.`);
  }
```

Near the helper functions in `src/quality-gates.ts`, add:

```ts
function asProductUsabilityGateInput(value: unknown): ProductUsabilityGateInput | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  return {
    priorityStories: Array.isArray(record.priorityStories) ? record.priorityStories.map(String) : [],
    decisionLog: Array.isArray(record.decisionLog) ? record.decisionLog as ProductUsabilityGateInput["decisionLog"] : [],
    protocolGaps: Array.isArray(record.protocolGaps) ? record.protocolGaps as ProductUsabilityGateInput["protocolGaps"] : [],
    usabilityEvidence: Array.isArray(record.usabilityEvidence) ? record.usabilityEvidence as ProductUsabilityGateInput["usabilityEvidence"] : [],
    lifecycleHandoffs: Array.isArray(record.lifecycleHandoffs) ? record.lifecycleHandoffs as ProductUsabilityGateInput["lifecycleHandoffs"] : [],
    referencePatternMap: Array.isArray(record.referencePatternMap) ? record.referencePatternMap as ProductUsabilityGateInput["referencePatternMap"] : [],
  };
}
```

- [ ] **Step 4: Extend completion evidence extraction in `src/cli-adapter.ts`**

In `completionEvidenceFromSkillOutput`, add this field to the returned object:

```ts
    productUsability: result.productUsability,
```

If `CompletionEvidenceInput` does not yet include `productUsability`, add the type field in Task 5 when updating `src/status-checker.ts`.

- [ ] **Step 5: Run gate tests**

Run:

```bash
node --test tests/product-usability.test.ts tests/quality-gates.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/quality-gates.ts src/cli-adapter.ts tests/quality-gates.test.ts tests/product-usability.test.ts
git commit -m "feat(gates): enforce product usability completion"
```

## Task 4: ReviewItem And Scheduler Projection

**Files:**
- Modify: `src/review-center.ts`
- Modify: `src/scheduler.ts`
- Modify: `tests/review-center.test.ts`
- Modify: `tests/scheduler.test.ts`

- [ ] **Step 1: Add failing Review Center test**

Append to `tests/review-center.test.ts`:

```ts
test("Review Center preserves product usability gap payload", () => {
  const dbPath = makeDbPath();
  initializeSchema(dbPath);
  const item = createReviewItem(dbPath, {
    id: "review-product-usability",
    projectId: "project-review",
    featureId: "FEAT-024",
    runId: "RUN-PUA",
    message: "Product Usability Gate failed.",
    reviewNeededReason: "risk_review_needed",
    triggerReasons: ["product_usability_gap"],
    body: {
      riskExplanation: "P0/P1 user story lacks runtime evidence.",
      productUsability: {
        gaps: [{
          id: "GAP-1",
          category: "runtime_gap",
          severity: "P1",
          status: "open",
          message: "Execution Workbench does not show evidence.",
        }],
      },
    },
    evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
  });

  assert.equal(item.triggerReasons.includes("product_usability_gap"), true);
  assert.deepEqual((item.body.productUsability as Record<string, unknown>).gaps, [{
    id: "GAP-1",
    category: "runtime_gap",
    severity: "P1",
    status: "open",
    message: "Execution Workbench does not show evidence.",
  }]);
});
```

- [ ] **Step 2: Run Review Center test to verify failure**

Run:

```bash
node --test tests/review-center.test.ts
```

Expected: FAIL because `ReviewTrigger` and `ReviewItem.body` do not include Product Usability fields.

- [ ] **Step 3: Extend `src/review-center.ts`**

Add `"product_usability_gap"` to `ReviewTrigger`:

```ts
  | "product_usability_gap"
```

Add `productUsability?: unknown;` to `ReviewItem["body"]`.

In `createReviewItem`, add this assignment inside `body`:

```ts
      productUsability: input.body?.productUsability,
```

- [ ] **Step 4: Add failing Scheduler classification test**

Append to `tests/scheduler.test.ts` near the existing review-needed tests:

```ts
test("cli.run classifies product usability gaps as risk review", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-product-usability-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-PRODUCT-USABILITY-GAP"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-PRODUCT-USABILITY-GAP"}\n${skillOutputEvent("RUN-PRODUCT-USABILITY-GAP", {
      result: {
        ...validJourneyResult(),
        productUsability: {
          priorityStories: ["US-024-04"],
          protocolGaps: [{
            id: "GAP-EXECUTION-WORKBENCH",
            category: "runtime_gap",
            severity: "P1",
            status: "open",
            message: "Execution Workbench lacks Product Usability evidence display.",
            affectedStories: ["US-024-04"],
            affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
            evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
            resumeStage: "Verify",
          }],
          usabilityEvidence: [],
          decisionLog: [],
          lifecycleHandoffs: [],
          referencePatternMap: [],
        },
      },
    })}`,
    stderr: "",
  }));

  const rows = runSqlite(dbPath, [], [
    { name: "reviews", sql: "SELECT status, review_needed_reason, trigger_reasons_json, body FROM review_items WHERE run_id = 'RUN-PRODUCT-USABILITY-GAP'" },
  ]).queries;

  assert.equal(result.status, "review_needed");
  assert.equal(rows.reviews[0].review_needed_reason, "risk_review_needed");
  assert.match(String(rows.reviews[0].trigger_reasons_json), /product_usability_gap/);
  assert.match(String(rows.reviews[0].body), /Execution Workbench lacks Product Usability evidence display/);
});
```

- [ ] **Step 5: Extend scheduler trigger classification**

In `src/scheduler.ts`, update `executionReviewNeededReason` so this text is classified as risk review:

```ts
    text.includes("product usability gate") ||
    text.includes("product_usability_gap") ||
```

In `executionReviewTriggers`, add `"product_usability_gap"` when summary or metadata includes Product Usability failure:

```ts
  if (text.includes("product usability gate") || text.includes("product_usability_gap")) {
    triggers.push("product_usability_gap");
  }
```

In `ensureExecutionReviewItem`, include the product usability result in `body.testResults`:

```ts
        productUsability: input.metadata?.productUsability ?? (input.metadata?.skillOutputContract as Record<string, unknown> | undefined)?.result?.productUsability,
```

- [ ] **Step 6: Run projection tests**

Run:

```bash
node --test tests/review-center.test.ts tests/scheduler.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/review-center.ts src/scheduler.ts tests/review-center.test.ts tests/scheduler.test.ts
git commit -m "feat(review): project product usability gaps"
```

## Task 5: Status Checker And IDE View Model Projection

**Files:**
- Modify: `src/status-checker.ts`
- Modify: `src/specdrive-ide.ts`
- Modify: `apps/vscode-extension/src/types.ts`
- Modify: `tests/status-checker.test.ts`
- Modify: `tests/specdrive-ide.test.ts`

- [ ] **Step 1: Add failing Status Checker test**

Append to `tests/status-checker.test.ts`:

```ts
test("completion evidence reports product usability gaps", () => {
  const result = runStatusCheck({
    kind: "completion_evidence",
    featureId: "FEAT-024",
    completionEvidence: {
      requirementCoverage: [{ requirementId: "REQ-099", status: "passed", evidence: ["unit"] }],
      acceptanceEvidence: [{ scenarioId: "AC-099", status: "passed", evidence: ["unit"] }],
      journeyEvidence: [{ userStoryId: "US-024-04", status: "passed", evidence: ["trace"] }],
      runtimeEvidence: { appLaunch: { status: "passed", evidence: ["launch.log"] } },
      deliveryFidelity: { completionDecision: { status: "passed" }, losses: [] },
      gitDelivery: { prUrl: "https://github.com/example/specdrive/pull/24", checks: "passed" },
      productUsability: {
        priorityStories: ["US-024-04"],
        protocolGaps: [{
          id: "GAP-1",
          category: "runtime_gap",
          severity: "P1",
          status: "open",
          message: "No Execution Workbench evidence display.",
          affectedStories: ["US-024-04"],
          affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
          evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
          resumeStage: "Verify",
        }],
        usabilityEvidence: [],
        decisionLog: [],
        lifecycleHandoffs: [],
        referencePatternMap: [],
      },
      requireRuntimeEvidence: true,
    },
  });

  assert.equal(result.status, "review_needed");
  assert.equal(result.reasons.some((reason) => reason.includes("Product Usability Gate failed")), true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test tests/status-checker.test.ts
```

Expected: FAIL because `CompletionEvidenceInput` and `runStatusCheck` do not process `productUsability`.

- [ ] **Step 3: Extend `src/status-checker.ts`**

Import:

```ts
import { assessProductUsabilityGate, type ProductUsabilityGateInput } from "./product-usability.ts";
```

Add to `CompletionEvidenceInput`:

```ts
  productUsability?: ProductUsabilityGateInput;
```

In the completion evidence branch of `runStatusCheck`, after existing evidence checks, add:

```ts
  const productUsability = assessProductUsabilityGate(input.completionEvidence?.productUsability);
  if (!productUsability.passed) {
    reasons.push(`Product Usability Gate failed: ${productUsability.details.join("; ")}`);
  }
```

Keep the existing status decision rule: any reason makes the result `review_needed`.

- [ ] **Step 4: Add failing IDE projection test**

Append to `tests/specdrive-ide.test.ts`:

```ts
test("SpecDrive IDE projects product usability evidence from execution metadata", () => {
  const workspaceRoot = makeWorkspace();
  const dbPath = makeDbPath();
  initializeSchema(dbPath);
  seedProject(dbPath, workspaceRoot);
  runSqlite(dbPath, [
    {
      sql: `INSERT INTO features (id, project_id, title, status, priority, folder, primary_requirements_json)
        VALUES ('FEAT-016', 'project-ide', 'SpecDrive IDE Foundation', 'ready', 10, 'feat-016-specdrive-ide-foundation', '["REQ-099"]')`,
    },
    {
      sql: `INSERT INTO execution_records (
        id, scheduler_job_id, executor_type, operation, project_id, context_json,
        status, summary, metadata_json, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        "RUN-PUA-IDE",
        "JOB-PUA-IDE",
        "cli",
        "feature_execution",
        "project-ide",
        JSON.stringify({ featureId: "FEAT-016" }),
        "review_needed",
        "Product Usability Gate failed.",
        JSON.stringify({
          skillOutputContract: {
            contractVersion: "skill-contract/v2",
            executionId: "RUN-PUA-IDE",
            skillName: "implement-feature",
            requestedAction: "feature_execution",
            status: "completed",
            summary: "Feature implemented.",
            nextAction: null,
            producedArtifacts: [],
            traceability: { featureId: "FEAT-016" },
            result: {
              productUsability: {
                priorityStories: ["US-024-04"],
                decisionLog: [{ id: "DL-1", type: "auto_decided", summary: "Use IDE as primary UI.", sourceRefs: ["AGENTS.md"], rationale: "Repo guidance.", risk: "low", affectedArtifacts: ["apps/vscode-extension/src/webviews/execution.ts"], verification: ["npm run ide:build"], status: "accepted" }],
                protocolGaps: [{ id: "GAP-1", category: "runtime_gap", severity: "P1", status: "open", message: "No evidence display.", affectedStories: ["US-024-04"], affectedJourneys: ["JOURNEY-1"], evidenceRefs: ["tests/specdrive-ide.test.ts"], resumeStage: "Verify" }],
                usabilityEvidence: [{ id: "UE-1", userStoryId: "US-024-04", journeyId: "JOURNEY-1", checkpointId: "CP-1", mode: "browser", status: "passed", assertion: "Evidence panel visible.", evidenceRefs: ["screenshot.png"] }],
                lifecycleHandoffs: [{ id: "LH-1", from: "Verify", to: "Review", owner: "review-delivery-evidence", inputRefs: ["tests/specdrive-ide.test.ts"], outputRefs: ["review_items"], preservedObligations: ["US-024-04"], evidenceRefs: ["screenshot.png"], status: "passed" }],
                referencePatternMap: [],
              },
            },
          },
        }),
        "2026-05-15T00:00:00.000Z",
        "2026-05-15T00:01:00.000Z",
      ],
    },
  ]);

  const detail = buildSpecDriveIdeExecutionDetail(dbPath, "RUN-PUA-IDE");

  assert.equal(detail?.productUsability?.protocolGaps?.[0]?.id, "GAP-1");
  assert.equal(detail?.productUsability?.usabilityEvidence?.[0]?.id, "UE-1");
  assert.equal(detail?.productUsability?.decisionLog?.[0]?.id, "DL-1");
});
```

- [ ] **Step 5: Extend IDE types in `src/specdrive-ide.ts`**

Add exported types:

```ts
import type { ProductUsabilityGateInput } from "./product-usability.ts";

export type SpecDriveIdeProductUsabilityProjection = ProductUsabilityGateInput & {
  gate?: unknown;
};
```

Add to `SpecDriveIdeExecutionDetail`:

```ts
  productUsability?: SpecDriveIdeProductUsabilityProjection;
```

In `buildSpecDriveIdeExecutionDetail`, after `const metadataArtifacts`, add:

```ts
  const productUsability = productUsabilityFromExecutionMetadata(metadata);
```

Add `productUsability` to the returned object.

Add helper:

```ts
function productUsabilityFromExecutionMetadata(metadata: Record<string, unknown>): SpecDriveIdeProductUsabilityProjection | undefined {
  const skillOutput = isRecord(metadata.skillOutputContract) ? metadata.skillOutputContract : undefined;
  const result = isRecord(skillOutput?.result) ? skillOutput.result : undefined;
  const productUsability = isRecord(result?.productUsability) ? result.productUsability : undefined;
  if (!productUsability) return undefined;
  return {
    priorityStories: Array.isArray(productUsability.priorityStories) ? productUsability.priorityStories.map(String) : [],
    decisionLog: Array.isArray(productUsability.decisionLog) ? productUsability.decisionLog as ProductUsabilityGateInput["decisionLog"] : [],
    protocolGaps: Array.isArray(productUsability.protocolGaps) ? productUsability.protocolGaps as ProductUsabilityGateInput["protocolGaps"] : [],
    usabilityEvidence: Array.isArray(productUsability.usabilityEvidence) ? productUsability.usabilityEvidence as ProductUsabilityGateInput["usabilityEvidence"] : [],
    lifecycleHandoffs: Array.isArray(productUsability.lifecycleHandoffs) ? productUsability.lifecycleHandoffs as ProductUsabilityGateInput["lifecycleHandoffs"] : [],
    referencePatternMap: Array.isArray(productUsability.referencePatternMap) ? productUsability.referencePatternMap as ProductUsabilityGateInput["referencePatternMap"] : [],
    gate: productUsability.gate,
  };
}
```

- [ ] **Step 6: Mirror IDE types in `apps/vscode-extension/src/types.ts`**

Add:

```ts
export type SpecDriveIdeProductUsabilityProjection = {
  priorityStories?: string[];
  decisionLog?: unknown[];
  protocolGaps?: unknown[];
  usabilityEvidence?: unknown[];
  lifecycleHandoffs?: unknown[];
  referencePatternMap?: unknown[];
  gate?: unknown;
};
```

Add to `SpecDriveIdeExecutionDetail`:

```ts
  productUsability?: SpecDriveIdeProductUsabilityProjection;
```

- [ ] **Step 7: Run tests**

Run:

```bash
node --test tests/status-checker.test.ts tests/specdrive-ide.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add src/status-checker.ts src/specdrive-ide.ts apps/vscode-extension/src/types.ts tests/status-checker.test.ts tests/specdrive-ide.test.ts
git commit -m "feat(ide): project product usability evidence"
```

## Task 6: Execution Workbench Evidence Display

**Files:**
- Modify: `apps/vscode-extension/src/webviews/execution.ts`
- Modify: `tests/specdrive-ide-webview-boundary.test.ts`

- [ ] **Step 1: Add failing static Webview boundary test**

Append to `tests/specdrive-ide-webview-boundary.test.ts`:

```ts
test("Execution Workbench renders Product Usability evidence groups", () => {
  assert.match(executionWebviewSource, /Product Usability/);
  assert.match(executionWebviewSource, /Decision Log/);
  assert.match(executionWebviewSource, /Protocol Gaps/);
  assert.match(executionWebviewSource, /Usability Evidence/);
  assert.match(executionWebviewSource, /Lifecycle Handoffs/);
  assert.match(executionWebviewSource, /Reference Pattern Map/);
  assert.match(executionWebviewSource, /renderProductUsabilityEvidence/);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --test tests/specdrive-ide-webview-boundary.test.ts
```

Expected: FAIL because the Webview does not render Product Usability evidence yet.

- [ ] **Step 3: Add Product Usability panel to Execution Workbench**

In `apps/vscode-extension/src/webviews/execution.ts`, inside the `execution-detail-grid` after `Blockers & Approvals`, insert:

```ts
                <details class="execution-detail-card execution-detail-card-full" open>
                  <summary class="section-title"><h2>Product Usability</h2><span>${productUsabilityCount(executionDetail)}</span></summary>
                  ${renderProductUsabilityEvidence(executionDetail)}
                </details>
```

Add these helper functions near `renderDeliveryFidelityEntry`:

```ts
function productUsabilityCount(detail: SpecDriveIdeExecutionDetail | undefined): number {
  const usability = detail?.productUsability;
  return [
    ...(usability?.decisionLog ?? []),
    ...(usability?.protocolGaps ?? []),
    ...(usability?.usabilityEvidence ?? []),
    ...(usability?.lifecycleHandoffs ?? []),
    ...(usability?.referencePatternMap ?? []),
  ].length;
}

function renderProductUsabilityEvidence(detail: SpecDriveIdeExecutionDetail | undefined): string {
  const usability = detail?.productUsability;
  if (!usability) return emptyState("No Product Usability evidence recorded.");
  const rows: Array<[string, unknown]> = [
    ["Priority Stories", usability.priorityStories],
    ["Decision Log", usability.decisionLog],
    ["Protocol Gaps", usability.protocolGaps],
    ["Usability Evidence", usability.usabilityEvidence],
    ["Lifecycle Handoffs", usability.lifecycleHandoffs],
    ["Reference Pattern Map", usability.referencePatternMap],
    ["Gate", usability.gate],
  ];
  return `<div class="result-group product-usability-evidence" data-i18n-skip>${rows.map(([label, value]) => `<div class="result-entry result-entry-wide"><span>${escapeHtml(label)}</span><div class="result-content">${renderResultValue(value)}</div></div>`).join("")}</div>`;
}
```

- [ ] **Step 4: Run Webview tests and build**

Run:

```bash
node --test tests/specdrive-ide-webview-boundary.test.ts
npm run ide:build
```

Expected: both commands PASS.

- [ ] **Step 5: Commit Task 6**

```bash
git add apps/vscode-extension/src/webviews/execution.ts tests/specdrive-ide-webview-boundary.test.ts
git commit -m "feat(ide): show product usability evidence"
```

## Task 7: Skill Wrappers And ReferencePatternMap Docs

**Files:**
- Create: `docs/agentic-spec/references/mature-skill-pattern-map.md`
- Modify: `docs/agentic-spec/zh-CN/agentic-spec-standard.md`
- Modify: `docs/agentic-spec/zh-CN/skills.md`
- Modify: `docs/agentic-spec/zh-CN/skill-refact.md`
- Modify: `.agents/skills/refine-product-intent/SKILL.md`
- Modify: `.agents/skills/generate-user-stories/SKILL.md`
- Modify: `.agents/skills/validate-requirements/SKILL.md`
- Modify: `.agents/skills/decompose-feature-specs/SKILL.md`
- Modify: `.agents/skills/implement-feature/SKILL.md`
- Modify: `.agents/skills/verify-behavior/SKILL.md`
- Modify: `.agents/skills/review-delivery-evidence/SKILL.md`
- Modify: `.agents/skills/use-specdrive-lifecycle/SKILL.md`

- [ ] **Step 1: Create ReferencePatternMap**

Create `docs/agentic-spec/references/mature-skill-pattern-map.md` with:

```markdown
# Mature Skill Reference Pattern Map

This document maps mature skill-library workflows to SpecDrive protocol rules. It is a source-backed reference map, not vendored runtime code.

| Source | Workflow / Skill | SpecDrive Stage | Local Skill / Protocol Rule | Evidence Field |
|---|---|---|---|---|
| Superpowers | brainstorming | Define | Require context exploration, one-question-at-a-time clarification, explicit design approval before implementation. | `LifecycleHandoff`, `DecisionLog` |
| Superpowers | writing-plans | Plan | Require implementation plans with exact files, tests, commands, and review handoff before execution. | `SkillWrapperContract`, `LifecycleHandoff` |
| Superpowers | test-driven-development | Build / Verify | Require failing tests before behavior implementation when changing code paths. | `UsabilityEvidence`, `ProtocolGap` |
| Superpowers | verification-before-completion | Verify / Ship | Require evidence before completion claims. | `UsabilityEvidence` |
| Superpowers | subagent-driven-development | Build / Review | Dispatch bounded tasks with explicit ownership and review outputs. | `LifecycleHandoff`, `DecisionLog` |
| Superpowers | requesting-code-review | Review | Require independent findings before closeout for broad changes. | `ProtocolGap` |
| Agent Skills | lifecycle skills | Define / Plan / Build / Verify / Review / Ship | Align local skills with lifecycle responsibilities and handoff readiness. | `LifecycleHandoff` |
| Agent Skills | skill anatomy | All | Require purpose, triggers, source inputs, process, output contract, and verification. | `SkillWrapperContract` |
| Agent Skills | anti-rationalization | Verify / Review | Reject self-justifying completion without evidence. | `ProtocolGap` |
| Agent Skills | verification evidence | Verify / Ship | Require concrete evidence refs for accepted behavior. | `UsabilityEvidence` |
| Everything Claude Code | memory persistence | Review / Ship | Persist durable decisions and gaps instead of conversation-only memory. | `DecisionLog`, `ProtocolGap` |
| Everything Claude Code | continuous learning | Review | Convert repeated gaps into protocol or skill wrapper improvements. | `ProtocolGap`, `ReferencePatternMap` |
| Everything Claude Code | verification loops | Verify | Keep verification loops explicit and stateful. | `LifecycleHandoff`, `UsabilityEvidence` |
| Everything Claude Code | orchestration status | Plan / Build | Surface status transitions and blockers through machine-queryable state. | `ProtocolGap` |
| Everything Claude Code | security scanning | Review | Escalate product/security/permission/data deletion uncertainty. | `DecisionLog`, `ProtocolGap` |
| Everything Claude Code | research-first workflow | Define / Plan | Require source-backed references before adopting external patterns. | `ReferencePatternMap` |
```

- [ ] **Step 2: Add SkillWrapperContract block to each local skill**

In each scoped `SKILL.md`, add this block after the opening workflow summary:

```markdown
## Product Usability Autonomy Wrapper

Apply FEAT-024 Product Usability Autonomy when this skill affects P0/P1 user stories, lifecycle handoffs, execution readiness, verification, review, or completion decisions.

Required wrapper fields:

- Source refs: list the PRD, requirements, HLD, UI Spec, Feature Spec, tasks, code, tests, or ReviewItems consumed.
- Lifecycle stage: name Define, Plan, Build, Verify, Review, or Ship.
- Decision policy: record safe automatic decisions as `DecisionLog`; record medium-risk ambiguity as Open Questions; record high-risk ambiguity as Blocking Open Questions.
- Protocol gaps: classify missing source, story, journey, interaction, state/data, test, runtime, review, and ship evidence as `ProtocolGap`.
- Usability evidence: preserve or produce `UsabilityEvidence` for P0/P1 stories affected by the skill.
- Handoff readiness: state whether downstream work may continue and which `LifecycleHandoff` obligations are preserved.
- Anti-rationalization: do not mark work ready or completed only because text, fixtures, API seeds, self-review, or command success exists.
```

- [ ] **Step 3: Add mainline standard reference**

In `docs/agentic-spec/zh-CN/agentic-spec-standard.md`, add a section named `Product Usability Autonomy` near the Delivery Fidelity sections:

```markdown
## Product Usability Autonomy

FEAT-024 makes product usability a protocol-level completion requirement. Mature skill-library workflows are reference patterns, while Agentic Spec owns the durable protocol structures that enforce and display those practices.

Required structures:

- `LifecycleHandoff`
- `SkillWrapperContract`
- `DecisionLog`
- `ProtocolGap`
- `UsabilityEvidence`
- `ReferencePatternMap`

Docs define semantics. `src/` defines machine-readable contracts, validators, ReviewItem payloads, status projection, and IDE-consumable view models. Drift between docs and runtime is a test failure.
```

- [ ] **Step 4: Validate skill docs**

Run:

```bash
npm run skills:validate
git diff --check -- .agents/skills docs/agentic-spec/zh-CN docs/agentic-spec/references
```

Expected: both commands PASS.

- [ ] **Step 5: Commit Task 7**

```bash
git add docs/agentic-spec/references/mature-skill-pattern-map.md docs/agentic-spec/zh-CN/agentic-spec-standard.md docs/agentic-spec/zh-CN/skills.md docs/agentic-spec/zh-CN/skill-refact.md .agents/skills/refine-product-intent/SKILL.md .agents/skills/generate-user-stories/SKILL.md .agents/skills/validate-requirements/SKILL.md .agents/skills/decompose-feature-specs/SKILL.md .agents/skills/implement-feature/SKILL.md .agents/skills/verify-behavior/SKILL.md .agents/skills/review-delivery-evidence/SKILL.md .agents/skills/use-specdrive-lifecycle/SKILL.md
git commit -m "docs(skills): add product usability wrappers"
```

## Task 8: Hybrid Golden Journey And Closeout

**Files:**
- Modify: `tests/product-usability.test.ts`
- Modify: `tests/specdrive-ide.test.ts`
- Modify: `docs/agentic-spec/features/feat-024-product-usability-autonomy/spec-state.json`

- [ ] **Step 1: Add golden journey protocol test**

Append to `tests/product-usability.test.ts`:

```ts
test("hybrid golden journey passes with source-backed decisions and browser usability evidence", () => {
  const result = assessProductUsabilityGate({
    priorityStories: ["US-024-04"],
    decisionLog: [{
      id: "DL-GOLDEN-1",
      type: "auto_decided",
      summary: "Use Execution Workbench as primary Product Usability evidence surface.",
      sourceRefs: ["AGENTS.md", "docs/superpowers/specs/2026-05-15-product-usability-autonomy-design.md"],
      rationale: "Repo guidance makes VSCode IDE Webview the primary current UI.",
      rejectedAlternatives: ["Product Console primary display"],
      risk: "low",
      affectedArtifacts: ["apps/vscode-extension/src/webviews/execution.ts"],
      verification: ["node --test tests/specdrive-ide-webview-boundary.test.ts", "npm run ide:build"],
      status: "accepted",
    }],
    protocolGaps: [{
      id: "GAP-GOLDEN-CLOSED",
      category: "runtime_gap",
      severity: "P1",
      status: "closed",
      message: "Execution Workbench usability evidence display implemented.",
      affectedStories: ["US-024-04"],
      affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
      evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
      resumeStage: "Review",
    }],
    usabilityEvidence: [{
      id: "UE-GOLDEN-1",
      userStoryId: "US-024-04",
      journeyId: "JOURNEY-EXECUTION-WORKBENCH-EVIDENCE",
      checkpointId: "CP-EVIDENCE-PANEL",
      mode: "browser",
      status: "passed",
      assertion: "Execution Workbench displays Product Usability evidence groups.",
      evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts", "npm run ide:build"],
    }],
    lifecycleHandoffs: [{
      id: "LH-GOLDEN-1",
      from: "Verify",
      to: "Review",
      owner: "review-delivery-evidence",
      inputRefs: ["tests/product-usability.test.ts", "tests/specdrive-ide.test.ts"],
      outputRefs: ["review_items", "Execution Workbench"],
      preservedObligations: ["US-024-04", "REQ-099"],
      evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
      status: "passed",
    }],
    referencePatternMap: [{
      source: "superpowers",
      workflow: "verification-before-completion",
      specdriveStage: "Verify",
      localRule: "Evidence must exist before completion.",
      localSkill: "verify-behavior",
      evidenceField: "UsabilityEvidence",
    }, {
      source: "agent-skills",
      workflow: "verification-evidence",
      specdriveStage: "Verify",
      localRule: "Product usability requires concrete evidence refs.",
      localSkill: "review-delivery-evidence",
      evidenceField: "ProtocolGap",
    }, {
      source: "everything-claude-code",
      workflow: "orchestration-status",
      specdriveStage: "Review",
      localRule: "Review blockers must be machine-queryable.",
      localSkill: "use-specdrive-lifecycle",
      evidenceField: "DecisionLog",
    }],
  });

  assert.equal(result.passed, true);
  assert.deepEqual(result.triggers, []);
});
```

- [ ] **Step 2: Run the complete targeted verification stack**

Run:

```bash
node --test tests/product-usability.test.ts tests/quality-gates.test.ts tests/status-checker.test.ts tests/review-center.test.ts tests/scheduler.test.ts tests/specdrive-ide.test.ts tests/specdrive-ide-webview-boundary.test.ts
npm run skills:validate
npm run ide:build
git diff --check
```

Expected: every command PASS.

- [ ] **Step 3: Mark FEAT-024 implementation complete in spec state**

After all checks pass, update `docs/agentic-spec/features/feat-024-product-usability-autonomy/spec-state.json`:

```json
{
  "schemaVersion": 1,
  "featureId": "FEAT-024",
  "status": "completed",
  "executionStatus": "completed",
  "updatedAt": "2026-05-15T00:00:00.000Z",
  "reason": "Product Usability Autonomy protocol structures, gates, ReviewItem projection, IDE evidence display, skill wrappers, and hybrid golden journey are implemented and verified.",
  "dependencies": [
    "FEAT-002",
    "FEAT-004",
    "FEAT-008",
    "FEAT-011",
    "FEAT-012",
    "FEAT-021",
    "FEAT-023"
  ],
  "lastResult": {
    "status": "completed",
    "summary": "Hybrid golden journey passed with Product Usability Gate and Execution Workbench evidence display.",
    "verification": [
      "node --test tests/product-usability.test.ts tests/quality-gates.test.ts tests/status-checker.test.ts tests/review-center.test.ts tests/scheduler.test.ts tests/specdrive-ide.test.ts tests/specdrive-ide-webview-boundary.test.ts",
      "npm run skills:validate",
      "npm run ide:build",
      "git diff --check"
    ]
  }
}
```

- [ ] **Step 4: Commit Task 8**

```bash
git add tests/product-usability.test.ts tests/specdrive-ide.test.ts docs/agentic-spec/features/feat-024-product-usability-autonomy/spec-state.json
git commit -m "test(usability): add hybrid golden journey"
```

## Final Verification

- [ ] **Step 1: Run final targeted checks**

Run:

```bash
node --test tests/product-usability.test.ts tests/quality-gates.test.ts tests/status-checker.test.ts tests/review-center.test.ts tests/scheduler.test.ts tests/specdrive-ide.test.ts tests/specdrive-ide-webview-boundary.test.ts
npm run skills:validate
npm run ide:build
git diff --check
```

Expected: every command PASS.

- [ ] **Step 2: Inspect commit history and worktree**

Run:

```bash
git log --oneline -8
git status --short
```

Expected: recent commits include FEAT-024 docs, protocol contracts, gates, review/status/IDE projection, skill wrappers, and golden journey. `git status --short` prints no output.
