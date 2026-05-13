---
name: 05.feature.generate-design
description: "Execute the Agentic Spec 05 feature workflow for generate design with reusable input references, output contract, and acceptance checks."
---

# Feature Design Skill

## Purpose

Create or update a Feature Spec `design.md` that explains how the Feature will
close its approved user journeys within the project HLD boundaries. This is the
right place for Feature-level low-level design when needed. It must not redefine
project architecture or create a mainline LLD.

## Use When

- A Feature Spec folder needs a new or refreshed `design.md`.
- Feature requirements are approved and need an implementation path.
- Planning outputs from architecture, data-flow, adapter-model, UI spec, or
  quickstart validation must be consolidated into Feature design.
- A high-risk or complex Feature needs low-level detail, scoped to the Feature.

## Do Not Use

- Do not write or regenerate the project HLD.
- Do not create a mainline LLD.
- Do not produce task lists; route execution steps to
  `05.feature.generate-tasks`.
- Do not reduce design to a traceability map. `design.md` must be enough for an
  implementer to start safely.

## Workflow

1. Read Feature `requirements.md`, project HLD, UI spec when relevant,
   repository context, and planning result artifacts named by the invocation.
2. Confirm HLD alignment: subsystem ownership, source-of-truth data, state
   flows, integration boundaries, security, and runtime constraints.
3. For each P1 journey, describe the implementation path from user action to
   state/data/API/UI behavior to feedback and evidence.
4. Define Feature-scoped UI, API, data, state, error, recovery, audit, and
   evidence design only as needed to make implementation safe.
5. For UI/configuration Features, include an interaction matrix or reference the
   UI Spec matrix and show how each row maps to state/data ownership,
   validation, persistence, reload/revisit evidence, and browser verification.
6. Include low-level design details only when risk justifies them; keep them
   inside Feature scope and trace them to requirements or planning results.
7. Identify implementation boundaries: files/modules likely touched,
   dependencies, forbidden changes, compatibility constraints, and assumptions.
8. Record unresolved design decisions as `clarification_needed` or
   `risk_review_needed`; do not hide them in broad prose.
9. Run the mandatory Spec document quality review and repair loop from
   `.agents/skills/SPEC_DOC_QUALITY_LOOP.md` before returning `completed`.
   Define `qualityLoopPlan` with the Feature `design.md` artifact, Feature
   requirements, HLD, UI Spec, planning-result source evidence, selected Feature
   design review Skill, Repair Owner, and rationale. Use separate Quality Review
   and Repair subagents, cap the loop at 10 iterations, and exit when remaining
   gaps are not in-scope repairable.

## Required Feature Design Template

```md
# Feature Design: <Feature ID> <Feature Name>

## Design Intent

## HLD Alignment

## User Journey Implementation Path

## UI / API / Data / State / Error Design

## Evidence Design

## Risks and Open Decisions

## Implementation Boundaries
```

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter.
Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level
traceability from the invocation. Include produced artifacts, next action, and a
concise result object specific to this workflow step.

## Specialized Result Contract

`result` should contain:

- `designPath`: generated or updated Feature design path.
- `hldAlignment`: HLD sections and boundaries preserved.
- `journeyImplementationPaths`: user story to implementation-path rows.
- `designSurfaces`: UI, API, data, state, error, recovery, and evidence
  surfaces touched.
- `lowLevelDesignScope`: `"none"`, `"feature_scoped"`, or `"blocked"`, with a
  short rationale.
- `implementationBoundaries`: allowed modules/files and forbidden changes.
- `openDecisions`: decisions requiring clarification or risk review.
- `qualityRepairLoop`: compact result from
  `.agents/skills/SPEC_DOC_QUALITY_LOOP.md`.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the Feature design boundary and does not redefine the
  project HLD.
- Every P1 journey from requirements has an implementation path and evidence
  design.
- Every UI/configuration interaction has a state/data path, validation behavior,
  persistence or source-of-truth owner, reload/revisit assertion, and evidence
  mode.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- No mainline LLD, task list, or product-specific shortcut is hardcoded into the
  skill.

## Failure Routing

- Use `clarification_needed` for unclear user flow, acceptance, or design
  decision.
- Use `risk_review_needed` when the Feature design would change HLD boundaries,
  shared architecture, security, or compatibility.
- Use `blocked` when required Feature requirements or HLD sources cannot be
  read.
