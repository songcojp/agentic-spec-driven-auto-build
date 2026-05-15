# FEAT-024 Product Usability Autonomy — Requirements

Feature ID: FEAT-024
Feature Name: Product Usability Autonomy
Status: ready
Milestone: M10
Dependencies: FEAT-002, FEAT-004, FEAT-008, FEAT-011, FEAT-012, FEAT-021, FEAT-023

## Goal

Upgrade SpecDrive AutoBuild from spec-complete delivery to product-usable delivery by converging mature skill-library practices with Agentic Spec protocol structures that are durable, machine-queryable, status-affecting, and visible in the VSCode IDE Execution Workbench.

## Source Requirements

| Requirement ID | Description | Source |
|---|---|---|
| REQ-095 | Mature skill-library practices and Agentic Spec protocol must converge through required protocol structures, not prompt-only guidance. | User approved Product Usability Autonomy design, 2026-05-15 |
| REQ-096 | The protocol structures `LifecycleHandoff`, `SkillWrapperContract`, `DecisionLog`, `ProtocolGap`, `UsabilityEvidence`, and `ReferencePatternMap` must be defined in docs and represented in `src/` contracts or validators. | User selected protocol-level implementation and docs/src double source of truth |
| REQ-097 | Docs/runtime drift tests must fail when critical protocol fields declared by the docs are missing from runtime or IDE-consumable structures. | User selected docs + `src/` synchronization |
| REQ-098 | Product Usability Gate must affect `completed`, `done`, and `review_needed` decisions for P0/P1 user stories. | User selected gate/status/IDE runtime depth |
| REQ-099 | ReviewItem and VSCode Execution Workbench must show concrete story, journey, checkpoint, decision, gap, evidence, and resume details. | User selected Execution Workbench golden journey |
| REQ-100 | Mature skill-library practices must be mapped at skill/workflow granularity to local SpecDrive rules, skill wrappers, gates, and evidence. | User selected Skill/Workflow-level ReferencePatternMap |
| REQ-101 | Critical project-local skills must implement `SkillWrapperContract` and produce or preserve decision logs, protocol gaps, usability evidence, and handoff readiness where relevant. | User selected mature skill and protocol convergence |
| REQ-102 | FEAT-024 must prove a hybrid golden journey: spec-document generation closure and Execution Workbench quality evidence display. | User selected mixed golden journey |

## User Stories

- US-024-01: As a SpecDrive user, I need P0/P1 user stories to remain traceable from source intent to runtime evidence so that completed Features are actually usable.
- US-024-02: As an agentic worker, I need local skills to expose clear source, decision, gap, evidence, and handoff requirements so that I cannot silently skip hard delivery obligations.
- US-024-03: As a reviewer, I need ReviewItems to show protocol gaps and usability evidence so that I know exactly why a Feature cannot continue.
- US-024-04: As a VSCode IDE user, I need Execution Workbench to show Product Usability Gate results, decisions, gaps, evidence, and resume guidance without reading raw logs.
- US-024-05: As a protocol maintainer, I need docs and runtime contracts to stay synchronized so that Agentic Spec remains both human-readable and machine-enforceable.

## Acceptance Criteria

- [ ] The six protocol structures are documented and represented in TypeScript contracts or validators.
- [ ] Product Usability Gate rejects completed Feature execution when P0/P1 stories lack usable journey/runtime evidence.
- [ ] Product Usability Gate results create concrete ReviewItems with `product_usability_gap` triggers.
- [ ] Execution Workbench renders Product Usability Gate result, `DecisionLog`, `ProtocolGap`, `UsabilityEvidence`, and resume guidance.
- [ ] Skill wrappers require source refs, lifecycle stage, autonomous decision scope, Open Question policy, anti-rationalization checks, output schema, handoff readiness, and verification evidence.
- [ ] ReferencePatternMap maps selected Superpowers, Agent Skills, and Everything Claude Code workflows to SpecDrive rules at skill/workflow granularity.
- [ ] Drift tests fail when docs-declared critical protocol structures are not represented in runtime or IDE types.
- [ ] Hybrid golden journey tests prove both spec-document generation closure and Execution Workbench evidence display.

## Non-Goals

- Do not vendor external skill libraries.
- Do not implement runtime direct delegation to external skills.
- Do not replace Agentic Spec with any external command taxonomy.
- Do not make Product Console the primary quality UI.
- Do not retrofit every historical Feature Spec.
