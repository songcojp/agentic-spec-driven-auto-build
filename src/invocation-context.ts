import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExecutionAdapterInvocationV1 } from "./execution-adapter-contracts.ts";

export const INVOCATION_CONTEXT_START = "[AUTOBUILD INVOCATION]";
export const INVOCATION_CONTEXT_END = "[/AUTOBUILD INVOCATION]";

export type InvocationContextManifest = {
  run: {
    executionId: string;
    schedulerJobId?: string;
    attempt?: number;
    mode: "first_run" | "retry" | "resume";
    resumeReason?: string;
  };
  project: {
    projectId?: string;
    workspaceRoot: string;
    memoryRef?: InvocationFileRef;
    constitutionRef?: InvocationFileRef;
    agentsRef?: InvocationFileRef;
  };
  task: {
    featureId?: string;
    taskId?: string;
    requestedAction: string;
    skillName: string;
    sourceRefs: string[];
  };
  controlPlaneFacts: {
    blockers: string[];
    prohibitedOperations: string[];
    pendingApprovals: string[];
    lastRunSummary?: string;
    resumeTarget?: string;
  };
  constraints: {
    allowedFiles: string[];
    forbiddenFiles: string[];
    requiredCommands: string[];
    risk?: string;
    sandboxMode?: string;
    approvalPolicy?: string;
  };
  output: {
    contractVersion: "skill-contract/v1" | "skill-contract/v2";
    requiredFields: string[];
  };
};

export type InvocationFileRef = {
  path: string;
  checksum?: string;
};

export function buildInvocationContextManifest(invocation: ExecutionAdapterInvocationV1): InvocationContextManifest {
  const mode = invocation.resume ? "resume" : "first_run";
  const requiredFields = invocation.skillInstruction.requestedAction === "feature_execution"
    ? ["requirementCoverage", "acceptanceEvidence", "journeyEvidence", "deliveryFidelity", "gitDelivery", "runtimeEvidence when UI/app behavior is changed"]
    : ["status", "summary", "producedArtifacts", "traceability", "result"];
  return {
    run: {
      executionId: invocation.executionId,
      schedulerJobId: invocation.jobId,
      mode,
      resumeReason: invocation.resume ? "adapter resume requested" : undefined,
    },
    project: {
      projectId: invocation.projectId,
      workspaceRoot: invocation.workspaceRoot,
      memoryRef: fileRef(invocation.workspaceRoot, ".autobuild/memory/project.md"),
      constitutionRef: fileRef(invocation.workspaceRoot, ".autobuild/memory/constitution.md"),
      agentsRef: fileRef(invocation.workspaceRoot, "AGENTS.md"),
    },
    task: {
      featureId: invocation.featureId ?? invocation.traceability.featureId,
      taskId: invocation.traceability.taskId,
      requestedAction: invocation.skillInstruction.requestedAction,
      skillName: invocation.skillInstruction.skillName,
      sourceRefs: invocation.skillInstruction.sourcePaths,
    },
    controlPlaneFacts: {
      blockers: stringArrayFromSpecState(invocation.specState?.blockedReasons),
      prohibitedOperations: stringArrayFromSpecState((invocation.constraints as Record<string, unknown>).forbiddenOperations),
      pendingApprovals: stringArrayFromSpecState(invocation.specState?.pendingApprovals),
      lastRunSummary: optionalString(invocation.specState?.lastResult),
      resumeTarget: optionalString(invocation.specState?.resumeTarget),
    },
    constraints: {
      allowedFiles: invocation.constraints.allowedFiles,
      forbiddenFiles: stringArrayFromSpecState((invocation.constraints as Record<string, unknown>).forbiddenFiles),
      requiredCommands: stringArrayFromSpecState((invocation.constraints as Record<string, unknown>).requiredCommands),
      risk: invocation.constraints.risk,
      sandboxMode: invocation.constraints.sandboxMode,
      approvalPolicy: invocation.constraints.approvalPolicy,
    },
    output: {
      contractVersion: invocation.skillInstruction.requestedAction === "feature_execution" ? "skill-contract/v2" : "skill-contract/v1",
      requiredFields,
    },
  };
}

export function ensureInvocationContextPrompt(prompt: string, invocation?: ExecutionAdapterInvocationV1): string {
  if (!invocation) return prompt;
  if (prompt.includes(INVOCATION_CONTEXT_START)) return prompt;
  return [
    renderInvocationContextManifest(buildInvocationContextManifest(invocation)),
    "",
    prompt,
  ].join("\n");
}

export function renderInvocationContextManifest(manifest: InvocationContextManifest): string {
  return [
    INVOCATION_CONTEXT_START,
    "",
    "Do not rely only on this prompt for repository context. Read the referenced project files directly.",
    "",
    `Run: executionId=${manifest.run.executionId}; schedulerJobId=${manifest.run.schedulerJobId ?? "none"}; mode=${manifest.run.mode}`,
    `Project: projectId=${manifest.project.projectId ?? "none"}; workspaceRoot=${manifest.project.workspaceRoot}`,
    "Project references:",
    `- ${formatRef(manifest.project.agentsRef ?? { path: "AGENTS.md" })}`,
    `- ${formatRef(manifest.project.memoryRef ?? { path: ".autobuild/memory/project.md" })}`,
    `- ${formatRef(manifest.project.constitutionRef ?? { path: ".autobuild/memory/constitution.md" })}`,
    "Task:",
    `- featureId: ${manifest.task.featureId ?? "none"}`,
    `- taskId: ${manifest.task.taskId ?? "none"}`,
    `- skillName: ${manifest.task.skillName}`,
    `- requestedAction: ${manifest.task.requestedAction}`,
    "Source refs:",
    ...manifest.task.sourceRefs.map((ref) => `- ${ref}`),
    "Control-plane facts:",
    `- blockers: ${formatList(manifest.controlPlaneFacts.blockers)}`,
    `- prohibitedOperations: ${formatList(manifest.controlPlaneFacts.prohibitedOperations)}`,
    `- pendingApprovals: ${formatList(manifest.controlPlaneFacts.pendingApprovals)}`,
    `- resumeTarget: ${manifest.controlPlaneFacts.resumeTarget ?? "none"}`,
    "Execution boundary:",
    `- allowedFiles: ${formatList(manifest.constraints.allowedFiles)}`,
    `- forbiddenFiles: ${formatList(manifest.constraints.forbiddenFiles)}`,
    `- requiredCommands: ${formatList(manifest.constraints.requiredCommands)}`,
    `- sandbox: ${manifest.constraints.sandboxMode ?? "default"}`,
    `- approval: ${manifest.constraints.approvalPolicy ?? "default"}`,
    "Output:",
    `- contractVersion: ${manifest.output.contractVersion}`,
    `- requiredFields: ${manifest.output.requiredFields.join(", ")}`,
    "",
    INVOCATION_CONTEXT_END,
  ].join("\n");
}

function fileRef(workspaceRoot: string, path: string): InvocationFileRef | undefined {
  const fullPath = join(workspaceRoot, path);
  if (!existsSync(fullPath)) return { path };
  return { path, checksum: checksumFile(fullPath) };
}

function checksumFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16);
}

function formatRef(ref: InvocationFileRef): string {
  return ref.checksum ? `${ref.path} sha256:${ref.checksum}` : ref.path;
}

function formatList(values: string[]): string {
  return values.length ? values.join(", ") : "none";
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return typeof record.summary === "string" ? record.summary : undefined;
  }
  return undefined;
}

function stringArrayFromSpecState(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}
