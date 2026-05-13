---
name: 06.planning.prepare-execution-plan
description: "Validate that a planned feature can be started and tested before task slicing—checking commands, environment, entry points, constitution compliance, and blockers. This skill is a pre-task-slicing startability gate, not a document producer. Use in the planning pipeline before 05.feature.decompose."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `06.planning.prepare-execution-plan` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Quickstart Validation Skill

Use this skill as the pre-task-slicing feasibility gate. Its purpose is to confirm the implementation path is **startable**, **testable**, **journey-checkpoint executable**, and **constitution-compliant** before task slicing commits to a task graph. It does not produce a spec artifact—it produces a go/no-go decision with a verification summary.

## Workflow

1. Read the feature requirements, architecture plan, data model plan, contract plan, and repository commands.
2. Verify the expected runtime, package manager, test command, build command, and target files are available.
3. Identify the smallest command or inspection that proves the implementation path is startable and testable.
4. Confirm that every P1 Journey Checkpoint expected by Feature requirements/design can be executed or verified in the current repository/environment. If browser, integration, or external-service evidence is required, identify the command/tooling or mark the path blocked.
5. **Check constitution compliance**: read `memory/constitution.md` (or equivalent project constitution) and confirm the planned architecture does not violate its gates (e.g., project count limit, framework-direct usage, test-first ordering, integration-first testing). Record any violations with the relevant article and a proposed resolution.
6. Record blockers explicitly instead of producing tasks that cannot run.
7. Do not modify source files unless the caller explicitly asks for a setup fix.

## Output

- Startability decision (go / blocked).
- Commands checked and expected working directory.
- Testability decision.
- Journey Checkpoint executability decision.
- Constitution compliance: pass or list of violations with article reference.
- Blockers and required remediation.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state go/blocked, command availability, testability, and constitution compliance.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `startability`: `"go"` or `"blocked"`.
- `commandsChecked`: array with command, cwd, found/expected status, and summary.
- `testability`: pass/fail decision with smallest meaningful test command.
- `journeyCheckpointReadiness`: pass/fail decision with each P1 checkpoint, required evidence, and command/tool availability.
- `constitutionCompliance`: pass/fail plus article references.
- `blockers`: array of blockers and required remediation.

## Failure Routing

- Use `review_needed` with `clarification_needed` when the implementation path cannot be located.
- Use `blocked` when tooling or environment is missing.
- Use `risk_review_needed` when a constitution violation cannot be resolved without a scope or architecture decision.
