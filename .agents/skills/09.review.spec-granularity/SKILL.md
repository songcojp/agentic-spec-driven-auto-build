---
name: 09.review.spec-granularity
description: "Review whether PRD, requirements, HLD, UI Spec, and Feature Spec artifacts have enough granularity to safely generate design, tasks, ready state, or execution."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `09.review.spec-granularity` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Spec Granularity Review Skill

Use this skill before a mainline artifact feeds the next layer, before a
Feature moves to `ready`, and when review finds that implementation matched
words but missed the intended behavior. This is a requirements-first gate:
requirements must be specific before design, design must be refined after
requirement changes, and tasks must be synced after design changes.

## Workflow

1. Read PRD, requirements, HLD, UI Spec, Feature Spec `requirements.md`,
   `design.md`, `tasks.md`, Feature index, and any review findings named by the
   invocation.
2. Check PRD granularity: users, goals, workflows, module sub-capabilities,
   success examples, failure examples, non-goals, and priority.
3. Check requirements granularity: each `REQ-*`, `NFR-*`, and `EDGE-*` is an
   atomic EARS behavior with `US-*` mapping, acceptance, boundary/error path,
   and evidence type.
4. Check HLD granularity: system-level subsystem ownership, source-of-truth
   data, state flows, interface/event strategy, runtime topology, recovery, and
   testing strategy.
5. Check UI granularity when UI exists: page/view/modal inventory, user action
   flows, state feedback, data binding, interaction matrix, save/validate/reload
   assertions, and browser evidence plan.
6. Check Feature granularity: every P1 journey has a requirement row, design
   path, parser-compatible task block, Journey Checkpoint, and evidence plan.
7. Return `review_needed` when any layer only names a module, page, component,
   happy path, entry text, screenshot, fixture, or task title without the
   behavior and evidence needed by the downstream layer.
8. When invoked by a document-generation quality loop, classify every finding
   against the caller-provided `qualityLoopPlan` as `in_scope_repairable`,
   `in_scope_not_repairable`, or `out_of_scope`. The review subagent does not
   edit files; bounded repair belongs to the separate Repair Subagent defined in
   `.agents/skills/SPEC_DOC_QUALITY_LOOP.md`.

## Required Gap Types

- `intent_gap`: PRD misses user, goal, success/failure example, non-goal, or
  module sub-capability.
- `behavior_gap`: requirements are not atomic, observable, testable, or mapped
  to user stories and evidence.
- `architecture_gap`: HLD misses source-of-truth data, state flow, interface,
  runtime, recovery, or quality strategy.
- `interaction_gap`: UI Spec or Feature design misses user actions, editable
  controls, save/cancel/validate behavior, or state feedback.
- `state_data_gap`: state/data ownership, persistence, reload, or derived view
  truth is unclear.
- `task_gap`: tasks are not vertical, parser-compatible, requirement-linked, or
  independently reviewable.
- `evidence_gap`: acceptance, browser/API/runtime evidence, reload/revisit
  proof, or negative sample is missing.

## Subagent Delegation

- **Use when**: Use read-only Review or Verification subagents for independent checking, failure analysis, or evidence review.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Review and Verification subagents do not edit files; any repair must route to the owning generation, change, recovery, or execution skill.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter.
Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level
traceability from the invocation.

`result.specGranularity` must contain:

- `decision`: `"pass"` or `"fail"`.
- `artifactLevelFindings`: findings grouped by PRD, requirements, HLD, UI Spec,
  Feature requirements, Feature design, and Feature tasks.
- `missingUserScenarios`: user journeys, success examples, failure examples, or
  non-goals needed before requirements/design can proceed.
- `missingBehaviorRequirements`: missing or untestable EARS behavior rows.
- `missingStateDataContracts`: missing state, data ownership, persistence,
  interface, event, reload, or source-of-truth contracts.
- `missingInteractionMatrix`: missing UI/configuration interaction matrix rows.
- `missingAcceptanceEvidence`: missing acceptance, evidence mode, browser,
  runtime, reload/revisit, or negative sample checks.
- `requiredRefinements`: exact upstream artifact edits required before the
  downstream layer can proceed.
- `repairScopeFindings`: compact gap classifications against the provided
  `qualityLoopPlan`, including gap ID, artifact, classification, reason, and
  evidence refs.
- `repairInstructions`: exact in-scope repairs suitable for a Repair Subagent;
  leave empty when there is no in-scope source-backed repair.

## Acceptance Checks

- The review checks artifact granularity, not only file presence.
- Requirements-first sequencing is preserved: refine requirements before design
  and sync tasks after design changes.
- UI/configuration Features include an interaction matrix with entry, fields or
  controls, user action, save/cancel/validate behavior, state feedback,
  reload assertion, and verification mode.
- `review_needed` is used for gaps that would make implementation likely to
  satisfy text while missing the intended behavior.
- When used as a Quality Review Subagent, the result is compact and
  action-oriented; do not include full artifact excerpts or long-form analysis.

## Failure Routing

- Use `review_needed` for `intent_gap`, `behavior_gap`, `architecture_gap`,
  `interaction_gap`, `state_data_gap`, `task_gap`, or `evidence_gap`.
- Use `clarification_needed` when the missing granularity requires product
  intent from a human.
- Use `risk_review_needed` when the missing granularity affects architecture,
  security, runtime state, existing completed Features, or downstream projects.
