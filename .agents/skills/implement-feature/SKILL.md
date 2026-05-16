---
name: implement-feature
description: "Implement bounded Feature Spec work. Use when a scheduled Feature has approved requirements, design constraints, Worktree Mode, allowed file scope, source paths, and verification commands, and Codex must modify code, tests, config, or docs through the governed worktree lifecycle."
---

# Feature Implementation

## Workflow

1. Confirm the requested outcome, source artifacts, workspace root, and allowed scope.
2. Read referenced files from disk and pass paths, IDs, and section anchors instead of pasted document bodies.
3. Apply this skill's workflow only to its declared responsibility; route adjacent lifecycle work to another project skill.
4. Produce or review the requested artifacts with traceability to PRD, requirements, HLD, Feature Spec, execution records, tests, or evidence as applicable.
5. Return the runtime-supplied structured output shape exactly. Echo `executionId`, `skillName`, `requestedAction`, produced artifacts, next action, and Feature-level traceability when the adapter provides them.

## Product Usability Autonomy Wrapper

Apply FEAT-024 Product Usability Autonomy when this skill affects P0/P1 user stories, lifecycle handoffs, execution readiness, verification, review, or completion decisions.

Required wrapper fields:

- Source refs: list the PRD, requirements, HLD, UI Spec, Feature Spec, tasks, code, tests, or ReviewItems consumed.
- Lifecycle stage: name Define, Plan, Build, Verify, Review, or Ship.
- Decision policy: record safe automatic decisions as `DecisionLog`; record medium-risk ambiguity as Open Questions; record high-risk ambiguity as Blocking Open Questions.
- Protocol gaps: classify missing source, story, journey, interaction, state/data, test, runtime, review, and ship evidence as `ProtocolGap`.
- Usability evidence: preserve or produce `UsabilityEvidence` for P0/P1 stories affected by the skill.
- Handoff readiness: state whether downstream work may continue and which `LifecycleHandoff` obligations are preserved.
- Anti-rationalization: do not mark work ready or completed only because text, fixtures, API seeds, self-review, or command success exists.

## Guidance

Read the Feature Spec, preserve unrelated changes, honor its declared `Worktree Mode`, implement the smallest complete behavior slice, collect protocol-backed completion evidence for affected P0/P1 stories, collect Delivery Fidelity and Git delivery evidence, and avoid self-approving completion.

When `Worktree Mode` is missing, return `review_needed` or `clarification_needed` for write-capable work instead of silently writing in the owner workspace. Use `shared-readonly` only for tasks that do not modify files. Use `serial-owner` for high-conflict writes, `feature-worktree` for the default one-Feature-one-PR lifecycle, `worker-worktree` for Feature-internal parallel write tasks that merge back to the Feature branch, and `manual-gated` when Git lifecycle side effects require explicit approval.

## Worktree Lifecycle

Use the project-local worktree skills as the Git lifecycle boundary:

1. Use `$setup-worktree` before any write-capable implementation, verification write, or Git delivery step.
2. Perform implementation inside the returned implementation workspace, not in the owner workspace, unless `Worktree Mode` explicitly allows `serial-owner`.
3. Use `$clean-worktree` after implementation, tests, and independent review evidence are ready.
4. If worktree setup, review, PR, merge, branch cleanup, or worktree cleanup cannot cleanly finish, return `review_needed`, `approval_needed`, or `blocked`; do not return `completed`.

## Feature Execution Rules

- Treat the Feature Spec directory in `sourcePaths` as the implementation scope.
- Read `requirements.md`, `design.md`, and `tasks.md`, then implement the concrete tasks described there.
- Do not satisfy `feature_execution` by only creating a report JSON file or by only summarizing planned work.
- If the Feature Spec tasks cannot be implemented from the available source paths, return `blocked` with the missing decision or file scope.
- List the actual code, test, config, or documentation files created or updated in `producedArtifacts`.
- Completed `feature_execution` outputs must use `skill-contract/v2`.
- Put `requirementCoverage`, `acceptanceEvidence`, `journeyEvidence`, `deliveryFidelity`, and `gitDelivery` directly under `result`.
- For UI/app changes, provide `runtimeEvidence`; use `runtimeExemption` only for explicit foundation or stateless cases with evidence.
- Passing tests or a commit alone is not enough for `completed`; close Journey Checkpoint, Delivery Fidelity, and Git delivery, or return the appropriate non-completed status.

## Delivery Evidence

For completed Feature execution, `result.gitDelivery` must include:

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
- `deliveryExemption`

## References

- Read `references/specdrive-output.md` when invoked by an adapter that requires structured execution output.
- Read `references/quality-loop.md` when this skill creates or updates Spec documents that must pass a review and repair loop before downstream use.

## Boundaries

- Do not rely on old dotted Skill names or compatibility aliases.
- Do not hardcode product-specific UI, database, scheduler, or adapter behavior unless the invocation supplies it as a source constraint.
- Surface missing decisions as `clarification_needed`, `review_needed`, `risk_review_needed`, or `blocked` instead of inventing facts.
