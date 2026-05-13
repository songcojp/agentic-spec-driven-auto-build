---
name: 07.execution.dispatch-adapter
description: "Implement bounded coding tasks through Codex. Use when a scheduled task has requirements, design constraints, allowed file scope, verification commands, and enough context to modify code safely."
---

# Feat Implement Skill

## Purpose

Implement bounded Feature Spec work and collect implementation, verification,
delivery, requirement, acceptance, journey, and Delivery Fidelity evidence. This
skill does not own the final product-completion verdict; independent test,
journey, evidence, code, and release reviews must be recorded before completion.

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `07.execution.dispatch-adapter` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

## Use When

Use this skill when a scheduled Feature or task has approved requirements,
design constraints, allowed file scope, verification commands, and enough
repository context to modify code safely.

## Do Not Use

- Do not use it for pure planning, decomposition, or consistency review.
- Do not return `completed` for evidence-only, report-only, API-only,
  ViewModel-only, or mock-test-only work when the Feature contains a user-facing
  journey.
- Do not use seed data, API fixtures, or page-entry checks as substitutes for
  the behavior under test.
- Do not treat commit, PR, task status, or tests alone as final product closure.

Use this skill for implementation tasks after planning and scheduling. The skill
owns the Feature implementation lane and the Git delivery lifecycle. Platform code
only schedules the `feature_execution`, passes the owner workspace and source
paths, records the returned evidence, and validates the final
`SkillOutputContractV1`. Local repository mutations use `git` where needed for
repository state inspection, worktree/branch lifecycle, staging, and commit
creation. GitHub-facing delivery operations use `gh`, including push setup when
available, PR creation, PR checks, PR merge, and remote branch cleanup.

The scheduler/runtime should start this skill with a sandbox that can access the
target repository Git metadata, such as `danger-full-access` in trusted local
development. Treat invocation `workspaceRoot` as the owner checkout. Before
editing, create a sibling Git worktree for the intended Feature branch whenever
the repository supports it. If worktree creation fails, record the reason in
`result.gitDelivery` and create or switch to the intended feature branch in
`workspaceRoot` only as an explicit fallback. Platform code must not create the
implementation worktree on behalf of this skill.

Runtime integration requirements:

- Load the provider prompt from `agents/codex.yaml` or `agents/openai.yaml` when
  this skill is invoked through Codex/OpenAI runtimes.
- Use the compact evidence `result` contract in this file as the output schema
  for `feature_execution`; do not replace it with a generic
  `resultSummary/details/items/openQuestions` schema.
- If the runtime cannot expose the compact evidence result schema, return
  `review_needed` and record the schema limitation in `blockedReason` instead of
  returning `completed`.

## Subagent Execution Model

Default to Codex CLI native subagents for feature execution unless the task is
too small to benefit from delegation or subagents are unavailable. Use subagents
to reduce main-thread context growth and to keep long FEAT implementation paths
from losing required delivery steps. The mainline agent owns control flow, scope,
integration, final review, task status updates, Git delivery, and the final
`SkillOutputContractV1`. Subagents are helpers; they do not own final delivery.

Before editing, the mainline agent must:

- Inspect repository state and preserve unrelated changes.
- Complete requirements and design review gates.
- Build a Delivery Fidelity Ledger covering source intent, journeys, behavior
  obligations, handoffs, losses, evidence, agent reviews, every planned task,
  owner, owned files, status, verification evidence, and blocking risk.
- Assign disjoint file scopes before starting worker subagents.

Delegate only bounded work:

- Explorer subagents are read-only. Use them for specific repository questions,
  such as existing modules, tests, interfaces, or file ownership.
- Worker subagents may edit files only in their declared owned file set. They
  must state their owned files, implemented tasks, verification they ran or
  recommend, risks, and changed paths. They are not alone in the codebase and
  must not revert or overwrite changes from other workers.
- Review subagents are read-only. Use them after implementation to identify
  blocking findings, spec drift, architecture risks, missed edge cases, security
  risks, and test gaps.
- Verification subagents are read-only unless explicitly assigned a scoped fix.
  Use them to analyze failing command output and propose focused recovery.

Do not delegate commit creation, pull request creation, PR checks, merge,
remote branch cleanup, local branch cleanup, `tasks.md` final status updates, or
the final output contract. Those are mainline responsibilities.

If Codex CLI subagents are unavailable, continue in the owner thread using the
same ledger, scope, review, and output requirements. Report that fallback in
`result.subagentUsageSummary`.

Default delegation plan:

1. Use an explorer subagent for repository mapping when the feature touches more
   than one package, app, persistence surface, or UI/API boundary.
2. Use worker subagents only after requirements and design gates pass and the
   ledger assigns disjoint file ownership.
3. Use a review subagent after implementation and before test execution when the
   diff touches contracts, persistence, security/safety policy, UI behavior, or
   shared runtime behavior.
4. Use a verification subagent only to analyze failing commands or propose a
   scoped recovery; final acceptance evidence remains the mainline agent's
   responsibility.
5. If no subagent is used, add one owner-thread fallback entry to
   `result.subagentUsageSummary` with the reason, owned files, and token
   visibility status. Do not omit this field.

When a Feature is split into independent implementation slices, the owner thread
may create worker worktrees and worker branches for those slices. Worker
worktrees are only implementation isolation boundaries: workers do not create
PRs, merge PRs, clean remote branches, or decide Feature completion. The owner
thread integrates worker branches back into the Feature branch, verifies the
combined diff, and delivers one explainable PR for the Feature.

## Mainline Guardrails

- Keep the feature execution ledger current after every subagent result and
  before every phase transition.
- Do not mark a task done until its ledger entry is `implemented`, `reviewed`,
  and `verified`.
- Do not continue from implementation into test execution until the scoped diff
  has passed code review or all blocking findings have been fixed.
- Do not return `completed` unless the compact result includes
  `requirementCoverage`, `acceptanceEvidence`, and `journeyEvidence`, or a valid
  `foundationExemption` with downstream closure Features and integration
  evidence.
- Do not return `completed` unless `contractVersion` is `skill-contract/v2` and
  `result.deliveryFidelity` proves Define -> Plan -> Build -> Verify -> Review
  -> Ship preserved the Feature's behavior obligations.
- Do not return `completed` for UI/App behavior changes unless
  `result.runtimeEvidence` proves app launch, route access, user interaction,
  state change, reload persistence or an equivalent state assertion,
  negative/boundary behavior, and screenshot/trace/log evidence. Use
  `result.runtimeExemption` only for explicit foundation/stateless work with
  evidence.
- Do not return `completed` with any open P0/P1 loss. P2 losses must be closed,
  accepted, or explicitly deferred with a responsible owner and evidence.
- Do not let the implementation agent self-close delivery. Record independent
  Test Engineer, Browser QA, Code Reviewer, or Release Reviewer evidence.
- Do not put `requirementCoverage`, `acceptanceEvidence`, or `journeyEvidence`
  only inside `details`, `items`, report prose, or produced artifact summaries.
  They must be direct structured arrays on `result` so the Journey Closure Gate
  can validate them.
- Do not return `completed` unless required Git delivery evidence exists or a
  delivery exemption is explicitly recorded in `result.gitDelivery`.
- Keep final output compact. Do not hide required evidence inside free-form
  `details`, but do not duplicate full plans, ledgers, logs, or review prose in
  the final JSON. The final `result` object must include the compact evidence
  fields listed below.

## Token and Cost Handling

Subagent token accounting depends on what Codex CLI exposes in the parent run's
event stream. This skill must not claim exact per-subagent token accounting
unless token usage is directly observable in run artifacts.

At finalization:

- Inspect `.autobuild/runs/<executionId>/cli-output.json` and
  `.autobuild/runs/<executionId>/report.json` when they exist.
- Record whether parent run `usage` is present.
- Record whether subagent token usage is directly observable.
- If subagent usage is not directly observable, record that runtime support may
  be needed later for child-run usage capture or aggregation.
- Keep Feature-level cost semantics as latest execution cost, not cumulative
  history.

## Workflow

1. Read the task, related Feature Spec, restrictive requirements, design constraints, allowed file scope, and project constitution constraints.
2. Inspect the current repository state in invocation `workspaceRoot`, preserve unrelated user changes, and create a sibling Git worktree for the intended Feature branch before editing. If worktree creation fails, record the failure reason in `result.gitDelivery` and create or switch to the intended feature branch in `workspaceRoot` only as an explicit fallback.
3. Run requirements review against the Feature Spec and source requirements. Confirm that each implementation task maps to approved `REQ-*`, `NFR-*`, `EDGE-*`, or task traceability. Stop with `clarification_needed` when material requirement intent is unclear.
4. Run design review against the Feature Spec design, HLD/design constraints, data/contract boundaries, and allowed file scope. Stop with `risk_review_needed` when the implementation would exceed approved design or scope.
5. If requirements or design review exposes a question that can be safely resolved by automatic decision, record it in a dedicated clarification and decision section in the corresponding document before implementation. Use the affected document closest to the decision:
   - Requirement ambiguity: add or update `## Clarifications and Decisions` / `## 澄清与决策记录` in the relevant `requirements.md`.
   - Design ambiguity: add or update `## Clarifications and Decisions` / `## 澄清与决策记录` in the relevant `design.md` or HLD document.
   - Task execution ambiguity: add or update a dedicated clarification and decision section in the relevant `tasks.md` or delivery notes.
   Record the chosen option, rationale, rejected alternatives, traceability IDs, and residual risk. If the decision needs user approval, do not auto-decide; return `clarification_needed`.
6. Create an implementation plan before editing. The plan must name the intended file scope, code path, test plan, review focus, traceability IDs, subagent delegation plan, and ledger entries for every planned task. Stop with `risk_review_needed` if the plan exceeds approved scope.
7. Create the Delivery Fidelity Ledger before editing. Convert source intent and
   user/system journeys into behavior obligations. For each planned handoff,
   record what must be preserved and what evidence will close it.
8. Inspect current files before editing and preserve unrelated user changes.
9. Delegate bounded exploration or implementation work when it can reduce main-thread context or run safely in parallel. Keep ownership scopes disjoint and update the ledger after every subagent result.
10. Implement the smallest change that satisfies the task and local patterns, either directly in the owner thread or through scoped worker subagents.
11. Integrate worker outputs in the owner thread, inspect the combined diff, and confirm every changed file is within the approved file scope.
12. Run code review before test execution. Review the scoped diff for correctness, spec drift, architecture violations, missed edge cases, security risks, and test gaps. Use review subagents when useful, but the mainline agent must decide and record the final review outcome.
13. Fix required code review findings before running the test flow. If a finding requires requirement or design changes, route through clarification, risk review, or spec evolution before continuing.
14. Add or update focused tests when behavior, contracts, state, or user-visible UI changes.
15. Run targeted verification and capture command results. Use verification subagents only to analyze failures or propose focused recovery; final acceptance evidence must be confirmed by the mainline agent.
16. Map implemented work to Journey Checkpoints. For each P1 user story covered by the Feature, capture runtime evidence that the user-visible scenario works. For UI-bearing Features, this means browser-level or equivalent interaction evidence; API, ViewModel, schema, or mock tests are supporting evidence only.
17. Update `result.deliveryFidelity`: close handoffs, attach behavior-obligation evidence, record any losses, and add independent test/QA/review/release decisions. API fixtures may appear only as precondition evidence; never as the sole behavior proof.
18. If the Feature is foundation-only, populate `foundationExemption` with the reason, downstream closure Features, and integration evidence. Do not invent an exemption for a user-facing Feature.
19. After verification passes and the ledger shows every completed task as implemented, reviewed, and verified, synchronize the implemented Feature Spec tasks in `docs/features/<feature-id>/tasks.md` using the existing task block structure. The task file must remain parseable by the Feature Spec Webview task parser (`parseFeatureTasksMarkdown()` in `src/specdrive-ide.ts`) because Feature item task completion counts depend on the parsed task IDs and statuses. Each implemented task must have a parser-compatible heading ID such as `T-001-01`, `T-021-12`, or `TASK-001`, plus a standalone `状态:` or `Status:` line. If the source task file uses compact legacy rows such as `- T001-01: ... Requirements: ... Verification: ...`, first normalize the affected rows into task blocks and normalize IDs to the generated parseable form, for example `T001-01` -> `T-001-01`.
    For each completed task, update its `状态:` or `Status:` line from `todo`, `pending`, `in_progress`, `blocked`, or another non-terminal pending value to `done`. Preserve or recreate the surrounding heading and fields, for example:
    ```md
    ### T-001-01 Task title
    状态: done
    描述: ...
    关联需求: ...
    范围: ...
    验证: ...
    完成标准: ...
    ```
    Do not mark a task `done` when implementation is blocked, verification fails, or the task was not actually completed. If a task file already defines an explicit blocked-status convention, follow that convention for blocked work; otherwise leave the existing task status unchanged and report the blocker in the skill output.
20. Inspect run usage artifacts for token/cost observation and record parent-run and subagent visibility in `subagentUsageSummary`.
21. Confirm the implementation checkout, whether sibling worktree or fallback branch in `workspaceRoot`, contains only scoped changes intended for this task, then commit them on the feature branch with a narrow Conventional Commit message.
22. Use `gh` for GitHub delivery: authenticate or report the blocker, push/set upstream as needed, create a pull request with traceability, changed files, verification results, deviations, and residual risks, then record the PR URL.
23. Use `gh pr checks` or the configured equivalent to inspect required checks. If checks or required reviews are pending or failing, stop with `approval_needed`, `review_needed`, or `blocked` instead of claiming delivery is complete.
24. Use `gh pr merge` only after required checks/reviews pass and project policy allows merge.
25. After the PR is merged, delete the remote feature branch through `gh` or the PR merge cleanup option when available. Delete the local feature branch only when policy allows and only after confirming no uncommitted changes remain. If a sibling worktree was created, remove it after confirming it is clean.
26. Report any deviations, blockers, cleanup failures, missing commit evidence, missing PR evidence, token visibility gaps, missing Journey Checkpoint evidence, unclosed Delivery Fidelity losses, or required spec evolution.

## Review Gates

- Requirements review must happen before implementation and must verify the task has approved acceptance criteria and stable traceability.
- Design review must happen before implementation and must verify the planned code path respects architecture, persistence, contract, UI, and file-scope constraints.
- Implementation planning must happen after requirements/design review and before editing. The plan is binding for scope control unless later review or implementation evidence requires a recorded change.
- Subagent delegation must happen only after requirements/design review and after the mainline ledger assigns disjoint ownership scopes.
- Code review must happen after implementation and before test execution. Required findings must be fixed before tests are treated as acceptance evidence.
- Both review gates are blocking. Do not continue into implementation when either gate requires user clarification, risk review, or spec evolution.
- Automatic clarification or design decisions are allowed only when the approved sources provide enough context to choose safely and the result is recorded in the corresponding document's dedicated clarification and decision section.

## Git Delivery

- Treat invocation `workspaceRoot` as the owner checkout. Use a sibling Git worktree for feature implementation and delivery when the repository supports it. If worktree creation fails, record the blocker in `result.gitDelivery` and fall back to a new or existing feature branch in `workspaceRoot` only as an explicit fallback.
- Preserve unrelated changes in the owner checkout and in the implementation checkout.
- Commit only the scoped implementation, tests, and required spec or decision-record updates. Local staging and commit creation may use `git`; never include unrelated modified files.
- Subagents must not run delivery commands. The mainline agent owns all `git` and `gh` delivery commands after integrating subagent outputs.
- Use `gh` for GitHub-facing operations: checking authentication, creating PRs, reading PR status/checks, merging PRs, and remote branch cleanup. Do not hardcode GitHub API calls when `gh` can provide the operation.
- Create and merge the PR as part of the skill delivery lane when the environment has the required repository permissions and checks pass. If repository policy requires a separate delivery skill, stop after the scoped commit and return `approval_needed` with a `nextAction` to run `14.release.prepare-pr`.
- After merge, clean up the remote feature branch and local feature branch when policy allows, and remove the sibling worktree when one was used. If cleanup cannot complete safely, report the exact blocker and leave the branch or worktree intact.
- `completed` requires auditable `gitDelivery` evidence for the owner workspace path, implementation workspace path, worktree creation or fallback reason, branch, commit hash, PR URL or approved delivery exemption, merge status, remote branch cleanup, local branch cleanup, and worktree cleanup. Missing commit, PR, merge, or cleanup evidence must produce `review_needed`, `approval_needed`, or `blocked`.

## Output

- Code changes within scope.
- Compact implementation plan and ledger status.
- Compact subagent usage summary, including fallback when subagents are
  unavailable.
- Compact code review outcome.
- Test or verification summary.
- Updated `docs/features/<feature-id>/tasks.md` task blocks and task statuses for completed and verified tasks, including normalization from compact legacy rows when needed.
- Residual risks and follow-up notes.
- Pull request, merge, and branch cleanup summary with `gh` command evidence for GitHub-facing actions.
- Return a `SkillOutputContractV1` JSON object with `contractVersion`, `executionId`, `skillSlug`, `requestedAction`, `status`, `summary`, `producedArtifacts`, and Feature-level `traceability`.
- Put verification command results in `summary`, `producedArtifacts[].summary`, or `result` fields; do not add extra top-level output fields.
- `completed` only means implementation evidence is ready for projection; the Scheduler or review flow still applies the independent Journey Closure Gate.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state what was implemented and the verification outcome.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should be compact. Prefer short strings, path arrays, and status
objects over nested prose. Store detailed ledgers, long review notes, command
logs, and rationale in source documents, task notes, produced artifacts, or run
logs instead of duplicating them here.

Required compact fields:

- `changedFiles`: array of changed file paths only.
- `requirementCoverage`: array of `{ requirementId, status, evidence }`.
- `acceptanceEvidence`: array of `{ scenarioId, status, evidence }`.
- `journeyEvidence`: array of `{ userStoryId, scenario, status, evidence }`.
- `foundationExemption`: `null` or `{ exempt, reason, downstreamFeatures, integrationEvidence }`.
- `runtimeEvidence`: `null` or an object with `appLaunch`, `journeys`,
  `stateAssertions`, and `negativePaths` evidence for UI/App behavior changes.
- `runtimeExemption`: `null` or `{ exempt, reason, evidence }` for explicit
  foundation/stateless work.
- `verification`: array of `{ command, status, summary }`, where `status` is
  `passed`, `failed`, or `skipped`.
- `tasks`: object with `done` and `blocked` arrays of normalized task IDs. When
  `tasks.md` statuses were changed, `done` must match the IDs updated to `done`.
- `gates`: object with `requirements`, `design`, and `codeReview` statuses.
  Values should be short, for example `passed`, `review_needed`, or `blocked`.
- `delegation`: array of compact entries `{ role, status, files, note }`.
  Include at least one entry. If no subagent is used, include an owner-thread
  fallback entry with the reason.
- `gitDelivery`: object with `ownerWorkspace`, `implementationWorkspace`,
  `worktree`, `branch`, `commitHash`, `prUrl`, `checks`, `merge`,
  `remoteBranchCleanup`, `localBranchCleanup`, `worktreeCleanup`, and
  `deliveryExemption`. Use `null` for missing values and return a
  non-`completed` status when required delivery evidence is missing. Use
  `deliveryExemption` only for an explicitly approved delivery exemption with
  evidence; protected branches, pending checks, failed merge, or unsafe cleanup
  should return `approval_needed`, `review_needed`, or `blocked`.
- `tokenUsage`: object with `parentUsagePresent` and
  `subagentUsageObservable` booleans.
- `risks`: array of concise residual risk strings.
- `blockedReason`: string or `null`.

## Failure Routing

- Use `clarification_needed` when implementation intent is unclear.
- Use `risk_review_needed` when the required change exceeds the approved scope.
- Use `12.recovery.classify-failure` input when verification fails and recovery is allowed.
- Use `review_needed` when implementation produced changes but the output lacks auditable workspace, commit, PR, or verification evidence.
- Use `approval_needed` when protected branch, missing review, pending checks, or delivery policy prevents merge or requires a separate `14.release.prepare-pr` handoff.
- Use `blocked` when workspace verification, fallback branch creation, `gh` authentication, PR creation, merge, remote branch deletion, local branch deletion, or worktree deletion cannot complete safely.
