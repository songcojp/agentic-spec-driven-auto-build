---
name: 03.hld.review-architecture
description: "Create a feature-level architecture plan from requirements, HLD, repository context, and research decisions. Use in the planning pipeline before data model, contract design, and task slicing."
---

# Feature Architecture Plan Skill

Use this skill to turn Feature requirements into an implementable technical
plan. This is a Feature-level planning skill, not project HLD generation and
not a mainline LLD generator. Its output may feed Feature `design.md`, data
flow, adapter model, execution plan, and task slicing.

## Boundary

- Preserve the project HLD as the architecture source of truth.
- Do not redefine subsystem ownership, runtime topology, source-of-truth data,
  or security policy unless the result routes to HLD spec evolution.
- Put Feature-scoped low-level details in the planning result or Feature
  `design.md`, never in a mainline LLD.

## Workflow

1. Read feature requirements, feature design, project HLD, technical context, and research decisions.
2. Define feature components, ownership boundaries, integration points, state changes, error handling, and observability.
3. Map each P1 user journey to the technical path needed to close it.
4. Preserve project-level architecture decisions; do not redefine the HLD.
5. Identify files or modules expected to change and which parts must remain untouched.
6. Note design gaps that block implementation or task slicing.

## Output

- Feature architecture plan.
- Component and module boundaries.
- State, error, recovery, and audit behavior.
- Implementation constraints and risks.
- Feature-scoped low-level design needs, if any, with the destination artifact.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state whether the architecture plan is ready for data model / contract planning or blocked.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `components`: array of planned components/modules and ownership boundaries.
- `integrationPoints`: array of APIs, events, files, adapters, or UI surfaces involved.
- `journeyTechnicalPaths`: user story to component/state/integration path rows.
- `stateAndRecovery`: state, error, recovery, and audit behavior summary.
- `constraints`: implementation constraints that downstream tasks must preserve.
- `lowLevelDesignNeeds`: array of Feature-scoped low-level decisions and their destination (`design.md`, data-flow plan, adapter-model plan, or task note).
- `risks`: array of risks with mitigation or required routing.

## Failure Routing

- Use `clarification_needed` for missing acceptance or unclear workflow.
- Use `risk_review_needed` for broad shared-module or architecture impact.
