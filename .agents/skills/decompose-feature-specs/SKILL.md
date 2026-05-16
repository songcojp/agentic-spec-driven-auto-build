---
name: decompose-feature-specs
description: "Decompose product and architecture scope into implementation-ready Feature Specs. Use to create or update Feature requirements, design, tasks, Feature index entries, queue plans, scope validation, and feature status metadata."
---

# Feature Spec Decomposition

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

Create vertical, testable Feature packages under docs/agentic-spec/features with fixed, parser-compatible artifacts.

Use `templates/feature-spec-template.md` as the required output contract for every created or regenerated Feature package. The template fixes:

- directory names as `docs/agentic-spec/features/feat-<nnn>-<kebab-title>/`
- mandatory file names as `requirements.md`, `design.md`, `tasks.md`, and `spec-state.json`
- index and queue updates as `docs/agentic-spec/features/README.md` and `docs/agentic-spec/features/feature-pool-queue.json`; the index table must start with `Feature ID` and its `Folder` column must use only the folder basename
- `tasks.md` task blocks as parseable `### TASK-<nnn>: <title>` or `### T-<feature-nnn>-<task-nn>: <title>` headings with `Status`, `Description`, `Requirements`, `Spec Refs`, `Allowed Paths`, `Forbidden Paths`, `Verification`, and `Acceptance`
- explicit `Worktree Mode` metadata and per-task mode when the Feature performs implementation, verification writes, Git delivery, or read-only analysis
- lifecycle handoff obligations, Product Usability Gate evidence plans, and P0/P1 story journey checkpoints that downstream implementation and review can validate without rereading unrelated source artifacts

Do not emit alternate spellings such as `taskes`, `task.md`, `plan.md`, or `implementation.md`. Do not mark a Feature `ready` unless all mandatory files exist and `tasks.md` contains at least one parser-compatible task block.

## References

- Read `references/specdrive-output.md` when invoked by an adapter that requires structured execution output.
- Read `references/quality-loop.md` when this skill creates or updates Spec documents that must pass a review and repair loop before downstream use.
- Read `templates/feature-spec-template.md` before producing Feature Spec files.

## Boundaries

- Do not rely on old dotted Skill names or compatibility aliases.
- Do not hardcode product-specific UI, database, scheduler, or adapter behavior unless the invocation supplies it as a source constraint.
- Surface missing decisions as `clarification_needed`, `review_needed`, `risk_review_needed`, or `blocked` instead of inventing facts.
