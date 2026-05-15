# Skill Refact Pattern-First Design

Date: 2026-05-15
Status: Approved design for planning
Source proposal: `docs/agentic-spec/zh-CN/skill-refact.md`

## Purpose

This design turns `skill-refact.md` into a mainline proposal for improving SpecDrive skill output quality without changing the current runtime contract.

The proposal is pattern-first: mature system skills such as `superpowers:brainstorming`, `superpowers:writing-plans`, external agent-skill practices, and Claude Code workflow examples are used as reference patterns. They are not current runtime dependencies and should not be described as directly invoked by SpecDrive until a later adapter design proves that boundary.

## Decisions

1. Keep `docs/agentic-spec/zh-CN/skill-refact.md` as the readable design proposal.
2. Add only short canonical references later in `docs/agentic-spec/zh-CN/skills.md`, `docs/agentic-spec/zh-CN/agentic-spec-standard.md`, and FEAT-023 docs.
3. Start with the upstream product and requirements lane:
   - `refine-product-intent`
   - `generate-user-stories`
   - `validate-requirements`
4. Preserve the current 17 project-local skill inventory and the `ExecutionAdapterInvocationV1.skillInstruction.skillName` contract.
5. Align with FEAT-023 instead of duplicating it. FEAT-023 remains the source of truth for Delivery Fidelity, Spec Artifact Granularity Gate, and the quality repair loop.
6. Defer direct runtime delegation to system-level skills until a later adapter boundary covers availability, version drift, output normalization, security, failure handling, and evidence capture.

## Architecture

### Reference Pattern Layer

Mature skills and external workflows are used as examples of strong behavior:

- clarify implicit assumptions;
- compress low-risk interaction into documented defaults;
- separate Open Questions from Blocking Open Questions;
- require user journeys, acceptance criteria, and testability before downstream execution;
- prevent vague documents from being treated as implementation-ready.

### Project Skill Contract Layer

The executable contract remains the local `.agents/skills/*` set.

For the first slice:

- `refine-product-intent` strengthens PRD and product-intent shaping.
- `generate-user-stories` strengthens user stories, user journeys, acceptance criteria, edge cases, and traceability.
- `validate-requirements` becomes the upstream quality gate for vague, untestable, or weakly traced requirements.

### Future Runtime Delegation Boundary

Direct invocation of installed system skills is out of scope for this design. A later design may introduce runtime delegation only after it defines:

- skill availability and version checks;
- allowed skill identities and security boundaries;
- input and output normalization;
- fallback and failure behavior;
- evidence capture for delegated execution;
- compatibility with `SkillOutputContractV1/V2`.

## Artifact Flow

The first integration target is:

```text
PRD / user input / Spec Sources
  -> refine-product-intent
  -> generate-user-stories
  -> validate-requirements
  -> decompose-feature-specs
```

This design changes only the expectations for the first three steps. It does not change UI, VSCode Webview behavior, Product Console behavior, scheduler behavior, Feature Spec directory structure, or adapter routing.

## Open Question Handling

Project-local skills should classify uncertainty by risk:

- Low risk: choose a default assumption, write it into the current artifact, and continue.
- Medium risk: write the issue into `Open Questions`, include a safe default assumption, and allow the flow to continue with review visibility.
- High risk: write the issue into `Blocking Open Questions` and return `blocked` or `review_needed`.

High-risk questions include product positioning changes, business rule changes, security or permission changes, data deletion behavior, Feature scope expansion, missing user journey mapping, or missing acceptance criteria that cannot be inferred.

## Output Requirements

`refine-product-intent` should produce or preserve:

- goals and non-goals;
- user journeys;
- acceptance boundaries;
- default assumptions;
- Open Questions;
- Blocking Open Questions.

`generate-user-stories` should produce or preserve:

- testable user stories;
- acceptance criteria;
- edge cases;
- traceability to PRD/source intent;
- default assumptions;
- Open Questions and Blocking Open Questions.

`validate-requirements` should block or request review when requirements lack:

- user value;
- acceptance criteria;
- test path;
- traceability;
- stable IDs;
- critical clarification decisions.

## Error Handling

The skills should not silently pass weak artifacts downstream.

If a gap can be safely resolved from existing PRD, requirements, HLD, Feature Specs, or repository rules, the skill records the default assumption and continues.

If a gap has multiple reasonable answers but does not invalidate the current artifact, the skill records an Open Question and continues with a stated default.

If continuing would produce a misleading Feature Spec or wrong implementation, the skill records a Blocking Open Question and returns `blocked` or `review_needed`.

## Testing And Acceptance

The implementation plan should include:

- `npm run skills:validate` for skill structure.
- `git diff --check` for documentation hygiene.
- A static scan that the refined proposal does not introduce old dotted skill slugs, a project-level skillpack registry, or claims of current runtime delegation.
- Static review of `refine-product-intent`, `generate-user-stories`, and `validate-requirements` to ensure they require assumptions, Open Questions, Blocking Open Questions, user journeys, acceptance criteria, traceability, and downstream block conditions.
- At least one golden sample comparing old output against the pattern-enhanced output, proving better testability, traceability, and Feature Spec readiness.

Acceptance criteria:

- `skill-refact.md` reads as a clear mainline design proposal.
- Canonical docs contain only short references, not duplicated long-form design.
- The repo does not imply that external system skills are directly invoked today.
- The first three upstream skills can be updated and verified without changing runtime routing.
- High-risk uncertainty cannot flow silently into Feature decomposition.

## Out Of Scope

This design does not implement:

- runtime delegation to system skills;
- UI changes;
- VSCode Webview changes;
- Product Console changes;
- scheduler changes;
- Feature Spec directory changes;
- new skillpack registry, lock file, import command, or vendored external skill package.

## Next Step

After user review, invoke the implementation planning workflow to turn this design into a scoped plan for refining `skill-refact.md`, adding short canonical references, and updating the first three project-local skills.
