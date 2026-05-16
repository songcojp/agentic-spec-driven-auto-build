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

FEAT-023 已经定义 Delivery Fidelity、Spec Artifact Granularity Gate 和 Spec 文档质量修复循环。本文最初只补充一个更小的设计：如何把成熟 Skill 的好实践引入上游产品/需求链路。FEAT-024 在此基础上把 Pattern-First 扩展为 Product Usability Autonomy：成熟 Skill 实践仍是参考模式，但必须通过 Agentic Spec 自己的 `SkillWrapperContract`、`DecisionLog`、`ProtocolGap`、`UsabilityEvidence`、`LifecycleHandoff` 和 `ReferencePatternMap` 收敛为可治理、可审查、可投影的协议结构。

## 3. 本轮范围

Pattern-First Phase 1 只增强三个上游 Skill：

1. `refine-product-intent`
2. `generate-user-stories`
3. `validate-requirements`

Pattern-First Phase 1 不修改：

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

Golden sample 将在本 implementation package 中新增至 `docs/agentic-spec/zh-CN/skill-refact-golden-sample.md`，并用于验证：

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

## 12. FEAT-024 收敛方向

FEAT-024 不改变本文的 runtime delegation 边界：外部成熟 Skill 库仍然不是当前运行时依赖，也不作为可直接调用的 adapter target。变化在于把参考模式从上游三项 Skill 扩展到关键生命周期 Skill，并用本地协议结构承接。

新增收敛要求：

- `docs/agentic-spec/references/mature-skill-pattern-map.md` 作为 `ReferencePatternMap`，按 Skill / workflow 粒度把 Superpowers、Agent Skills 和 Everything Claude Code 实践映射到 SpecDrive 本地规则。
- 关键 `.agents/skills/*/SKILL.md` 必须声明 Product Usability Autonomy wrapper，说明 source refs、lifecycle stage、decision policy、protocol gaps、usability evidence、handoff readiness 和 anti-rationalization 要求。
- `refine-product-intent`、`generate-user-stories`、`validate-requirements` 继续负责上游产品/需求质量，但其输出也要能被 `DecisionLog`、`ProtocolGap` 和 `UsabilityEvidence` 消费。
- `decompose-feature-specs`、`implement-feature`、`verify-behavior`、`review-delivery-evidence` 和 `use-specdrive-lifecycle` 必须把成熟 Skill 实践投影到 Feature readiness、执行证据、用户旅程验证、评审结论和 lifecycle handoff。
- 当 Product Usability Gate 发现 P0/P1 story、journey、interaction、state/data、test、runtime、review 或 ship 证据缺口时，下游状态应进入 `review_needed`、`risk_review_needed`、`clarification_needed` 或 `blocked`，而不是靠文本完整度继续推进。
