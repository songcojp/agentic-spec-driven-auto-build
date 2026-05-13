---
name: 00.intake.collect-context
description: "Perform read-only repository exploration for SpecDrive planning, review, or recovery. Use when codebase facts, file ownership, commands, dependencies, or implementation patterns must be gathered without editing files."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `00.intake.collect-context` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Repo Probe Skill

Use this skill for bounded read-only exploration.

## Workflow

1. Define the exact question, feature, module, or file set to probe.
2. Use fast local search such as `rg`, `rg --files`, `git status`, `git log`, and targeted file reads.
3. Identify relevant files, existing patterns, tests, commands, and constraints.
4. Avoid speculative implementation advice beyond the probe question.
5. Report confidence and any gaps that require deeper inspection.

## Output

- Source-backed repository facts.
- Relevant paths and commands.
- Existing conventions to reuse.
- Unknowns or risks.

## Subagent Delegation

- **Use when**: Use read-only Review/Explorer subagents only when they can independently validate referenced artifacts; they must not edit files.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: No subagent may write files unless this skill explicitly enters a repair or update workflow with allowed artifacts.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the source-backed repository facts gathered and any unresolved unknowns.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `facts`: array of source-backed facts with file/path references.
- `paths`: relevant files, directories, or modules.
- `commands`: commands discovered for build, test, dev, or verification.
- `conventions`: implementation patterns to reuse.
- `unknowns`: unresolved questions or risks.

## Failure Routing

- Use `clarification_needed` when the probe target is too broad or ambiguous.
