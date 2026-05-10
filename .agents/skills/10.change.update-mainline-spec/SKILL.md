---
name: 10.change.update-mainline-spec
description: "Manage requirement changes and spec evolution caused by user decisions, implementation, tests, review, delivery results, or repository reality. Use when PRD, EARS requirements, HLD, Feature Specs, tasks, milestones, or acceptance criteria must be changed, revised, replaced, deprecated, clarified, or reconciled."
---

# Spec Evolution Skill

Before editing, follow the governed requirement-change protocol in `.agents/skills/10.change.classify/SKILL.md`. That protocol is owned by the skill catalog; do not create target-project `change-management.md` or `change-disposition-checklist.md` documents to hold protocol rules or pending items. This skill is the design-named entry point for source-driven requirement and spec changes after the 10.change.classify triage classifies the item as `CHANGE`, `DEPRECATE`, `CLARIFY`, or `TRACEABILITY_FIX`.

## When to Use This Skill vs. `10.change.create-request`

| Situation | Use This Skill | Use `10.change.create-request` |
|-----------|---------------|--------------------------------|
| An **existing** `REQ-*`/`NFR-*`/`EDGE-*` is wrong, incomplete, or contradicted by source material | ✅ | |
| Acceptance criteria of an existing requirement must be corrected | ✅ | |
| An existing requirement must be deprecated or superseded by another | ✅ | |
| Wording clarification or traceability correction on an existing ID | ✅ | |
| Architecture or HLD must be updated because implementation proved the plan wrong | ✅ | |
| Requirement does **not yet exist**—needs a brand-new stable ID | | ✅ |
| New user story, capability, or constraint with no prior requirement | | ✅ |
| Implementation revealed a behavior that was never specified at all | | ✅ |

**Rule of thumb**: If the target ID already exists and you are modifying it, use this skill. If no target ID exists yet, use `10.change.create-request`.

## Workflow

1. Identify the changed requirement and its current source of truth. If no path is given, inspect root project docs first: `docs/PRD.md`, `docs/requirements.md`, `docs/hld.md`, and `docs/features/README.md`. Use localized lanes such as `docs/en/*`, `docs/zh-CN/*`, or `docs/ja/*` only when the project explicitly declares multilingual documentation or the invocation provides localized paths.
2. Identify the source reference: implementation result, test failure, review finding, delivery report, approval decision, repository fact, or user instruction.
3. Classify the change:
   - `MAJOR`: product goal, core boundary, architecture direction, delivery model, or compatibility contract changes.
   - `MINOR`: new behavior, capability, user story, constraint, or materially expanded acceptance.
   - `PATCH`: wording, clarification, traceability, acceptance detail, or non-behavioral correction.
4. Determine whether this is Spec Evolution:
   - Implementation found the requirement inaccurate.
   - Acceptance criteria are not testable.
   - Repository reality conflicts with the plan.
   - Approval changed scope.
   - Tests exposed a missing edge case.
   - Runtime metrics exposed a new constraint.
5. For Spec Evolution, record the source reference in the changed doc. Include impact scope and affected IDs.
6. Update documents in order:
   - PRD for product scope, source intent, non-goals, milestones, risks, page surfaces, or data model changes.
   - `requirements.md` for EARS statements, acceptance checks, priorities, traceability matrix, phase mapping, and open questions.
   - `hld.md` when system boundaries, data domains, interfaces, state machines, technology stack, or risks change.
   - Feature Specs when the change affects executable feature scope, dependencies, tasks, or acceptance.
7. Preserve existing IDs when the requirement is semantically the same. Mark deprecated or superseded requirements explicitly when replacement is necessary; do not silently reuse an old ID for a different behavior.
8. If a change affects an active or completed Feature Spec, update the feature status or notes so execution does not continue from stale assumptions.
9. Re-run consistency checks across PRD, requirements, design/HLD, feature index, affected feature folders, and open questions.

## Output

- Change classification.
- Documents updated.
- Traceability and affected features.
- Review routing and residual risk.

## Output Rules

- Make localized edits instead of rewriting whole specs unless the change truly invalidates the structure.
- Preserve the source language unless the user asks otherwise.
- Update the mainline requirements document for the active lane; do not create `docs/features/requirements.md` for project-level requirement changes unless the protocol explicitly defines it.
- Keep change rationale short and source-backed.
- Do not directly modify implementation code unless the user explicitly asks to implement the changed requirement.
- Keep feature worktrees and unrelated docs out of scope unless they are part of the affected traceability chain.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the change classification, documents updated, affected features, and review routing.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `classification`: `PATCH`, `MINOR`, or `MAJOR`.
- `sourceReference`: implementation result, test failure, review finding, delivery report, approval decision, repository fact, or user instruction.
- `updatedDocuments`: array of documents changed or intentionally unchanged.
- `affectedFeatures`: array of affected Feature IDs and required sync.
- `supersededRequirements`: existing requirement IDs changed, deprecated, or superseded.
- `reviewRouting`: approval, risk-review, clarification, or no routing.
- `residualRisk`: concise risk summary.

## Failure Routing

- Use `approval_needed` for scope-changing product decisions.
- Use `risk_review_needed` for architecture or completed-feature impact.
- Use `clarification_needed` when source references conflict with product intent.
