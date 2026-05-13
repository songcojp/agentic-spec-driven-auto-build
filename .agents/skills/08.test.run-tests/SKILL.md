---
name: 08.test.run-tests
description: "Run and analyze tests for SpecDrive tasks or features. Use when targeted, regression, browser, build, or acceptance verification is required before status or delivery decisions."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `08.test.run-tests` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Test Execution Skill

Use this skill to produce trustworthy verification summaries that prove behavior
obligations, not just command success.

## Workflow

1. Read the task or Feature acceptance criteria, behavior obligations,
   Delivery Fidelity Ledger, and repository test/build commands.
2. Build a test obligation list before running commands. Each obligation must
   name the source requirement/journey, action under test, expected state/data
   change, evidence type, and whether seed/API fixtures are only preconditions.
3. Select the narrowest command that proves the changed behavior; broaden only
   when risk requires it.
4. Run tests from the correct worktree and runtime environment.
5. For UI or multi-step workflows, prefer browser/equivalent runtime evidence:
   interaction, state mutation, detail/list/reload roundtrip, negative path, and
   screenshot/trace/log refs.
6. Classify failures as product mismatch, implementation bug, environment
   issue, flaky test, missing fixture, spec gap, or test semantics gap.
7. Attach command, exit status, concise output summary, artifacts, and behavior
   coverage to the result.

## Output

- Commands run and results.
- Failure classification.
- Behavior obligations covered and not covered.
- Evidence rows suitable for `result.deliveryFidelity.evidence`.
- Runtime evidence rows suitable for `result.runtimeEvidence` when the change
  touches UI/App behavior, including app launch, route access, journey
  interaction, state assertion, reload persistence or equivalent, negative path,
  and screenshot/trace/log refs.
- Status Checker summary.
- Recommended next action.

## Subagent Delegation

- **Use when**: Use read-only Review or Verification subagents for independent checking, failure analysis, or evidence review.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Review and Verification subagents do not edit files; any repair must route to the owning generation, change, recovery, or execution skill.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state commands run, pass/fail state, failure classification, and recommended next action.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `commands`: array with command, cwd, exitCode, status, and concise output summary.
- `testObligations`: array with id, sourceRef, behavior, action, expectedObservation, fixturePolicy, status, and evidenceRefs.
- `failureClassification`: failure category or `null`.
- `statusChecker`: status checker decision and reasons.
- `artifacts`: logs, screenshots, reports, or evidence paths.
- `runtimeEvidence`: app launch, journey runtime, state assertion, reload
  persistence or equivalent, negative path, and screenshot/trace/log refs when
  applicable.
- `fidelityLosses`: any discovered `test_bypass`, `journey_loss`, `interaction_loss`, `state_loss`, or `data_loss`.
- `recommendedNextAction`: recovery, review, rerun, broaden tests, or no action.

## Failure Routing

- Use `12.recovery.classify-failure` for recoverable implementation or test failures.
- Use `blocked` for missing environment or unavailable external dependency.
- Use `risk_review_needed` when verification is insufficient for a high-risk change.
- Use `review_needed` when tests pass but only prove entry/text/API fixture
  behavior while the behavior obligation remains unproven.
