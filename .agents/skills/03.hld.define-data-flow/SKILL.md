---
name: 03.hld.define-data-flow
description: "Design or validate feature-level data model changes. Use when planning involves persistence, schema migration, state records, view models, events, verification summaries, audit, or data ownership."
---

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
