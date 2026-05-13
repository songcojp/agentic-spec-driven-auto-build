---
name: 03.hld.define-data-flow
description: "Design or validate feature-level data model changes. Use when planning involves persistence, schema migration, state records, view models, events, verification summaries, audit, or data ownership."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `03.hld.define-data-flow` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Data Model Skill

Use this skill in planning when a Feature reads, writes, migrates, or presents
durable data. Its output is Feature-level data design input for Feature
`design.md` and `tasks.md`; it does not change project HLD unless it discovers
an architecture-level contradiction that must route through spec evolution.

## Workflow

1. Read requirements, feature design, HLD data domains, and existing schema/model code.
2. Identify owned entities, fields, lifecycle states, invariants, indexes, migrations, and retention/audit needs.
3. Map data reads/writes to the user journeys and acceptance scenarios they support.
4. Preserve compatibility with existing schema versioning and migration strategy.
5. Define validation, idempotency, concurrency, and rollback behavior.
6. Map each data change to requirements, Journey Checkpoints, and tests.

## Output

- Entity and field changes.
- Migration and compatibility plan.
- Validation and lifecycle rules.
- Test and verification-summary requirements.
- Feature design and task notes that must consume the data plan.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the data ownership and migration/compatibility outcome.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `entities`: array of entity/table/model changes and ownership.
- `fields`: array of field-level changes with compatibility notes.
- `migrations`: array of required migrations, rollback notes, and data-loss risks.
- `lifecycleRules`: array of validation, state transition, concurrency, or retention rules.
- `journeyDataUsage`: user story or acceptance scenario to data read/write rows.
- `featureDesignNotes`: data-design notes that must be copied into Feature `design.md`.
- `taskInputs`: task-slicing notes for migrations, model updates, tests, and verification.
- `verification`: array of required data, migration, or query checks.

## Failure Routing

- Use `risk_review_needed` for destructive migration, compatibility risk, or data-loss potential.
- Use `clarification_needed` for unclear ownership or lifecycle semantics.
