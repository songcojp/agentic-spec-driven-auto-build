# SpecDrive AutoBuild

**An agentic spec-driven auto-build system for long-running, recoverable, and auditable AI software development.**

SpecDrive AutoBuild turns AI coding from an ad-hoc chat session into a governed engineering workflow. It uses specs as the source of truth, skills as reusable engineering procedures, execution adapters as controlled coding interfaces, and durable state as the basis for recovery, review, and delivery.

Languages: English | [中文](README.zh-CN.md) | [日本語](README.ja.md)

---

## Why this project exists

AI coding agents are powerful, but long-running software delivery still fails when the process depends on transient conversation context, implicit assumptions, or the agent's own completion claims.

SpecDrive AutoBuild is built around a stricter premise:

> AI should not just write code. It should deliver code through a controlled, recoverable, and auditable engineering system.

The system is designed to solve recurring problems in autonomous software development:

- **Context bloat**: large projects exceed one agent session's effective memory.
- **Prompt drift**: requirements silently change when they are not anchored to specs.
- **Unrecoverable runs**: interrupted coding sessions cannot safely resume without checkpoints.
- **Weak traceability**: code changes are hard to map back to requirements and acceptance criteria.
- **Untrusted completion**: an agent saying "done" is not enough evidence for delivery.
- **Unsafe parallelism**: multiple agents can conflict when workspace, file, and feature ownership are unclear.

SpecDrive addresses these problems by combining a formal spec protocol, project-local skills, execution records, evidence packs, status checks, recovery rules, and review gates.

---

## Core idea

```text
Spec Protocol
+ CLI Skill Directory
+ Feature Spec Pool
+ Project Memory
+ Execution Adapter Layer
+ Internal State Machine
+ Status Checker
+ Evidence Pack
+ Review / Recovery / Delivery Workflow
+ Product Console / IDE Surfaces
```

In this repository, **Agentic Spec** means:

```text
Agentic Spec = Mainline Spec + Feature Spec + Execution Spec + State Ledger
```

Expanded into engineering facts:

```text
PRD              defines product facts
EARS             defines acceptance facts
HLD              defines architecture facts
UI Spec          defines experience facts
Feature Spec     defines development facts
Execution Spec   defines runtime facts
State Ledger     defines recovery facts
Evidence         defines completion facts
```

---

## What SpecDrive AutoBuild does

SpecDrive AutoBuild is a control plane for autonomous software delivery. It can:

1. Convert natural language or product documents into structured specs.
2. Decompose mainline specs into independently deliverable Feature Specs.
3. Generate requirements, design, tasks, acceptance criteria, and risk constraints for each feature.
4. Select the next executable feature from the Feature Spec Pool.
5. Dispatch work to coding CLIs or RPC providers through an Execution Adapter Layer.
6. Keep execution state, checkpoints, logs, results, and evidence outside transient agent context.
7. Judge task outcomes through Status Checker logic instead of trusting agent self-reporting.
8. Route failed, blocked, risky, or ambiguous work into recovery or human review.
9. Produce auditable delivery records, PR-ready summaries, and spec evolution notes.
10. Present project state through a Product Console and IDE-oriented workbench surfaces.

This is not a replacement for Git, CI, or issue trackers. It is a spec-first orchestration layer that makes AI-driven implementation safer and more inspectable.

---

## Product Screenshots

| Spec Workspace | Feature Spec |
| --- | --- |
| ![Spec Workspace](docs/screens/spec-workspace.png) | ![Feature Spec](docs/screens/feature-spec.png) |

| Execution Workbench | System Settings |
| --- | --- |
| ![Execution Workbench](docs/screens/execution-workbench.png) | ![System Settings](docs/screens/Setting.png) |

| Feature Spec Web View |
| --- |
| ![Feature Spec Web View](docs/screens/feature-spec-web.png) |

---

## Architecture

```text
User / PM / Developer
        |
        v
Product Console / IDE Workbench
        |
        v
Control Plane API
        |
        v
Spec Protocol Engine
        |
        v
Feature Spec Pool + Feature Selector
        |
        v
Scheduler + Internal State Machine
        |
        v
Execution Adapter Layer
   +----+----------------------+------------------+
   |                           |                  |
   v                           v                  v
CLI Adapter                RPC Adapter        Future Adapters
Codex CLI / Gemini CLI     Codex RPC          Provider-specific runtimes
   |                           |
   v                           v
Git Workspace / Worktree / Branch
        |
        v
Execution Record + Checkpoint + Logs + Evidence
        |
        v
Status Checker + State Aggregator
        |
        +--> Done        -> delivery / next feature
        +--> Failed      -> recovery workflow
        +--> Blocked     -> unblock workflow
        +--> Review      -> human approval / spec update
        +--> Interrupted -> checkpoint-based resume
        |
        v
State Ledger + Project Memory Projection
```

### Design principle

The coding agent may implement, test, and propose a state transition, but it does not own final truth.

```text
Agent output is a proposal.
Evidence is the input.
Status Checker decides.
State Ledger records.
Spec remains the source of truth.
```

---

## Core concepts

| Concept | Purpose |
| --- | --- |
| **Mainline Spec** | Product-level source of truth: PRD, EARS requirements, HLD, UI Spec, prototype notes, and change rules. |
| **Feature Spec** | Development-level source of truth for one independently deliverable capability. Usually includes `requirements.md`, `design.md`, `tasks.md`, and `spec-state.json`. |
| **Execution Spec** | Runtime-level source of truth for a concrete run: invocation, checkpoint, result, evidence, logs, and recovery plan. |
| **State Ledger** | Append-only state history used for audit, recovery, replay, and dashboard reconstruction. |
| **Project Memory** | A compact recovery projection injected into CLI sessions. It is not the source of truth; it is a resumable summary. |
| **Skill** | A reusable project-local engineering workflow stored under `.agents/skills/<skill-name>/SKILL.md`. |
| **Execution Adapter** | A provider-neutral execution layer for coding tools. The current direction separates CLI execution from RPC execution. |
| **Evidence Pack** | Structured proof of what happened: files changed, commands run, tests executed, risks found, outputs produced, and state transitions proposed. |
| **Status Checker** | The decision layer that evaluates evidence against specs, constraints, and verification results. |
| **Review Center** | The human gate for high-risk changes, failed retries, unsafe operations, ambiguity, or spec drift. |

---

## Agentic Spec workflow

### 1. Mainline spec creation

Inputs can be natural language, an existing PRD, a product brief, a pull request, an issue, or an existing codebase. The system first turns them into mainline documents:

```text
docs/<language>/PRD.md
docs/<language>/requirements.md
docs/<language>/hld.md
docs/<language>/ui-spec.md
docs/<language>/prototype-spec.md
```

Mainline specs define product scope, acceptance behavior, architecture boundaries, user-facing flows, and change rules.

### 2. Feature Spec slicing

The system slices mainline specs into feature-level delivery units:

```text
docs/features/<feature-id>/requirements.md
docs/features/<feature-id>/design.md
docs/features/<feature-id>/tasks.md
docs/features/<feature-id>/spec-state.json
```

A good Feature Spec is not "frontend work" or "backend work". It is a vertical capability that can be implemented, verified, reviewed, and delivered independently.

### 3. Scheduling and execution

The scheduler selects ready work from the Feature Spec Pool, creates an execution record, prepares the workspace, and dispatches the task through an execution adapter.

A run must record:

```text
invocation
checkpoint
logs
result
evidence
recovery plan when needed
state transition proposal
```

### 4. Status checking

The system validates whether the run actually satisfies the spec:

- Are EARS requirements covered?
- Are design boundaries respected?
- Were only allowed files modified?
- Were required commands executed?
- Are test results acceptable?
- Is there unresolved risk, ambiguity, or spec drift?
- Does the result need approval before continuing?

### 5. Recovery, review, and delivery

Runs may complete, fail, pause, become blocked, require approval, or need recovery. The state machine records every transition and routes the work accordingly.

Delivery is considered complete only when evidence, status, review, and spec traceability agree.

---

## Repository structure

```text
.
├── .agents/                  # Project-local agent templates and skills
├── apps/
│   ├── product-console/       # React/Vite Product Console
│   └── vscode-extension/      # VSCode extension and IDE workbench surfaces
├── docs/
│   ├── en/                    # English product/spec documents
│   ├── zh-CN/                 # Chinese product/spec documents and protocol docs
│   ├── ja/                    # Japanese documents
│   └── features/              # Feature Spec pool, state, dependencies, and delivery notes
├── scripts/                   # Development, packaging, and adapter helper scripts
├── src/                       # Control plane, scheduler, adapters, state, API, persistence
├── tests/                     # Node test suites and integration-oriented checks
├── package.json
└── README.md
```

Key documents:

- [Product Requirements Document](docs/en/PRD.md)
- [Documentation Index](docs/README.md)
- [Feature Spec Index](docs/features/README.md)
- [Agentic Spec Protocol](docs/zh-CN/agentic-spec-protocol.md)
- [Project Skill Guide](docs/zh-CN/skills.md)

---

## Current implementation status

SpecDrive AutoBuild is under active implementation. The repository already contains the control-plane runtime, scheduler, persistence/audit foundations, execution adapter work, Product Console work, VSCode IDE surfaces, feature specs, and test coverage for core workflows.

For the most precise status, use the Feature Spec index:

```text
docs/features/README.md
```

That file is the working delivery map for MVP features, dependencies, follow-up changes, terminology migrations, and implementation notes.

---

## Getting started

### Prerequisites

- Node.js **24 or newer**
- npm
- Git
- Optional: Docker, when using Redis/BullMQ worker-only mode
- Optional: Codex CLI, when running real `codex exec` adapter flows
- Optional: Gemini CLI, when enabling the Gemini CLI adapter preset

### Install dependencies

```bash
npm install
```

### Run bootstrap checks

```bash
npm run bootstrap
```

### Start the local development environment

```bash
npm run dev
```

The development script starts:

```text
Backend API:      http://localhost:4317
Product Console: http://localhost:5173
Health check:    http://localhost:4317/health
```

The default development mode uses an embedded local worker. For Redis/BullMQ worker-only mode:

```bash
AUTOBUILD_WORKER_MODE=worker-only npm run dev
```

### Run tests

```bash
npm test
```

Console browser tests:

```bash
npm run console:test
```

Build the Product Console:

```bash
npm run console:build
```

Build the VSCode extension:

```bash
npm run ide:build
```

Package the VSCode extension:

```bash
npm run ide:package
```

---

## Configuration

SpecDrive reads configuration from three layers, with later layers overriding earlier ones:

```text
.autobuild.config.json
environment variables
CLI arguments
```

Common settings:

| Setting | Environment variable | Default |
| --- | --- | --- |
| Backend port | `AUTOBUILD_PORT` | `43117` in direct backend mode; `4317` via `npm run dev` |
| Artifact root | `AUTOBUILD_ARTIFACT_ROOT` | `.autobuild` |
| Database path | `AUTOBUILD_DB_PATH` | `.autobuild/autobuild.db` |
| Log level | `AUTOBUILD_LOG_LEVEL` | `info` |
| Runner command | `AUTOBUILD_RUNNER_COMMAND` | `codex` |
| Runner arguments | `AUTOBUILD_RUNNER_ARGS` | `exec` |
| Runner sandbox mode | `AUTOBUILD_RUNNER_SANDBOX_MODE` | `danger-full-access` |
| Redis URL | `AUTOBUILD_REDIS_URL` | `redis://127.0.0.1:6379` |
| Worker mode | `AUTOBUILD_WORKER_MODE` | `embedded` |

Supported worker modes:

| Mode | Behavior |
| --- | --- |
| `embedded` | Backend process also runs local scheduling work. Best for development. |
| `worker-only` | Starts a dedicated worker process and uses Redis/BullMQ queues. |
| `off` | Disables worker execution while keeping the API surface available. |

Example config file:

```json
{
  "port": 43117,
  "artifactRoot": ".autobuild",
  "dbPath": ".autobuild/autobuild.db",
  "logLevel": "info",
  "runnerConfig": {
    "command": "codex",
    "args": ["exec"],
    "sandboxMode": "danger-full-access"
  },
  "schedulerConfig": {
    "redisUrl": "redis://127.0.0.1:6379",
    "workerMode": "embedded"
  }
}
```

---

## Development principles

SpecDrive follows several strict rules for agentic development:

1. **Specs before implementation**: do not start coding from an unstructured request when the change affects product, acceptance, architecture, or UI behavior.
2. **Feature Specs are executable boundaries**: each feature must have requirements, design, tasks, and machine-readable state.
3. **Execution must be durable**: every non-trivial run needs invocation, checkpoint, result, evidence, and state events.
4. **Agent self-reporting is not trusted**: completion must be decided by status checks and evidence.
5. **Project Memory is a projection, not truth**: it helps future sessions resume, but authoritative facts live in specs, execution records, and state ledgers.
6. **Parallel work must be isolated**: use worktrees, locks, allowed-file constraints, and feature boundaries before allowing concurrent writes.
7. **Spec drift must become spec evolution**: when implementation reveals a constraint or change, update the relevant spec instead of hiding the change in code.
8. **Skills encode repeatable reasoning; code enforces durable state**: planning, decomposition, review, and recovery can live in skills; persistence, validation, state transitions, and auditability belong in code.

---

## Suggested reading order

For product and architecture understanding:

1. [docs/en/PRD.md](docs/en/PRD.md)
2. [docs/zh-CN/agentic-spec-protocol.md](docs/zh-CN/agentic-spec-protocol.md)
3. [docs/features/README.md](docs/features/README.md)
4. [docs/zh-CN/skills.md](docs/zh-CN/skills.md)

For implementation work:

1. Read the relevant Feature Spec under `docs/features/`.
2. Check `spec-state.json` before modifying files.
3. Follow the task's allowed-files and verification rules.
4. Run the targeted tests first, then broader regression tests.
5. Record evidence and update specs when behavior changes.

---

## License

MIT License. See [LICENSE](LICENSE).
