---
name: 03.hld.define-adapter-model
description: "Design feature-level contracts. Use when planning requires API, CLI, event, file, UI view-model, skill input, verification package, or integration contracts."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `03.hld.define-adapter-model` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Contract Design Skill

Use this skill to define the interfaces a Feature exposes or consumes. Its
output is Feature-level contract design input for Feature `design.md` and
`tasks.md`; it does not redefine project HLD integration strategy or create a
mainline LLD.

## Workflow

1. Read feature requirements, design, HLD integration strategy, technical context, and existing interface patterns.
2. Identify contract type: HTTP API, CLI command, file format, event, view model, skill input, verification package, or internal function boundary.
3. Define required fields, validation, status codes or outcomes, error cases, compatibility promises, and examples at the minimum detail needed for implementation.
4. Map contracts to user journeys, consumers, Journey Checkpoints, and tests.
5. Flag breaking changes before task slicing.

## Output

- Contract summary and payload shape.
- Validation and error behavior.
- Backward-compatibility notes.
- Required contract tests.
- Feature design and task notes that must consume the contract plan.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the contract type, compatibility impact, and whether downstream task slicing can proceed.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `contracts`: array of contract definitions with `type`, `name`, `consumer`, `producer`, and payload/status summary.
- `validationRules`: array of field, status, error, or compatibility rules.
- `examples`: array of compact request/response, file, event, or CLI examples when useful.
- `journeyContractUsage`: user story or acceptance scenario to contract rows.
- `featureDesignNotes`: contract-design notes that must be copied into Feature `design.md`.
- `taskInputs`: task-slicing notes for implementation and verification.
- `requiredTests`: array of contract tests to add or run.
- `breakingChanges`: array of backward-incompatible changes, empty when none.

## Failure Routing

- Use `risk_review_needed` for public, cross-feature, or backward-incompatible contract changes.
- Use `clarification_needed` for ambiguous consumer behavior.
