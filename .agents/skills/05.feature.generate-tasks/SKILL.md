---
name: 05.feature.generate-tasks
description: "Execute the Agentic Spec 05 feature workflow for generate tasks with reusable input references, output contract, and acceptance checks."
---

# Feature Tasks Skill

## Purpose

Create or update a Feature Spec `tasks.md` that turns approved Feature
requirements and design into parser-compatible, executable tasks. Tasks must be
vertical enough to close user journeys, not only technical layers.

## Use When

- A Feature Spec folder needs a new or refreshed `tasks.md`.
- Feature requirements and design are ready and implementation tasks need to be
  generated or repaired.
- `09.review.spec-consistency` reports missing task coverage or Journey
  Checkpoints.
- A foundation Feature needs integration checkpoints instead of direct journey
  checkpoints.

## Do Not Use

- Do not generate Feature requirements or design from scratch; call the
  corresponding `05.feature.generate-*` skill first.
- Do not create compact one-line task rows as final output.
- Do not split UI-bearing Feature work into only API/ViewModel/mock-test tasks.
- Do not mark tasks done unless existing source evidence proves completion.

## Workflow

1. Read Feature `requirements.md`, `design.md`, project HLD references, UI spec
   when relevant, quickstart validation, and repository constraints named by the
   invocation.
2. Preserve existing task IDs and statuses when updating. New tasks start as
   `todo` unless source evidence proves another state.
3. Organize tasks by user story priority: shared setup, P1 journey closure,
   P2/P3 stories, then polish/cross-cutting work.
4. For every P1 user story, add at least one `Journey Checkpoint` task or
   checkpoint section with scenario, expected evidence, acceptance rows, and
   verification command.
5. For UI-bearing Features, include visible page/route/component state work and
   browser-level verification. API/ViewModel/schema tasks may support the
   journey but cannot be the only completion path.
6. For UI/configuration Features, include task blocks that close interaction
   matrix rows: editable fields or controls, save/cancel/validate behavior,
   state feedback, persisted source truth, reload/revisit assertion, and
   negative sample where relevant.
7. For foundation Features, add integration checkpoints naming downstream
   closure Features and integration evidence.
8. Keep every task independently reviewable with scope, linked requirements,
   verification, and done criteria.

## Required Task Block Template

```md
### T-001-01 Task title
状态: todo
描述: Concrete implementation work.
关联需求: REQ-001, US-001
范围: Allowed files or modules.
验证: Targeted command or acceptance check.
完成标准: Observable done criteria.
Journey Checkpoint: scenario, expected evidence, acceptance rows, verification command.
```

English-only projects may use `Status:`, `Description:`, `Related
Requirements:`, `Scope:`, `Verification:`, `Done Criteria:`, and `Journey
Checkpoint:`. The heading ID and standalone status line are mandatory.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter.
Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level
traceability from the invocation. Include produced artifacts, next action, and a
concise result object specific to this workflow step.

## Specialized Result Contract

`result` should contain:

- `tasksPath`: generated or updated Feature tasks path.
- `taskCoverage`: task IDs mapped to requirements, user stories, and design
  sections.
- `journeyCheckpoints`: P1 journey checkpoints with evidence expectations.
- `foundationCheckpoints`: downstream integration checkpoints when applicable.
- `parserCompatibility`: status of task heading/status-line compatibility.
- `verificationPlan`: commands or acceptance checks per story phase.
- `openQuestions`: missing inputs or blocked task-slicing decisions.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the Feature task boundary.
- `tasks.md` remains parseable by the Feature Spec Webview task parser.
- Every P1 user story has a Journey Checkpoint or valid foundation integration
  checkpoint.
- UI/configuration tasks are vertical behavior obligations, not only files,
  components, endpoints, text, or screenshots.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded
  beyond what the Feature design and HLD require.

## Failure Routing

- Use `clarification_needed` when requirements or design do not identify a
  verifiable user journey.
- Use `risk_review_needed` when tasks require broad refactors or architecture
  changes beyond the Feature design.
- Use `blocked` when required Feature requirements or design files cannot be
  read.
