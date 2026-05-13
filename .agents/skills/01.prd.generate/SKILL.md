---
name: 01.prd.generate
description: "Run the Agentic Spec PRD generate workflow. Use when the scheduler, operator, or another skill explicitly requests `01.prd.generate` and needs traceable product-intent outputs that downstream requirements can consume inside the product-intent boundary."
---

# PRD Generate

## Purpose

Generate or refresh the project PRD at the product-intent layer. The PRD must
be specific enough for requirements-first decomposition: it should preserve
users, workflows, module sub-capabilities, success/failure examples, non-goals,
risks, priorities, and acceptance direction. It must not stop at module names,
page names, or broad product slogans.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `01.prd.generate` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `01.prd.generate` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Confirm the requested action and identify the relevant Agentic Spec phase,
   object, and state.
2. Read intake notes, product brief, existing PRD, requirements, HLD, UI Spec,
   Feature index, review findings, and repository facts needed for traceability.
3. For every major capability, identify actors, user goals, workflow steps,
   sub-capabilities, success examples, failure examples, non-goals, priority,
   and evidence direction.
4. For UI/configuration-heavy modules, list the configuration groups and user
   actions that downstream UI Spec and Feature Spec must cover. For example,
   an App Studio-like module must identify basics, template, page structure,
   team, Skill, Tool/MCP, Provider, Artifact, task flow, approval, budget, and
   publish groups when source intent supports them.
5. Produce the PRD without task-level implementation details, function
   signatures, or file edits.
6. Record assumptions, blockers, and follow-up actions. Return
   `clarification_needed` or `review_needed` instead of inventing missing
   product intent.
7. Run the mandatory Spec document quality review and repair loop from
   `.agents/skills/SPEC_DOC_QUALITY_LOOP.md` before returning `completed`.
   The calling Skill must define `qualityLoopPlan`, including the selected
   PRD quality review Skill / Repair Owner and rationale, then use a Quality
   Review Subagent and a Repair Subagent for up to 10 iterations. Repairs are
   allowed only when they are source-backed, in scope for the PRD artifact, and
   do not invent product intent.

## PRD Granularity Gate

The PRD fails this skill's quality bar when it:

- names a module, page, role, or workflow without the user action and target
  outcome;
- omits success and failure examples for P1 journeys;
- leaves non-goals, priority, or phase boundary implicit;
- describes a UI/configuration surface without the configuration groups or
  actions downstream specs must close;
- cannot feed `02.requirements.convert-ears` without interpretation.

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
- The result stays within the `01` `prd` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Every P1 module has user scenarios, sub-capabilities, success/failure
  examples, non-goals, priority, and downstream evidence direction.
- `result.qualityRepairLoop` records `qualityLoopPlan`, subagent usage, iteration
  count, final decision, remaining gaps, and exit reason.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
