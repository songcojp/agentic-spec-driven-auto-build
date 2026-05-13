---
name: 09.review.test-coverage
description: "Run the Agentic Spec review test coverage workflow. Use when the scheduler, operator, or another skill explicitly requests `09.review.test-coverage` and needs traceable review findings, quality decisions, risk routing, or coverage judgments inside the review and quality-gate boundary."
---

# Review Test Coverage

## Purpose

Use this skill to determine whether the executed tests prove the intended
behavior obligations. It reviews test semantics, not only whether a command was
green.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `09.review.test-coverage` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `09.review.test-coverage` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Read PRD/requirements/Feature Spec, behavior obligations, test plan,
   executed commands, artifacts, and Delivery Fidelity evidence.
2. Map each P0/P1/P2 behavior obligation to at least one test or runtime proof.
3. Reject coverage that only checks page entry, text presence, mocked ViewModel
   state, or API-seeded outcomes when the requirement is user-facing behavior.
4. Verify fixture policy: API/seed setup can establish preconditions but cannot
   be counted as the user action under test.
5. Record coverage gaps as `test_bypass`, `journey_loss`,
   `interaction_loss`, `state_loss`, or `data_loss` with owner and severity.
6. Return pass only when required obligations have meaningful proof and open
   gaps have an explicit defer/accept decision.

## Subagent Delegation

- **Use when**: Use read-only Review or Verification subagents for independent checking, failure analysis, or evidence review.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Review and Verification subagents do not edit files; any repair must route to the owning generation, change, recovery, or execution skill.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `09` `review` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Test semantics are judged against behavior obligations, not against generic
  command success.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
