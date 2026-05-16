# Mature Skill Reference Pattern Map

This document maps mature skill-library workflows to SpecDrive protocol rules. It is a source-backed reference map, not vendored runtime code.

| Source | Workflow / Skill | SpecDrive Stage | Local Skill / Protocol Rule | Evidence Field |
|---|---|---|---|---|
| Superpowers | brainstorming | Define | Require context exploration, one-question-at-a-time clarification, explicit design approval before implementation. | `LifecycleHandoff`, `DecisionLog` |
| Superpowers | writing-plans | Plan | Require implementation plans with exact files, tests, commands, and review handoff before execution. | `SkillWrapperContract`, `LifecycleHandoff` |
| Superpowers | test-driven-development | Build / Verify | Require failing tests before behavior implementation when changing code paths. | `UsabilityEvidence`, `ProtocolGap` |
| Superpowers | verification-before-completion | Verify / Ship | Require evidence before completion claims. | `UsabilityEvidence` |
| Superpowers | subagent-driven-development | Build / Review | Dispatch bounded tasks with explicit ownership and review outputs. | `LifecycleHandoff`, `DecisionLog` |
| Superpowers | requesting-code-review | Review | Require independent findings before closeout for broad changes. | `ProtocolGap` |
| Agent Skills | lifecycle skills | Define / Plan / Build / Verify / Review / Ship | Align local skills with lifecycle responsibilities and handoff readiness. | `LifecycleHandoff` |
| Agent Skills | skill anatomy | All | Require purpose, triggers, source inputs, process, output contract, and verification. | `SkillWrapperContract` |
| Agent Skills | anti-rationalization | Verify / Review | Reject self-justifying completion without evidence. | `ProtocolGap` |
| Agent Skills | verification evidence | Verify / Ship | Require concrete evidence refs for accepted behavior. | `UsabilityEvidence` |
| Everything Claude Code | memory persistence | Review / Ship | Persist durable decisions and gaps instead of conversation-only memory. | `DecisionLog`, `ProtocolGap` |
| Everything Claude Code | continuous learning | Review | Convert repeated gaps into protocol or skill wrapper improvements. | `ProtocolGap`, `ReferencePatternMap` |
| Everything Claude Code | verification loops | Verify | Keep verification loops explicit and stateful. | `LifecycleHandoff`, `UsabilityEvidence` |
| Everything Claude Code | orchestration status | Plan / Build | Surface status transitions and blockers through machine-queryable state. | `ProtocolGap` |
| Everything Claude Code | security scanning | Review | Escalate product/security/permission/data deletion uncertainty. | `DecisionLog`, `ProtocolGap` |
| Everything Claude Code | research-first workflow | Define / Plan | Require source-backed references before adopting external patterns. | `ReferencePatternMap` |
