# SpecDrive Structured Output

When a SpecDrive adapter invokes a skill, return the exact JSON shape supplied by the runtime schema. New invocations use `skillName` as the skill identity field.

Required common fields are: `contractVersion`, `executionId`, `skillName`, `requestedAction`, `status`, `summary`, `nextAction`, `producedArtifacts`, `traceability`, and `result`.

Use `skill-contract/v2` for completed Feature implementation. Feature implementation results must include Delivery Fidelity and Git delivery evidence when the runtime schema requests them.

When `result.qualityRepairLoop` is present, include `subagents[]` entries with visible `displayName`, `dispatchDescription`, and `activationEvidence` values for every quality review, repair, and fallback owner-thread pass.
