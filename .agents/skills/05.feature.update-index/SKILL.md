---
name: 05.feature.update-index
description: "Execute the Agentic Spec 05 feature workflow for update index with reusable input references, output contract, and acceptance checks."
---

# Feature Update Index

## Purpose

Use this skill to perform the Agentic Spec `05` `feature` workflow step for `update-index`. Keep the workflow reusable across Agentic Spec projects and avoid product-specific assumptions.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `05.feature.update-index` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Confirm the requested action and identify the relevant Agentic Spec phase, object, and state.
2. Read the minimum source references needed to make the result traceable.
3. Produce the requested workflow result, preserving existing IDs, states, and evidence links unless the invocation explicitly asks for a change.
4. Record assumptions, blockers, and follow-up actions in the output instead of inventing missing facts.
5. Keep implementation-specific details out of the skill unless they are passed as constraints or evidence.
6. If this invocation generates or updates the Feature index or other Spec
   documents, run the mandatory quality review and repair loop from
   `.agents/skills/SPEC_DOC_QUALITY_LOOP.md` before returning `completed`.
   Define `qualityLoopPlan` first, including the selected Quality Review Skill /
   Repair Owner and rationale, use separate Quality Review and Repair subagents,
   cap the loop at 10 iterations, and exit when remaining gaps are not in-scope
   repairable.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `05` `feature` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Generated or updated Spec documents include `result.qualityRepairLoop`.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
