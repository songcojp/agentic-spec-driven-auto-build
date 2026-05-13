---
name: 14.release.prepare-pr
description: "Prepare commits, push branches, and create pull requests for SpecDrive delivery. Use when a completed feature or task needs a clean commit, PR description, verification summary, and delivery traceability."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `14.release.prepare-pr` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# PR Generation Skill

Use this skill after implementation, tests, and review have passed when delivery
was intentionally split from `07.execution.dispatch-adapter`, or when a previous
Feature execution stopped after implementation and needs PR / merge / cleanup
closeout. Default Feature execution should normally use
`07.execution.dispatch-adapter` for implementation and Git delivery in one
Feature lifecycle.

## Workflow

1. Inspect git status and confirm the intended diff belongs to the feature or task.
2. Stage only files that belong to the feature or task; preserve unrelated user changes.
3. Use a Conventional Commit message with a narrow scope and traceability when practical.
4. Push the feature branch to the configured remote.
5. Create a PR with summary, requirement/feature traceability, verification summary, risks, and follow-up items.
6. Inspect PR checks and required reviews; merge only when repository policy permits it.
7. Clean up the remote branch, local branch, and sibling worktree when merge and local safety checks allow it.
8. Do not include unrelated user changes.

## Output

- Commit hash.
- Branch, PR URL, merge status, and cleanup summary or failure summary.
- Verification summary.
- Delivery notes.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state whether the commit, push, PR creation, merge, and cleanup completed or where delivery stopped.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `commitHash`: created commit hash or `null`.
- `branchName`: pushed branch name or current delivery branch.
- `prUrl`: pull request URL or `null`.
- `mergeStatus`: merged, approval_needed, blocked, or not_attempted.
- `remoteBranchCleanup`: completed, blocked, or not_attempted.
- `localBranchCleanup`: completed, blocked, or not_attempted.
- `worktreeCleanup`: completed, blocked, or not_applicable.
- `verification`: array of checks run before delivery.
- `deliveryNotes`: concise release/PR notes and follow-ups.
- `blockedReason`: authentication, remote, permission, or policy blocker when applicable.

## Failure Routing

- Use `blocked` for authentication, remote, or network failures.
- Use `approval_needed` when protected branch, permission, or release policy blocks delivery.
