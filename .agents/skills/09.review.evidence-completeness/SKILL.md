---
name: 09.review.evidence-completeness
description: "Execute the Agentic Spec 09 review workflow for evidence completeness with reusable input references, output contract, and acceptance checks."
---

# Review Evidence Completeness

## Purpose

Use this skill to decide whether evidence is complete enough to support a
delivery decision across the full Define -> Plan -> Build -> Verify -> Review
-> Ship lifecycle.

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

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `09` `review` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Evidence proves behavior obligations and delivery handoffs, not only file
  edits, test command success, commit creation, or PR existence.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
