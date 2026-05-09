---
name: 07.execution.monitor-run
description: "Execute the Agentic Spec 07 execution workflow for monitor run with reusable input references, output contract, and acceptance checks."
---

# Execution Monitor Run

## Purpose

Use this skill to perform the Agentic Spec `07` `execution` workflow step for `monitor-run`. Keep the workflow reusable across Agentic Spec projects and avoid product-specific assumptions.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `07.execution.monitor-run` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

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

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `07` `execution` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
