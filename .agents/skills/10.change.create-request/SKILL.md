---
name: 10.change.create-request
description: "Intake and add new product requirements into the SpecDrive documentation flow. Use when a natural-language request, user story, capability, constraint, non-functional requirement, edge case, review finding, or implementation-discovered scope item must become governed PRD, EARS, design, and Feature Spec updates with traceability."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `10.change.create-request` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Requirement Intake Skill

Before editing, follow the governed requirement-change protocol in `.agents/skills/10.change.classify/SKILL.md`. That protocol is owned by the skill catalog; do not create target-project `change-management.md` or `change-disposition-checklist.md` documents to hold protocol rules or pending items. This skill is the design-named requirement intake entry point and owns new requirement propagation after the 10.change.classify triage classifies the item as `ADD`.

## When to Use This Skill vs. `10.change.update-mainline-spec`

| Situation | Use This Skill | Use `10.change.update-mainline-spec` |
|-----------|---------------|----------------------------|
| Requirement does **not yet exist** anywhere in the spec | ✅ | |
| Adding a brand-new user story, capability, or constraint | ✅ | |
| Review finding adds a missing edge case not covered by any `EDGE-*` | ✅ | |
| Implementation discovered behavior that was never specified | ✅ | |
| **Existing** `REQ-*`/`NFR-*`/`EDGE-*` is inaccurate, incomplete, or contradicted by source material | | ✅ |
| Acceptance criteria of an existing requirement must change | | ✅ |
| Existing requirement must be deprecated or superseded | | ✅ |
| Wording clarification on an existing requirement with no scope change | | ✅ |

**Rule of thumb**: If you can assign a brand-new stable ID without displacing an existing one, use this skill. If you are editing, replacing, or annotating an existing ID, use `10.change.update-mainline-spec`.

## Workflow

1. Locate the active source lane. If the user does not provide paths, prefer root project docs: `docs/PRD.md`, `docs/requirements.md`, `docs/hld.md`, and `docs/features/README.md`. Use localized lanes such as `docs/en/*`, `docs/zh-CN/*`, or `docs/ja/*` only when the project explicitly declares multilingual documentation or the invocation provides localized paths.
2. Classify the source: user request, PRD change, review finding, test result, delivery report, or implementation result.
3. Determine whether the intake is a new requirement, a change to an existing requirement, or a clarification. Use `10.change.update-mainline-spec` for changes to existing requirements.
4. Classify the new requirement:
   - Functional behavior -> `REQ-*`.
   - Non-functional quality, security, reliability, observability, or performance -> `NFR-*`.
   - Error, boundary, recovery, ambiguity, or exceptional path -> `EDGE-*`.
   - Project Initialization (项目初始化) -> `NFR-*` or foundational `REQ-*`, capturing scaffolding, frameworks, and environment setup.
   - Project Initialization Feature Spec rule -> include `.gitignore` creation or safe update in the generated initialization Feature Spec instead of treating it as a one-off current-repository requirement.
5. Update the PRD first when the new requirement changes product scope, user value, milestones, risks, data model, page surface, or non-goals. Keep the PRD concise and conclusion-first.
6. Update the adjacent `requirements.md` next. Add a stable ID, source trace, priority, EARS statement, and testable acceptance checks.
7. Run a consistency pass:
   - Every new requirement must point back to a PRD section, source note, clarification, or explicit user instruction.
   - Every new behavior must be atomic and observable.
   - Do not invent product intent; add a pending question when the input is ambiguous.
8. If the new requirement affects architecture, technology stack, data ownership, workflows, interfaces, state machines, or security boundaries, update `hld.md`.
9. Update Feature Specs:
   - If it belongs to an existing feature, update that feature's `requirements.md`, `design.md`, and `tasks.md`.
   - If it is independently deliverable, create a new feature folder and update `docs/features/README.md`.
   - Always update `docs/features/README.md` when creating or changing Feature information, even when the intake did not run the Feature splitting flow. Add or update the Feature ID, Feature name, folder, status, primary requirements, suggested milestone, and dependencies so IDE refresh and downstream execution do not see orphan Feature folders.
   - Keep dependencies, milestone, status, and source `REQ-*`/`NFR-*`/`EDGE-*` mapping aligned between the Feature folder and the index.
10. When the invocation asks for `desiredOutcome: feature_spec_ready_for_execution`, do not stop after mainline requirements. Create or update the implementation-ready Feature Spec, update `docs/features/README.md`, update `docs/features/feature-pool-queue.json`, and write Feature `spec-state.json` with `status: ready` and cleared blocking reasons so the UI can immediately schedule execution. If the requirement cannot be made execution-ready, return `blocked` or `review_needed` with the missing decision.
11. Re-check downstream references: traceability matrix, phase mapping, feature index, HLD split/dependency mapping, and open questions.

## Versioning

- Use `MINOR` for a new user story, capability, constraint, or externally visible behavior.
- Use `PATCH` only when the addition is a clarification or acceptance detail that does not expand scope.
- Use `MAJOR` when the addition changes product goals, core boundaries, or delivery model.

## Output

- Intake classification.
- Requirement IDs and affected documents.
- Acceptance criteria or open questions.
- Downstream sync notes.

## Output Rules

- Preserve the source language unless the user asks otherwise.
- Prefer in-place edits to the current formal docs over creating scratch files.
- Do not create or update target-project `change-management.md` or `change-disposition-checklist.md`; protocol lives in `.agents/skills/10.change.*`, while change facts live in PRD, requirements, HLD, Feature Specs, and state/evidence records.
- Update the mainline requirements document for the active lane; do not create `docs/features/requirements.md` for project-level requirements unless the protocol explicitly defines it.
- Keep IDs stable; append new IDs instead of renumbering existing requirements unless the user explicitly asks for a rebase.
- Keep implementation details out of requirements unless the PRD states them as hard constraints.
- If only documentation changed, do not touch code or feature worktrees.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the intake classification, affected requirement IDs, affected docs, and whether downstream sync is needed.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `classification`: user request, PRD change, review finding, test result, delivery report, or implementation result.
- `requirementIds`: new stable requirement IDs added.
- `affectedDocuments`: docs created, updated, or intentionally unchanged.
- `acceptanceCriteria`: added or updated acceptance checks.
- `openQuestions`: unresolved intake questions.
- `downstreamSync`: feature index, Feature Spec, HLD, UI Spec, or task sync notes.

## Failure Routing

- Use `clarification_needed` when intent or acceptance cannot be made testable.
- Use `risk_review_needed` when the intake changes architecture, security, data ownership, or active feature scope.
