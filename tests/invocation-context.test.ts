import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildInvocationContextManifest, ensureInvocationContextPrompt, renderInvocationContextManifest } from "../src/invocation-context.ts";
import type { ExecutionAdapterInvocationV1 } from "../src/execution-adapter-contracts.ts";

test("invocation context manifest references governing files without inlining full specs", () => {
  const workspaceRoot = mkdtempSync(join(tmpdir(), "invocation-manifest-"));
  mkdirSync(join(workspaceRoot, ".autobuild/memory"), { recursive: true });
  writeFileSync(join(workspaceRoot, "AGENTS.md"), "# Agent Guidelines\n");
  writeFileSync(join(workspaceRoot, ".autobuild/memory/project.md"), "# Project Memory\n");
  writeFileSync(join(workspaceRoot, ".autobuild/memory/constitution.md"), "# Constitution\n");

  const manifest = buildInvocationContextManifest(invocation(workspaceRoot));
  const rendered = renderInvocationContextManifest(manifest);

  assert.equal(manifest.run.executionId, "RUN-MANIFEST");
  assert.equal(manifest.task.featureId, "FEAT-023");
  assert.equal(manifest.output.contractVersion, "skill-contract/v2");
  assert.equal(manifest.output.requiredFields.includes("runtimeEvidence when UI/app behavior is changed"), true);
  assert.match(rendered, /AGENTS\.md sha256:/);
  assert.match(rendered, /\.autobuild\/memory\/project\.md sha256:/);
  assert.match(rendered, /Do not rely only on this prompt/);
  assert.doesNotMatch(rendered, /# Agent Guidelines/);
  assert.doesNotMatch(rendered, /# Project Memory/);
});

test("invocation context prompt wrapper is idempotent", () => {
  const workspaceRoot = mkdtempSync(join(tmpdir(), "invocation-wrapper-"));
  const wrapped = ensureInvocationContextPrompt("Run the task.", invocation(workspaceRoot));
  const wrappedAgain = ensureInvocationContextPrompt(wrapped, invocation(workspaceRoot));

  assert.match(wrapped, /^\[AUTOBUILD INVOCATION\]/);
  assert.match(wrapped, /Run the task\./);
  assert.equal(wrappedAgain, wrapped);
});

function invocation(workspaceRoot: string): ExecutionAdapterInvocationV1 {
  return {
    contractVersion: "execution-adapter/v1",
    executionId: "RUN-MANIFEST",
    jobId: "JOB-MANIFEST",
    projectId: "project-1",
    workspaceRoot,
    operation: "feature_execution",
    featureId: "FEAT-023",
    specState: {
      blockedReasons: ["waiting for review evidence"],
      pendingApprovals: ["approval-1"],
      resumeTarget: "RUN-OLD",
    },
    traceability: { featureId: "FEAT-023", taskId: "T-023-13", requirementIds: ["REQ-093"] },
    constraints: {
      allowedFiles: ["src/invocation-context.ts"],
      risk: "medium",
      sandboxMode: "danger-full-access",
      approvalPolicy: "never",
    },
    outputSchema: {},
    skillInstruction: {
      skillName: "implement-feature",
      requestedAction: "feature_execution",
      sourcePaths: ["docs/agentic-spec/features/feat-023-full-lifecycle-delivery-fidelity/tasks.md"],
      expectedArtifacts: [],
    },
  };
}
