---
name: 01.prd.generate
description: "Execute the Agentic Spec 01 prd workflow for generate with reusable input references, output contract, and acceptance checks."
---

# PRD Generate

## Purpose

Generate or refresh the project PRD at the product-intent layer. The PRD must
be specific enough for requirements-first decomposition: it should preserve
users, workflows, module sub-capabilities, success/failure examples, non-goals,
risks, priorities, and acceptance direction. It must not stop at module names,
page names, or broad product slogans.

## When to Use

Use this skill when the operator, scheduler, or another skill requests `01.prd.generate` or when the current Agentic Spec phase requires this exact capability. Do not use it as a catch-all replacement for adjacent skills in the same phase.

## Input References

Read only the artifacts needed for the request, preferring references over copied document bodies:

- Project intake, PRD, requirements, HLD, UI spec, Feature Spec, task spec, change request, ADR, run state, checkpoint, evidence, or traceability files named by the invocation.
- Current repository facts and constraints when they materially affect the workflow.
- Applicable policies, guardrails, approvals, and acceptance criteria.

## Workflow

1. Confirm the requested action and identify the relevant Agentic Spec phase,
   object, and state.
2. Read intake notes, product brief, existing PRD, requirements, HLD, UI Spec,
   Feature index, review findings, and repository facts needed for traceability.
3. For every major capability, identify actors, user goals, workflow steps,
   sub-capabilities, success examples, failure examples, non-goals, priority,
   and evidence direction.
4. For UI/configuration-heavy modules, list the configuration groups and user
   actions that downstream UI Spec and Feature Spec must cover. For example,
   an App Studio-like module must identify basics, template, page structure,
   team, Skill, Tool/MCP, Provider, Artifact, task flow, approval, budget, and
   publish groups when source intent supports them.
5. Produce the PRD without task-level implementation details, function
   signatures, or file edits.
6. Record assumptions, blockers, and follow-up actions. Return
   `clarification_needed` or `review_needed` instead of inventing missing
   product intent.

## PRD Granularity Gate

The PRD fails this skill's quality bar when it:

- names a module, page, role, or workflow without the user action and target
  outcome;
- omits success and failure examples for P1 journeys;
- leaves non-goals, priority, or phase boundary implicit;
- describes a UI/configuration surface without the configuration groups or
  actions downstream specs must close;
- cannot feed `02.requirements.convert-ears` without interpretation.

## Output Contract

Return the project-local `SkillOutputContractV1` when invoked by an adapter. Echo `executionId`, `skillSlug`, `requestedAction`, and Feature-level traceability from the invocation. Include produced artifacts, next action, and a concise result object specific to this workflow step.

## Acceptance Checks

- The output is traceable to the referenced Agentic Spec artifacts.
- The result stays within the `01` `prd` boundary.
- Missing inputs, unresolved ambiguity, or blocked state is reported explicitly.
- Every P1 module has user scenarios, sub-capabilities, success/failure
  examples, non-goals, priority, and downstream evidence direction.
- No product-specific UI, database, scheduler, or adapter behavior is hardcoded into the skill.
