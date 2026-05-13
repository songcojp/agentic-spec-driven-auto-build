---
name: 07.execution.update-state
description: "Execute a single deterministic lifecycle side effect when a SpecDrive state transition occurs (feature selected, planning completed, task scheduled, status changed, review routed, recovery started, PR created, delivery closed). Use when a transition needs exactly one auditable side effect—snapshot, status attachment, index update, or audit note—but no planning, coding, testing, or review work."
---

## Codex Skill Usage

Use this project-local skill only when the user, scheduler, or another skill explicitly names `07.execution.update-state` or the current SpecDrive workflow step requires it. Keep context lean: read referenced files from disk, pass paths/IDs/section anchors instead of pasted documents, and return the project-local Skill output contract rather than free-form prose. Provider YAML files under `agents/` are UI/provider prompt metadata only; subagent roles and fallback rules belong in `SKILL.md`.

# Workflow Hook Skill

Use this skill to make a single lifecycle side effect explicit and auditable. Each invocation handles **one trigger event** and **one side effect**. Do not combine multiple unrelated hooks into a single call.

## Supported Trigger Events

| Trigger Event | Expected Side Effect |
|---|---|
| Feature selected for scheduling | Project Memory snapshot |
| Planning completed | Feature index status update to `planned` |
| Task scheduled | Audit timeline entry |
| Status changed (task/feature) | Status summary attachment to state record |
| Review routed | Review Center item creation |
| Recovery started | Audit timeline entry + failure fingerprint record |
| PR created | Delivery report note |
| Delivery closed | Final Project Memory snapshot + feature index update to `done` |

## Workflow

1. Identify the triggering event from the table above.
2. Determine the required side effect (only one per invocation).
3. Execute only the hook side effect; do not perform unrelated planning, coding, testing, or review work.
4. Ensure the hook is idempotent when repeated with the same trigger and same state.
5. Record the hook result and any failure summary.

## Output

- Trigger event name.
- Side effect executed and artifact or state updated.
- Idempotency key or duplicate-handling note.
- Failure route if the hook did not complete.

## Subagent Delegation

- **Use when**: Use Explorer, Worker, Review, and Verification subagents only after the owner thread has assigned disjoint responsibilities and file scopes.
- **Inputs**: pass file paths, source refs, IDs, section anchors, quality bars, and allowed scopes; do not paste full artifacts or long analysis into subagent prompts.
- **Write scope**: Worker subagents may edit only their declared owned files; Explorer/Review/Verification subagents are read-only unless a scoped fix is explicitly assigned.
- **Output**: merge only compact structured findings, changed paths, evidence refs, blockers, and fallback status into the owner thread.
- **Fallback**: if real Codex subagents are unavailable, run the same role as an isolated owner-thread pass and record the fallback in `result.subagentFallback`, `result.qualityRepairLoop.subagentFallback`, or the nearest skill-specific result field.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state the trigger, side effect, updated artifact/state, and idempotency outcome.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `triggerEvent`: lifecycle event handled.
- `sideEffect`: side effect executed or skipped.
- `updatedTarget`: artifact, state record, audit note, or status attachment updated.
- `idempotencyKey`: idempotency key or duplicate-handling note.
- `failureRoute`: blocked/review route when the hook did not complete.

## Failure Routing

- Use `blocked` for missing storage, permissions, or unavailable dependency.
- Use `review_needed` when the hook would change state without enough supporting context.
