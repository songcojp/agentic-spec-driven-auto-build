---
name: 09.review.journey-closure
description: "Evaluate whether a completed Feature closes its user journeys with requirement, task, acceptance, and evidence coverage. Use after feature execution and before projecting a Feature to completed/done."
---

# Journey Closure Review Skill

## Purpose

Judge product completion independently from implementation. This skill acts as
the evaluation, QA, and critic gate for a Feature: it decides whether the user
journey is actually closed, not whether the implementation agent tried hard or
produced code.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `09.review.journey-closure` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## Use When

- A `07.execution.dispatch-adapter` feature execution returns `completed`.
- A Feature has all tasks marked done but product completeness is uncertain.
- Review Center, Scheduler, or Workbench needs a machine-readable reason for
  `review_needed` after implementation.
- A foundation Feature claims exemption from direct user journey closure.

## Do Not Use

- Do not implement missing code, tests, specs, or UI.
- Do not replace `09.review.spec-consistency`; that skill checks planning
  artifact consistency before implementation.
- Do not replace `09.review.code-diff`; that skill reviews diffs and spec
  drift.
- Do not treat this as the only quality step. It consumes the Delivery Fidelity
  Ledger and reports where lifecycle losses remain.
- Do not mark historical completed Features back to open automatically. Report
  gaps for audit or follow-up routing.

## Workflow

1. Read PRD user journeys, EARS requirements, UI spec or prototype references,
   Feature `requirements.md`, `design.md`, `tasks.md`, execution result,
   Delivery Fidelity Ledger, produced artifacts, tests, screenshots, logs, and
   review items.
2. Build a closure matrix across:
   - P1 user stories and journey checkpoints.
   - `REQ-*`, `NFR-*`, `EDGE-*`, and acceptance criteria.
   - Task IDs and task status evidence.
   - Runtime evidence: commands, browser screenshots, logs, report files,
     review results, PR or commit evidence.
3. For UI-bearing Features, require browser-level or equivalent interaction
   evidence for the visible user flow. API, ViewModel, schema, mock, or unit
   tests can support closure but cannot be the only evidence unless the Feature
   is explicitly backend-only.
4. For foundation Features, accept `foundationExemption` only when it explains
   why no direct user journey exists, names downstream closure Features, and
   lists integration evidence that proves the foundation is consumable.
5. Return `completed` only when every P1 journey checkpoint, acceptance item,
   requirement row, and lifecycle handoff is closed or a valid foundation
   exemption applies.
6. Return `review_needed` when closure is missing. Use one of these reasons:
   - `journey_not_closed`
   - `acceptance_gap`
   - `evidence_missing`
   - `quality_evidence_gap`
   - `test_semantics_gap`
   - `journey_bypassed_by_fixture`
7. Return `blocked` only when required input artifacts are unavailable and no
   closure judgment can be made.

## Output

- User story closure matrix.
- Requirement coverage decision.
- Acceptance and task evidence mapping.
- Missing journey, acceptance, or evidence rows.
- Foundation exemption decision when applicable.
- Delivery Fidelity losses and handoff gaps.
- Required fixes before the Feature can be projected to `completed`.

## Subagent Delegation

- **Use when**: Use read-only Review or Verification subagents for independent checking, failure analysis, or evidence review.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Review and Verification subagents do not edit files; any repair must route to the owning generation, change, recovery, or execution skill.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one
  `SkillOutputContractV1` JSON object.
- `summary` must state whether the Feature is closed, exempt, or requires
  review.
- `traceability` must contain only `featureId`.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` must contain:

- `decision`: `"closed"`, `"not_closed"`, or `"exempt"`.
- `reviewNeededReason`: `null`, `"journey_not_closed"`,
  `"acceptance_gap"`, or `"evidence_missing"`.
- `requirementCoverage`: array of rows with requirement ID, status, and
  evidence references.
- `journeyEvidence`: array of rows with user story ID, checkpoint/scenario,
  status, and evidence references.
- `acceptanceEvidence`: array of rows with acceptance ID or scenario, status,
  and evidence references.
- `taskCoverage`: array of task IDs with status and linked journey or
  requirement IDs.
- `foundationExemption`: object or `null`; when present it must include
  `exempt`, `reason`, `downstreamFeatures`, and `integrationEvidence`.
- `deliveryFidelity`: lifecycle ledger summary, including open losses and
  independent review evidence.
- `missingEvidence`: array of missing or insufficient evidence rows.
- `requiredFixes`: array of concrete fixes or follow-up routes.

## Minimal Valid Final JSON Shape

```json
{
  "contractVersion": "skill-contract/v1",
  "executionId": "<echo invocation.executionId>",
  "skillSlug": "09.review.journey-closure",
  "requestedAction": "<echo invocation.requestedAction>",
  "status": "completed",
  "summary": "Journey Closure Gate passed for FEAT-001.",
  "nextAction": null,
  "producedArtifacts": [],
  "traceability": {
    "featureId": "FEAT-001"
  },
  "result": {
    "decision": "closed",
    "reviewNeededReason": null,
    "requirementCoverage": [
      {
        "requirementId": "REQ-001",
        "status": "passed",
        "evidence": ["tests/example.test.ts"]
      }
    ],
    "journeyEvidence": [
      {
        "userStoryId": "US-001",
        "scenario": "Primary user completes the P1 flow",
        "status": "passed",
        "evidence": ["docs/ui/concepts/example.png"]
      }
    ],
    "acceptanceEvidence": [
      {
        "scenarioId": "AC-001",
        "status": "passed",
        "evidence": ["npm test"]
      }
    ],
    "taskCoverage": [
      {
        "taskId": "T-001-01",
        "status": "done",
        "links": ["US-001", "REQ-001"]
      }
    ],
    "foundationExemption": null,
    "missingEvidence": [],
    "requiredFixes": []
  }
}
```

## Failure Routing

- Use `review_needed` with `journey_not_closed` when the user story path is
  incomplete or not demonstrably usable.
- Use `review_needed` with `acceptance_gap` when acceptance criteria or
  requirement rows are uncovered or failed.
- Use `review_needed` with `evidence_missing` when the implementation may be
  correct but lacks sufficient tests, screenshots, logs, or artifact evidence.
- Use `10.change.update-mainline-spec` only when the approved spec itself is
  wrong or obsolete.
