---
name: 03.hld.generate-adr
description: "Create or update a bounded Architecture Decision Record. Use when an architecture choice needs context, options, selected decision, consequences, affected artifacts, risk routing, and traceability before HLD, Feature design, planning, or execution."
---

# HLD Generate ADR

## Purpose

Create or update an Architecture Decision Record for a bounded project-level or
feature-level architecture decision. The ADR must preserve the decision context,
options considered, selected outcome, consequences, traceability, and review
state without turning into a broad HLD rewrite or low-level implementation plan.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `03.hld.generate-adr` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## When to Use

Use this skill when the operator, scheduler, or another skill requests
`03.hld.generate-adr`, or when an architecture decision needs an ADR before HLD,
Feature design, planning, or execution can proceed. Do not use it for general
HLD generation, task slicing, or implementation design.

## Input References

Read only the artifacts needed for the request, preferring references over
copied document bodies:

- PRD, requirements, HLD/design notes, existing ADRs, Feature Spec design, task
  plan, risk review, or change request named by the invocation.
- Repository facts needed to verify current stack, runtime boundaries,
  persistence, interfaces, or deployment constraints.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Confirm the decision question, scope, owning artifact path, status, affected
   requirements/features, and allowed write scope.
2. Read the minimum source references needed to state why the decision is
   needed now. Preserve existing ADR IDs and statuses unless the invocation
   explicitly allows a new or superseding ADR.
3. Identify viable options, including the current/default option when relevant.
   Compare them against requirements, HLD boundaries, repository facts, risk,
   verification cost, and downstream Feature Spec impact.
4. Record the selected decision only when the source or operator supplies enough
   evidence. If the choice requires product, security, data, or runtime risk
   review, return `risk_review_needed` instead of inventing a decision.
5. Write the ADR with concise sections: title, status, date, context, decision,
   options considered, consequences, affected artifacts, verification/evidence,
   and follow-up actions.
6. Do not include task lists, function signatures, field-level schemas, or file
   edit plans unless they are required as decision evidence.
7. If this invocation generates or updates an ADR or other Spec document, run
   the mandatory quality review and repair loop from
   `.agents/skills/SPEC_DOC_QUALITY_LOOP.md` before returning `completed`.
   Define `qualityLoopPlan` first, including the selected Quality Review Skill,
   Repair Owner, and rationale. After this governed loop has been explicitly
   invoked, use separate Quality Review and Repair subagents when available;
   otherwise use isolated owner-thread passes and record the fallback. Cap the
   loop at 10 iterations and exit when remaining gaps are not in-scope
   repairable.

## ADR Quality Bar

- The ADR answers one bounded decision question.
- Context and decision are traceable to requirements, HLD/design notes,
  repository facts, or risk review evidence.
- Options include meaningful tradeoffs, not just the chosen answer.
- Consequences name downstream artifact updates, tests, migration/recovery
  needs, and known risks.
- Superseded or conflicting ADRs are called out explicitly.

## Subagent Delegation

- **Use when**: Use Quality Review and Repair subagents only after this skill has produced or updated the scoped artifact and entered its governed review/repair loop.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Repair subagents may edit only the caller-declared allowed artifacts and only for source-backed, in-scope gaps.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

`result` should include `adrPath`, `decisionQuestion`, `status`,
`optionsConsidered`, `selectedDecision`, `affectedArtifacts`,
`requiredFollowUps`, `riskRouting`, and `qualityRepairLoop`.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `03` `hld` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Generated or updated Spec documents include `result.qualityRepairLoop`.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
