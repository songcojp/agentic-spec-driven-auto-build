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
  validateSkillWrapperContract,
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

test("skill wrapper contract validation rejects missing required sections", () => {
  const result = validateSkillWrapperContract({
    skillName: "",
    lifecycleStage: "Build",
    requiredSourceRefs: [],
    allowedDecisionTypes: [],
    requiredOutputFields: [],
    handoffReadiness: [],
    antiRationalizationChecks: [],
    verificationEvidence: [],
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, [
    "SkillWrapperContract requires skillName.",
    "SkillWrapperContract (unnamed skill) requires requiredSourceRefs.",
    "SkillWrapperContract (unnamed skill) requires allowedDecisionTypes.",
    "SkillWrapperContract (unnamed skill) requires requiredOutputFields.",
    "SkillWrapperContract (unnamed skill) requires handoffReadiness.",
    "SkillWrapperContract (unnamed skill) requires antiRationalizationChecks.",
    "SkillWrapperContract (unnamed skill) requires verificationEvidence.",
  ]);
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

test("product usability gate accepts browser evidence without reference pattern map", () => {
  const input: ProductUsabilityGateInput = {
    priorityStories: ["US-024-04"],
    decisionLog: [],
    protocolGaps: [],
    usabilityEvidence: [
      {
        id: "UE-BROWSER",
        userStoryId: "US-024-04",
        journeyId: "JOURNEY-EXECUTION-WORKBENCH-EVIDENCE",
        checkpointId: "CP-1",
        mode: "browser",
        status: "passed",
        assertion: "Workbench shows runtime evidence for the story.",
        evidenceRefs: ["trace.zip"],
      },
    ],
    lifecycleHandoffs: [],
  };

  const result = assessProductUsabilityGate(input);

  assert.equal(result.passed, true);
  assert.deepEqual(result.triggers, []);
  assert.deepEqual(result.gaps, []);
});

test("product usability gate blocks open P0 runtime gaps", () => {
  const input: ProductUsabilityGateInput = {
    priorityStories: ["US-024-04"],
    protocolGaps: [
      {
        id: "GAP-P0",
        category: "runtime_gap",
        severity: "P0",
        status: "open",
        message: "No runtime proof for the primary user journey.",
        affectedStories: ["US-024-04"],
        affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
        evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
        resumeStage: "Verify",
      },
    ],
    usabilityEvidence: [
      {
        id: "UE-REAL",
        userStoryId: "US-024-04",
        journeyId: "JOURNEY-EXECUTION-WORKBENCH-EVIDENCE",
        checkpointId: "CP-1",
        mode: "browser",
        status: "passed",
        assertion: "Workbench shows evidence.",
        evidenceRefs: ["trace.zip"],
      },
    ],
  };

  const result = assessProductUsabilityGate(input);

  assert.equal(result.passed, false);
  assert.equal(result.reason, "product_usability_gap");
  assert.equal(result.gaps[0]?.id, "GAP-P0");
});

test("product usability gate creates synthetic gap for missing priority story evidence", () => {
  const input: ProductUsabilityGateInput = {
    priorityStories: ["US-024-04"],
    protocolGaps: [],
    usabilityEvidence: [],
  };

  const result = assessProductUsabilityGate(input);

  assert.equal(result.passed, false);
  assert.equal(result.reason, "product_usability_gap");
  assert.equal(result.gaps[0]?.id, "missing-usability-evidence-US-024-04");
  assert.deepEqual(result.gaps[0]?.affectedJourneys, ["missing-journey-US-024-04"]);
  assert.deepEqual(result.gaps[0]?.evidenceRefs, ["missing-usability-evidence-US-024-04"]);
  assert.equal(result.gaps[0]?.message, "P0/P1 story US-024-04 lacks runtime or equivalent usability evidence.");
});

for (const mode of ["fixture", "seed", "text"] as const) {
  test(`product usability gate does not close priority story with ${mode} evidence`, () => {
    const input: ProductUsabilityGateInput = {
      priorityStories: ["US-024-04"],
      protocolGaps: [],
      usabilityEvidence: [
        {
          id: `UE-${mode.toUpperCase()}`,
          userStoryId: "US-024-04",
          journeyId: "JOURNEY-EXECUTION-WORKBENCH-EVIDENCE",
          checkpointId: "CP-1",
          mode,
          status: "passed",
          assertion: "Seeded text exists.",
          evidenceRefs: [`${mode}.json`],
        },
      ],
    };

    const result = assessProductUsabilityGate(input);

    assert.equal(result.passed, false);
    assert.equal(result.reason, "product_usability_gap");
    assert.equal(result.gaps.some((gap) => gap.id === "missing-usability-evidence-US-024-04"), true);
  });
}
