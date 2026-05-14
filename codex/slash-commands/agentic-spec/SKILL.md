---
name: agentic-spec
description: "Run the Agentic Spec protocol for requirements, architecture, Feature Specs, implementation, verification, review, and delivery."
---

# Agentic Spec Command

Use this skill when the user asks to run the SpecDrive or Agentic Spec workflow for a repository task.

This is a command-style entrypoint for Codex. It packages the Agentic Spec operating rules as a reusable skill so it can be installed into Codex's user skill path and invoked with `$agentic-spec <request>` or selected from `/skills`.

## Workflow

1. Confirm the active workspace, repository root, user request, intended artifact lane, and allowed scope.
2. Inspect `git status --short` before editing and preserve unrelated user changes.
3. Read the nearest `AGENTS.md` first, then read the relevant PRD, requirements, HLD/design, Feature Spec, tasks, and docs index before making code or spec changes.
4. Classify the request:
   - Ordinary question, small edit, simple command, or direct bug fix: use the normal Codex workflow with source-backed checks.
   - New requirement, requirement change, clarification, deprecation, traceability fix, or coverage gap: update the mainline spec lane first and keep changes traceable.
   - Broad delivery work spanning requirements, planning, implementation, verification, review, or release: route through the repo's SpecDrive lifecycle guidance when present.
5. If the repository provides project-local `.agents/skills/*`, use them only when the user explicitly requests the project workflow, explicitly names a skill, or the work cannot be handled safely without the governed workflow.
6. For implementation work, read the approved Feature Spec before coding, keep edits scoped to allowed files, add or update focused tests when behavior changes, and run the smallest meaningful verification first.
7. For docs-only changes, run `git diff --check` and inspect affected links or referenced paths.
8. Do not commit unless the user asks for a commit or delivery action. When committing, stage only the intended files and use a narrow Conventional Commit message.
9. Report the changed artifacts, requirements or Feature Specs affected, verification evidence, skipped checks, and residual risks.

## Spec Artifact Rules

- Treat specs as the source of truth: PRD, requirements, HLD/design, UI specs, Feature Specs, tasks, state files, evidence, and delivery notes must stay aligned.
- Prefer JSON for machine-readable state and Markdown for human-edited spec content.
- Keep HLD as the project-level architecture fact source; put low-level implementation design into Feature Spec `design.md`.
- Do not create scratch requirement protocol files in target projects. Requirement intake and evolution should land in PRD, requirements, HLD, Feature Specs, state, or evidence records.
- For Chinese docs, preserve Chinese structure, numbering, and terminology unless the user asks for a language or tone change.

## Skill-Vs-Code Decision

Use a skill or spec workflow when the capability is prompt-driven: reasoning, planning, review, decomposition, analysis, context collection, or task slicing.

Use code when the capability requires durable state, enforced invariants, retry limits, audit records, machine-readable outputs, or queryable status.

Default to a skill when the CLI already provides the mechanism. Add code only when persistence, structural enforcement, or machine-queryable output is necessary.

## Output

Respond with a concise delivery summary that includes:

- Outcome and changed files or artifacts.
- Traceability to requirements, Feature Specs, tasks, or change IDs when available.
- Verification commands and results.
- Known follow-ups, skipped checks, or residual risks.
