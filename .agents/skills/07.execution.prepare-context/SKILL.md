---
name: 07.execution.prepare-context
description: "Collect technical context for a Feature Spec planning pipeline. Use when a feature enters planning and needs repository facts, existing modules, constraints, test commands, package tooling, and implementation boundaries."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `07.execution.prepare-context` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Technical Context Skill

Use this skill as the first planning-stage skill.

## Workflow

1. Read the feature requirements, design, tasks, project HLD, and feature index.
2. Inspect the repository for existing modules, package manager, runtime versions, test commands, build commands, config files, and relevant conventions.
3. Identify likely files, APIs, data models, UI surfaces, test fixtures, and migration points.
4. Capture constraints that must govern downstream architecture, data model, contract, and task slicing.
5. Avoid code changes; this stage is read-only planning context.

## Output

- Repository context summary.
- Existing patterns and commands.
- Candidate implementation surfaces.
- Risks, unknowns, and required follow-up probes.

## Subagent Delegation

- **Use when**: Use Explorer, Worker, Review, and Verification subagents only after the owner thread has assigned disjoint responsibilities and file scopes.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Worker subagents may edit only their declared owned files; Explorer/Review/Verification subagents are read-only unless a scoped fix is explicitly assigned.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the implementation surfaces, reusable conventions, commands, and unknowns.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `repositorySummary`: concise source-backed repository context.
- `implementationSurfaces`: candidate files, modules, APIs, UI surfaces, or schemas.
- `commands`: relevant install, dev, build, test, browser, or migration commands.
- `constraints`: technical constraints from HLD, Feature Spec, and repo facts.
- `followUpProbes`: required additional read-only probes.
- `risks`: risks and unknowns for downstream planning.

## Failure Routing

- Use `review_needed` with `clarification_needed` when required source artifacts or implementation boundaries are missing.
