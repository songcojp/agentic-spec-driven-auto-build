# Feature Spec Output Template

Use this template as a contract, not as an example. Generated Feature Specs must keep the file names and task block structure exactly parseable.

## Directory Contract

Create or update one directory per Feature:

```text
docs/features/feat-<nnn>-<kebab-title>/
  requirements.md
  design.md
  tasks.md
  spec-state.json
```

Also update:

```text
docs/features/README.md
docs/features/feature-pool-queue.json
```

Rules:

- The folder name must start with lowercase `feat-<nnn>-`.
- Do not generate alternate file names such as `requirement.md`, `task.md`, `taskes.md`, `plan.md`, `implementation.md`, `feature.md`, or nested task files.
- `requirements.md`, `design.md`, and `tasks.md` are mandatory before a Feature can be marked `ready`.
- `tasks.md` must contain at least one parser-compatible task heading matching `### TASK-<nnn>: <title>` or `### T-<feature-nnn>-<task-nn>: <title>`.

## requirements.md

```markdown
# Feature Spec: FEAT-<NNN> <Title>

## Metadata

- Feature ID: FEAT-<NNN>
- Folder: docs/features/feat-<nnn>-<kebab-title>
- Status: draft | review_needed | ready
- Priority: Must | Should | Could
- Source Requirements:
  - REQ-<NNN>
- Dependencies:
  - FEAT-<NNN> | none

## Goal

<One vertical, testable user/business outcome.>

## Scope

### In Scope

- <Concrete behavior included in this Feature.>

### Out of Scope

- <Concrete behavior deferred elsewhere.>

## Requirements

| ID | Source | Statement | Acceptance | Evidence |
|---|---|---|---|---|
| FEAT-<NNN>-REQ-001 | REQ-<NNN> | When <condition>, the system shall <observable behavior>. | <Pass/fail criterion> | <test/evidence artifact> |

## Traceability

| Source Requirement | Feature Requirement | Design Section | Task | Verification |
|---|---|---|---|---|
| REQ-<NNN> | FEAT-<NNN>-REQ-001 | design.md#<section-anchor> | TASK-001 | <command or evidence> |
```

## design.md

```markdown
# Design: FEAT-<NNN> <Title>

## Metadata

- Feature ID: FEAT-<NNN>
- Status: draft | review_needed | ready
- Related Requirements:
  - FEAT-<NNN>-REQ-001

## Design Summary

<Implementation approach scoped to this Feature.>

## Data and State

- Fact source: <file/db/table/api>
- State transitions: <from -> to>

## Interfaces

- Input: <contract/path/command>
- Output: <contract/path/artifact>

## Implementation Plan

- <Concrete module/path change.>

## Risks and Controls

- Risk: <risk>
- Control: <control>

## Verification Design

- <Test/evidence strategy mapped to requirements.>
```

## tasks.md

```markdown
# Tasks: FEAT-<NNN> <Title>

## Metadata

- Feature ID: FEAT-<NNN>
- Status: draft | ready | in-progress | done
- Priority: Must | Should | Could
- Depends On:
  - FEAT-<NNN> | none
- Adapter: codex-cli | cli | rpc | mcp | sandbox | manual
- Approval Required: true | false

## Tasks

### TASK-001: <Imperative task title>
Status: todo
Description: <One concrete implementation or spec task.>
Requirements:
- FEAT-<NNN>-REQ-001
Spec Refs:
- docs/features/feat-<nnn>-<kebab-title>/requirements.md#<anchor>
- docs/features/feat-<nnn>-<kebab-title>/design.md#<anchor>
Allowed Paths:
- <path/glob>
Forbidden Paths:
- <path/glob> | none
Verification: <command or evidence>
Acceptance:
- [ ] <Observable completion criterion>

### TASK-002: <Imperative task title>
Status: todo
Description: <One concrete implementation or verification task.>
Requirements:
- FEAT-<NNN>-REQ-001
Spec Refs:
- docs/features/feat-<nnn>-<kebab-title>/requirements.md#<anchor>
- docs/features/feat-<nnn>-<kebab-title>/design.md#<anchor>
Allowed Paths:
- <path/glob>
Forbidden Paths:
- <path/glob> | none
Verification: <command or evidence>
Acceptance:
- [ ] <Observable completion criterion>

## Journey Checkpoints

- [ ] Primary user journey has a requirement row, design path, task block, and evidence plan.
- [ ] Failure or edge path has a requirement row, design path, task block, and evidence plan.
- [ ] Every `TASK-*` has Requirements, Spec Refs, Allowed Paths, Verification, and Acceptance fields.
```

## spec-state.json

```json
{
  "featureId": "FEAT-<NNN>",
  "status": "ready",
  "executionStatus": null,
  "blockedReasons": [],
  "nextAction": "Schedule feature execution.",
  "updatedAt": "<ISO-8601>",
  "history": [
    {
      "at": "<ISO-8601>",
      "status": "ready",
      "summary": "Feature Spec created from fixed template.",
      "source": "decompose-feature-specs"
    }
  ]
}
```
