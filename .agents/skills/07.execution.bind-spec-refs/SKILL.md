---
name: 07.execution.bind-spec-refs
description: "Run the Agentic Spec execution bind spec refs workflow. Use when the scheduler, operator, or another skill explicitly requests `07.execution.bind-spec-refs` and needs traceable execution references, events, run monitoring results, state updates, or implementation evidence inside the execution-state boundary."
---

# Execution Bind Spec Refs

## Purpose

Run the exact Agentic Spec execution `bind-spec-refs` step for `07.execution.bind-spec-refs`. This skill turns referenced inputs into execution references, events, run monitoring results, state updates, or implementation evidence while staying inside the execution-state boundary. It must preserve existing IDs, states, and evidence links unless the invocation explicitly authorizes a change.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `07.execution.bind-spec-refs` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `07.execution.bind-spec-refs` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Confirm the invocation requested `07.execution.bind-spec-refs`, identify the target artifact or object, and verify the current state allows this bind spec refs step.
2. Read the smallest set of referenced files needed for traceability, plus repository facts only when they materially affect the result.
3. Produce the execution references, events, run monitoring results, state updates, or implementation evidence requested by the invocation, preserving stable IDs, states, source refs, and evidence links unless the invocation explicitly allows a change.
4. Record assumptions, blockers, unresolved ambiguity, and follow-up routing in the structured result instead of inventing missing facts.
5. Keep adjacent phase work out of scope; route requirement changes, architecture decisions, implementation, tests, review, approval, recovery, audit, or release work to the owning skill when this skill does not own it.

## Subagent Delegation

- **Use when**: Use Explorer, Worker, Review, and Verification subagents only after the owner thread has assigned disjoint responsibilities and file scopes.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Worker subagents may edit only their declared owned files; Explorer/Review/Verification subagents are read-only unless a scoped fix is explicitly assigned.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `07` `execution` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
