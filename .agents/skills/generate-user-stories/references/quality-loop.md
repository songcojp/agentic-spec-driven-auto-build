# Spec Document Quality Loop

Use this loop when creating or updating PRD, requirements, HLD, UI Spec, Feature Spec, ADR, Feature index, queue plan, or other downstream Spec artifacts.

1. Define the generated artifact, source artifacts, quality bar, allowed repair scope, quality reviewer, and repair owner.
2. Review the artifact against source intent, traceability, behavior coverage, state/data/interface clarity, and downstream readiness.
3. Repair only in-scope gaps. Do not invent product or architecture decisions.
4. Repeat until the review passes, there are no in-scope repairable gaps, a gap repeats, a repair would exceed scope, or ten iterations have been used.
5. Return blocked, review_needed, risk_review_needed, or clarification_needed when unresolved gaps remain.
