---
name: 08.test.generate-integration-tests
description: "Generate integration-test plans or code from approved requirements and Feature Specs. Use when behavior must be proven across real module, persistence, adapter, runtime, UI, or state boundaries with executable verification commands."
---

# Test Generate Integration Tests

## Purpose

Create or update integration-test plans or integration-test code from approved
requirements, Feature Spec tasks, HLD/data-flow/adapter decisions, and existing
repository test patterns. Integration tests must prove behavior across real
module boundaries, state transitions, persistence, APIs/adapters, or UI/runtime
surfaces; API fixtures or entry-text checks alone are not enough.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `08.test.generate-integration-tests` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests
`08.test.generate-integration-tests`, or when an approved Feature Spec needs
integration coverage before execution, review, or release. Do not use it for
unit-test-only generation, manual QA notes, or broad test-suite refactors.

## Input References

Read only the artifacts needed for the request, preferring references over
copied document bodies:

- Requirements, Feature Spec `requirements.md`, `design.md`, `tasks.md`,
  acceptance criteria, HLD/data-flow/adapter decisions, ADRs, and run/review
  evidence named by the invocation.
- Existing test files, fixtures, helpers, package scripts, browser configs, and
  repository conventions that determine how integration tests should be written
  and run.
- Runtime constraints, data persistence contracts, UI/IDE/Product Console scope,
  adapter boundaries, approvals, and acceptance criteria.

## Workflow

1. Confirm the target behavior obligations, affected requirements, allowed test
   files, runtime surface, and verification command.
2. Inspect existing integration-test style before writing new tests. Prefer
   current helpers, seeded data patterns, browser/runtime harnesses, and package
   scripts over inventing a parallel test framework.
3. Map every proposed test to a requirement, acceptance check, boundary/error
   path, and expected evidence type.
4. Cover at least one real integration boundary for each behavior slice:
   persistence and reload/revisit, API/adapter contract, event/state transition,
   CLI/runtime process, IDE Webview interaction, or browser/UI flow as
   applicable.
5. Include negative, empty, duplicate, timeout, permission, recovery, and
   concurrency paths when they are relevant to the requirement or HLD risk.
6. When generating test code, keep edits scoped to the declared test files and
   minimal supporting fixtures. Do not rewrite production code or unrelated test
   infrastructure unless explicitly requested.
7. When generating a test-spec document instead of code, include test cases,
   data setup, assertions, evidence refs, verification command, and known gaps.
8. Record blockers when tests require unavailable runtime services, missing
   seed data, unclear acceptance criteria, or unresolved architecture/data
   decisions.
9. If this invocation generates or updates test-spec documents, run the
   mandatory quality review and repair loop from
   `.agents/skills/SPEC_DOC_QUALITY_LOOP.md` before returning `completed`.
   Define `qualityLoopPlan` first, including the selected Quality Review Skill,
   Repair Owner, and rationale. After this governed loop has been explicitly
   invoked, use separate Quality Review and Repair subagents when available;
   otherwise use isolated owner-thread passes and record the fallback. Cap the
   loop at 10 iterations and exit when remaining gaps are not in-scope
   repairable.

## Integration Test Quality Bar

- Tests prove cross-module behavior, not only function-level logic.
- Each test maps to requirement IDs, acceptance checks, and the Feature/task
  scope that needs the evidence.
- Fixtures prepare preconditions only; they do not replace the user/system
  behavior under test.
- UI/runtime tests include interaction, state change, persistence or explicit
  runtime exemption, and negative/boundary behavior when applicable.
- Verification commands are executable in the repository and named exactly.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

`result` should include `testArtifacts`, `requirementCoverage`,
`acceptanceCoverage`, `integrationBoundaries`, `verificationCommands`,
`uncoveredGaps`, `blockedTests`, and `qualityRepairLoop` when a test-spec
document was generated or updated.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `08` `test` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Generated or updated Spec documents include `result.qualityRepairLoop`.
- Integration tests are tied to real repository commands and existing test
  patterns.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
