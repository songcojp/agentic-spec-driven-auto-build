---
name: clean-worktree
description: "Clean a SpecDrive Feature implementation worktree after verification. Use when implement-feature or prepare-release needs to commit reviewed changes, create or update a PR, check or merge it, clean remote/local branches, remove the local worktree, or return review_needed when delivery cannot clean."
---

# Worktree Clean

## Overview

Finish the Git delivery lifecycle for a Feature worktree without letting platform code perform Git side effects. This skill owns commit, PR, merge, branch cleanup, and worktree removal decisions; the platform records and validates the resulting evidence.

## Inputs

- Owner workspace root.
- Implementation worktree path and branch.
- Feature ID, Feature Spec directory, and target branch.
- Review, verification, and Delivery Fidelity evidence.
- Delivery policy: auto-merge allowed, PR-only, manual-gated, or prepare-release handoff.

## Workflow

1. Read Feature `requirements.md`, `design.md`, `tasks.md`, `spec-state.json`, and the current implementation diff.
2. Refuse closeout with `review_needed` when required tests, code review, Delivery Fidelity, Journey Closure, or spec alignment evidence is missing.
3. Run proportional verification from the implementation worktree and record exact commands and outcomes.
4. Inspect `git status --short --branch`. Do not continue if unrelated or unreviewed changes are present.
5. Create a narrow Conventional Commit on the implementation branch after verification and review are complete.
6. Create or update the PR with `gh`, using a body that includes Feature summary, tasks, requirements, verification, risks, approval records, rollback plan, and unresolved follow-ups.
7. Check PR status. Merge only when policy allows and checks are passing; otherwise return `review_needed` or `approval_needed` with the PR URL and missing condition.
8. Clean up only after the PR is delivered or explicitly rolled back:
   - delete remote branch when policy allows;
   - remove local branch from the owner workspace, not from inside the worktree;
   - remove the local worktree only when `git status --short` is clean and evidence is already recorded.
9. Return final `gitDelivery` evidence to the caller.

## Evidence

Return `result.gitDelivery` with:

- `ownerWorkspace`
- `implementationWorkspace`
- `worktree`
- `branch`
- `commitHash`
- `prUrl`
- `checks`
- `merge`
- `remoteBranchCleanup`
- `localBranchCleanup`
- `worktreeCleanup`
- `deliveryExemption` only when an approved policy explicitly defers delivery

Use statuses such as `passed`, `completed`, `merged`, or `cleaned` only when fresh command evidence proves the claim. If any field cannot be closed, return `review_needed`, `approval_needed`, or `blocked` instead of `completed`.

## Boundaries

- Do not create implementation worktrees; route setup to `setup-worktree`.
- Do not hide missing review, test, or delivery evidence behind prose-only summaries.
- Do not remove a dirty worktree or delete a branch that contains unmerged user work.
