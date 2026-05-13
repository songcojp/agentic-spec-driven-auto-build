---
name: 14.release.archive-run
description: "Run the Agentic Spec release archive run workflow. Use when the scheduler, operator, or another skill explicitly requests `14.release.archive-run` and needs traceable release-gate, PR-prep, release note, archive, or released-state outputs inside the release and delivery boundary."
---

# Release Archive Run

## Purpose

Run the exact Agentic Spec release `archive-run` step for `14.release.archive-run`. This skill turns referenced inputs into release-gate, PR-prep, release note, archive, or released-state outputs while staying inside the release and delivery boundary. It must preserve existing IDs, states, and evidence links unless the invocation explicitly authorizes a change.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `14.release.archive-run` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `14.release.archive-run` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Confirm the invocation requested `14.release.archive-run`, identify the target artifact or object, and verify the current state allows this archive run step.
2. Read the smallest set of referenced files needed for traceability, plus repository facts only when they materially affect the result.
3. Produce the release-gate, PR-prep, release note, archive, or released-state outputs requested by the invocation, preserving stable IDs, states, source refs, and evidence links unless the invocation explicitly allows a change.
4. Record assumptions, blockers, unresolved ambiguity, and follow-up routing in the structured result instead of inventing missing facts.
5. Keep adjacent phase work out of scope; route requirement changes, architecture decisions, implementation, tests, review, approval, recovery, audit, or release work to the owning skill when this skill does not own it.

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
- The result stays within the `14` `release` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
