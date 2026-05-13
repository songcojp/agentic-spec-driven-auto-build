---
name: 02.requirements.convert-ears
description: "Decompose PRD, PR/RP, product brief, or natural-language product input into atomic EARS requirements. Use when product prose must become testable REQ, NFR, EDGE entries, acceptance criteria, open questions, and traceability."
---

# PR EARS Requirement Decomposition Skill

This is the design-named PRD-to-EARS conversion entry point.

## Workflow

1. Locate the source PRD, product request, PR/RP, or feature brief. If no path is given, prefer root project docs first: `docs/PRD.md`, then `docs/requirements.md` when the PRD has already been decomposed. Only use localized lanes such as `docs/en/PRD.md`, `docs/zh-CN/PRD.md`, or `docs/ja/PRD.md` when the project explicitly declares multilingual documentation (for example `docs/README.md` lists languages/default language) or the invocation provides a localized source path.
2. Preserve the source language unless the user asks for another language.
3. Extract product goals, non-goals, actors, user stories, functional requirements, non-functional requirements, risks, constraints, and unresolved questions. Ensure Project Initialization (项目初始化) is extracted as a distinct baseline requirement.
4. **Extract and prioritize user stories** before converting to EARS statements:
   - Identify each distinct user journey or independently deliverable capability from the PRD.
   - Assign a priority level: `P1` (Core—must ship), `P2` (important—should ship), `P3` (nice to have).
   - Verify each user story is independently testable and delivers standalone value.
   - Preserve success examples, failure examples, non-goals, and module
     sub-capabilities from the PRD so later design does not collapse broad
     modules into shallow tasks.
   - Include a foundational user story or requirement for Project Initialization (项目初始化) (e.g., scaffolding, environment setup, base dependencies) if not explicitly present.
   - Record stories as `US-001`, `US-002`, ... with title, actor, goal, and priority.
5. Convert observable behavior into EARS statements using stable IDs:
   - `REQ-001`, `REQ-002`, ... for functional requirements.
   - `NFR-001`, `NFR-002`, ... for non-functional requirements.
   - `EDGE-001`, `EDGE-002`, ... for boundary, error, recovery, or exceptional paths.
   - Map each `REQ-*` back to the `US-*` it belongs to.
   - Add acceptance checks, boundary/error paths, and evidence type for each
     behavior when the source supports it.
6. Keep each requirement atomic, observable, testable, and free of implementation choices unless the source states a hard constraint.
7. Add traceability back to PRD sections or source bullets when possible.
8. Surface gaps as open questions instead of inventing product intent.
9. Write only the EARS requirements output directly to the requested file using normal file-edit/write tools. If the user does not specify a target, create or update `docs/requirements.md`. Write to a localized `docs/<language>/requirements.md` only when the project explicitly declares multilingual documentation or the invocation explicitly requests that localized lane.
10. Run the mandatory quality loop before reporting success:
   - Invoke `02.requirements.validate-testability` in a fresh review subagent
     against the generated requirements artifact and the source PRD/product
     input. Pass file paths, source section anchors, changed requirement IDs,
     and quality-bar instructions; do not paste the full generated requirements
     document or the subagent's chain of analysis into the owner context.
   - If the review decision is `pass`, keep the generated artifact and include
     the review result summary in this skill's output.
   - If the review decision is `fail` and every gap can be repaired from the
     existing source, update the EARS artifact to fix those gaps, preserve stable
     IDs where possible, update traceability references when IDs change, and run
     a new `02.requirements.validate-testability` review subagent again.
   - Repeat review and repair until the quality review passes or the remaining
     gaps require human clarification, risk review, or new product intent.
   - After each subagent review, merge only the compact structured result:
     decision, gap IDs, repairable/non-repairable classification, repair
     instructions, required routing, and evidence references. Discard verbose
     review notes once their actionable content has been applied.
   - Never advance to HLD, UI Spec, Feature Spec splitting, planning, or
     execution while the latest quality review is failing.
11. Do not split product scope into Feature Specs, create `docs/features/<feature-id>/` packages, update `docs/features/README.md`, or push anything into the Feature Spec Pool. Feature splitting belongs to `05.feature.decompose`.
12. Treat `ARTIFACT: <relative-path>` fallback content as a last-resort only when direct file writes fail; do not use ARTIFACT output as the normal path.

## EARS Patterns

Use the simplest pattern that fits the behavior:

```markdown
WHEN [event or trigger]
THE SYSTEM SHALL [observable expected behavior]

WHILE [state or mode]
THE SYSTEM SHALL [observable expected behavior]

IF [optional feature or configuration is enabled]
THEN THE SYSTEM SHALL [observable expected behavior]

WHERE [context or actor scope applies]
THE SYSTEM SHALL [observable expected behavior]

WHEN [unwanted condition or error occurs]
THE SYSTEM SHALL [safe handling, error message, rollback, retry, or blocked action]
```

## Output

- User story index (`US-*`) with priority (P1/P2/P3) and independent-testability confirmation.
- Atomic EARS requirements mapped to their parent `US-*`.
- Non-functional requirements and edge cases.
- Traceability matrix (requirement → PRD section → user story).
- Open questions for unresolved product intent.
- No Feature Spec package, task graph, or Feature Spec index output.
- Return a `SkillOutputContractV1` JSON object with `contractVersion`, `executionId`, `skillSlug`, `requestedAction`, `status`, `summary`, `producedArtifacts`, and Feature-level `traceability`.

## Output Contract

- Follow `.agents/skills/SKILL_OUTPUT_CONTRACT.md` and return exactly one `SkillOutputContractV1` JSON object.
- `summary` must state how many user stories, requirements, NFRs, edge cases, and open questions were produced, plus the final quality review decision and repair iteration count.
- `result` must follow the specialized contract below.

## Specialized Result Contract

`result` should contain:

- `userStories`: array of `US-*` IDs with priority and independent-testability status.
- `requirements`: array of produced `REQ-*` IDs grouped by parent user story.
- `nonFunctionalRequirements`: array of produced `NFR-*` IDs.
- `edgeCases`: array of produced `EDGE-*` IDs.
- `openQuestions`: array of unresolved product-intent questions.
- `traceabilityMatrix`: compact mapping from requirement ID to source section and user story.
- `qualityReview`: object containing the final `02.requirements.validate-testability`
  subagent decision, repair iteration count, remaining gaps, required routing,
  and compact evidence references.

## Subagent Context Budget

- Run each quality-review pass in a fresh subagent or isolated review context.
- The owner thread passes references, not bulk content: requirements path, PRD
  path, relevant section anchors, changed IDs, and the current quality bar.
- The review subagent reads the referenced files directly and returns only the
  specialized result contract from `02.requirements.validate-testability`.
- The owner thread applies repair instructions in the requirements artifact and
  starts a new review subagent for the next pass.
- Keep only the latest compact review result plus repair iteration count in the
  owner context; do not accumulate full review transcripts across iterations.

## Quality Bar

- Passing `02.requirements.validate-testability` is required before this skill
  may return `completed`.
- Every requirement has exactly one primary behavior.
- Every requirement can become a test case without interpretation.
- Every requirement has a source user story, trigger, expected system response,
  acceptance check, boundary/error path when relevant, and evidence type.
- UI/configuration requirements must identify editable actions, persistence or
  state expectations, and reload/revisit evidence where the behavior is meant
  to survive navigation.
- Defined `US-*`, `REQ-*`, `NFR-*`, and `EDGE-*` IDs are unique and monotonically increasing within their section; update traceability references if an ID changes.
- Error, empty, permission, duplicate, timeout, and recovery paths are covered when relevant.
- Design, data model, framework, database, and algorithm choices stay out of requirements unless explicitly required by the source.
- Ambiguity is captured in `Open Questions` with the smallest useful question.

## Failure Routing

- Use `clarification_needed` for ambiguous goals, conflicting sources, or untestable acceptance.
- Use `review_needed` when the source PRD is too coarse to generate testable
  EARS requirements without inventing behavior.
- Use `risk_review_needed` when the quality loop exposes unresolved gaps that
  affect architecture, data ownership, security, runtime state, or active
  implementation scope.
- Do not return `completed` if the latest quality review failed. Return
  `review_needed`, `clarification_needed`, or `risk_review_needed` with the
  remaining gap IDs and the last attempted repair iteration.
