---
name: using-agent-skills
description: "Route SpecDrive work through a lifecycle-first agent and skill workflow. Use when a request spans product intent, planning, implementation, verification, review, or delivery and needs the right skill/persona sequence instead of a single final quality gate."
---

# Using Agent Skills

Use this meta-skill to choose the workflow, specialist agents, and project
skills for a SpecDrive task. It adapts the proven agent-skills pattern to this
repository without replacing the local 00-14 skills.

## Lifecycle Model

Prefer the lifecycle view over numbered phases:

| Lifecycle | Intent | Local Skill Lane |
| --- | --- | --- |
| Define | Preserve product intent, users, non-goals, success samples, and constraints. | `00.intake.*`, `01.prd.*`, `02.requirements.*`, `10.change.*` |
| Plan | Convert intent into vertical, testable behavior obligations. | `03.hld.*`, `04.ui.*`, `05.feature.*`, `06.planning.*`, `09.review.spec-consistency` |
| Build | Implement the smallest behavior slice without dropping obligations. | `07.execution.prepare-context`, `07.execution.dispatch-adapter` |
| Verify | Prove behavior with commands, browser/API evidence, artifacts, and failure classification. | `08.test.*`, `12.recovery.*` |
| Review | Independently check code, spec drift, test semantics, evidence, and release readiness. | `09.review.*`, `11.approval.*` |
| Ship | Deliver PR, merge/cleanup, release notes, archive, and state projection. | `14.release.*`, `13.audit.*`, `07.execution.update-state` |

The numbered skills remain implementation details. Do not let the numbering
hide missing lifecycle responsibilities.

## Agent Registry

Use these personas as responsibilities, whether implemented by native
subagents, separate CLI runs, or owner-thread passes:

| Agent | Owns | Must Not Own |
| --- | --- | --- |
| Product Interpreter | Source intent, user, boundary, success/failure examples. | Implementation shortcuts. |
| Requirement Critic | Atomic, testable, traceable requirements and acceptance. | Final delivery approval. |
| Interaction Designer | UI/API/state/data behavior that closes journeys. | Cosmetic-only acceptance. |
| Task Slicer | Behavior obligations, vertical slices, fixture boundaries. | Hiding journeys inside generic tasks. |
| Implementation Agent | Scoped code/docs/tests changes. | Self-approval of completion. |
| Test Engineer | Test obligations, command selection, negative cases. | Treating green tests as sufficient when behavior is unproven. |
| Browser QA | Browser or equivalent runtime interaction proof. | API fixtures as the tested behavior. |
| Code Reviewer | Bugs, regressions, architecture, safety, spec drift. | Rewriting scope without change routing. |
| Release Reviewer | Delivery decision, unresolved losses, PR/merge/cleanup readiness. | Rubber-stamping missing evidence. |

## Workflow

1. Classify the request by lifecycle span. If it adds or changes product
   behavior, route through `10.change.classify` before edits.
2. Identify source intent and expected user/system behavior. Record explicit
   non-goals and examples that would count as failure.
3. Convert intent into behavior obligations before implementation. Each
   obligation needs a source ref, owner, evidence plan, and closing condition.
4. Select the smallest local skills that cover Define, Plan, Build, Verify,
   Review, and Ship for the task. Skip a lifecycle only when it is truly not
   relevant and record why.
5. Assign agent responsibilities. If real subagents are unavailable, perform
   separate owner-thread passes using the same role names and record the
   fallback.
6. Maintain a Delivery Fidelity Ledger through handoffs. Any loss must be
   recorded as `intent_loss`, `journey_loss`, `interaction_loss`, `state_loss`,
   `data_loss`, `task_loss`, `implementation_shortcut`, `test_bypass`,
   `review_gap`, or `delivery_gap`.
7. Require independent verification/review before `completed`. Implementation
   evidence, tests, commit, or PR are supporting facts, not the completion
   decision by themselves.

## Red Flags

- A task says "create page", "add button", "wire endpoint", or "add e2e" but
  does not name the behavior that must work afterward.
- Tests check text, navigation, or API-seeded state without proving the user
  action, data mutation, detail/list roundtrip, or negative case.
- A Feature claims completion with only implementation-agent evidence.
- A handoff drops a P1/P2 journey, interaction, state, or data obligation.
- Review is performed only after release packaging instead of during planning,
  implementation, verification, and delivery.

## Output Expectations

When this meta-skill is invoked directly, return a project-local Skill output
contract. For non-feature routing decisions, `skill-contract/v1` is enough. For
completed `feature_execution`, the final implementation skill must use
`skill-contract/v2` and include `result.deliveryFidelity`.
