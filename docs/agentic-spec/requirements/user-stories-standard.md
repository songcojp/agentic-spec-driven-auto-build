# Agentic Spec User Story Content Generation Standard

Status: review_needed
Scope: generic Agentic Spec requirements content contract

## 1. Purpose

This file defines how Agentic Spec turns PRD intent, PR/RP text, product prose, existing requirements input, and clarifications into detailed user stories and derived behavior requirements.

The main quality problem this standard prevents is shallow story generation: broad user stories such as "As a user, I want to configure the app" or requirements such as "THE SYSTEM SHALL support settings" are not enough for downstream HLD, UI Spec, Feature Spec, tasks, or verification.

This standard does not require one fixed Markdown layout. Projects may organize requirements differently, but generated content must preserve the detail below.

## 2. User Story Depth

Each `US-*` must describe one concrete user goal in one concrete context. A story is ready only when it answers:

| Field | Required Detail |
|---|---|
| Actor | The role, persona, or system actor performing the goal |
| Context | Where the actor is, what state/data exists, and what precondition matters |
| Goal | The single outcome the actor wants, not a whole feature area |
| Reason / Value | Why the outcome matters to the actor or workflow |
| Trigger | What starts the story: user action, event, state, schedule, or external input |
| Main Scenario | The normal path in enough detail to derive behavior requirements |
| Alternate / Negative Scenarios | At least the important invalid, empty, permission, conflict, cancellation, timeout, or recovery path |
| Done Signal | What the actor can observe when the story is complete |
| Source | PRD/source refs or clarification refs |
| Priority | Must, Should, Could, or Won't |

Shallow story examples that must be refined:

- "As a user, I want app settings."
- "As an admin, I want to manage providers."
- "As a creator, I want to publish."
- "As a user, I want better UI."

Acceptable story shape:

```text
US-012
Actor: App Creator
Context: The creator has opened an unpublished app draft with one invalid provider binding.
Goal: Validate the provider binding before publishing.
Reason / Value: Prevent publishing an app that cannot launch.
Trigger: The creator clicks Validate Binding.
Main Scenario: The system runs validation, shows field-level errors, and keeps Publish disabled.
Alternate / Negative Scenarios: Provider is missing, provider credentials are invalid, validation times out.
Done Signal: The creator sees the exact blocking reason and the next corrective action.
Source: PRD §x.y; CQ-004
Priority: Must
```

## 3. Story Splitting Rules

Split a user story when it contains:

- Multiple actors or personas.
- Multiple independent goals.
- Multiple surfaces or channels with different behavior.
- A create/update/delete workflow mixed with review, approval, publish, or recovery.
- Happy path and substantial failure/recovery paths that need separate acceptance.
- UI interaction, API behavior, persistence, permission, and runtime execution that can fail independently.

Keep one story only when the pieces form one user-observable vertical outcome. For example, "save a setting and see the saved value after refresh" can stay together when persistence is part of the user goal.

## 4. User Story Derivation

Each detailed `US-*` should produce behavior rows, not just one coarse requirement. Derive rows for the relevant obligation types:

| Obligation | Typical ID | When To Generate |
|---|---|---|
| Main behavior | `REQ-*` | The normal system response that fulfills the story |
| State or persistence behavior | `REQ-*` or `EDGE-*` | Saved state, reload/revisit, resume, audit, or durable truth matters |
| Permission or role behavior | `EDGE-*` | Access, disabled state, read-only state, or authorization matters |
| Validation and error behavior | `EDGE-*` | Invalid input, missing config, conflict, timeout, or failure matters |
| Non-functional behavior | `NFR-*` | Performance, security, reliability, accessibility, compatibility, or compliance has a measurable threshold |
| Clarification | `CQ-*` | A required actor, trigger, threshold, state, data, UI, runtime, or evidence decision is missing |

Do not collapse these into one "support" requirement when the behavior can fail independently.

## 5. User Story Requirement Patterns

Use structured behavior clauses that are observable and testable:

| Pattern | Use When | Template |
|---|---|---|
| Event-driven | A trigger causes behavior | `WHEN <event/condition>, THE SYSTEM SHALL <observable behavior>.` |
| State-driven | Behavior depends on state | `WHILE <state>, THE SYSTEM SHALL <observable behavior>.` |
| Optional feature | Behavior applies when a capability is enabled | `WHERE <feature/condition>, THE SYSTEM SHALL <observable behavior>.` |
| Unwanted behavior | System must prevent or handle something | `IF <unwanted condition>, THEN THE SYSTEM SHALL <mitigation or feedback>.` |
| Ubiquitous | Always true invariant | `THE SYSTEM SHALL <always-observable behavior or invariant>.` |

Every clause must name a concrete system response. Avoid phrases that hide behavior such as "support", "provide", "handle", "manage", "optimize", "improve", "integrate", "allow", or "ensure" unless the row also states the observable result.

## 6. Requirement Row Content

Each `REQ-*`, `NFR-*`, and `EDGE-*` row must carry enough content to be tested:

| Field | Required Detail |
|---|---|
| ID | Stable requirement id |
| Story | One or more `US-*` ids, or `N/A - system invariant` with reason |
| Source | Source refs and short source summary |
| Condition | Trigger, state, feature condition, or unwanted condition |
| System Response | Observable behavior |
| Acceptance | Pass/fail criterion without hidden interpretation |
| Evidence | Unit, integration, browser/runtime, static analysis, manual review, log, trace, artifact, or persistence evidence |
| Priority | Must, Should, Could, or Won't |
| Status | draft, review_needed, ready, implemented, deprecated, or superseded |

Rows missing Story, Source, Acceptance, or Evidence must remain `review_needed`.

## 7. Atomicity Rules

A requirement is atomic only when:

- It has one trigger, state, feature condition, or invariant.
- It has one observable system response.
- It can be verified by focused evidence.
- It does not hide multiple independent decisions behind "and", "or", slash-separated nouns, or comma lists.

Split a row when:

- A single statement has multiple actors.
- A single statement has multiple independent outcomes.
- Happy path and error path are mixed.
- UI feedback and durable state are both required but can fail independently.
- A non-functional threshold is mixed with functional behavior.

## 8. Evidence Rules

Acceptance must state the observable result and how it is checked. Evidence must name the proof mode.

Insufficient evidence by itself:

- "Tests pass" without test target.
- Screenshot-only proof for interactive behavior.
- API-only proof for user-facing UI behavior.
- Fixture-only or seed-only proof for an end-to-end user journey.
- Visible text or route entry without action, state change, or persistence assertion.

## 9. Ready Gate

Requirements can advance to HLD, UI Spec, Feature Spec, task planning, or execution only when:

- Must-scope user stories are detailed enough to derive behavior rows without guessing.
- Must `REQ-*`, `NFR-*`, and `EDGE-*` rows are atomic, observable, and testable.
- Important edge, boundary, permission, empty, conflict, invalid-input, cancellation, timeout, and negative paths are represented or explicitly out of scope.
- Open `CQ-*` items do not block any Must story or requirement.
- Traceability links source -> story -> requirement -> acceptance -> evidence.

If these conditions are not met, the requirements must remain `review_needed`. Do not advance requirements because they use familiar user-story syntax or contain many rows.
