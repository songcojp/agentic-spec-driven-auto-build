# Skill Refact Pattern-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine `skill-refact.md` into a pattern-first skill quality proposal, add short canonical references, and update the first three upstream project-local skills without changing runtime routing.

**Architecture:** The implementation is documentation and skill-contract work only. `skill-refact.md` becomes the readable proposal; canonical docs point to it briefly; `refine-product-intent`, `generate-user-stories`, and `validate-requirements` absorb mature-skill patterns as local output requirements. Direct runtime delegation remains explicitly out of scope.

**Tech Stack:** Markdown docs, OpenAI-style project-local `SKILL.md` files, existing `npm run skills:validate`, shell diff checks.

---

## File Structure

- Modify: `docs/agentic-spec/zh-CN/skill-refact.md`
  - Responsibility: readable mainline proposal for pattern-first skill quality refactoring.
- Modify: `docs/agentic-spec/zh-CN/skills.md`
  - Responsibility: concise canonical skill guide reference to pattern-first upstream quality.
- Modify: `docs/agentic-spec/zh-CN/agentic-spec-standard.md`
  - Responsibility: concise standard reference near Spec Artifact Granularity Gate and quality repair loop.
- Modify: `docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/design.md`
  - Responsibility: FEAT-023 design note that pattern-first refactor is an upstream quality input, not a separate runtime delegation feature.
- Modify: `.agents/skills/refine-product-intent/SKILL.md`
  - Responsibility: product intent output expectations for defaults, Open Questions, Blocking Open Questions, and downstream readiness.
- Modify: `.agents/skills/generate-user-stories/SKILL.md`
  - Responsibility: user-story generation expectations for pattern-first clarification compression and testable outputs.
- Modify: `.agents/skills/validate-requirements/SKILL.md`
  - Responsibility: validation gate expectations for Open Question risk levels and downstream blocking.
- Create: `docs/agentic-spec/zh-CN/skill-refact-golden-sample.md`
  - Responsibility: lightweight golden sample showing how pattern-first upstream skills improve a weak requirement input without changing runtime routing.

## Task 1: Rewrite The Readable Proposal

**Files:**
- Modify: `docs/agentic-spec/zh-CN/skill-refact.md`

- [ ] **Step 1: Inspect current proposal and confirm it is untracked or intended for this change**

Run:

```bash
git status --short -- docs/agentic-spec/zh-CN/skill-refact.md
```

Expected: the file is present as `?? docs/agentic-spec/zh-CN/skill-refact.md` or modified intentionally by the user.

- [ ] **Step 2: Replace the current draft with the pattern-first proposal**

Replace the full contents of `docs/agentic-spec/zh-CN/skill-refact.md` with:

````markdown
# Skill Pattern-First 质量改造提案

## 1. 定位

本文是 SpecDrive AutoBuild 的 Skill 质量改造提案。目标不是让当前运行时直接调用外部成熟 Skill，而是先把成熟 Skill 的工作方式吸收到项目本地 Skill 的输出要求中。

本轮采用 Pattern-First 策略：

- `superpowers:brainstorming`、`superpowers:writing-plans`、外部 agent-skill 实践和 Claude Code workflow 经验作为参考模式。
- 当前可执行合同仍是 `.agents/skills/*` 中的项目本地 Skill。
- 直接调用系统级 Skill 属于未来能力，必须等 adapter boundary、版本/可用性检查、输出归一化、失败处理和证据模型完成后再设计。

## 2. 背景问题

当前核心问题不是缺少文档或功能描述，而是上游文档经常不能稳定传递到可执行 Feature：

```text
PRD / 用户输入粒度不足
  -> 用户故事不够可测试
  -> 需求缺少验收和证据路径
  -> Feature Spec 仍能继续下游
  -> 实现阶段反复澄清或交付不可用
```

FEAT-023 已经定义 Delivery Fidelity、Spec Artifact Granularity Gate 和 Spec 文档质量修复循环。本文只补充一个更小的设计：如何把成熟 Skill 的好实践引入上游产品/需求链路。

## 3. 本轮范围

本轮只增强三个上游 Skill：

1. `refine-product-intent`
2. `generate-user-stories`
3. `validate-requirements`

本轮不修改：

- VSCode Webview
- Product Console
- Scheduler / Execution Adapter
- Feature Spec 目录结构
- `.agents/skills` 的 17 个 Skill 清单
- `ExecutionAdapterInvocationV1.skillInstruction.skillName`
- `SkillOutputContractV1/V2`
- Runtime 对外部 system skill 的直接调用方式

## 4. 架构边界

### 4.1 Reference Pattern Layer

成熟 Skill 只作为参考模式，提供以下工作习惯：

- 在生成内容前澄清真实目标。
- 把低风险问题压缩为可追踪默认假设。
- 把中风险问题写入 Open Questions。
- 把高风险问题写入 Blocking Open Questions。
- 在进入下游前要求用户旅程、验收标准、测试路径和追踪关系。

### 4.2 Project Skill Contract Layer

当前可执行合同仍由项目本地 Skill 承担。

`refine-product-intent` 负责整理目标、非目标、用户旅程、验收边界、默认假设和开放问题。

`generate-user-stories` 负责生成可测试用户故事、验收标准、边界场景、追踪关系和澄清问题。

`validate-requirements` 负责阻止粗粒度、不可测试、缺少证据路径或缺少关键澄清的需求继续进入设计或 Feature 拆分。

### 4.3 Future Runtime Delegation Boundary

直接 runtime delegation 暂不实现。未来如果需要让本地 Skill 调用系统级 Skill，必须先设计：

- skill availability / version drift 检查；
- allowed skill identity 与安全边界；
- input / output normalization；
- 失败、超时、缺失 skill 的 fallback；
- delegated execution 的证据记录；
- 与 `SkillOutputContractV1/V2` 的兼容关系。

## 5. 产物流

本轮目标链路：

```text
PRD / 用户输入 / Spec Sources
  -> refine-product-intent
  -> generate-user-stories
  -> validate-requirements
  -> decompose-feature-specs
```

本轮只增强前三步的产物要求，不改变下游调度。

## 6. Open Question 分级

### 6.1 自动决策与默认假设

满足以下条件时，Skill 可以自动选择默认假设并写入当前文档：

- 不改变产品定位；
- 不改变业务规则；
- 不改变安全、权限、支付或数据删除语义；
- 不扩大 Feature scope；
- 能从 PRD、requirements、HLD、Feature Spec 或仓库规则推导；
- 可逆，并且不影响当前产物成立。

### 6.2 Open Questions

存在多个合理方案，但可以用默认假设继续时，写入 `Open Questions`。每个问题必须包含：

- 问题；
- 默认假设；
- 是否阻塞；
- 需要人工确认的时机；
- 关联 source artifact。

### 6.3 Blocking Open Questions

以下问题必须写入 `Blocking Open Questions`，并返回 `blocked` 或 `review_needed`：

- 影响产品定位；
- 改变业务规则；
- 涉及安全、权限、支付或数据删除；
- 扩大 Feature scope；
- 无法推导用户旅程；
- 无法写出可测试验收标准；
- 继续下游会导致错误 Feature Spec 或错误实现。

## 7. 三个上游 Skill 的增强要求

### 7.1 refine-product-intent

输出必须包含或保留：

- 目标与非目标；
- 用户旅程；
- 验收边界；
- 自动决策与默认假设；
- Open Questions；
- Blocking Open Questions；
- 下游是否可以进入 `generate-user-stories` 的结论。

### 7.2 generate-user-stories

输出必须包含或保留：

- 可测试 `US-*` 用户故事；
- `REQ-*` / `NFR-*` / `EDGE-*` 原子行为；
- 验收标准；
- 证据路径；
- PRD/source intent 追踪；
- 默认假设；
- Open Questions / Blocking Open Questions；
- 下游是否可以进入 `validate-requirements` 的结论。

### 7.3 validate-requirements

以下情况必须返回 `review_needed` 或 `blocked`，并将 clarification-needed 或 risk-review-needed 记录为 reason、next action 或 result detail，不得进入 HLD、UI Spec、Feature Spec、ready 或 execution：

- 缺少用户价值；
- 缺少验收标准；
- 缺少测试路径；
- 缺少 source refs 或 `US-*` 映射；
- 需求不可观察或不可测试；
- Must 范围存在未关闭 Blocking Open Question；
- 关键产品/安全/权限/数据语义无法确认。

## 8. 与 FEAT-023 的关系

FEAT-023 仍是 Delivery Fidelity、Spec Artifact Granularity Gate 和质量修复循环的主事实源。

本文不替代 FEAT-023，只定义上游产品/需求 Skill 如何吸收成熟 Skill 的工作模式，使进入 FEAT-023 门禁的文档更清晰、更可测试、更可追踪。

## 9. Golden Sample

Golden sample 见 `docs/agentic-spec/zh-CN/skill-refact-golden-sample.md`。该样例用于验证：

- 弱输入不会被直接转成 Feature Spec；
- 默认假设、Open Questions 和 Blocking Open Questions 可以被明确记录；
- `validate-requirements` 能阻止不可测试需求继续下游；
- 输出没有声称当前 runtime 已直接调用外部 system skills。

## 10. 验收标准

- 本文清楚表达 Pattern-First，而不是 runtime delegation。
- canonical docs 只增加短引用，不复制本文大段内容。
- 三个上游 Skill 明确要求默认假设、Open Questions、Blocking Open Questions、用户旅程、验收标准、证据路径和下游阻断条件。
- `npm run skills:validate` 通过。
- `git diff --check` 通过。
- 静态扫描确认没有引入旧 dotted skill slug、skillpack registry、runtime 直调承诺。

## 11. 非目标

- 不 vendor `superpowers`、`agent-skills` 或其他外部 skill package。
- 不创建项目级 skillpack registry、lock 文件、import/update 命令。
- 不修改 UI、调度、Adapter 或 Feature Spec 结构。
- 不把外部成熟 Skill 描述成当前 runtime dependency。
````

- [ ] **Step 3: Check the proposal for forbidden runtime claims**

Run:

```bash
rg -n "runtime.*直接调用|直接调用.*system|skill import|skill update|skill lock|skillpack registry|dotted slug" docs/agentic-spec/zh-CN/skill-refact.md
```

Expected: matches are either in explicitly forbidden/out-of-scope contexts or there is no output.

## Task 2: Add Canonical Short References

**Files:**
- Modify: `docs/agentic-spec/zh-CN/skills.md`
- Modify: `docs/agentic-spec/zh-CN/agentic-spec-standard.md`
- Modify: `docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/design.md`

- [ ] **Step 1: Add a short rule to `skills.md`**

In `docs/agentic-spec/zh-CN/skills.md`, after usage principle 6, add:

````markdown
7. 上游产品/需求类 Skill 采用 Pattern-First 质量改造：成熟系统级 Skill 只作为参考模式，当前运行时仍调用项目本地 Skill。`refine-product-intent`、`generate-user-stories` 和 `validate-requirements` 必须记录默认假设、Open Questions、Blocking Open Questions、用户旅程、验收标准、证据路径和下游阻断条件；不得声称已直接 runtime delegation 到外部 Skill。
````

- [ ] **Step 2: Add a standard note near `agentic-spec-standard.md` section 7.4**

In `docs/agentic-spec/zh-CN/agentic-spec-standard.md`, immediately after the paragraph that says requirements changes must refine design and sync tasks, add:

```markdown
上游产品/需求链路采用 Pattern-First Skill 质量改造：成熟系统级 Skill 的澄清、默认假设、Open Question 分级和可测试性做法作为本地 Skill 的输出要求吸收，不作为当前 runtime 直接调用外部 Skill 的承诺。`refine-product-intent`、`generate-user-stories` 和 `validate-requirements` 必须先关闭或显式阻断高风险不确定项，再允许下游设计、Feature 拆分或执行。
```

- [ ] **Step 3: Add FEAT-023 design cross-reference**

In `docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/design.md`, after the `## 5.1 Spec Document Quality Repair Loop` introductory paragraph, add:

```markdown
Pattern-First Skill 质量改造是该门禁的上游输入策略。`docs/agentic-spec/zh-CN/skill-refact.md` 定义如何把成熟 Skill 的澄清压缩、默认假设、Open Questions 和 Blocking Open Questions 做法吸收到 `refine-product-intent`、`generate-user-stories` 和 `validate-requirements` 中；它不改变 FEAT-023 的 Delivery Fidelity、Granularity Gate 或 quality repair loop 职责，也不表示当前 runtime 已直接调用外部 system skills。
```

- [ ] **Step 4: Verify canonical references stay short**

Run:

```bash
git diff -- docs/agentic-spec/zh-CN/skills.md docs/agentic-spec/zh-CN/agentic-spec-standard.md docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/design.md
```

Expected: three small insertions only; no duplicated long-form proposal text.

## Task 3: Update Upstream Skill Contracts

**Files:**
- Modify: `.agents/skills/refine-product-intent/SKILL.md`
- Modify: `.agents/skills/generate-user-stories/SKILL.md`
- Modify: `.agents/skills/validate-requirements/SKILL.md`

- [ ] **Step 1: Add Pattern-First guidance to `refine-product-intent`**

In `.agents/skills/refine-product-intent/SKILL.md`, after the `## Guidance` paragraph, add:

```markdown
Apply Pattern-First quality rules from `docs/agentic-spec/zh-CN/skill-refact.md`: use mature system-skill behavior as reference patterns only, not as runtime dependencies. Compress low-risk clarification into explicit default assumptions, record medium-risk uncertainty as Open Questions, and record high-risk uncertainty as Blocking Open Questions with `blocked` or `review_needed` status.

When creating or refining product intent, ensure the artifact names goals, non-goals, actors, user journeys, acceptance boundaries, source refs, default assumptions, Open Questions, Blocking Open Questions, and whether the output is ready for `generate-user-stories`. Do not invent product positioning, business rules, security policy, data deletion behavior, or Feature scope to keep the flow moving.
```

- [ ] **Step 2: Add Pattern-First guidance to `generate-user-stories`**

In `.agents/skills/generate-user-stories/SKILL.md`, under `When generating or updating requirements:`, after the existing bullet `Treat docs/agentic-spec/requirements/user-stories-standard.md...`, add:

```markdown
- Apply Pattern-First quality rules from `docs/agentic-spec/zh-CN/skill-refact.md`: mature system skills are reference patterns only, not runtime dependencies. Convert low-risk ambiguity into explicit default assumptions, write medium-risk ambiguity as Open Questions with safe defaults, and write high-risk ambiguity as Blocking Open Questions that prevent downstream validation or decomposition.
- Preserve or add an `自动决策与默认假设` / `Default Assumptions` section and Open Questions / Blocking Open Questions sections when the target artifact format allows them. Each question must include source refs, default assumption when safe, blocking status, and the required human decision.
```

- [ ] **Step 3: Add Pattern-First validation gate to `validate-requirements`**

In `.agents/skills/validate-requirements/SKILL.md`, under `When validating user stories:`, after the existing bullet `Use docs/agentic-spec/requirements/user-stories-standard.md...`, add:

```markdown
- Enforce Pattern-First quality rules from `docs/agentic-spec/zh-CN/skill-refact.md`: external mature skills are reference patterns only, and validation must not claim runtime delegation to system skills.
- Check that default assumptions, Open Questions, and Blocking Open Questions are present when the source contains ambiguity. Medium-risk Open Questions may continue only with a stated safe default and review visibility. Must-scope Blocking Open Questions require `blocked` or `review_needed` status, with clarification-needed or risk-review-needed recorded as the reason, next action, or result detail, and must not advance to HLD, UI Spec, Feature Spec, ready, planning, or execution.
```

- [ ] **Step 4: Verify skill structure**

Run:

```bash
npm run skills:validate
```

Expected: command exits 0 and reports skill validation success.

## Task 4: Add Golden Sample

**Files:**
- Create: `docs/agentic-spec/zh-CN/skill-refact-golden-sample.md`

- [ ] **Step 1: Create the golden sample document**

Create `docs/agentic-spec/zh-CN/skill-refact-golden-sample.md` with:

````markdown
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
````

- [ ] **Step 2: Check markdown fences**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('docs/agentic-spec/zh-CN/skill-refact-golden-sample.md')
text = p.read_text()
assert text.count('```') % 2 == 0, 'unbalanced markdown fences'
print('markdown fences balanced')
PY
```

Expected: `markdown fences balanced`

## Task 5: Run Final Static Checks

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run docs whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 2: Scan for forbidden old or over-promising terms**

Run:

```bash
rg -n "skill import|skill update|skill lock|skillpack registry|direct runtime delegation|直接 runtime delegation|已直接调用|old dotted|旧 dotted" docs/agentic-spec/zh-CN/skill-refact.md docs/agentic-spec/zh-CN/skills.md docs/agentic-spec/zh-CN/agentic-spec-standard.md docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/design.md .agents/skills/refine-product-intent/SKILL.md .agents/skills/generate-user-stories/SKILL.md .agents/skills/validate-requirements/SKILL.md docs/agentic-spec/zh-CN/skill-refact-golden-sample.md
```

Expected: matches are only in explicit prohibition, out-of-scope, or "must not claim" contexts.

- [ ] **Step 3: Run skill validation**

Run:

```bash
npm run skills:validate
```

Expected: command exits 0.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git diff -- docs/agentic-spec/zh-CN/skill-refact.md docs/agentic-spec/zh-CN/skills.md docs/agentic-spec/zh-CN/agentic-spec-standard.md docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/design.md .agents/skills/refine-product-intent/SKILL.md .agents/skills/generate-user-stories/SKILL.md .agents/skills/validate-requirements/SKILL.md docs/agentic-spec/zh-CN/skill-refact-golden-sample.md
```

Expected: all changes match Tasks 1-4; no UI, scheduler, adapter, or Feature Spec structure changes.

- [ ] **Step 5: Commit the implementation**

Run:

```bash
git status --short
git add docs/agentic-spec/zh-CN/skill-refact.md docs/agentic-spec/zh-CN/skill-refact-golden-sample.md docs/agentic-spec/zh-CN/skills.md docs/agentic-spec/zh-CN/agentic-spec-standard.md docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/design.md .agents/skills/refine-product-intent/SKILL.md .agents/skills/generate-user-stories/SKILL.md .agents/skills/validate-requirements/SKILL.md docs/superpowers/plans/2026-05-15-skill-refact-pattern-first.md
git diff --cached --check
git commit -m "docs(skills): define pattern-first skill quality"
```

Expected: staged diff contains only the files listed above, including this implementation plan, whitespace check passes, and commit succeeds.

## Self-Review

Spec coverage:

- Scope and positioning are covered by Tasks 1 and 2.
- Architecture boundaries are covered by Tasks 1, 2, and 3.
- Artifact flow and first integration target are covered by Tasks 1 and 3.
- Open Question handling is covered by Tasks 1, 3, and 4.
- Error handling and downstream blocking are covered by Tasks 3 and 4.
- Testing and acceptance are covered by Tasks 4 and 5.

Placeholder scan:

- The plan contains no unresolved placeholder markers or unspecified edge handling.

Type and contract consistency:

- The plan preserves existing skill names: `refine-product-intent`, `generate-user-stories`, and `validate-requirements`.
- The plan preserves `ExecutionAdapterInvocationV1.skillInstruction.skillName` and `SkillOutputContractV1/V2`.
- The plan does not introduce runtime delegation, a skillpack registry, new UI, scheduler, adapter, or Feature Spec directory changes.
