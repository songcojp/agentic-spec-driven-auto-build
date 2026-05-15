import test from "node:test";
import assert from "node:assert/strict";
import { assessRuntimeEvidenceGate, isAppTouchingFile, validateFeatureCompletion } from "../src/quality-gates.ts";
import type { ExecutionAdapterInvocationV1 } from "../src/execution-adapter-contracts.ts";
import type { SkillOutputContract } from "../src/cli-adapter.ts";

test("runtime evidence gate requires app proof for UI file changes", () => {
  const result = assessRuntimeEvidenceGate({
    invocation: invocation(),
    output: output({ runtimeEvidence: null }),
    changedFiles: ["src/components/FeaturePanel.tsx"],
  });

  assert.equal(result.passed, false);
  if (!result.passed) {
    assert.equal(result.reason, "evidence_missing");
    assert.equal(result.details.includes("runtimeEvidence is required for UI/app changes"), true);
  }
});

test("runtime evidence gate accepts structured browser evidence", () => {
  const result = assessRuntimeEvidenceGate({
    invocation: invocation(),
    output: output({ runtimeEvidence: runtimeEvidence() }),
    changedFiles: ["apps/vscode-extension/src/webviews/feature-spec.ts"],
  });

  assert.equal(result.passed, true);
});

test("runtime evidence gate accepts explicit foundation exemption", () => {
  const result = assessRuntimeEvidenceGate({
    invocation: invocation(),
    output: output({
      runtimeEvidence: null,
      runtimeExemption: { exempt: true, reason: "Stateless type-only change.", evidence: ["tests/typecheck.log"] },
    }),
    changedFiles: ["src/components/FeaturePanel.tsx"],
  });

  assert.equal(result.passed, true);
});

test("feature completion gate centralizes closure failures", () => {
  const result = validateFeatureCompletion({
    invocation: invocation(),
    skillOutput: output({ runtimeEvidence: null }),
    changedFiles: ["src/components/FeaturePanel.tsx"],
  });

  assert.equal(result.status, "review_needed");
  assert.equal(result.triggers.includes("evidence_missing"), true);
  assert.equal(result.details.some((detail) => detail.includes("Runtime Evidence Gate failed")), true);
});

test("feature completion gate rejects and accepts product usability evidence", () => {
  const failing = validateFeatureCompletion({
    invocation: invocation(),
    skillOutput: output({
      productUsability: {
        priorityStories: ["US-024-04"],
        protocolGaps: [
          {
            id: "GAP-EXECUTION-WORKBENCH",
            category: "runtime_gap",
            severity: "P1",
            status: "open",
            message: "Execution Workbench does not display usability evidence.",
            affectedStories: ["US-024-04"],
            affectedJourneys: ["JOURNEY-EXECUTION-WORKBENCH-EVIDENCE"],
            evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
            resumeStage: "Verify",
          },
        ],
        usabilityEvidence: [],
        decisionLog: [],
        lifecycleHandoffs: [],
        referencePatternMap: [],
      },
    }),
    changedFiles: ["apps/vscode-extension/src/webviews/execution.ts"],
  });

  assert.equal(failing.status, "review_needed");
  assert.equal(failing.triggers.includes("product_usability_gap"), true);
  assert.equal(failing.triggers.includes("runtime_gap"), true);
  assert.equal(failing.details.some((detail) => detail.startsWith("Product Usability Gate failed:")), true);

  const passing = validateFeatureCompletion({
    invocation: invocation(),
    skillOutput: output({
      productUsability: {
        priorityStories: ["US-024-04"],
        protocolGaps: [],
        usabilityEvidence: [
          {
            id: "UE-BROWSER",
            userStoryId: "US-024-04",
            journeyId: "JOURNEY-EXECUTION-WORKBENCH-EVIDENCE",
            checkpointId: "CP-1",
            mode: "browser",
            status: "passed",
            assertion: "Execution Workbench displays usability evidence.",
            evidenceRefs: ["trace.zip"],
          },
        ],
        decisionLog: [],
        lifecycleHandoffs: [],
        referencePatternMap: [],
      },
    }),
    changedFiles: ["apps/vscode-extension/src/webviews/execution.ts"],
  });

  assert.equal(passing.status, "completed");
  assert.equal(passing.triggers.includes("product_usability_gap"), false);
});

test("app touching file detection supports built-in and configured patterns", () => {
  assert.equal(isAppTouchingFile("src/components/FeaturePanel.tsx"), true);
  assert.equal(isAppTouchingFile("src/runtime.ts"), false);
  assert.equal(isAppTouchingFile("packages/app-shell/src/runtime.ts", ["packages/app-shell/**"]), true);
});

function invocation(): ExecutionAdapterInvocationV1 {
  return {
    contractVersion: "execution-adapter/v1",
    executionId: "RUN-QUALITY",
    projectId: "project-1",
    workspaceRoot: "/workspace/project",
    operation: "feature_execution",
    featureId: "FEAT-QUALITY",
    specState: {},
    traceability: { featureId: "FEAT-QUALITY", requirementIds: ["REQ-093"] },
    constraints: { allowedFiles: [], risk: "low" },
    outputSchema: {},
    skillInstruction: {
      skillName: "implement-feature",
      requestedAction: "feature_execution",
      sourcePaths: ["docs/agentic-spec/features/feat-quality/requirements.md"],
      expectedArtifacts: [],
    },
  };
}

function output(overrides: Record<string, unknown> = {}): SkillOutputContract {
  return {
    contractVersion: "skill-contract/v2",
    executionId: "RUN-QUALITY",
    skillName: "implement-feature",
    requestedAction: "feature_execution",
    status: "completed",
    summary: "Feature implemented.",
    nextAction: null,
    producedArtifacts: [],
    traceability: { featureId: "FEAT-QUALITY" },
    result: {
      requirementCoverage: [{ requirementId: "REQ-093", status: "passed", evidence: ["unit"] }],
      acceptanceEvidence: [{ scenarioId: "AC-QUALITY", status: "passed", evidence: ["browser"] }],
      journeyEvidence: [{ userStoryId: "US-QUALITY", status: "passed", evidence: ["trace"] }],
      foundationExemption: null,
      runtimeEvidence: runtimeEvidence(),
      runtimeExemption: null,
      deliveryFidelity: deliveryFidelity(),
      gitDelivery: gitDelivery(),
      ...overrides,
    },
  };
}

function runtimeEvidence(): Record<string, unknown> {
  return {
    appLaunch: { command: "npm run dev", status: "passed", url: "http://127.0.0.1:5173", evidence: ["launch.log"] },
    journeys: [{ scenario: "open feature", status: "passed", evidence: ["trace.zip"] }],
    stateAssertions: [{ assertion: "state changed", status: "passed", evidence: ["state.png"] }],
    negativePaths: [{ scenario: "empty state", status: "passed", evidence: ["negative.png"] }],
  };
}

function deliveryFidelity(): Record<string, unknown> {
  return {
    sourceIntent: [{ id: "INTENT-1", status: "preserved" }],
    behaviorObligations: [{ id: "BO-1", status: "passed", evidenceRefs: ["EV-1"] }],
    handoffs: [{ from: "build", to: "verify", status: "passed", preservedObligations: ["BO-1"] }],
    evidence: [{ id: "EV-1", mode: "browser", assertion: "state_change", status: "passed", covers: ["BO-1"], artifactRefs: ["trace.zip"] }],
    agentReviews: [{ role: "browser-qa", status: "passed", evidenceRefs: ["EV-1"] }],
    losses: [],
    completionDecision: { status: "passed", decidedBy: "release-reviewer" },
  };
}

function gitDelivery(): Record<string, unknown> {
  return {
    ownerWorkspace: "/workspace/project",
    implementationWorkspace: "/workspace/project.worktrees/quality",
    worktree: "/workspace/project.worktrees/quality",
    branch: "feat/quality",
    commitHash: "abc1234",
    prUrl: "https://github.com/example/repo/pull/1",
    checks: "passed",
    merge: "merged",
    remoteBranchCleanup: "completed",
    localBranchCleanup: "completed",
    worktreeCleanup: "cleaned",
  };
}
