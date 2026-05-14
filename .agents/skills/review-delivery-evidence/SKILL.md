---
name: review-delivery-evidence
description: "Review delivery evidence and release readiness. Use for journey closure, test coverage semantics, evidence completeness, approval gates, human review routing, and release-readiness decisions."
---

# Delivery Evidence Review

## Workflow

1. Confirm the requested outcome, source artifacts, workspace root, and allowed scope.
2. Read referenced files from disk and pass paths, IDs, and section anchors instead of pasted document bodies.
3. Apply this skill's workflow only to its declared responsibility; route adjacent lifecycle work to another project skill.
4. Produce or review the requested artifacts with traceability to PRD, requirements, HLD, Feature Spec, execution records, tests, or evidence as applicable.
5. Return the runtime-supplied structured output shape exactly. Echo `executionId`, `skillName`, `requestedAction`, produced artifacts, next action, and Feature-level traceability when the adapter provides them.

## Guidance

Decide whether behavior, evidence, quality gates, approvals, and release readiness are sufficient. Do not let implementation evidence alone close delivery.

When reviewing Spec Artifact Granularity for UI work:

- Treat `docs/agentic-spec/ui/ui-spec.md` or the invocation-supplied UI System Design path as the UI source of truth. Concept images, screenshots, page names, routes, visible headings, API tests, or single-surface-only references do not satisfy UI Spec readiness by themselves.
- Fail with `review_needed` and `interaction_gap` when a UI Spec lacks per-workflow interaction matrices covering entry point, actors, controls/fields, user action, validation, save/cancel behavior, state feedback, error path, requirement IDs, and browser/evidence expectations.
- Fail with `review_needed` and `state_data_gap` when a UI Spec lacks fact sources, data-binding rules, command/write targets, persistence behavior, reload/revisit assertions, or status-source mapping for primary surfaces.
- Fail with `review_needed` and `evidence_gap` when a UI/App Feature relies on fixture-only, route-only, entry/text-only, screenshot-only, happy-path-only, or API-only evidence instead of browser-visible action plus state change and persistence/revisit proof.
- Fail with `review_needed` and `interaction_gap` when a UI Feature assumes a product-specific host, compatibility surface, or legacy UI source without an explicit PRD/HLD/UI Spec requirement.
- Require the review output to name the missing UI workflow IDs or surfaces, the exact missing matrix columns, the impacted REQ/FEAT IDs when known, and the minimum refinement needed before HLD/UI Spec/Feature Spec can advance.
- Accept read-only UI only when the PRD, requirements, HLD, or UI Spec explicitly marks the surface or field as read-only and still defines the user-visible disabled/permission state and evidence path.

## References

- Read `references/specdrive-output.md` when invoked by an adapter that requires structured execution output.
- Read `references/quality-loop.md` when this skill creates or updates Spec documents that must pass a review and repair loop before downstream use.

## Boundaries

- Do not rely on old dotted Skill names or compatibility aliases.
- Do not hardcode product-specific UI, database, scheduler, or adapter behavior unless the invocation supplies it as a source constraint.
- Surface missing decisions as `clarification_needed`, `review_needed`, `risk_review_needed`, or `blocked` instead of inventing facts.
