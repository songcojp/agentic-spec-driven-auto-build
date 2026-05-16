# Product Usability Autonomy Design

Date: 2026-05-15
Status: Approved design for spec writing
Target Feature: `feat-024-product-usability-autonomy`

## Purpose

This design defines Phase 2 of the SpecDrive AutoBuild quality upgrade.

The current system can describe many functions, but that is not enough. A Feature must prove that the product is usable, not merely that documents exist, tasks are checked, or commands passed. Phase 2 upgrades SpecDrive from spec-complete delivery to product-usable delivery.

The design has three equal goals:

1. Product usability closure: P0/P1 user stories must trace to user journeys, Feature design, tasks, tests, runtime evidence, review, and final completion decisions.
2. Autonomous discovery and repair: the system must find gaps across Define, Plan, Build, Verify, Review, and Ship; repair gaps when existing sources make the repair safe; and preserve Open Questions or Blocking Open Questions when a human decision is required.
3. Mature skill and protocol convergence: external skill libraries are used as reference patterns for workflow, gates, checklists, and anti-rationalization behavior, while Agentic Spec is also upgraded so those practices become protocol-level primitives rather than scattered local prompts. The external libraries are not vendored and are not direct runtime dependencies.

## Reference Patterns

Phase 2 uses a pattern-and-wrapper strategy.

- Superpowers is a reference for spec-first brainstorming, design approval, implementation planning, TDD, subagent-driven development, code review, and verification-before-completion.
- Everything Claude Code is a reference for skills as the primary workflow surface, continuous learning, memory persistence, verification loops, orchestration status, security scanning, and cross-harness compatibility.
- Agent Skills is a reference for lifecycle skill anatomy, structured workflows, verification gates, anti-rationalization tables, specialist personas, and reference checklists.

SpecDrive will absorb these patterns into local skills, references, and protocol rules. It will not copy the upstream packages wholesale, create a runtime skill registry, or claim direct execution of external system skills in this Feature.

## Protocol Convergence Requirements

Phase 2 should not treat mature skill libraries as one-way templates. The target is convergence between mature skill practice and the Agentic Spec protocol.

Mature skill libraries push SpecDrive toward:

- conversational clarification before design;
- explicit spec approval before implementation;
- implementation plans with small verifiable tasks;
- test-first and verification-before-completion habits;
- subagent review and repair loops;
- anti-rationalization checks that prevent agents from skipping hard steps;
- evidence requirements that make "looks done" insufficient.

Agentic Spec pushes mature skill practice toward:

- durable lifecycle state instead of conversation-only workflow memory;
- machine-queryable requirements, Feature state, ReviewItems, and evidence records;
- explicit requirement, user story, journey, task, test, and runtime evidence traceability;
- status projection that can block `ready`, `execution`, `completed`, and `done`;
- IDE-visible decision logs, Open Questions, and human review resumability;
- protocol-owned boundaries for what an agent may auto-decide, auto-repair, or must escalate.

The Feature must define these protocol structures as implementation objects, not only design principles:

| Structure | Purpose | Required Source Of Truth |
|---|---|---|
| `LifecycleHandoff` | Define, Plan, Build, Verify, Review, and Ship transitions with input, output, owner, loss, and evidence rows. | Docs define lifecycle semantics; `src/` defines TypeScript contract and validators. |
| `SkillWrapperContract` | Local skill anatomy: purpose, triggers, required sources, process, anti-rationalization checks, output schema, handoff readiness, and verification evidence. | Docs define required sections; `src/` or validation scripts enforce required wrapper fields where machine-readable. |
| `DecisionLog` | Automatic decisions, rejected alternatives, autonomous repairs, Open Questions, Blocking Open Questions, human approvals, and deferred decisions. | Docs define decision policy; `src/` defines result shape consumed by gates, ReviewItems, and IDE. |
| `ProtocolGap` | Normalized gap object for source, story, journey, interaction, state/data, test, runtime, review, and ship failures. | Docs define taxonomy; `src/` defines status projection and ReviewItem payload shape. |
| `UsabilityEvidence` | Story, journey, checkpoint, interaction, state/data, runtime, review, and ship proof tied to product usability. | Docs define evidence semantics; `src/` defines gate input and UI projection shape. |
| `ReferencePatternMap` | Skill/workflow-level mapping from mature library practices to local SpecDrive protocol rules and skill wrapper requirements. | Docs define source-backed mapping; tests confirm required mappings exist for the selected critical workflows. |

Docs and `src/` are both required sources of truth. Docs define human-readable semantics and protocol boundaries. `src/` defines machine-readable contracts, validators, status projection, ReviewItem payloads, and IDE-consumable structures. Drift tests must fail when the implementation omits protocol structures or critical fields declared by the docs.

This convergence is the main improvement over the earlier Pattern-First proposal. Pattern-First improved selected upstream skills; Phase 2 improves both the skill surface and the Agentic Spec protocol that evaluates, persists, and presents their work.

## Positioning

The new Feature should live at:

```text
docs/agentic-spec/features/feat-024-product-usability-autonomy/
```

It is separate from FEAT-023.

FEAT-023 owns the foundational mechanisms: Delivery Fidelity, runtime evidence, Workpad, quality gates, ReviewItem projection, and IDE evidence display.

FEAT-024 uses and extends those mechanisms to make real product usability enforceable. It owns stronger skill wrappers, user journey test coverage, autonomous repair decisions, human clarification blocking, Product Usability Gate semantics, and a true end-to-end golden journey.

## Architecture

### Mature Pattern Reference Layer

This layer records source-backed research from mature skill libraries. It should become local reference material, not runtime code. The first references should cover:

- skill/workflow-level mappings for spec-to-plan-to-implementation workflow;
- skill wrapper anatomy;
- quality checklist and exit criteria patterns;
- anti-rationalization gates;
- verification evidence requirements;
- user journey testing patterns;
- autonomous decision and repair boundaries.

The `ReferencePatternMap` should stay at skill/workflow granularity for the first version. It should map selected mature workflows to SpecDrive lifecycle stages, local skill wrappers, gates, and evidence. It should not attempt full checklist-level copying of upstream libraries, except for critical path checks that directly protect product usability.

### Agentic Spec Protocol Convergence Layer

This layer converts mature reference patterns into protocol-level rules. It defines shared vocabulary and machine-readable structures that make skill behavior durable across sessions and visible in the product.

The first protocol upgrades must cover:

- lifecycle handoff records for Define, Plan, Build, Verify, Review, and Ship;
- normalized decision logs for auto decisions, autonomous repairs, Open Questions, Blocking Open Questions, and human approvals;
- reusable Product Usability Gate result shape;
- protocol gap categories that status checker, ReviewItems, and IDE Webview can all consume;
- source-backed `ReferencePatternMap` from mature skill library workflows to SpecDrive rules;
- explicit boundaries between prompt-owned reasoning and code-owned structural enforcement.

### SpecDrive Skill Wrapper Layer

Local project skills should declare more than output headings. Each critical skill should implement the protocol convergence layer through a local wrapper contract:

- required input source refs;
- lifecycle stage and handoff responsibilities;
- allowed autonomous decision scope;
- required decision log rows;
- Open Question and Blocking Open Question conditions;
- quality self-checks;
- anti-rationalization checks;
- Product Usability Gate obligations, when the skill affects P0/P1 journeys;
- downstream handoff contract.

The first skills in scope are:

- `refine-product-intent`
- `generate-user-stories`
- `validate-requirements`
- `decompose-feature-specs`
- `implement-feature`
- `verify-behavior`
- `review-delivery-evidence`
- `use-specdrive-lifecycle`, if routing needs to expose the new gate.

### Autonomy Decision Layer

SpecDrive should classify every material uncertainty or repair as one of:

- `auto_decided`
- `open_question`
- `blocking_open_question`
- `autonomous_repair`
- `human_approved`
- `rejected_or_deferred`

Each row must record:

- decision;
- source refs;
- rationale;
- rejected alternatives;
- risk level;
- affected artifacts;
- owner;
- verification expectation.

### Product Usability Gate Layer

FEAT-024 adds a Product Usability Gate on top of Delivery Fidelity.

The gate checks whether P0/P1 user stories close through real or equivalent runtime evidence. It should reject completion when evidence is missing, fixture-only, API-seeded without user interaction proof, text-only, self-reviewed only, or missing negative/reload/persistence coverage where the story requires it.

The first runtime depth is full gate/status/IDE integration, not only types. The implementation package must define TypeScript contracts and validators, connect Product Usability Gate to `completed`, `done`, and `review_needed` decisions, project failures into ReviewItems, and expose the structures to VSCode IDE Webview.

Gap categories should include:

- `source_gap`
- `story_gap`
- `journey_gap`
- `interaction_gap`
- `state_data_gap`
- `test_semantics_gap`
- `runtime_gap`
- `review_gap`
- `ship_gap`

Failures must project to `review_needed` or `blocked` with concrete story, journey, checkpoint, and evidence details.

### IDE Evidence Projection Layer

VSCode IDE Webview remains the primary UI surface.

The first IDE golden journey is Execution Workbench quality evidence display. The IDE should show:

- which `US-*` or `REQ-*` failed closure;
- which journey checkpoint lacks evidence;
- relevant `LifecycleHandoff`, `DecisionLog`, `ProtocolGap`, and `UsabilityEvidence` rows;
- which decisions were automatic;
- which gaps were autonomously repaired;
- which Open Questions remain visible;
- which Blocking Open Questions require human action;
- why the Feature cannot become `done`;
- which stage can resume after clarification.

Product Console remains a compatibility or reference surface and is not the primary UI for new quality evidence.

## Data Flow

```text
PRD / user input / existing specs
  -> Skill Wrapper collects source refs
  -> Autonomy Decision Layer classifies gaps
  -> autonomous repair or Open Question
  -> generated/refined specs and Feature Specs
  -> implementation and verification
  -> Product Usability Gate
  -> ReviewItem / status projection
  -> IDE Evidence Projection
```

## Scope

The Feature Spec should include docs, skills, runtime gates, status projection, tests, and IDE Webview changes.

In scope:

- create `requirements.md`, `design.md`, and `tasks.md` for FEAT-024;
- update mainline standard docs to reference Product Usability Autonomy and the new protocol convergence primitives;
- define docs semantics and `src/` TypeScript contracts for `LifecycleHandoff`, `SkillWrapperContract`, `DecisionLog`, `ProtocolGap`, `UsabilityEvidence`, and `ReferencePatternMap`;
- define a source-backed, skill/workflow-level `ReferencePatternMap` from mature skill libraries to SpecDrive protocol rules;
- update local skill contracts and shared references;
- add or refine validators, status projection, ReviewItem payloads, and IDE-consumable shapes for the protocol structures;
- add or extend Product Usability Gate logic so it affects `completed`, `done`, and `review_needed`;
- project specific failures into ReviewItems and Feature status;
- show Product Usability Gate evidence in the Execution Workbench IDE Webview;
- add targeted unit, integration, and Webview tests;
- add a hybrid golden journey: one spec-document generation path and one Execution Workbench quality evidence display path.

## Non-Goals

- Do not vendor `superpowers`, `everything-claude-code`, or `agent-skills`.
- Do not implement runtime direct delegation to external skills.
- Do not replace Agentic Spec with any one external skill library's command taxonomy.
- Do not keep improvements as prompt-only advice when a protocol-level structure is needed for persistence, querying, status projection, or UI display.
- Do not attempt full checklist-level copying of upstream skill libraries in the first version.
- Do not make Product Console the primary quality UI.
- Do not retrofit every historical Feature Spec in one pass.
- Do not let autonomous repair invent product requirements or change security, permissions, payment, or data deletion semantics.
- Do not let fixture-only, API-seeded, text-only, or self-review-only evidence close Product Usability Gate.
- Do not let checklists substitute for runtime or equivalent runtime evidence.

## Error Handling And Decision Rules

### Auto Decision

SpecDrive may record `auto_decided` and continue when the decision:

- is inferable from PRD, requirements, HLD, Feature Specs, AGENTS.md, or repository rules;
- does not change product positioning, business rules, security, permissions, payment, or data deletion semantics;
- does not expand Feature scope;
- is reversible;
- has a clear verification path;
- affects only the current Feature or artifact layer.

### Autonomous Repair

SpecDrive may record `autonomous_repair` and edit artifacts when:

- the gap is within the current task's allowed scope;
- source artifacts prove the repair;
- the repair does not create new product intent;
- verification can prove the repair;
- decision log and evidence refs are updated.

### Open Question

Use `open_question` when multiple valid answers exist but a safe default allows progress.

Each Open Question must include:

- safe default;
- why the default is safe;
- confirmation deadline;
- downstream risk;
- owner;
- affected user stories or journeys.

### Blocking Open Question

Use `blocking_open_question` with `blocked` or `review_needed` when:

- the user journey cannot be inferred;
- acceptance criteria cannot be written;
- a P0/P1 story lacks a verifiable journey;
- the issue changes product positioning, business rules, security, permissions, payment, or data deletion;
- Feature scope would expand;
- continuing would produce a wrong implementation or fake completion;
- evidence can only be fixture-only, API-seeded, or text-only;
- repair exceeds allowed scope;
- the same gap repeats and indicates a weak upstream wrapper or gate.

## Testing Strategy

### Skill Contract Tests

Critical skills must require source refs, decision log, Open Questions, Blocking Open Questions, handoff readiness, and quality checklist output. Weak input must not silently enter downstream planning or execution.

### Protocol Contract And Drift Tests

Tests must prove that docs and `src/` stay aligned for the six protocol structures. The implementation should fail validation when a required structure or critical field is documented but not represented in TypeScript contracts, validators, status projection, ReviewItem payloads, or IDE-consumable data.

### Reference Pattern Map Tests

Tests or static checks must prove that selected mature skill workflows are mapped at skill/workflow granularity:

- Superpowers brainstorming, writing-plans, TDD, verification-before-completion, subagent-driven-development, and requesting-code-review;
- Agent Skills Define, Plan, Build, Verify, Review lifecycle workflows, skill anatomy, anti-rationalization, and verification evidence;
- Everything Claude Code memory persistence, continuous learning, verification loops, orchestration status, security scanning, and research-first workflow.

### Product Usability Gate Tests

Tests should cover:

- P0/P1 story without a journey;
- journey without checkpoints;
- checkpoint without runtime evidence;
- fixture-only or API-seeded evidence;
- text-only evidence;
- missing reload, persistence, or negative-path proof;
- self-review-only closure;
- Open Questions entering execution or done without closure.

### Autonomous Repair Tests

Tests should cover:

- source-backed gap repair;
- out-of-scope repair blocked;
- product, security, permissions, payment, or data deletion uncertainty blocked;
- decision log and evidence refs written after repair.

### IDE Webview Tests

Tests should prove the IDE shows:

- story and journey coverage;
- Product Usability Gate result;
- autonomous decisions;
- autonomous repairs;
- Open Questions and Blocking Open Questions;
- ReviewItem resume guidance.

### Hybrid Golden Journey

The Feature must include two connected golden paths.

The spec-document path proves the protocol structures and autonomous repair behavior:

```text
PRD / user input
  -> product intent
  -> user stories
  -> requirements validation
  -> Feature Spec
  -> tasks
  -> implementation
  -> verification
  -> review
  -> done or review_needed decision
```

The Execution Workbench path proves product usability evidence is visible in the primary UI:

```text
completed or review_needed execution record
  -> Product Usability Gate result
  -> ReviewItem projection
  -> Execution Workbench quality evidence display
  -> user sees story, journey, DecisionLog, ProtocolGap, UsabilityEvidence, and resume guidance
```

The combined journey must prove both sides:

- missing evidence blocks completion with actionable details;
- complete evidence explains why the product is usable;
- the IDE shows enough structure for a user to continue without reading raw logs.

The older single-path form remains a useful summary:

```text
spec input
  -> protocol-backed skill output
  -> Feature execution
  -> Product Usability Gate
  -> IDE evidence
  -> done or review_needed decision
```

## Acceptance Criteria

- FEAT-024 Feature Spec exists with complete requirements, design, and tasks.
- Mainline standard and skill docs define Product Usability Autonomy and protocol convergence primitives.
- `LifecycleHandoff`, `SkillWrapperContract`, `DecisionLog`, `ProtocolGap`, `UsabilityEvidence`, and `ReferencePatternMap` are defined in docs and represented in `src/` contracts or validators.
- Drift tests fail if docs-declared critical protocol fields are missing from runtime or IDE-consumable structures.
- Mature skill library practices are mapped to local SpecDrive protocol rules through a source-backed, skill/workflow-level `ReferencePatternMap`.
- Local skill wrappers do not claim direct execution of external skills.
- Local skill wrappers implement the shared `SkillWrapperContract` instead of isolated prose-only instructions.
- Product Usability Gate affects `completed`, `done`, and `review_needed` decisions.
- ReviewItem and Execution Workbench IDE Webview show concrete story, journey, checkpoint, decision, gap, evidence, and resume details.
- P0/P1 user stories require runtime or equivalent runtime evidence.
- Autonomous decisions and repairs create decision log rows.
- Blocking Open Questions prevent execution or done.
- A hybrid golden journey proves both spec-document generation closure and Execution Workbench quality evidence display.
- `npm run skills:validate`, targeted tests, IDE build or relevant Webview tests, and `git diff --check` pass for the implementation package.

## Sources

- Superpowers: https://github.com/obra/superpowers
- Everything Claude Code: https://github.com/affaan-m/everything-claude-code
- Agent Skills: https://github.com/addyosmani/agent-skills
