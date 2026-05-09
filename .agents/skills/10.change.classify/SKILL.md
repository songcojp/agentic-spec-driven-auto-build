---
name: 10.change.classify
description: "Govern requirement additions and changes through the SpecDrive change-management protocol before routing to requirement intake or spec evolution."
---

# Change Requirement Skill

This skill is the protocol entry point for requirement additions, requirement changes, coverage gaps, clarifications, deprecations, and traceability fixes.

## Governing Protocol

Before editing any spec or code, read and follow the active change-management protocol:

1. Use `docs/zh-CN/change-management.md` when the active project lane is Chinese or when the request is in Chinese.
2. Use `docs/change-management.md` when it exists and the active lane is root English docs.
3. For explicit multilingual projects, use the localized protocol that matches the active lane.

The protocol is authoritative for:

- trigger sources;
- triage classification;
- version level;
- risk routing;
- mainline document updates;
- downstream Feature Spec synchronization;
- active/done/delivered Feature handling;
- review and blocking rules;
- commit and verification expectations.

## Required Triage Record

For every requirement item, establish a triage record before changing files:

| Field | Required Value |
|---|---|
| Source | PRD paragraph, user instruction, review finding, test result, delivery report, implementation evidence, or approval decision. |
| Type | `ADD`, `CHANGE`, `DEPRECATE`, `CLARIFY`, or `TRACEABILITY_FIX`. |
| Version Level | `MAJOR`, `MINOR`, or `PATCH`. |
| Impact IDs | Affected `REQ-*`, `NFR-*`, `EDGE-*`, Feature Spec IDs, or HLD sections. |
| Risk Routing | `none`, `clarification_needed`, `risk_review_needed`, or `approval_needed`. |
| Processing State | `triaged`, `documenting`, `downstream_sync`, `reviewing`, `ready_to_commit`, or `blocked`. |

If the item cannot be triaged into these fields, stop and ask for clarification.

## Routing

- Use `10.change.create-request` when the item needs a brand-new stable `REQ-*`, `NFR-*`, or `EDGE-*` ID.
- Use `10.change.update-mainline-spec` when an existing ID must be changed, corrected, deprecated, superseded, clarified, or re-traced.
- For coverage gaps where PRD already contains the product intent but downstream docs do not, update `requirements.md` and downstream traceability without inventing new PRD scope.

## Mainline-First Rule

Requirement additions and changes must update the mainline spec lane first:

1. PRD, when product scope, page surface, data model, risk, non-goal, or milestone changes.
2. `requirements.md`, for stable IDs, EARS statements, source traces, priority, and testable acceptance.
3. `hld.md`, when architecture, subsystem responsibility, data ownership, state machines, interfaces, security, scheduling, or technology choices change.
4. `docs/features/README.md` and affected `docs/features/<feature-id>/` files when executable Feature Specs are affected.

Do not create scratch requirement files such as `docs/features/requirements.md` for project-level requirements unless the governing spec explicitly defines that file as a source artifact.

## Downstream Sync

After mainline updates, apply the downstream checklist from the governing protocol:

- traceability matrix;
- MVP or milestone mapping;
- HLD requirement coverage;
- Feature index primary requirements;
- affected Feature Spec `requirements.md`;
- affected Feature Spec `design.md`;
- affected Feature Spec `tasks.md`;
- active/done/delivered Feature stale or follow-up handling;
- open questions and review routing.

## Output

Report:

- triage record;
- routed skill or reason no skill was needed;
- updated mainline documents;
- downstream Feature Spec synchronization;
- review routing;
- verification performed;
- residual risk.
