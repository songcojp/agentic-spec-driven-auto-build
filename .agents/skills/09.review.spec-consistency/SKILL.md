---
name: 09.review.spec-consistency
description: "Check planning outputs against the active Feature Spec. Use at the end of the planning pipeline to verify requirements, architecture plan, data model, contracts, and task slicing are mutually consistent."
---

# Spec Consistency Analysis Skill

Use this skill as the final planning gate before a Feature moves to `tasked`.
It checks both horizontal consistency and document-layer boundaries: project
HLD stays project-level, Feature design carries Feature-level implementation
detail, and tasks carry executable Journey Checkpoints.

## Workflow

1. Read the feature requirements, design, tasks, HLD references, and all planning-stage outputs.
2. Verify every requirement has a design path, task coverage, user journey coverage, delivery checkpoint, and acceptance verification plan.
3. Verify every task maps to an approved requirement, design decision, or explicit follow-up.
4. Verify every P1 user story has a Journey Checkpoint in `tasks.md`, every implementation Feature has a Git Delivery Checkpoint for `result.gitDelivery`, and UI-bearing Features include browser-level or equivalent runtime evidence expectations.
5. Verify Spec Artifact Granularity Gate results when present. If not present,
   perform the minimal granularity check inline: PRD intent, EARS behavior,
   HLD state/data/interface boundary, UI interaction matrix, Feature design
   path, task block, and evidence plan must all be traceable for P1 scope.
6. Verify HLD-vs-Feature boundaries:
   - HLD does not contain Feature task steps, function signatures, component internals, or field-level payloads.
   - Feature design does not redefine project-level architecture, source-of-truth ownership, runtime topology, or security policy.
   - Feature design carries any needed Feature-scoped low-level design instead of relying on a mainline LLD.
7. Check that data model, contracts, quickstart validation, and task slicing do not contradict each other.
8. List stale status, dependency, milestone, or feature-index entries that must be corrected.

## Output

- Consistency decision.
- Requirement-to-task coverage table.
- Journey coverage table.
- Git delivery checkpoint coverage.
- HLD/Feature boundary findings.
- Contradictions or stale assumptions.
- Required fixes before implementation.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state whether planning artifacts are consistent and what must be fixed before implementation.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `decision`: `"consistent"` or `"inconsistent"`.
- `coverage`: requirement-to-task coverage rows.
- `journeyCoverage`: user story to Journey Checkpoint and acceptance coverage rows.
- `gitDeliveryCoverage`: Feature to Git Delivery Checkpoint and expected `result.gitDelivery` evidence rows.
- `boundaryFindings`: HLD-vs-Feature boundary findings and required destination fixes.
- `contradictions`: array of conflicts across requirements, design, data model, contracts, quickstart, or tasks.
- `staleAssumptions`: assumptions that no longer match current artifacts.
- `requiredFixes`: fixes required before implementation.
- `specGranularity`: pass/fail summary or the referenced
  `result.specGranularity` rows from `09.review.spec-granularity`.

## Failure Routing

- Use `review_needed` when consistency fails.
- Use `clarification_needed` for unresolved requirements.
- Use `risk_review_needed` for architecture or cross-feature contradictions.
- Use `review_needed` when consistency appears intact only because artifacts
  are too coarse to expose missing behavior, interaction, state/data, task, or
  evidence obligations.
