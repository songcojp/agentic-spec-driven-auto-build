---
name: 09.review.code-diff
description: "Produce review findings and delivery-risk reports for SpecDrive changes. Use when diff, test results, architecture risk, approval items, or Review Center records need concise actionable findings. Includes spec drift detection: behavior that diverges from REQ-* requirements is reported as a finding."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `09.review.code-diff` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Review Report Skill

Use this skill for code, spec, or delivery review summaries.

## Workflow

1. Read the diff, feature requirements, design, tasks, test results, and review item context.
2. **Detect spec drift**: for each changed file in the diff, check whether the implemented behavior matches the acceptance criteria of the `REQ-*` or `US-*` requirements it was supposed to fulfill. Flag any divergence—over-implementation, under-implementation, behavioral mismatch, missing Journey Checkpoint evidence, or missing Git Delivery Checkpoint evidence—as a spec drift finding.
3. Compare implementation evidence against `User Journey Coverage` and `Journey Checkpoint` sections. For UI-bearing Features, API/ViewModel/mock-only evidence is a blocking under-implementation unless the Feature is explicitly backend-only.
4. Prioritize real bugs, behavioral regressions, missing tests, missing journey closure, missing Git delivery evidence, security/privacy risks, and spec drift.
5. Anchor findings to file paths, requirement IDs, Journey Checkpoints, or source references. Every finding must state: location, expected behavior (from spec), actual behavior (from diff), and severity.
6. Separate blocking findings from suggestions.
7. Recommend the next state: approve, request fixes, clarify, risk review, rollback, Journey Closure review, or spec evolution.

## Finding Severity Levels

| Severity | Description |
|---|---|
| **Blocking** | Wrong behavior, missing required feature, security risk, broken test, spec drift that changes user outcome |
| **Suggestion** | Style, minor readability, non-behavioral improvement, low-risk simplification |

## Output

- Spec drift findings (requirement ID → expected → actual → severity).
- Journey closure findings (user story or checkpoint → expected evidence → actual evidence → severity).
- Git delivery findings (`result.gitDelivery` field → expected evidence → actual evidence → severity).
- Other findings ordered by severity (blocking first, then suggestions).
- Verification and source references.
- Required fixes or approval decision.
- Residual risk summary.

## Subagent Delegation

- **Use when**: Use read-only Review or Verification subagents for independent checking, failure analysis, or evidence review.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Review and Verification subagents do not edit files; any repair must route to the owning generation, change, recovery, or execution skill.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state finding count by severity and whether the change can proceed.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `specDriftFindings`: array of requirement ID, expected behavior, actual behavior, and severity.
- `journeyClosureFindings`: array of user story/checkpoint ID, expected evidence, actual evidence, and severity.
- `gitDeliveryFindings`: array of `result.gitDelivery` field, expected evidence, actual evidence, and severity.
- `findings`: array of other review findings ordered by severity.
- `verificationReferences`: commands, files, lines, or evidence used.
- `requiredFixes`: blocking fixes or approval decisions.
- `residualRisks`: remaining risks after review.

## Failure Routing

- Use `risk_review_needed` for high-risk unresolved findings.
- Use `clarification_needed` for spec ambiguity found during review.
- Use `10.change.update-mainline-spec` if a finding reveals that the spec itself is wrong (not the implementation).
