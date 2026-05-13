# Spec Document Quality Review and Repair Loop

Use this protocol for every Skill that generates or updates Spec documents:
project intake, PRD, requirements, HLD, UI Spec, Feature Spec
`requirements.md`, `design.md`, `tasks.md`, Feature index, queue plan, ADR, or
other markdown/json Spec artifacts that feed downstream planning or execution.

The loop is mandatory before a document-generation Skill may return
`completed`.

## Codex-Native Usage Boundary

This protocol follows the Codex/ChatGPT Skill model: keep the Skill itself as a
reusable, reference-driven workflow; pass file paths and compact instructions
instead of copying full artifacts into prompts; and keep long review notes out
of the owner thread.

Subagents are an execution aid, not the source of truth. Use them only after the
operator, scheduler, or calling Skill has explicitly entered this governed
quality loop. That invocation is the scoped delegation request for the Quality
Review and Repair roles below. For ordinary Codex conversations that have not
asked for the project workflow or a specific Skill, do not start this loop just
because a Spec document is mentioned.

If the current runtime cannot create real Codex subagents, or if approvals make
subagent execution unavailable, continue with isolated owner-thread review and
repair passes using the same compact input/output rules. Record the fallback in
`result.qualityRepairLoop.subagentFallback`.

This protocol does not maintain a central artifact-type-to-review-skill routing
table. The Skill that calls this loop owns that choice because it knows the
requested action, generated artifacts, downstream phase, source language, and
allowed write scope.

## Roles

- **Owner thread**: defines the caller-owned `qualityLoopPlan`, invokes
  subagents, merges compact structured outputs, decides whether to continue or
  exit, and returns the final SkillOutputContract.
- **Quality Review Subagent**: reads referenced artifacts directly, checks the
  applicable quality gate, classifies gaps, and returns only compact structured
  findings.
- **Repair Subagent**: applies only in-scope, source-backed repairs or returns a
  compact patch plan when direct edits are unavailable. It must not broaden
  scope, invent product intent, or touch files outside the repair scope.

After the governed loop has been explicitly invoked, quality checking and repair
should run in fresh subagents or isolated review contexts whenever the runtime
supports subagents. If subagents are unavailable, the Skill must use the same
compact input/output discipline in the owner context and record the fallback in
`result.qualityRepairLoop.subagentFallback`.

## Required Loop Plan

Before the first review pass, the owner thread must define a `qualityLoopPlan`
containing:

- `allowedArtifacts`: exact generated or updated files the Repair Subagent may
  edit.
- `sourceArtifacts`: source-of-truth files the subagents may use as evidence.
- `forbiddenArtifacts`: files or artifact classes that are out of scope for this
  operation.
- `allowedGapTypes`: gate gap types this operation is allowed to repair.
- `maxRisk`: highest risk level allowed without human/risk review.
- `idPolicy`: whether stable IDs must be preserved, may be added, or may be
  renumbered.
- `downstreamAllowed`: whether downstream sync is allowed in this invocation.
- `qualityReviewSkill`: the Skill or review contract selected by the calling
  generation Skill for this artifact and downstream phase.
- `qualityReviewRationale`: why that review Skill is the right gate for this
  operation.
- `repairSkill` or `repairOwner`: the Skill, subagent role, or artifact owner
  that is allowed to repair this artifact.
- `repairRationale`: why the selected repair owner is allowed to modify the
  scoped artifacts.

The loop must not replace the caller's `qualityReviewSkill` selection with a
different review Skill. If the selected review Skill cannot judge the generated
artifact, return `blocked` or `review_needed` with a routing gap rather than
guessing a central fallback.

A gap is repairable only when all of these are true:

- the existing source artifacts contain enough intent to repair it;
- the repair fits `allowedArtifacts`, `allowedGapTypes`, `maxRisk`, and
  `idPolicy`;
- the repair does not require a new requirement, architecture decision, product
  priority, security posture, runtime boundary, or downstream artifact outside
  `downstreamAllowed`;
- the Repair Subagent can explain the evidence refs that justify the change.

## Loop

1. Generate or update the requested artifact within the invocation scope.
2. Invoke the caller-selected Quality Review Subagent with file paths, source
   refs, the full `qualityLoopPlan`, and the quality gate to apply. Do not paste
   full artifacts into the prompt.
3. If the review decision is `pass`, stop the loop and return `completed`.
4. If the review decision is `fail`, classify every gap as:
   - `in_scope_repairable`
   - `in_scope_not_repairable`
   - `out_of_scope`
5. If there are no `in_scope_repairable` gaps, exit without another repair pass.
6. Invoke the caller-selected Repair Subagent or repair owner for only the
   `in_scope_repairable` gaps. It may edit only `allowedArtifacts` and must
   return changed paths, applied gap IDs, skipped gap IDs, evidence refs, and
   any new gaps it discovered.
7. Run another Quality Review Subagent pass against the updated artifact.
8. Repeat until the review passes, no in-scope repairable gaps remain, the next
   repair would exceed scope, the same gap fingerprint repeats, or the loop has
   reached 10 review/repair iterations.

The loop limit is strict: never run more than 10 review/repair iterations for a
single document-generation invocation.

## Exit Rules

- Return `completed` only when the latest Quality Review Subagent returns
  `pass`.
- Return `clarification_needed` when remaining gaps require product intent,
  priority, acceptance, or user decision.
- Return `risk_review_needed` when remaining gaps affect architecture,
  security, runtime state, data ownership, completed Features, or downstream
  projects.
- Return `review_needed` when the artifact remains too coarse or inconsistent
  but the next action is review rather than product clarification.
- Return `blocked` when required sources cannot be read, required tools are
  unavailable, or the Repair Subagent cannot write the allowed artifacts.

Do not continue to downstream HLD, UI Spec, Feature split, task generation,
ready, planning, or execution while the latest review decision is `fail`.

## Result Contract

Every generating Skill should include `result.qualityRepairLoop`:

```json
{
  "applied": true,
  "maxIterations": 10,
  "iterationsUsed": 2,
  "finalDecision": "pass",
  "qualityLoopPlan": {
    "allowedArtifacts": [],
    "sourceArtifacts": [],
    "forbiddenArtifacts": [],
    "allowedGapTypes": [],
    "maxRisk": "medium",
    "idPolicy": "preserve_stable_ids",
    "downstreamAllowed": false,
    "qualityReviewSkill": "09.review.spec-granularity",
    "qualityReviewRationale": "Caller-selected gate for the generated artifact and downstream phase.",
    "repairSkill": null,
    "repairOwner": "calling-generation-skill-repair-subagent",
    "repairRationale": "Repairs are limited to caller-owned artifacts and source-backed gaps."
  },
  "subagents": {
    "qualityReview": "used",
    "repair": "used",
    "subagentFallback": null
  },
  "remainingGaps": [],
  "exitReason": "passed"
}
```

Use concise gap IDs and evidence refs. Do not include full review transcripts or
chain-of-thought style analysis in the owner output.
