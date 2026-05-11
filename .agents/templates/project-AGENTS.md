# Agent Guidelines

This project is managed by SpecDrive AutoBuild. This file explains the SpecDrive spec standard and the workflow skills that managing agents may use while operating this target project. It does not require the target product to implement its own features as Skills.

Use this file as the target project's SpecDrive operating contract.

## Source Of Truth

- Treat `docs/PRD.md`, `docs/requirements.md`, `docs/hld.md`, `docs/ui/ui-spec.md`, and `docs/features/<feature-id>/` as the governed product and delivery source of truth.
- Use localized docs such as `docs/zh-CN/*`, `docs/en/*`, or `docs/ja/*` only when the project declares a localized or multilingual spec lane.
- Treat `docs/features/feature-pool-queue.json` as the Feature dependency, priority, and queue fact source.
- Treat `docs/features/<feature-id>/spec-state.json` as the file-backed lifecycle fact source for one Feature, including `status`, `executionStatus`, `currentJob`, `lastResult`, `blockedReasons`, `resumeTarget`, `nextAction`, and `history` when present.
- Treat `.autobuild/` as local runtime state. Runtime databases and run artifacts are evidence sources, not mainline specs. Keep `.autobuild/runs/` ignored by Git unless the user explicitly asks to inspect or preserve run evidence.
- Preserve user edits. Inspect the worktree before changing files and do not revert unrelated changes.

## Spec Standard

- PRD captures product intent, scope, non-goals, milestones, risks, page surfaces, and source decisions.
- `requirements.md` captures stable `REQ-*`, `NFR-*`, and `EDGE-*` IDs with source trace, priority, EARS-style behavior, and testable acceptance.
- `hld.md` captures architecture, subsystem responsibility, data ownership, state machines, interfaces, security, scheduling, and technology constraints.
- `docs/ui/ui-spec.md` and `docs/ui/concepts/*.png` guide page layout, visual hierarchy, state messaging, and browser verification when UI exists.
- Each `docs/features/<feature-id>/` folder should contain feature-local `requirements.md`, `design.md`, `tasks.md`, and optional `spec-state.json`.
- Do not create project-level scratch requirement files under `docs/features/`. Project-level additions and changes belong in the active mainline `requirements.md`.
- Feature-local `tasks.md` is an execution-agent work plan and UI projection source. Do not introduce a platform task table or make parsed tasks a scheduling prerequisite unless the active project spec explicitly requires it.

## State Protocol

Every state transition must be reviewable by both humans and machines. A transition record, audit note, history entry, or equivalent evidence must identify:

- `from` and `to` states.
- Trigger event: user instruction, Skill output, Adapter event, Status Check, Review decision, Recovery result, delivery action, or controlled command.
- Fact source: spec file, `spec-state.json`, runtime record, approval/review record, audit entry, or run artifact.
- Evidence references: report, raw log, produced artifact, diff, test output, approval record, or review item.
- Allowed side effects: the exact writes or commands permitted by the transition.
- Recovery entry: `resumeTarget` for interrupt states such as `waiting_input`, `approval_needed`, `review_needed`, `blocked`, `failed`, or `paused`.
- Terminal condition: how the state exits, resumes, retries, skips, cancels, or becomes final.

Use the common execution statuses without folding them into unrelated states: `queued`, `running`, `waiting_input`, `approval_needed`, `review_needed`, `blocked`, `failed`, `cancelled`, and `completed`. Feature file lifecycle may additionally use `draft`, `ready`, `paused`, `skipped`, and `delivered` when the project supports them.

State fact ownership:

- `feature-pool-queue.json` owns dependencies, priority, and queue selection facts.
- Feature `spec-state.json` owns operator-facing Feature lifecycle and recovery hints.
- Runtime execution records own actual run facts.
- Scheduler job records own queue job facts.
- Review and approval records own Review Needed and human decision facts.
- Product Console, VSCode Webviews, dashboards, and other UIs are projections and controlled-command entrypoints only; they must not directly own or silently rewrite state facts.

## Spec Operations

- Requirement addition or change: follow the skill-owned protocol in `.agents/skills/10.change.classify/SKILL.md`, then route to `10.change.create-request` for new IDs or `10.change.update-mainline-spec` for existing IDs.
- PRD to EARS: use `02.requirements.convert-ears`.
- HLD generation: use `03.hld.generate`.
- UI Spec generation: use `04.ui.generate-spec` after PRD, requirements, and HLD exist.
- Feature splitting: use `05.feature.decompose` after planning context, architecture, data model, contracts, quickstart validation, and consistency checks are complete.
- Feature execution: use `07.execution.dispatch-adapter` only for bounded tasks with approved requirements, design constraints, allowed scope, and verification commands.
- Verification: use `08.test.run-tests` for targeted, regression, browser, build, or acceptance checks.
- Review: use `09.review.code-diff` for spec drift, code risk, test gaps, delivery risk, or approval findings.
- Delivery: use `14.release.prepare-pr` only after implementation, verification, and review are complete.

## Change And Drift Protocol

- Any requirement addition, requirement change, coverage gap, clarification, deprecation, or traceability fix must go through the skill-owned change protocol before implementation.
- Do not create target-project `docs/change-management.md`, `docs/zh-CN/change-management.md`, or `docs/*/change-disposition-checklist.md`; those protocol/checklist documents are legacy SpecDrive repository artifacts. Store change facts in PRD, `requirements.md`, `hld.md`, affected Feature Specs, `spec-state.json`, and runtime/review evidence.
- If a repository fact conflicts with the approved spec, do not silently code around it. Classify the conflict as either a code fix or spec evolution, then update the governing spec lane first when the spec changes.
- If implementation, tests, review, or delivery evidence invalidates an active or completed Feature, record the affected evidence, update traceability, and reopen, follow up, or re-plan the affected Feature.
- If a Feature is `blocked`, `failed`, `review_needed`, or `approval_needed`, do not repeatedly auto-select it unless there is an explicit resume or skip instruction.
- `paused` must keep a `resumeTarget`; `cancelled` must record actor, reason, and retry policy; `skipped` must preserve history and let the scheduler select the next Feature.

## Spec Workflow

Use the Delivery Lifecycle OS as the primary workflow model: Define, Plan,
Build, Verify, Review, and Ship. The 00-14 skill numbers are an internal
compatibility layer, not a reason to skip lifecycle responsibilities.

1. Define: intake or evolve requirements through the skill-owned change protocol and preserve source intent, users, non-goals, success examples, and failure examples.
2. Plan: update mainline docs first, then turn journeys into behavior obligations, Feature Specs, task blocks, test obligations, and handoff expectations.
3. Build: implement only the approved Feature Spec or task scope and preserve the Delivery Fidelity Ledger.
4. Verify: prove behavior obligations with the smallest meaningful command first; UI and multi-step flows need browser or equivalent runtime evidence.
5. Review: independently check code, spec drift, test semantics, evidence completeness, and open losses.
6. Ship: record PR/merge/cleanup evidence, delivery notes, state projection, known risks, and follow-up work.

## SpecDrive Workflow Skills

- Project-local skills live under `.agents/skills/*/SKILL.md`.
- Skills are SpecDrive workflow tools for the managing agent and control plane. They encode governed spec operations such as requirement handling, planning, implementation dispatch, verification, review, recovery, and delivery.
- Skills are not the target project's product architecture and are not the default implementation form for target-project business capabilities.
- Read the relevant `SKILL.md` before using a skill. Follow its source paths, output contract, risk routing, state protocol, and verification expectations.
- Use normal agent behavior for ordinary questions, exploratory reading, simple edits, simple commands, and direct bug fixes when no governed workflow is needed.
- If a requested change conflicts with current specs, evolve the spec first instead of silently coding around it.
- If intent, acceptance criteria, file scope, safety, or approval boundary is unclear, stop for clarification.

## Target Implementation Boundary

- Implement target-project product behavior in the target project's code, configuration, documentation, or other artifacts according to its PRD, requirements, HLD, Feature Spec, and technology stack.
- Do not convert target-project business features into `.agents/skills/` unless the approved Feature Spec explicitly says the target product itself is a Skill package, workflow package, agent runtime, or similar developer-tooling artifact.
- Treat changes to `.agents/skills/` as changes to the SpecDrive workflow contract, not as the normal path for delivering target-project functionality.
- If the target project already contains Skills as governed product artifacts, edit them like any other target-project files: trace the change to requirements, update the relevant Feature Spec, and verify the declared behavior.

## Skill Reference

- `10.change.classify`: Triage requirement additions, changes, deprecations, clarifications, traceability fixes, and coverage gaps through the skill-owned change protocol.
- `using-agent-skills`: Route broad work through Define/Plan/Build/Verify/Review/Ship, local skills, and specialist agent responsibilities.
- `10.change.create-request`: Add brand-new `REQ-*`, `NFR-*`, or `EDGE-*` requirements with traceability and downstream sync.
- `10.change.update-mainline-spec`: Change, correct, supersede, deprecate, clarify, or re-trace existing requirements and specs.
- `10.change.impact-analysis`: Resolve unclear product intent, acceptance criteria, or technical boundaries.
- `02.requirements.validate-testability`: Check requirement quality, readiness, and traceability.
- `07.execution.prepare-context`: Gather repository facts and implementation constraints for planning.
- `06.planning.estimate-risk`: Record bounded technical decisions and rejected alternatives.
- `03.hld.review-architecture`: Produce feature-level architecture plans.
- `03.hld.define-data-flow`: Design persistence, state, event, and ownership changes.
- `03.hld.define-adapter-model`: Design API, CLI, event, file, UI view-model, and integration contracts.
- `06.planning.prepare-execution-plan`: Check startability, commands, environment, and blockers before slicing tasks.
- `05.feature.decompose`: Split product scope into Feature Specs or executable tasks.
- `09.review.spec-consistency`: Verify planning outputs agree before implementation.
- `06.planning.replan`: Select the next executable Feature from queue, dependencies, state, and operator hints.
- `07.execution.dispatch-adapter`: Implement bounded tasks through Codex while preserving scope, Delivery Fidelity, Journey Closure, and Git delivery evidence.
- `08.test.run-tests`: Run and analyze verification commands against behavior obligations.
- `09.review.code-diff`: Produce review findings and delivery-risk reports.
- `09.review.test-coverage`: Review whether tests prove behavior obligations rather than only command success.
- `09.review.evidence-completeness`: Review Delivery Fidelity, Journey, Git, and artifact evidence before completion.
- `12.recovery.classify-failure`: Plan bounded recovery for failed tasks.
- `07.execution.update-state`: Perform deterministic lifecycle side effects for state transitions.
- `00.intake.generate-project-intake`: Create or update project governance.
- `14.release.prepare-pr`: Prepare delivery commits and pull requests after review and verification.

## Implementation Rules

- Read the relevant PRD, requirements, HLD, Feature Spec, and task file before changing code or specs.
- Keep edits scoped to the requested requirement, Feature Spec, or task.
- Prefer existing project patterns, package managers, scripts, and helper APIs.
- Add durable state or machine-queryable behavior in code only when persistence, structural enforcement, or programmatic querying is required.
- Use SpecDrive workflow Skills only for the managing agent's governed workflow steps; implement target-product behavior in the target project's governed artifacts.
- Use controlled commands or approved code paths for writes to runtime state, Feature state, Review/Approval facts, and delivery records.
- Keep UI and reports as projections of source facts. If a UI value looks wrong, inspect the fact source before patching the view.
- Preserve execution evidence for verification, review, recovery, and delivery. Do not replace real run history with synthetic success.
- Do not commit unless the user asks for a commit or delivery action.
- Report commands run, failures, skipped checks, and residual risks.

## Verification And Delivery

- For docs-only changes, run `git diff --check` and inspect affected links, paths, IDs, and terminology.
- For code changes, run the smallest meaningful targeted verification first, then broader checks when shared state, persistence, contracts, scheduling, recovery, or UI are affected.
- For UI changes, verify rendered behavior with browser or Webview evidence when practical.
- Delivery summaries must include affected requirements or Feature Specs, verification evidence, and known follow-ups.
