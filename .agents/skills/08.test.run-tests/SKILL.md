---
name: 08.test.run-tests
description: "Run and analyze tests for SpecDrive tasks or features. Use when targeted, regression, browser, build, or acceptance verification is required before status or delivery decisions."
---

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
- Status Checker summary.
- Recommended next action.

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
- `fidelityLosses`: any discovered `test_bypass`, `journey_loss`, `interaction_loss`, `state_loss`, or `data_loss`.
- `recommendedNextAction`: recovery, review, rerun, broaden tests, or no action.

## Failure Routing

- Use `12.recovery.classify-failure` for recoverable implementation or test failures.
- Use `blocked` for missing environment or unavailable external dependency.
- Use `risk_review_needed` when verification is insufficient for a high-risk change.
- Use `review_needed` when tests pass but only prove entry/text/API fixture
  behavior while the behavior obligation remains unproven.
