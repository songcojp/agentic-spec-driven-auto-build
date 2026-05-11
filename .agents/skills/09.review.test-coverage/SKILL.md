---
name: 09.review.test-coverage
description: "Execute the Agentic Spec 09 review workflow for test coverage with reusable input references, output contract, and acceptance checks."
---

# Review Test Coverage

## Purpose

Use this skill to determine whether the executed tests prove the intended
behavior obligations. It reviews test semantics, not only whether a command was
green.

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

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `09` `review` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Test semantics are judged against behavior obligations, not against generic
  command success.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
