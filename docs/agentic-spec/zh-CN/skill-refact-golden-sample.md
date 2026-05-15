# Skill Pattern-First Golden Sample

## 1. Purpose

This sample validates the upstream Pattern-First Skill quality refactor. It proves that weak product input is turned into explicit assumptions, Open Questions, Blocking Open Questions, testable user stories, and validation gates before Feature Spec decomposition.

## 2. Weak Input

```text
Add provider settings so users can configure AI providers and publish apps.
```

## 3. Expected refine-product-intent Behavior

### 自动决策与默认假设

| ID | 默认假设 | 来源 | 风险 |
|---|---|---|---|
| AD-001 | Provider settings belong to existing SpecDrive system settings surfaces, not a new product surface. | Current IDE/System Settings direction | Low |
| AD-002 | Publishing means preparing a configured runtime target, not deploying to a paid SaaS environment. | MVP local-first product boundary | Medium |

### Open Questions

| ID | Question | Safe default | Blocking | Human decision needed |
|---|---|---|---|---|
| OQ-001 | Which providers are in first-slice scope? | Use currently configured adapter presets only. | No | Before UI copy or provider-specific validation text is finalized. |

### Blocking Open Questions

| ID | Question | Blocking reason | Required decision |
|---|---|---|---|
| BOQ-001 | Does publish create external network resources or mutate a remote account? | Security, permissions, and irreversible side effects cannot be inferred. | Choose local artifact only, remote deployment, or split remote deployment into a later Feature. |

## 4. Expected generate-user-stories Behavior

| Story ID | Story | Acceptance | Evidence |
|---|---|---|---|
| US-001 | As an operator, I can select an existing adapter preset so execution uses a known adapter configuration. | Given available presets, when I select one and save, the setting persists and can be read by the execution path. | Settings persistence assertion and adapter config read evidence. |
| US-002 | As an operator, I can validate a provider setting before using it for execution. | Invalid configuration returns a visible validation failure and does not become active. | Negative-path validation evidence. |

`BOQ-001` prevents generating publish execution requirements until the side-effect boundary is decided.

## 5. Expected validate-requirements Behavior

Validation must return `review_needed` or `blocked` while `BOQ-001` is open. It may allow adapter preset configuration requirements to proceed only if they have stable IDs, source refs, user-story mapping, acceptance criteria, and evidence paths.

## 6. Runtime Boundary Check

This sample does not invoke `superpowers`, `agent-skills`, or external skillpacks. It validates that their patterns are absorbed into project-local Skill output expectations.
