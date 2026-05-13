---
name: 09.review.evidence-completeness
description: "Run the Agentic Spec review evidence completeness workflow. Use when the scheduler, operator, or another skill explicitly requests `09.review.evidence-completeness` and needs traceable review findings, quality decisions, risk routing, or coverage judgments inside the review and quality-gate boundary."
---

# Review Evidence Completeness

## Purpose

Use this skill to decide whether evidence is complete enough to support a
delivery decision across the full Define -> Plan -> Build -> Verify -> Review
-> Ship lifecycle.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `09.review.evidence-completeness` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `09.review.evidence-completeness` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Read source intent, requirements, Feature Spec, execution result, tests,
   logs, screenshots/traces, review findings, Git delivery evidence, and the
   Delivery Fidelity Ledger.
2. Confirm every source intent and behavior obligation has an evidence row with
   a source, status, covers list, and artifact refs.
3. Confirm every handoff preserved obligations or recorded a closed/deferred
   loss.
4. Confirm independent Test/QA/Review/Release evidence exists for completed
   feature execution.
5. Return `review_needed` for missing artifact refs, self-review-only closure,
   fixture-only evidence, entry/text-only evidence, or open P0/P1 losses.

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
- Evidence proves behavior obligations and delivery handoffs, not only file
  edits, test command success, commit creation, or PR existence.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
