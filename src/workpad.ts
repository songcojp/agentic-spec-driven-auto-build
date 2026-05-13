import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ExecutionAdapterInvocationV1 } from "./execution-adapter-contracts.ts";

export type RunWorkpad = {
  executionId: string;
  featureId?: string;
  taskId?: string;
  markdownPath: string;
  jsonPath: string;
  sections: {
    plan: string[];
    requirementCoverage: string[];
    acceptanceCriteria: string[];
    journeyCheckpoints: string[];
    runtimeValidation: string[];
    evidence: Array<{ type: string; ref: string; status: string }>;
  };
};

export function createRunWorkpad(input: {
  workspaceRoot: string;
  executionId: string;
  featureId?: string;
  taskId?: string;
  invocation?: ExecutionAdapterInvocationV1;
}): RunWorkpad {
  const safeExecutionId = sanitizePathPart(input.executionId);
  const runDir = join(input.workspaceRoot, ".autobuild", "runs", safeExecutionId);
  const markdownPath = `.autobuild/runs/${safeExecutionId}/WORKPAD.md`;
  const jsonPath = `.autobuild/runs/${safeExecutionId}/workpad.json`;
  const workpad: RunWorkpad = {
    executionId: input.executionId,
    featureId: input.featureId ?? input.invocation?.featureId ?? input.invocation?.traceability.featureId,
    taskId: input.taskId ?? input.invocation?.traceability.taskId,
    markdownPath,
    jsonPath,
    sections: {
      plan: ["Read governing specs and source refs.", "Implement only the bounded task scope.", "Verify behavior obligations and evidence."],
      requirementCoverage: (input.invocation?.traceability.requirementIds ?? []).map((id) => `${id}: pending`),
      acceptanceCriteria: [],
      journeyCheckpoints: [],
      runtimeValidation: [
        "App starts",
        "Target route opens",
        "Primary interaction succeeds",
        "State mutation observed",
        "Reload persistence verified",
        "Negative or boundary path verified",
        "Screenshot/trace/log attached",
      ],
      evidence: [],
    },
  };
  try {
    mkdirSync(runDir, { recursive: true, mode: 0o700 });
    writeFileSync(join(input.workspaceRoot, markdownPath), renderWorkpadMarkdown(workpad), { encoding: "utf8", mode: 0o600 });
    writeFileSync(join(input.workspaceRoot, jsonPath), `${JSON.stringify(workpad, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  } catch {
    // Workpad is a process-evidence index; failure to write it must not mask the real adapter result.
  }
  return workpad;
}

function renderWorkpadMarkdown(workpad: RunWorkpad): string {
  return [
    "# AutoBuild Workpad",
    "",
    "```text",
    `executionId=${workpad.executionId}`,
    `featureId=${workpad.featureId ?? "none"}`,
    `taskId=${workpad.taskId ?? "none"}`,
    "```",
    "",
    "## Plan",
    ...checklist(workpad.sections.plan),
    "",
    "## Requirement Coverage",
    ...checklistOrEmpty(workpad.sections.requirementCoverage),
    "",
    "## Acceptance Criteria",
    ...checklistOrEmpty(workpad.sections.acceptanceCriteria),
    "",
    "## Journey Checkpoints",
    ...checklistOrEmpty(workpad.sections.journeyCheckpoints),
    "",
    "## Runtime Validation",
    ...checklist(workpad.sections.runtimeValidation),
    "",
    "## Review Findings",
    "- [ ] Code review finding resolved",
    "- [ ] Test gap resolved",
    "",
    "## Evidence",
    "",
    "| Type | Ref | Status |",
    "|---|---|---|",
    ...workpad.sections.evidence.map((entry) => `| ${entry.type} | ${entry.ref} | ${entry.status} |`),
    "",
    "## Confusions",
    "",
    "- None recorded.",
    "",
  ].join("\n");
}

function checklist(values: string[]): string[] {
  return values.map((value) => `- [ ] ${value}`);
}

function checklistOrEmpty(values: string[]): string[] {
  return values.length ? checklist(values) : ["- [ ] pending"];
}

function sanitizePathPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}
