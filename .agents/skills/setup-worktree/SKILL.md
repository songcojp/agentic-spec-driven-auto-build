---
name: setup-worktree
description: "Set up a SpecDrive Feature implementation worktree. Use when implement-feature or a governed delivery workflow needs to create, reuse, or validate an isolated Git worktree and branch before code, tests, or docs are modified."
---

# Worktree Setup

## Overview

Prepare the implementation workspace for a Feature before any write-capable work starts. This skill owns Git worktree creation and reuse decisions; platform code may pass owner workspace and Feature Spec paths, but must not run `git worktree add` on its behalf.

Until this skill returns a valid implementation workspace, platform code, scheduler code, IDE code, adapters, and status checkers must not modify project files in either the owner workspace or a would-be implementation path. They may only read files and record runtime/database/log evidence.

## Inputs

- Owner workspace root.
- Feature ID and Feature Spec directory.
- Target branch or default branch, if supplied.
- Worktree Mode from `tasks.md`.
- Allowed paths, forbidden paths, and required verification commands.
- Current Git status and any existing linked worktrees.

## Workflow

1. Read `AGENTS.md`, Feature `requirements.md`, `design.md`, `tasks.md`, and `spec-state.json` before running Git commands.
2. Confirm `Worktree Mode`:
   - `feature-worktree`: create or reuse one Feature worktree and Feature branch.
   - `worker-worktree`: create or reuse a worker worktree whose branch merges back to the Feature branch.
   - `serial-owner`: use the Feature owner worktree serially; do not create extra worker worktrees.
   - `shared-readonly`: stop with `blocked` if write-capable work was requested.
   - `manual-gated`: return `approval_needed` before Git side effects unless approval is already present.
3. Inspect `git status --short --branch`, `git rev-parse --show-toplevel`, `git branch --show-current`, `git rev-parse HEAD`, and `git worktree list --porcelain` from the owner workspace.
4. Choose a deterministic sibling path under `<owner-basename>.worktrees/<feature-folder>` unless the invocation provides a safer existing path.
5. Create the worktree only from a clean, known base:
   - derive target branch from the invocation, Feature Spec, or owner default branch;
   - create branch names as `feat/<feature-folder>` for Feature worktrees and `feat/<feature-folder>/<task-or-worker>` for worker worktrees;
   - avoid overwriting existing local branches or dirty worktrees.
6. Verify the implementation workspace contains readable `AGENTS.md`, `.agents/skills`, and the Feature Spec source paths. If not, stop with `blocked`.
7. Return worktree evidence in the parent `implement-feature` result. Do not report completion until the implementation workspace is ready for writes.

## Evidence

Record these fields for handoff to `implement-feature` and final `result.gitDelivery`:

- `ownerWorkspace`
- `implementationWorkspace`
- `worktree`
- `branch`
- `baseCommit`
- `targetBranch`
- `featureId`
- `taskId` when applicable
- `worktreeMode`
- `status`: `created`, `reused`, `blocked`, or `approval_needed`
- command evidence for the Git facts used to make the decision

## Boundaries

- This skill is the first file-mutation boundary for worktree modes. Any `tasks.md`, `spec-state.json`, code, test, docs, checkpoint, or evidence file update that belongs to implementation must wait until setup has selected the active workspace.
- Do not modify project specs (including `tasks.md` and `spec-state.json`), code, tests, or docs from the owner workspace after this worktree setup starts; write work belongs in the implementation worktree.
- Failure to redirect spec writes to the `implementationWorkspace` will result in spec drift where progress is recorded in the `ownerWorkspace` but missing from the delivery branch.
- Do not clean up worktrees; route cleanup to `clean-worktree`.
- Do not mark Feature execution completed. This skill only prepares the workspace and returns worktree setup evidence.
