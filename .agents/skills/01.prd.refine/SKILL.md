---
name: 01.prd.refine
description: "Refine an existing PRD into source-backed, requirements-ready product intent. Use when a PRD needs clearer journeys, priorities, non-goals, examples, evidence direction, and traceability before EARS/HLD/UI/Feature work."
---

# PRD Refine

## Purpose

Refine an existing PRD at the product-intent layer so downstream EARS
requirements, HLD, UI Spec, and Feature Specs can be generated without guessing.
This skill improves clarity, granularity, traceability, and review readiness; it
does not implement code, split Feature Specs, or add requirements that are not
backed by the approved source.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `01.prd.refine` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests
`01.prd.refine`, or when an existing PRD needs source-backed refinement before
requirements conversion. Do not use it as a catch-all replacement for
`01.prd.generate`, `02.requirements.convert-ears`, or change-intake skills.

## Input References

Read only the artifacts needed for the request, preferring references over
copied document bodies:

- Existing PRD and source brief/intake files named by the invocation.
- Existing requirements, HLD, UI Spec, Feature index, review findings, or
  change records only when needed to preserve traceability or avoid drift.
- Repository facts and constraints only when they materially affect product
  boundaries.
- Applicable policies, guardrails, approvals, and acceptance criteria.

If the invocation provides localized docs, preserve the source language and
existing numbering/terminology.

## Workflow

1. Confirm the target PRD path, source-of-truth inputs, allowed write scope, and
   whether this is a refinement, correction, or change-governed update.
2. Preserve valid existing structure, IDs, source links, decisions, and locale.
   Do not rewrite broad sections only for style.
3. For every P1 or user-facing capability, ensure the PRD names actors, user
   journeys, user actions, target outcomes, success examples, failure/edge
   examples, priority, non-goals, NFR direction, and downstream evidence
   expectations when the source supports them.
4. For UI/configuration-heavy products, ensure the PRD identifies expected
   configuration groups, editable actions, persisted state expectations, and
   review/approval surfaces rather than only page or module names.
5. Tighten ambiguous statements into source-backed product intent. If a gap
   requires new product intent, add an open question and return
   `clarification_needed` or `review_needed` instead of inventing behavior.
6. Keep implementation choices, file edits, schemas, task lists, and algorithm
   details out of the PRD unless the approved source names them as hard
   constraints.
7. Run the mandatory Spec document quality review and repair loop from
   `.agents/skills/SPEC_DOC_QUALITY_LOOP.md` before returning `completed`.
   Define `qualityLoopPlan`, including the selected PRD quality review Skill,
   Repair Owner, and rationale. After this governed loop has been explicitly
   invoked, use separate Quality Review and Repair subagents when available;
   otherwise use isolated owner-thread passes and record the fallback. Cap the
   loop at 10 iterations and exit when remaining gaps are not in-scope
   repairable.

## PRD Refinement Quality Bar

- Every core journey has actor, trigger, action, outcome, and success/failure
  examples.
- P1 modules expose sub-capabilities instead of collapsing into a single module
  name.
- Non-goals, phase boundaries, priority, and acceptance direction are explicit.
- Downstream `02.requirements.convert-ears` can produce testable requirements
  without interpreting missing behavior.
- Open questions are minimal, actionable, and tied to the affected source
  section.

## Subagent Delegation

- **Use when**: Use read-only Review/Explorer subagents only when they can independently validate referenced artifacts; they must not edit files.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: No subagent may write files unless this skill explicitly enters a repair or update workflow with allowed artifacts.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

`result` should include `prdPath`, `inputFiles`, `refinedSections`,
`preservedDecisions`, `openQuestions`, `readinessDecision`, and
`qualityRepairLoop`.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `01` `prd` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Product intent was refined from existing sources rather than invented.
- `result.qualityRepairLoop` records `qualityLoopPlan`, subagent usage, iteration
  count, final decision, remaining gaps, and exit reason.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
