---
name: 09.review.release-readiness
description: "Run the Agentic Spec review release readiness workflow. Use when the scheduler, operator, or another skill explicitly requests `09.review.release-readiness` and needs traceable review findings, quality decisions, risk routing, or coverage judgments inside the review and quality-gate boundary."
---

# Review Release Readiness

## Purpose

Use this skill to decide whether a Feature can ship after implementation,
verification, review, and delivery evidence have been collected.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `09.review.release-readiness` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `09.review.release-readiness` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Read Feature Spec, execution result, Delivery Fidelity Ledger, journey
   closure, test coverage, evidence completeness, code review, Git delivery,
   PR/check state, release notes, and open ReviewItems.
2. Confirm no open P0/P1 loss remains and any P2 loss has an accepted/deferred
   decision with owner and follow-up.
3. Confirm `completionDecision` was made by a Release Reviewer or equivalent
   independent pass, not only by the Implementation Agent.
4. Return `review_needed` for missing merge/check/cleanup evidence, unclosed
   losses, self-review-only completion, or unresolved spec drift.
5. Record assumptions, blockers, and follow-up actions in the output instead of
   inventing missing facts.

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
- Release readiness accounts for Delivery Fidelity, Journey Closure, test
  semantics, evidence completeness, Git delivery, and cleanup.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
