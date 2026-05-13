---
name: 00.intake.generate-project-intake
description: "Create or update the project constitution for SpecDrive projects. Use when a project charter, goal, boundary, default branch, trust level, repository policy, or governance baseline must be captured before planning or execution."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `00.intake.generate-project-intake` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Project Constitution Skill

Use this skill to establish the project-level operating contract consumed by Project Memory, Scheduler, Review Center, and later Feature Specs.

## Workflow

1. Read the PRD, requirements, project repository metadata, and existing constitution notes.
2. Capture project name, product goal, repository root, default branch, trusted paths, restricted paths, trust level, owner contacts, and required review gates.
3. Record delivery boundaries: what the automation may change, what requires approval, and what is out of scope.
4. Map constitution decisions to source references such as PRD sections, user instruction, repository facts, or review decisions.
5. Update the formal project artifact requested by the caller. If unspecified, prefer the existing project foundation or memory artifact instead of creating a new root file.
6. Run the mandatory Spec document quality review and repair loop from
   `.agents/skills/SPEC_DOC_QUALITY_LOOP.md` before returning `completed`.
   The calling Skill must define `qualityLoopPlan`, including the selected
   Quality Review Skill / Repair Owner and rationale. Scope the plan to the
   requested constitution/intake artifact, use source PRD/repository facts as
   evidence, and use separate subagents for quality review and repair. Stop
   after at most 10 iterations, and exit with `clarification_needed`,
   `review_needed`, `risk_review_needed`, or `blocked` when no remaining gap is
   in-scope repairable.

## Output

- Project identity and goal.
- Repository and branch contract.
- Trust and approval rules.
- Review routing rules for `approval_needed`, `clarification_needed`, and `risk_review_needed`.
- Traceability to source references.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state whether the constitution was created, updated, unchanged, blocked, or approval-routed.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `projectIdentity`: project name, goal, and repository boundary.
- `branchContract`: default branch, protected branches, and delivery policy.
- `trustRules`: approval, sandbox, and write-boundary rules.
- `reviewRouting`: mapping for approval, clarification, and risk-review outcomes.
- `sourceReferences`: source files or decisions used.
- `qualityRepairLoop`: compact result from
  `.agents/skills/SPEC_DOC_QUALITY_LOOP.md`.

## Failure Routing

- Use `clarification_needed` when the project goal, target repo, or allowed write boundary is unclear.
- Use `approval_needed` when the constitution grants new permissions or changes a protected boundary.
