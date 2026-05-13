# SkillOutputContractV1 / V2

Project-local skills may stream `SkillOutputContractV1` or `SkillOutputContractV2` JSON objects while invoked by the Scheduler, CLI Adapter, RPC Adapter, or Execution Workbench. The final result must be the last valid Skill output contract object in the stream.

The common contract is optimized for the Execution Workbench display:

- `contractVersion`: `"skill-contract/v1"` for legacy and non-feature workflow outputs; `"skill-contract/v2"` for completed `feature_execution` outputs.
- `executionId`: echo the invocation `executionId`.
- `skillSlug`: echo the invocation `skillSlug`.
- `requestedAction`: echo the invocation `requestedAction`.
- `status`: one of `"queued"`, `"running"`, `"waiting_input"`, `"approval_needed"`, `"review_needed"`, `"blocked"`, `"failed"`, `"cancelled"`, or `"completed"`.
- `summary`: concise human-readable execution summary. This is shown in Current Execution and Result Projection, so it must state the outcome, not only the process.
- `nextAction`: the recommended next scheduler/operator action as a string, or `null` when no follow-up is needed.
- `producedArtifacts`: every created, updated, unchanged, missing, or skipped expected artifact. Each item must include `path`, `kind`, `status`, `checksum` (`string` or `null`), and `summary` (`string` or `null`).
- `traceability`: include only Feature-level traceability with `featureId`. Do not include `requirementIds`, `taskId`, `changeIds`, or task/package-level tracking in the common Skill output contract.
- `result`: skill-specific machine-readable execution result. Use `{}` only when the skill has no specialized result fields.

Do not add extra top-level fields. Put command output, verification details, decisions, blockers, coverage, and execution results in `summary`, `producedArtifacts[].summary`, `nextAction`, or `result`.

## Common vs Specialized Result Boundary

The common `SkillOutputContractV1.traceability` field intentionally stays small:
it carries only `featureId`. Requirement IDs, task IDs, acceptance rows, journey
checkpoints, test commands, screenshots, PR links, and review decisions belong
in the skill-specific `result` object or produced artifact summaries.

Spec granularity review uses the same boundary. `09.review.spec-granularity`
must place its machine-readable decision under `result.specGranularity`; do not
add new top-level fields. The object should name artifact-level findings,
missing user scenarios, missing behavior requirements, missing state/data
contracts, missing interaction matrix rows, missing acceptance evidence, and
required refinements before downstream design, tasks, ready state, or execution
can proceed.

Any Skill that generates or updates Spec documents must follow
`.agents/skills/SPEC_DOC_QUALITY_LOOP.md` before returning `completed`. This
applies to project intake, PRD, requirements, HLD, UI Spec, Feature Spec
`requirements.md`, `design.md`, `tasks.md`, Feature index, queue plan, ADR, and
future markdown/json Spec artifacts that feed downstream planning or execution.
The generating Skill must invoke isolated subagents for both quality review and
repair whenever subagents are available, cap the loop at 10 iterations, define a
caller-owned `qualityLoopPlan` before the first review, and exit when no
remaining gap is in-scope repairable. The loop protocol does not choose the
review Skill from a central artifact table; the calling generation Skill must
record `qualityReviewSkill`, `qualityReviewRationale`, `repairSkill` or
`repairOwner`, and `repairRationale` in the plan. Put the compact loop result
under `result.qualityRepairLoop`; do not return `completed` when the latest
quality review failed.

For `07.execution.dispatch-adapter` with `requestedAction =
"feature_execution"`, `status = "completed"` is valid only with
`contractVersion = "skill-contract/v2"` and when `result` contains all of the
following closure evidence:

- `requirementCoverage`: non-empty coverage rows for the implemented
  requirements.
- `acceptanceEvidence`: non-empty acceptance scenario evidence.
- `journeyEvidence`: non-empty user story or Journey Checkpoint evidence.
- `deliveryFidelity`: the Delivery Fidelity Ledger that proves the Feature kept
  product intent intact through Define, Plan, Build, Verify, Review, and Ship.
- `runtimeEvidence`: required for UI/App behavior changes unless a valid
  `runtimeExemption` is present. It proves app launch, route access, user
  interaction, state change, reload persistence or an equivalent state
  assertion, negative/boundary behavior, and screenshot/trace/log evidence.
- `runtimeExemption`: `null` or a structured foundation/stateless exemption
  with `exempt: true`, `reason`, and `evidence`.
- `gitDelivery`: Feature Git lifecycle evidence, including owner workspace,
  implementation workspace or approved fallback, worktree, branch, commit hash,
  PR URL, checks, merge, remote branch cleanup, local branch cleanup, and
  worktree cleanup.

`deliveryFidelity` is not a final quality badge. It is a chain-of-custody record
for software intent. It must include:

- `sourceIntent`: PRD, requirement, review, or operator intent that entered the
  workflow.
- `journeys`: user or system journeys preserved from source intent.
- `behaviorObligations`: executable behavior slices derived from the journeys.
- `handoffs`: Define -> Plan -> Build -> Verify -> Review -> Ship transitions,
  including preserved obligations and any losses.
- `losses`: first-class loss records with type, severity, status, owner, and
  evidence refs. Loss types are `intent_loss`, `journey_loss`,
  `interaction_loss`, `state_loss`, `data_loss`, `task_loss`,
  `implementation_shortcut`, `test_bypass`, `review_gap`, and `delivery_gap`.
- `evidence`: structured proof rows with evidence type, mode, assertion, source,
  covered obligations, status, and artifact refs.
- `agentReviews`: independent Test/QA/Review/Release review rows.
- `completionDecision`: the final delivery decision and unresolved losses.

Completed feature execution must not have open P0/P1 losses. P2 losses must be
closed, accepted, or explicitly deferred. API fixtures may prepare preconditions,
but they cannot satisfy the behavior under test. Entry, text, or page-presence
assertions alone are not enough to close a behavior obligation. The
implementation agent cannot be the only reviewer for its own completion.

A foundation-only Feature may omit direct journey evidence only when
`result.foundationExemption` is present and includes:

- `exempt: true`
- `reason`
- `downstreamFeatures`
- `integrationEvidence`

A foundation-only or stateless Feature may omit UI/App runtime evidence only
when `result.runtimeExemption` is present and includes:

- `exempt: true`
- `reason`
- `evidence`

Passing tests, creating a commit, opening a PR, or marking tasks done is not by
itself enough for a completed feature execution. Missing or failed journey
closure evidence must produce `review_needed` with `journey_not_closed`,
`acceptance_gap`, or `evidence_missing`. Missing Delivery Fidelity evidence must
produce `review_needed` with `quality_evidence_gap`, `test_semantics_gap`, or
`journey_bypassed_by_fixture`. Missing or incomplete Git delivery evidence must
produce `review_needed`, `approval_needed`, or `blocked` with
`delivery_evidence_missing` or `delivery_not_closed`.
Missing runtime evidence for UI/App behavior changes must produce
`review_needed` with `evidence_missing`.

Closure fields must be direct structured arrays on `result`; `runtimeEvidence`,
`deliveryFidelity`, and `gitDelivery` must be direct structured objects on
`result`. Do not provide them only as prose in `result.details`,
`result.items`, report summaries, or produced artifact summaries; the Journey
Closure Gate, Runtime Evidence Gate, Delivery Fidelity Gate, and Git Delivery
Gate do not parse prose evidence.

Use `status = "queued"` before execution starts, `status = "running"` while reading, analyzing, writing, or verifying, `status = "waiting_input"` when user information is required, and `status = "approval_needed"` when command, permission, or risk approval is required. Final status must be `completed`, `review_needed`, `blocked`, `failed`, or `cancelled`. Use `status = "completed"` when the skill produced a valid decision or artifact, even if the decision is "none" or "no change". Use `status = "blocked"` for missing inputs or unresolved required decisions, `status = "review_needed"` only when a real human or risk review gate must resolve the next step, and include the review reason in `summary` or `result.reviewNeededReason`. Use `status = "failed"` for execution errors that prevented a valid skill result.

Do not return shorthand JSON such as `{"summary": "...", "status": "...", "evidence": [...]}`. Any progress or final response must be the complete contract object below, with invocation-owned execution fields echoed exactly. Progress objects must not use `review_needed` as a placeholder for work in progress.

```json
{
  "contractVersion": "skill-contract/v2",
  "executionId": "<echo invocation.executionId>",
  "skillSlug": "<echo invocation.skillSlug>",
  "requestedAction": "<echo invocation.requestedAction>",
  "status": "completed",
  "summary": "<concise outcome summary>",
  "nextAction": null,
  "producedArtifacts": [
    {
      "path": "<relative/path>",
      "kind": "markdown",
      "status": "updated",
      "checksum": null,
      "summary": "<artifact-specific summary>"
    }
  ],
  "traceability": {
    "featureId": null
  },
  "result": {
    "requirementCoverage": [],
    "acceptanceEvidence": [],
    "journeyEvidence": [],
    "deliveryFidelity": {
      "sourceIntent": [],
      "journeys": [],
      "behaviorObligations": [],
      "handoffs": [],
      "losses": [],
      "evidence": [],
      "agentReviews": [],
      "completionDecision": {
        "status": "passed",
        "reason": "<why delivery is closed>",
        "decidedBy": "release-reviewer",
        "unresolvedLosses": []
      }
    },
    "runtimeEvidence": {
      "appLaunch": {
        "command": "<dev server or launch command>",
        "status": "passed",
        "url": "<route or app url>",
        "evidence": ["<screenshot/trace/log ref>"]
      },
      "journeys": [
        {
          "scenario": "<primary user journey>",
          "status": "passed",
          "evidence": ["<trace or assertion ref>"]
        }
      ],
      "stateAssertions": [
        {
          "assertion": "<state mutation or reload persistence assertion>",
          "status": "passed",
          "evidence": ["<log or screenshot ref>"]
        }
      ],
      "negativePaths": [
        {
          "scenario": "<negative or boundary path>",
          "status": "passed",
          "evidence": ["<trace or assertion ref>"]
        }
      ]
    },
    "runtimeExemption": null,
    "gitDelivery": {
      "ownerWorkspace": "<owner checkout>",
      "implementationWorkspace": "<feature worktree or explicit fallback workspace>",
      "worktree": "<worktree path or fallback reason>",
      "branch": "<feature branch>",
      "commitHash": "<commit hash>",
      "prUrl": "<pull request url>",
      "checks": "passed",
      "merge": "merged",
      "remoteBranchCleanup": "completed",
      "localBranchCleanup": "completed",
      "worktreeCleanup": "cleaned",
      "deliveryExemption": null
    }
  }
}
```
