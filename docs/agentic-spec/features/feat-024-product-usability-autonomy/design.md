# FEAT-024 Product Usability Autonomy — Design

Feature ID: FEAT-024
Source Requirements: REQ-095 to REQ-102
Design Source: `docs/superpowers/specs/2026-05-15-product-usability-autonomy-design.md`

## 1. Architecture Decisions

- Treat mature skill libraries as reference patterns and Agentic Spec as the durable protocol layer.
- Define protocol convergence structures in docs and `src/`.
- Keep external libraries out of runtime dependencies.
- Use Product Usability Gate as an additional completion gate on top of Delivery Fidelity.
- Make VSCode Execution Workbench the primary product evidence display.

## 2. Protocol Structures

| Structure | Runtime Responsibility |
|---|---|
| `LifecycleHandoff` | Preserve lifecycle stage inputs, outputs, owner, losses, and evidence. |
| `SkillWrapperContract` | Define local skill anatomy and readiness obligations. |
| `DecisionLog` | Record auto decisions, repairs, human approvals, Open Questions, and Blocking Open Questions. |
| `ProtocolGap` | Normalize source/story/journey/interaction/state/test/runtime/review/ship gaps. |
| `UsabilityEvidence` | Prove story, journey, checkpoint, interaction, state/data, runtime, review, and ship usability. |
| `ReferencePatternMap` | Map mature skill workflows to SpecDrive protocol rules and local wrappers. |

## 3. Data Flow

```text
spec source
  -> SkillWrapperContract
  -> DecisionLog / ProtocolGap / UsabilityEvidence
  -> Product Usability Gate
  -> ReviewItem / status projection
  -> Execution Workbench quality evidence display
```

## 4. Runtime Integration

- `src/product-usability.ts` owns the structures and validation.
- `src/quality-gates.ts` invokes Product Usability Gate from `validateFeatureCompletion`.
- `src/scheduler.ts` routes Product Usability Gate failure to `review_needed`.
- `src/review-center.ts` stores concrete protocol gap details in the ReviewItem body.
- `src/specdrive-ide.ts` projects usability evidence into IDE view models.
- `apps/vscode-extension/src/webviews/execution.ts` renders the evidence.

## 5. Error Handling

- Safe defaults are recorded as `auto_decided`.
- Source-backed in-scope fixes are recorded as `autonomous_repair`.
- Safe unresolved ambiguity is recorded as `open_question`.
- Product, security, permission, data deletion, scope-expanding, or fake-completion risks are recorded as `blocking_open_question` and block downstream status.

## 6. Testing

- Protocol unit tests cover validators and gate failure categories.
- Gate integration tests cover Feature completion.
- Scheduler and Review Center tests cover ReviewItem routing.
- IDE tests cover view-model projection and Webview rendering.
- Drift tests compare docs-declared structures with runtime structures.
