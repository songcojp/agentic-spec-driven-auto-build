---
name: 05.feature.generate-requirements
description: "Execute the Agentic Spec 05 feature workflow for generate requirements with reusable input references, output contract, and acceptance checks."
---

# Feature Requirements Skill

## Purpose

Create or update a Feature Spec `requirements.md` that defines what the Feature
must make true for users. This skill owns the Feature-level acceptance object:
user stories, requirements, acceptance scenarios, journey coverage, non-scope,
and foundation exemption when applicable. It does not produce project-level
HLD, Feature design, tasks, or implementation code.

## Use When

- A Feature Spec folder needs a new or refreshed `requirements.md`.
- `05.feature.decompose` has selected a Feature boundary and needs the
  requirements artifact generated independently.
- `09.review.spec-consistency` reports missing Feature requirement, acceptance,
  or Journey Checkpoint coverage.
- A foundation Feature needs an explicit exemption and downstream closure map.

## Do Not Use

- Do not write project-level PRD, mainline requirements, HLD, or LLD.
- Do not design APIs, data models, UI components, or task steps; route those to
  Feature design or planning skills.
- Do not mark API/ViewModel/mock-only coverage as sufficient for a UI-bearing
  Feature.

## Workflow

1. Read the PRD, mainline EARS requirements, project HLD, UI spec when relevant,
   Feature index, existing Feature artifacts, and change request or operator
   instruction named by the invocation.
2. Preserve existing `REQ-*`, `NFR-*`, `EDGE-*`, and `US-*` IDs. Create local
   Feature requirement labels only when the source documents do not already
   provide stable IDs, and flag the gap.
3. Define the Feature goal, non-goals, source traceability, and user-story
   coverage. P1 stories must remain independently verifiable.
4. Write requirement rows that are observable, testable, and traceable to
   source IDs. Keep implementation choices out unless they are explicit source
   constraints.
5. Add `User Journey Coverage`: each P1 story must map to requirement rows,
   acceptance scenarios, expected runtime/browser/evidence type, and the
   downstream Journey Checkpoint that tasks must include.
6. Add `Acceptance Scenarios` that can become tests or manual acceptance checks
   without interpretation.
7. For foundation-only Features, add `Foundation Exemption` with `exempt`,
   `reason`, `downstreamFeatures`, and `integrationEvidence`. Do not add this
   section as a shortcut for user-facing scope.
8. If source intent, priority, or acceptance is ambiguous, return
   `clarification_needed` instead of inventing completion criteria.

## Required Feature Requirements Template

```md
# Feature Requirements: <Feature ID> <Feature Name>

## Feature Goal

## Source Traceability

## User Story Coverage

## Requirements

## User Journey Coverage

## Acceptance Scenarios

## Non-Scope

## Foundation Exemption
```

Omit `Foundation Exemption` only when the Feature directly closes user journeys.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter.
Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level
traceability from the invocation. Include produced artifacts, next action, and a
concise result object specific to this workflow step.

## Specialized Result Contract

`result` should contain:

- `requirementsPath`: generated or updated Feature requirements path.
- `sourceTraceability`: source document and ID coverage.
- `userStoryCoverage`: user stories, priorities, and Feature ownership.
- `requirementCoverage`: requirement rows generated or updated.
- `journeyCoverage`: P1 journey coverage and evidence expectations.
- `acceptanceScenarios`: acceptance scenarios that design and tasks must close.
- `foundationExemption`: exemption object or `null`.
- `openQuestions`: unresolved input or acceptance questions.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `05` `feature` requirements boundary.
- Every P1 user story has requirement and journey coverage, or a valid
  foundation exemption exists.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- No project-level HLD, mainline LLD, design, task, UI, database, scheduler, or
  adapter behavior is hardcoded into the requirements artifact.

## Failure Routing

- Use `clarification_needed` for missing user intent, acceptance, or source
  traceability.
- Use `risk_review_needed` when the Feature boundary contradicts the HLD or
  mainline requirements.
- Use `blocked` when required source files cannot be read.
