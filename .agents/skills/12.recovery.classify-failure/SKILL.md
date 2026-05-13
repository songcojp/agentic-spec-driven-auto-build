---
name: 12.recovery.classify-failure
description: "Plan and execute bounded recovery for failed SpecDrive tasks. Use when a task failure, failed command, status check failure, or Codex Runner error produces a recovery task and retry policy."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `12.recovery.classify-failure` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Failure Recovery Skill

Use this skill for recoverable failures only. Respect retry limits, failure fingerprints, and forbidden retry items.

## Workflow

1. Read the recovery task input: failure type, failed command, summary, related files, fingerprint, historical attempts, forbidden retry items, and max retries.
2. Classify the likely root cause from available context before editing.
3. Choose a recovery action: retry, auto-fix, alternate command, narrow rollback, spec clarification, or manual review.
4. Do not repeat a forbidden strategy for the same fingerprint.
5. If auto-fixing, keep edits inside the proposed file scope and run the verification command.
6. Record the outcome, verification summary, and whether retry budget remains.

## Output

- Recovery classification and action.
- Files changed or command retried.
- Verification summary.
- Updated failure fingerprint notes.

## Subagent Delegation

- **Use when**: Use read-only Review/Explorer subagents only when they can independently validate referenced artifacts; they must not edit files.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: No subagent may write files unless this skill explicitly enters a repair or update workflow with allowed artifacts.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the failure classification, recovery action, and verification outcome.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `classification`: failure type and retryability.
- `actions`: array of recovery actions, file changes, or commands retried.
- `verification`: array of verification commands or inspections with outcomes.
- `failureFingerprint`: updated fingerprint or `null`.
- `retryBudgetRemaining`: boolean or number.
- `nextRecoveryAction`: recommended recovery or review action.

## Failure Routing

- Use `review_needed` when retry budget is exhausted.
- Use `clarification_needed` for spec mismatch or unclear expected behavior.
- Use `risk_review_needed` for recovery that requires broad or unsafe changes.
