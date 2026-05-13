---
name: 06.planning.estimate-risk
description: "Research and record bounded technical decisions for Feature Spec planning. Use when a feature needs options analysis, dependency choice, implementation approach selection, or explicit rejected alternatives."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `06.planning.estimate-risk` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Research Decision Skill

Use this skill after technical context collection and before architecture planning.

## Workflow

1. Start from project HLD decisions and existing repository conventions.
2. Identify the decision that must be made for the current feature only.
3. Compare viable options against requirements, risk, effort, compatibility, security, testability, and delivery constraints.
4. Choose the conservative option that best matches the project unless source references support a different path.
5. Record rationale, rejected alternatives, and residual risks.

## Output

- Decision statement.
- Chosen option and rationale.
- Rejected alternatives.
- Impacted requirements, files, and tests.

## Subagent Delegation

- **Use when**: Use read-only Review/Explorer subagents only when they can independently validate referenced artifacts; they must not edit files.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: No subagent may write files unless this skill explicitly enters a repair or update workflow with allowed artifacts.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the chosen option, why it was chosen, and whether any review is needed.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `decision`: decision statement.
- `chosenOption`: selected option and rationale.
- `rejectedAlternatives`: array of rejected options with reasons.
- `impact`: impacted requirements, files, tests, and downstream planning stages.
- `risks`: risks, mitigations, and review routing.

## Failure Routing

- Use `risk_review_needed` when a decision changes shared architecture, major dependencies, or public contracts.
- Use `clarification_needed` when product intent determines the decision.
