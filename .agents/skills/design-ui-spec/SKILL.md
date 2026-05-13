---
name: design-ui-spec
description: "Design UI specifications and prototypes. Use for UI specs, page lists, interaction/state models, concept image plans, prototype HTML/PNG/index artifacts, and UI-to-feature mapping validation."
---

# UI Specification Design

## Workflow

1. Confirm the requested outcome, source artifacts, workspace root, and allowed scope.
2. Read referenced files from disk and pass paths, IDs, and section anchors instead of pasted document bodies.
3. Apply this skill's workflow only to its declared responsibility; route adjacent lifecycle work to another project skill.
4. Produce or review the requested artifacts with traceability to PRD, requirements, HLD, Feature Spec, execution records, tests, or evidence as applicable.
5. Return the runtime-supplied structured output shape exactly. Echo `executionId`, `skillName`, `requestedAction`, produced artifacts, next action, and Feature-level traceability when the adapter provides them.

## Guidance

Describe real user workflows, page states, interactions, accessibility, evidence needs, and concept artifacts. Prefer source-backed UI behavior over decorative output.

When generating concept images:

- Derive the page/surface list from the PRD, requirements, HLD primary page/surface inventory, existing UI Spec, and Feature Specs when present.
- Produce one distinct raster image for every concrete expected `docs/ui/concepts/<page-id>.png` artifact; do not collapse multiple pages into one overview image.
- Use stable page IDs that match the artifact paths supplied by the invocation.
- If an expected concept image already exists and does not need repair, keep it unchanged and list it as `unchanged`; do not regenerate or overwrite the same path just to refresh the run.
- If replacing an existing concept image is necessary, record the path and replacement reason in `result.details` or `result.items`.
- The image artifact `summary` should describe the page/surface represented, not the generation mechanism.

## References

- Read `references/specdrive-output.md` when invoked by an adapter that requires structured execution output.
- Read `references/quality-loop.md` when this skill creates or updates Spec documents that must pass a review and repair loop before downstream use.

## Boundaries

- Do not rely on old dotted Skill names or compatibility aliases.
- Do not hardcode product-specific UI, database, scheduler, or adapter behavior unless the invocation supplies it as a source constraint.
- Surface missing decisions as `clarification_needed`, `review_needed`, `risk_review_needed`, or `blocked` instead of inventing facts.
