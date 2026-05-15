import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PRODUCT_USABILITY_PROTOCOL_STRUCTURES,
  assessProductUsabilityGate,
  validateDecisionLog,
  validateLifecycleHandoffs,
  validateProtocolGaps,
  validateReferencePatternMap,
  validateUsabilityEvidence,
  type ProductUsabilityGateInput,
} from "../src/product-usability.ts";

test("protocol structures declared in docs are represented in runtime constants", () => {
  const design = readFileSync("docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md", "utf8");
  for (const structure of [
    "LifecycleHandoff",
    "SkillWrapperContract",
    "DecisionLog",
    "ProtocolGap",
    "UsabilityEvidence",
    "ReferencePatternMap",
  ]) {
    assert.match(design, new RegExp(`\\b${structure}\\b`));
    assert.equal(PRODUCT_USABILITY_PROTOCOL_STRUCTURES.includes(structure), true);
  }
});

test("decision log validation rejects missing source refs", () => {
  const result = validateDecisionLog([
    {
      id: "DL-1",
      type: "auto_decided",
      summary: "Use existing IDE Webview as primary UI.",
      rationale: "AGENTS.md states VSCode IDE Webview is primary.",
      risk: "low",
      affectedArtifacts: ["docs/agentic-spec/features/feat-024-product-usability-autonomy/design.md"],
      verification: ["git diff --check"],
      status: "accepted",
    },
  ]);

  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, ["DecisionLog DL-1 requires sourceRefs."]);
});

test("protocol gap validation accepts concrete product usability gap", () => {
  const result = validateProtocolGaps([
    {
      id: "GAP-1",
      category: "runtime_gap",
      severity: "P1",
      status: "open",
      message: "Execution Workbench does not show usability evidence.",
      affectedStories: ["US-024-04"],
      affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
      evidenceRefs: ["tests/specdrive-ide.test.ts"],
      resumeStage: "Verify",
    },
  ]);

  assert.equal(result.valid, true);
  assert.deepEqual(result.reasons, []);
});

test("usability evidence validation rejects fixture-only P0 story evidence", () => {
  const result = validateUsabilityEvidence([
    {
      id: "UE-1",
      userStoryId: "US-024-04",
      journeyId: "JOURNEY-EXECUTION-WORKBENCH-EVIDENCE",
      checkpointId: "CP-1",
      mode: "fixture",
      status: "passed",
      assertion: "Seeded text exists.",
      evidenceRefs: ["seed.json"],
    },
  ]);

  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, ["UsabilityEvidence UE-1 cannot use fixture-only evidence for product usability."]);
});

test("lifecycle handoff validation requires preserved obligations", () => {
  const result = validateLifecycleHandoffs([
    {
      id: "LH-1",
      from: "Define",
      to: "Plan",
      owner: "Product Interpreter",
      inputRefs: ["docs/agentic-spec/zh-CN/PRD.md"],
      outputRefs: ["docs/agentic-spec/features/feat-024-product-usability-autonomy/requirements.md"],
      evidenceRefs: ["docs/superpowers/specs/2026-05-15-product-usability-autonomy-design.md"],
      status: "passed",
    },
  ]);

  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, ["LifecycleHandoff LH-1 requires preservedObligations."]);
});

test("reference pattern map validates selected mature workflows", () => {
  const result = validateReferencePatternMap([
    {
      source: "superpowers",
      workflow: "brainstorming",
      specdriveStage: "Define",
      localRule: "Require design approval before implementation.",
      localSkill: "use-specdrive-lifecycle",
      evidenceField: "LifecycleHandoff",
    },
    {
      source: "agent-skills",
      workflow: "verification-evidence",
      specdriveStage: "Verify",
      localRule: "Runtime evidence must support product usability.",
      localSkill: "verify-behavior",
      evidenceField: "UsabilityEvidence",
    },
    {
      source: "everything-claude-code",
      workflow: "continuous-learning",
      specdriveStage: "Review",
      localRule: "Protocol gaps must become durable review records.",
      localSkill: "review-delivery-evidence",
      evidenceField: "ProtocolGap",
    },
  ]);

  assert.equal(result.valid, true);
  assert.deepEqual(result.reasons, []);
});

test("product usability gate blocks open P1 runtime gaps", () => {
  const input: ProductUsabilityGateInput = {
    priorityStories: ["US-024-04"],
    decisionLog: [],
    protocolGaps: [
      {
        id: "GAP-1",
        category: "runtime_gap",
        severity: "P1",
        status: "open",
        message: "No Execution Workbench evidence display.",
        affectedStories: ["US-024-04"],
        affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
        evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
        resumeStage: "Verify",
      },
    ],
    usabilityEvidence: [],
    lifecycleHandoffs: [],
    referencePatternMap: [],
  };

  const result = assessProductUsabilityGate(input);

  assert.equal(result.passed, false);
  assert.equal(result.reason, "product_usability_gap");
  assert.equal(result.triggers.includes("product_usability_gap"), true);
  assert.equal(result.gaps[0]?.id, "GAP-1");
});
