# Agent Guidelines

This project is managed by SpecDrive AutoBuild. This file explains the SpecDrive spec standard and the skill-driven workflow that agents must follow inside this target project.

Use this file as the target project's SpecDrive operating contract.

## Source Of Truth

- Treat `docs/PRD.md`, `docs/requirements.md`, `docs/hld.md`, `docs/ui/ui-spec.md`, and `docs/features/<feature-id>/` as the governed product and delivery source of truth.
- Use localized docs such as `docs/zh-CN/*`, `docs/en/*`, or `docs/ja/*` only when the project declares a localized or multilingual spec lane.
- Treat `docs/features/feature-pool-queue.json` and `docs/features/<feature-id>/spec-state.json` as machine-readable Feature state when they exist.
- Treat `.autobuild/` as local runtime state. Keep `.autobuild/runs/` ignored by Git unless the user explicitly asks to inspect or preserve run evidence.
- Preserve user edits. Inspect the worktree before changing files and do not revert unrelated changes.

## Spec Standard

- PRD captures product intent, scope, non-goals, milestones, risks, page surfaces, and source decisions.
- `requirements.md` captures stable `REQ-*`, `NFR-*`, and `EDGE-*` IDs with source trace, priority, EARS-style behavior, and testable acceptance.
- `hld.md` captures architecture, subsystem responsibility, data ownership, state machines, interfaces, security, scheduling, and technology constraints.
- `docs/ui/ui-spec.md` and `docs/ui/concepts/*.png` guide page layout, visual hierarchy, state messaging, and browser verification when UI exists.
- Each `docs/features/<feature-id>/` folder should contain feature-local `requirements.md`, `design.md`, `tasks.md`, and optional `spec-state.json`.
- Do not create project-level scratch requirement files under `docs/features/`. Project-level additions and changes belong in the active mainline `requirements.md`.

## Spec Operations

- Requirement addition or change: follow `.agents/skills/10.change.classify/SKILL.md`, then route to `10.change.create-request` for new IDs or `10.change.update-mainline-spec` for existing IDs.
- PRD to EARS: use `02.requirements.convert-ears`.
- HLD generation: use `03.hld.generate`.
- UI Spec generation: use `04.ui.generate-spec` after PRD, requirements, and HLD exist.
- Feature splitting: use `05.feature.decompose` after planning context, architecture, data model, contracts, quickstart validation, and consistency checks are complete.
- Feature execution: use `07.execution.dispatch-adapter` only for bounded tasks with approved requirements, design constraints, allowed scope, and verification commands.
- Verification: use `08.test.run-tests` for targeted, regression, browser, build, or acceptance checks.
- Review: use `09.review.code-diff` for spec drift, code risk, test gaps, delivery risk, or approval findings.
- Delivery: use `14.release.prepare-pr` only after implementation, verification, and review are complete.

## Spec Workflow

1. Intake or evolve requirements through the active change-management protocol.
2. Update mainline docs first: PRD when product scope changes, then `requirements.md`, then `hld.md` when architecture or system boundaries change.
3. Sync downstream Feature Specs: update `docs/features/README.md`, affected feature `requirements.md`, `design.md`, `tasks.md`, and feature state notes.
4. Run consistency checks before planning or implementation consumes changed specs.
5. Implement only the approved Feature Spec or task scope.
6. Verify with the smallest meaningful command first, then broader checks when shared behavior, state, persistence, contracts, or UI are affected.
7. Record evidence, known risks, and follow-up work in the affected Feature Spec or delivery notes.

## Skill Workflow

- Project-local skills live under `.agents/skills/*/SKILL.md`.
- Read the relevant `SKILL.md` before using a skill. Follow its source paths, output contract, risk routing, and verification expectations.
- Use skills for governed SpecDrive workflows, requirement handling, planning, implementation, verification, review, recovery, and delivery.
- Use normal agent behavior for ordinary questions, exploratory reading, simple edits, simple commands, and direct bug fixes when no governed workflow is needed.
- If a requested change conflicts with current specs, evolve the spec first instead of silently coding around it.
- If intent, acceptance criteria, file scope, safety, or approval boundary is unclear, stop for clarification.

## Skill Reference

- `10.change.classify`: Triage requirement additions, changes, deprecations, clarifications, traceability fixes, and coverage gaps through the active change-management protocol.
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
- `07.execution.dispatch-adapter`: Implement bounded tasks through Codex while preserving scope and evidence.
- `08.test.run-tests`: Run and analyze verification commands.
- `09.review.code-diff`: Produce review findings and delivery-risk reports.
- `12.recovery.classify-failure`: Plan bounded recovery for failed tasks.
- `07.execution.update-state`: Perform deterministic lifecycle side effects for state transitions.
- `00.intake.generate-project-intake`: Create or update project governance.
- `14.release.prepare-pr`: Prepare delivery commits and pull requests after review and verification.

## Implementation Rules

- Read the relevant PRD, requirements, HLD, Feature Spec, and task file before changing code or specs.
- Keep edits scoped to the requested requirement, Feature Spec, or task.
- Prefer existing project patterns, package managers, scripts, and helper APIs.
- Add durable state or machine-queryable behavior in code only when persistence, structural enforcement, or programmatic querying is required.
- Use skills or docs for prompt-driven reasoning, planning, review, decomposition, or analysis.
- Do not commit unless the user asks for a commit or delivery action.
- Report commands run, failures, skipped checks, and residual risks.
