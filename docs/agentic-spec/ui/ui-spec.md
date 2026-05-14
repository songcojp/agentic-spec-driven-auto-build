# Agentic Spec UI System Design Standard

Status: review_needed
Scope: generic Agentic Spec UI specification contract

## 1. Purpose

This file defines the generic UI System Design contract for Agentic Spec managed products. It is not a concept-image index, screenshot folder, page list, or implementation-specific UI plan. It turns PRD, EARS requirements, and HLD constraints into user-operable, testable UI interaction contracts.

Any UI-related Feature must be able to trace from this UI Spec, or a project-supplied equivalent, to:

- Where the user enters the workflow.
- Which user goal or decision the workflow supports.
- Which controls, fields, commands, and states are involved.
- How save, cancel, validation, failure, permission, loading, empty, blocked, and completion feedback behave.
- What fact should survive refresh, revisit, project switch, session restore, or equivalent re-entry.
- Which browser, screenshot, trace, log, DOM, network, persistence, or state evidence proves the UI is usable.

## 2. UI Surface Inventory

Every project must declare its own UI surfaces before Feature-level UI work can be marked ready. Surface names and hosts are product-specific; this standard only defines the minimum metadata.

| Surface ID | Host / Channel | User Goal | Primary / Secondary / Compatibility | Source Requirements | Notes |
|---|---|---|---|---|---|
| <surface-id> | <web app / IDE panel / desktop view / mobile view / CLI TUI / admin console / other> | <goal> | <primary/secondary/compatibility> | <REQ ids> | <boundary notes> |

Rules:

- A project may have one or more primary UI surfaces.
- Compatibility or legacy surfaces may exist, but they must be declared explicitly.
- The UI Spec must not assume a specific host such as a web app, IDE panel, desktop app, terminal UI, or console unless the PRD/HLD states that host.
- If multiple surfaces expose the same workflow, the UI Spec must name the source of truth for behavior, state, and verification.

## 3. UI Spec Minimum Granularity

Each UI workflow must answer the following questions. Missing answers require `review_needed` from the UI/spec granularity review.

| Dimension | Required Question | Gap Type |
|---|---|---|
| Entry | Which command, route, view, button, list item, notification, deep link, or menu starts the workflow? | `interaction_gap` |
| Actor / Permission | Who can operate it, and how are read-only, disabled, hidden, or unauthorized states shown? | `interaction_gap` |
| Controls / Fields | Which fields are read-only, editable, required, optional, derived, destructive, or async-loaded? | `interaction_gap` |
| User Action | Which click, input, selection, drag/drop, confirmation, retry, approval, or cancellation is observable? | `interaction_gap` |
| Validation / Error | How do client validation, server errors, missing data, conflicts, timeout, and failed execution appear? | `state_data_gap` |
| State Feedback | How are empty, loading, dirty, saving, running, blocked, failed, completed, and partial states rendered? | `state_data_gap` |
| Data Binding | Which query, file, database row, event, command, state transition, or local preference drives each field? | `state_data_gap` |
| Save / Cancel | What happens on save success, save failure, cancel, unsaved changes, repeated submit, and retry? | `interaction_gap` |
| Refresh / Revisit | What must persist or be restored after refresh, reopen, navigation away/back, project switch, or session restore? | `state_data_gap` |
| Negative Path | How are missing config, unavailable provider, invalid schema, permission denial, or blocked state handled? | `interaction_gap` |
| Evidence | Which browser steps, screenshots, traces, logs, network events, DOM assertions, or persistence checks prove it? | `evidence_gap` |

Page names, routes, headings, screenshots, concept images, static layouts, happy paths, or text assertions alone do not satisfy UI Spec readiness.

## 4. Interaction Matrix Template

Each workflow must have its own interaction matrix. Feature-level UI designs may reference this template, but they must fill concrete project facts.

| Workflow | Entry | Actor | Controls / Fields | User Action | Validation | Save / Cancel | State Feedback | Persisted / Revisit Assertion | Error Path | Requirement IDs | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| <workflow id> | <command/view/button/route> | <user role> | <field/control list> | <observable action> | <validation rule> | <save/cancel behavior> | <loading/success/failure feedback> | <reload/reopen/session assertion> | <negative path> | <REQ/FEAT ids> | <browser/runtime evidence> |

Rows must represent vertical user-operable behavior. Do not replace them with coarse statements such as "implement page", "show module", "support configuration", or "add settings".

## 5. State Matrix Template

| Surface | Empty | Loading | Ready | Dirty | Saving | Running | Blocked | Failed | Completed | Permission / Read-only |
|---|---|---|---|---|---|---|---|---|---|---|
| <surface id> | <message/action> | <indicator> | <default controls> | <unsaved changes> | <disabled/progress> | <live state> | <reason/action> | <error/retry> | <result/next step> | <fallback> |

Each state must name:

- The fact source that produces the state.
- What the user can and cannot do.
- Whether the state change requires audit, review, command receipt, event record, run record, or local UI state.
- How runtime or browser verification observes the state.

## 6. Data Binding And Persistence Rules

- UI must not directly mutate governed feature, task, run, review, configuration, or evidence state unless the HLD explicitly designates that UI as the write boundary.
- Write operations must use a declared command, mutation, state transition, review action, approval action, or settings action.
- Local UI state may store display preferences such as language, theme, expanded sections, selected rows, filters, or drafts; it must not replace durable product state.
- Every editable or action-driving field must declare read source, write target, schema/type constraints, failure feedback, and refresh/revisit assertion.
- API fixtures, seed data, mocked DOM, read-only view models, screenshots, and visible text are preconditions or supporting evidence; they do not replace user operation plus state-change verification.

## 7. Prototype And Runtime Evidence

UI System Design should produce a local reviewable prototype unless the project supplies another approved design artifact:

- Project-level prototype index: `docs/agentic-spec/ui/prototype/index.html`
- Project-level page prototype: `docs/agentic-spec/ui/prototype/<page-id>.html`
- Feature-level prototype: `<feature-spec>/prototype/index.html` and `<feature-spec>/prototype/<page-id>.html`

Prototype artifacts must be reviewable without a backend and include representative data, key states, error states, focus states, responsive layout, and local static interactions when needed. Prototypes must not call production APIs or mutate real workspace state.

If a project chooses a different artifact format, it must still provide equivalent review evidence for layout, workflow, state, interaction reachability, accessibility, and no incoherent overlap.

This standard remains `review_needed` for a concrete project until that project supplies its surface inventory, workflow interaction matrices, state matrices, data-binding contracts, and prototype or equivalent review artifacts.

## 8. Workflow Inventory Template

| Workflow ID | Surface | User Goal | Current Spec Status | Required Refinement |
|---|---|---|---|---|
| <workflow id> | <surface id> | <goal> | draft / review_needed / ready | <missing matrix/prototype/evidence/state binding> |

Projects should create one row per user-operable workflow. Workflows that only differ by internal implementation but share the same user behavior may share one row; workflows with different controls, states, persistence, or error paths need separate rows.

## 9. UI Ready Gate

Any UI/App Feature must satisfy the following before it can be marked `ready`:

- The Feature Spec references a concrete UI surface and workflow row.
- The UI Spec covers the Feature's user journey, interaction matrix, state matrix, data binding, negative paths, and evidence obligations.
- The design names the relevant UI host or hosts without assuming a product-specific host that is not present in PRD/HLD.
- Required prototype or equivalent design artifact exists and can be reviewed.
- Verification includes real user operation, visible state change, refresh/revisit or equivalent persistence assertion, and at least one negative or blocked path.

If these conditions are not met, the Feature must remain `review_needed`. Do not use "page exists", "route exists", "text is visible", "concept image exists", or "API test passed" as UI ready evidence.
