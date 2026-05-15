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
3. Mature skill pattern wrappers: external skill libraries are used as reference patterns for workflow, gates, checklists, and anti-rationalization behavior. They are not vendored and are not direct runtime dependencies.

## Reference Patterns

Phase 2 uses a pattern-and-wrapper strategy.

- Superpowers is a reference for spec-first brainstorming, design approval, implementation planning, TDD, subagent-driven development, code review, and verification-before-completion.
- Everything Claude Code is a reference for skills as the primary workflow surface, continuous learning, memory persistence, verification loops, orchestration status, security scanning, and cross-harness compatibility.
- Agent Skills is a reference for lifecycle skill anatomy, structured workflows, verification gates, anti-rationalization tables, specialist personas, and reference checklists.

SpecDrive will absorb these patterns into local skills and references. It will not copy the upstream packages wholesale, create a runtime skill registry, or claim direct execution of external system skills in this Feature.

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

- spec-to-plan-to-implementation workflow;
- skill wrapper anatomy;
- quality checklist and exit criteria patterns;
- anti-rationalization gates;
- verification evidence requirements;
- user journey testing patterns;
- autonomous decision and repair boundaries.

### SpecDrive Skill Wrapper Layer

Local project skills should declare more than output headings. Each critical skill should define:

- required input source refs;
- allowed autonomous decision scope;
- required decision log rows;
- Open Question and Blocking Open Question conditions;
- quality self-checks;
- anti-rationalization checks;
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

The IDE should show:

- which `US-*` or `REQ-*` failed closure;
- which journey checkpoint lacks evidence;
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
- update mainline standard docs to reference Product Usability Autonomy;
- update local skill contracts and shared references;
- add or extend Product Usability Gate logic;
- project specific failures into ReviewItems and Feature status;
- show Product Usability Gate evidence in the IDE Webview;
- add targeted unit, integration, and Webview tests;
- add one end-to-end golden journey that starts at spec input and ends in a product usable or correctly blocked decision.

## Non-Goals

- Do not vendor `superpowers`, `everything-claude-code`, or `agent-skills`.
- Do not implement runtime direct delegation to external skills.
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

### End-To-End Golden Journey

The Feature must include one real golden journey:

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
  -> IDE evidence
  -> done or review_needed decision
```

The journey must prove both sides:

- missing evidence blocks completion with actionable details;
- complete evidence explains why the product is usable.

## Acceptance Criteria

- FEAT-024 Feature Spec exists with complete requirements, design, and tasks.
- Mainline standard and skill docs define Product Usability Autonomy.
- Local skill wrappers do not claim direct execution of external skills.
- Product Usability Gate affects completed and done decisions.
- ReviewItem and IDE Webview show concrete story, journey, checkpoint, and evidence gaps.
- P0/P1 user stories require runtime or equivalent runtime evidence.
- Autonomous decisions and repairs create decision log rows.
- Blocking Open Questions prevent execution or done.
- One end-to-end golden journey proves spec-to-product usability closure.
- `npm run skills:validate`, targeted tests, IDE build or relevant Webview tests, and `git diff --check` pass for the implementation package.

## Sources

- Superpowers: https://github.com/obra/superpowers
- Everything Claude Code: https://github.com/affaan-m/everything-claude-code
- Agent Skills: https://github.com/addyosmani/agent-skills
