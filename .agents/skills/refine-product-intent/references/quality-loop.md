# Spec Document Quality Loop

Use this loop when creating or updating PRD, requirements, HLD, UI Spec, Feature Spec, ADR, Feature index, queue plan, or other downstream Spec artifacts.

1. Define the generated artifact, source artifacts, quality bar, allowed repair scope, quality reviewer, repair owner, and explicit visible subagent names.
2. When the platform has a subagent or Task tool, use that tool for each isolated review or repair pass. Put the human-readable name in the dispatch description or first prompt line so the chat transcript shows the actual subagent activation, such as `Quality Review: <artifact>` or `Spec Repair: <artifact>`.
3. Review the artifact against source intent, traceability, behavior coverage, state/data/interface clarity, and downstream readiness.
4. Repair only in-scope gaps. Do not invent product or architecture decisions.
5. Repeat until the review passes, there are no in-scope repairable gaps, a gap repeats, a repair would exceed scope, or ten iterations have been used.
6. Do not treat a planned subagent name, JSON record, or owner-thread self-review as proof that a subagent ran. If no subagent/Task tool is available, record an explicit fallback pass instead of claiming subagent activation.
7. Record every review and repair pass in `result.qualityRepairLoop.subagents[]` with `role`, `displayName`, `skillName` when applicable, `dispatchDescription`, `activationEvidence`, `round`, `status`, and evidence refs. If the platform cannot create a real subagent, record the owner-thread fallback pass with the same display fields and a `fallbackReason`.
8. Return blocked, review_needed, risk_review_needed, or clarification_needed when unresolved gaps remain.
