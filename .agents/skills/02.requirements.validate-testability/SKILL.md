---
name: 02.requirements.validate-testability
description: "Check requirements for quality, readiness, and traceability. Use before a Feature Spec moves from draft to ready or before planning consumes requirements."
---

# Requirements Checklist Skill

Use this skill as the readiness gate for requirements.

## Workflow

1. Confirm every requirement is atomic, observable, testable, and traceable to PRD or approved source references.
2. Check that acceptance criteria can become tests without interpretation.
3. Confirm each requirement has a user-story mapping, trigger, expected system
   response, priority, acceptance check, boundary/error path when relevant, and
   evidence type.
4. Verify error, empty, duplicate, permission, timeout, recovery, persistence,
   reload/revisit, and concurrency paths where relevant.
5. Confirm open questions are either resolved or explicitly block readiness.
6. Report requirement IDs that are missing design, task, UI interaction, state
   data, or feature coverage.
7. When invoked from `02.requirements.convert-ears`, run as an isolated review
   subagent whenever the runtime supports subagents. Read the referenced PRD and
   requirements files directly from disk, classify each gap as repairable from
   the current source, requiring clarification, or requiring risk review, and
   return only the compact structured result. Do not return long-form analysis
   or copied requirement text unless a short excerpt is needed to identify the
   exact gap.
8. When invoked as part of `.agents/skills/SPEC_DOC_QUALITY_LOOP.md`, classify
   every finding against the caller-provided `qualityLoopPlan` as
   `in_scope_repairable`, `in_scope_not_repairable`, or `out_of_scope`. The
   review subagent does not edit files; repair edits belong to the separate
   Repair Subagent.

## Output

- Pass/fail readiness decision.
- Requirement gaps by ID.
- Missing acceptance checks.
- Missing evidence types, boundary/error paths, and interaction/state data
  obligations.
- Repairable gaps that can be fixed from the existing PRD/product source.
- Non-repairable gaps that require clarification, risk review, or new product
  intent.
- Required clarification or risk-review routing.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state pass/fail readiness and the most important blocking gaps.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `decision`: `"pass"` or `"fail"`.
- `gaps`: array of requirement gaps by ID.
- `missingAcceptanceChecks`: array of missing or untestable checks.
- `traceabilityFindings`: requirement/source/feature traceability issues.
- `repairableGaps`: gaps that can be fixed without inventing product intent.
- `nonRepairableGaps`: gaps that require clarification, risk review, or source
  changes before the requirements can pass.
- `repairScopeFindings`: gap classifications against the provided
  `qualityLoopPlan`,
  using `in_scope_repairable`, `in_scope_not_repairable`, or `out_of_scope`.
- `repairInstructions`: exact edits or additions expected before the next
  quality-review iteration.
- `evidenceRefs`: compact file, heading, section, or requirement-ID references
  that support the decision without copying the full source text.
- `requiredRouting`: `"none"`, `"clarification_needed"`, or `"risk_review_needed"`.

## Subagent Context Contract

- Prefer a fresh subagent or isolated review context for every validation pass
  triggered by `02.requirements.convert-ears`.
- Inputs should be references only: requirements path, PRD/source path, relevant
  section anchors, changed IDs, and the quality bar to apply.
- Read source files locally inside the review context; avoid returning full file
  contents, full tables, or step-by-step reasoning to the owner thread.
- Return one compact `SkillOutputContractV1` with actionable gaps, repair
  instructions, routing, and evidence references.
- If subagents are unavailable, use the same compact-input and compact-output
  discipline in the owner context and record that fallback in `summary`.

## Failure Routing

- Use `clarification_needed` for untestable or conflicting requirements.
- Use `risk_review_needed` when readiness gaps affect architecture, data, security, or active implementation.
- Use `review_needed` when requirements are present but too coarse to feed
  design, task slicing, or execution.
