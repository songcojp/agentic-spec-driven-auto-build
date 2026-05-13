---
name: 04.ui.define-interactions
description: "Run the Agentic Spec UI define interactions workflow. Use when the scheduler, operator, or another skill explicitly requests `04.ui.define-interactions` and needs traceable UI states, interactions, page lists, or UI specification artifacts inside the UI specification and interaction boundary."
---

# UI Define Interactions

## Purpose

Define the interaction matrix for UI, configuration, approval, dashboard,
settings, editor, or multi-step workflow surfaces. This skill owns the
user-action-to-state/data/evidence contract that prevents UI work from passing
with only text, screenshots, or happy-path navigation.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `04.ui.define-interactions` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `04.ui.define-interactions` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Read PRD user journeys, requirements, HLD surface inventory, UI Spec, Feature
   Spec, concept images, and review findings named by the invocation.
2. Identify every page, panel, drawer, dialog, step, form, table, command bar,
   and approval or recovery surface that the scoped requirements imply.
3. For each interaction row, define entry point, field/control, user action,
   save/cancel/validate behavior, state feedback, data source, persistence
   assertion, reload/revisit assertion, error/empty/permission behavior, and
   verification mode.
4. Separate visual acceptance from functional interaction acceptance. Screens
   may pass visual review while still failing interaction completeness.
5. Return `review_needed` when a requirement-backed surface only has a concept
   image, page heading, status label, or happy-path navigation.

## Required Interaction Matrix Shape

```md
| Surface | Entry | Field/Control | User Action | State Feedback | Persistence / Source Truth | Reload Assertion | Verification |
|---|---|---|---|---|---|---|---|
```

Each row must name the requirement or user story it closes. If a surface is
intentionally read-only, say so explicitly and name the source requirement or
non-goal that makes it read-only.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `04` `ui` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- UI/configuration surfaces include interaction matrix rows and browser or
  equivalent runtime evidence expectations.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
