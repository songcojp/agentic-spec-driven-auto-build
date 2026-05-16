import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { accessSync, constants, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { delimiter as pathDelimiter, dirname, join, normalize as normalizeFilePath } from "node:path";
import { ORDINARY_LOG_SECRET_PATTERNS } from "./persistence.ts";
import {
  buildFailureFingerprint,
  buildRecoveryDispatchInput,
  buildRecoveryTask,
  listRecoveryHistory,
  persistRecoveryAttempt,
  persistRecoveryResultHandling,
  type RecoveryDispatchInput,
  type ForbiddenRetryRecord,
  type RecoveryAttempt,
  type RecoveryResultHandling,
  type RecoveryTask,
} from "./recovery.ts";
import { runSqlite, type SqlStatement } from "./sqlite.ts";
import type { RiskLevel } from "./orchestration.ts";
import type { TestRunnerIsolationInput, WorktreeRecord } from "./workspace.ts";
import {
  runStatusCheck,
  type CommandCheckKind,
  type CommandCheckResult,
  type CommandCheckStatus,
  type CompletionEvidenceInput,
  type DiffSummary,
  type ExecutionArtifactRef,
  type RunnerTerminalStatus,
  type SpecAlignmentInput,
  type StatusCheckResult,
  type StatusDecision,
} from "./status-checker.ts";
import type {
  ExecutionAdapterInvocationV1,
  ExecutionAdapterConfigV1,
  ExecutionAdapterProviderSessionV1,
  ExecutionAdapterResultV1,
} from "./execution-adapter-contracts.ts";
import {
  normalizeCostRates,
  validateCostRates,
  type TokenCostRate,
} from "./adapter-pricing.ts";
import {
  applyCodexCliAdapterPromptRules,
  CODEX_CLI_ADAPTER_CONFIG,
  DEFAULT_CLI_ADAPTER_CONFIG,
} from "./codex-cli-adapter.ts";
import { CLAUDE_CLI_ADAPTER_CONFIG, claudeAllowedTools, claudePermissionMode } from "./claude-cli-adapter.ts";
import { GEMINI_CLI_ADAPTER_CONFIG, geminiApprovalMode } from "./gemini-cli-adapter.ts";
import { isAppTouchingFile, isFeatureExecutionInvocation, validateFeatureCompletion } from "./quality-gates.ts";
import { buildInvocationContextManifest, ensureInvocationContextPrompt, renderInvocationContextManifest } from "./invocation-context.ts";
import { createRunWorkpad } from "./workpad.ts";

export { CODEX_CLI_ADAPTER_CONFIG, DEFAULT_CLI_ADAPTER_CONFIG } from "./codex-cli-adapter.ts";
export { CLAUDE_CLI_ADAPTER_CONFIG } from "./claude-cli-adapter.ts";
export { GEMINI_CLI_ADAPTER_CONFIG } from "./gemini-cli-adapter.ts";
export type { TokenCostRate } from "./adapter-pricing.ts";

export type RunnerSandboxMode = "read-only" | "workspace-write" | "danger-full-access";
export type RunnerApprovalPolicy = "untrusted" | "on-failure" | "on-request" | "never" | "bypass";
export type RunnerReasoningEffort = "low" | "medium" | "high" | "xhigh";
export type RunnerServiceTier = "standard" | "fast";
export const SKILL_OUTPUT_STATUSES = [
  "queued",
  "running",
  "waiting_input",
  "approval_needed",
  "review_needed",
  "blocked",
  "failed",
  "cancelled",
  "completed",
] as const;
export type SkillOutputStatus = typeof SKILL_OUTPUT_STATUSES[number];
export type RunnerQueueStatus = SkillOutputStatus;
const TERMINAL_SKILL_OUTPUT_STATUSES = new Set<SkillOutputStatus>(["completed", "review_needed", "blocked", "failed", "cancelled"]);
const DEFAULT_TERMINAL_CONTRACT_DRAIN_MS = 10_000;
const STDIN_WAIT_AFTER_TERMINAL_CONTRACT_PATTERN = /Reading additional input from stdin/i;

export type RunnerPolicy = {
  id: string;
  runId: string;
  risk: RiskLevel;
  sandboxMode: RunnerSandboxMode;
  approvalPolicy: RunnerApprovalPolicy;
  model: string;
  reasoningEffort: RunnerReasoningEffort;
  profile?: string;
  outputSchema: Record<string, unknown>;
  workspaceRoot: string;
  testEnvironmentIsolation?: TestRunnerIsolationInput;
  resumeSessionId?: string;
  heartbeatIntervalSeconds: number;
  commandTimeoutMs: number;
  createdAt: string;
};

export type RunnerHeartbeat = {
  id: string;
  runId: string;
  runnerId: string;
  status: "online" | "offline";
  sandboxMode: RunnerSandboxMode;
  approvalPolicy: RunnerApprovalPolicy;
  queueStatus: RunnerQueueStatus;
  message?: string;
  beatAt: string;
};

export type CliSessionRecord = {
  id: string;
  runId: string;
  sessionId?: string;
  workspaceRoot: string;
  command: string;
  args: string[];
  exitCode: number | null;
  startedAt: string;
  completedAt: string;
};

export type RawExecutionLog = {
  id: string;
  runId: string;
  stdout: string;
  stderr: string;
  events: CliJsonEvent[];
  files?: CliInvocationLogFiles;
  commandTermination?: CliCommandTermination;
  createdAt: string;
};

export type CliJsonEvent = {
  type?: string;
  session_id?: string;
  [key: string]: unknown;
};

export type CliAdapterStatus = "draft" | "active" | "disabled" | "invalid";
export type CliImageGenerationOperation = "generate" | "edit" | "restore" | "icon" | "pattern" | "story" | "diagram" | "natural_language";

export type CliImageGenerationInterface = {
  provider: string;
  invocation: "codex-skill" | "gemini-extension-command" | "cli-command";
  operations: CliImageGenerationOperation[];
  commands?: Partial<Record<CliImageGenerationOperation, string>>;
  defaultModel?: string;
  modelEnvVar?: string;
  requiredEnv?: string[];
  outputFormats: string[];
  maxVariations?: number;
  outputPathArgument?: string;
  inputImageArgument?: string;
  countArgument?: string;
  notes?: string[];
};

export type CliAdapterConfig = {
  id: string;
  displayName: string;
  schemaVersion: number;
  executable: string;
  argumentTemplate: string[];
  resumeArgumentTemplate?: string[];
  configSchema: Record<string, unknown>;
  formSchema: Record<string, unknown>;
  defaults: {
    model?: string;
    reasoningEffort?: RunnerReasoningEffort;
    reasoning_effort?: RunnerReasoningEffort;
    serviceTier?: RunnerServiceTier;
    service_tier?: RunnerServiceTier;
    fastMode?: boolean;
    fast_mode?: boolean;
    profile?: string;
    sandbox?: RunnerSandboxMode;
    approval?: RunnerApprovalPolicy;
    costRates?: Record<string, TokenCostRate>;
  };
  imageGeneration?: CliImageGenerationInterface;
  environmentAllowlist: string[];
  outputMapping: {
    eventStream: "json";
    outputSchema: string;
    sessionIdPath: string;
    responseTextPaths?: string[];
  };
  status: CliAdapterStatus;
  updatedAt: string;
};

export type ExecutionPolicy = RunnerPolicy;
export type ExecutionHeartbeat = RunnerHeartbeat;
export type ExecutionSessionRecord = CliSessionRecord;

export type CliAdapterValidationResult = {
  valid: boolean;
  errors: string[];
  command?: string;
  args?: string[];
};

export type RunnerExecutionResultInput = {
  runId: string;
  taskId?: string;
  featureId?: string;
  sessionId?: string;
  exitCode: number | null;
  events: CliJsonEvent[];
  stdout: string;
  stderr: string;
  testEnvironmentIsolation?: TestRunnerIsolationInput;
  executionInvocation?: ExecutionAdapterInvocationV1;
  skillOutput?: SkillOutputContract;
  contractValidation?: SkillContractValidationResult;
  logFiles?: CliInvocationLogFiles;
  commandTermination?: CliCommandTermination;
};

export type CliInvocationLogFiles = {
  input: string;
  output: string;
  stdout: string;
  stderr: string;
  report: string;
  workpadMarkdown?: string;
  workpadJson?: string;
};

export type RunnerPolicyInput = {
  runId: string;
  risk: RiskLevel;
  taskType?: string;
  workspaceRoot: string;
  model?: string;
  reasoningEffort?: RunnerReasoningEffort;
  profile?: string;
  outputSchema?: Record<string, unknown>;
  resumeSessionId?: string;
  requestedSandboxMode?: RunnerSandboxMode;
  requestedApprovalPolicy?: RunnerApprovalPolicy;
  testEnvironmentIsolation?: TestRunnerIsolationInput;
  heartbeatIntervalSeconds?: number;
  commandTimeoutMs?: number;
  now?: Date;
};

export type SafetyGateInput = {
  policy: RunnerPolicy;
  prompt?: string;
  files?: string[];
  commands?: string[];
  taskText?: string;
  executionInvocation?: ExecutionAdapterInvocationV1;
};

export type SafetyGateResult = {
  allowed: boolean;
  reviewNeeded: boolean;
  reasons: string[];
  summary: string;
};

export type CliCommandResult = {
  status: number | null;
  stdout?: string;
  stderr?: string;
  error?: Error;
  commandTermination?: CliCommandTermination;
};

export type CliCommandRunner = (command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv) => CliCommandResult;
export type AsyncCliCommandRunner = (command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv) => Promise<CliCommandResult>;

export type CliCommandTerminationReason = "terminal_contract_drain_timeout" | "stdin_wait_after_terminal_contract";

export type CliCommandTermination = {
  terminatedAfterTerminalContract: boolean;
  reason: CliCommandTerminationReason;
};

export type RunCommandOptions = {
  terminalOutputGraceMs?: number;
  hasTerminalOutput?: (stdout: string, stderr: string) => boolean;
  terminationReason?: (stdout: string, stderr: string) => CliCommandTerminationReason;
  env?: NodeJS.ProcessEnv;
};

export type CliAdapterInput = {
  policy: RunnerPolicy;
  prompt: string;
  taskId?: string;
  featureId?: string;
  outputSchemaPath?: string;
  imagePaths?: string[];
  adapterConfig?: CliAdapterConfig;
  executionInvocation?: ExecutionAdapterInvocationV1;
  runner?: CliCommandRunner;
  asyncRunner?: AsyncCliCommandRunner;
  onHeartbeat?: () => void;
  terminalContractGraceMs?: number;
  now?: Date;
};

export type CliAdapterResult = {
  session: CliSessionRecord;
  rawLog: RawExecutionLog;
  result: RunnerExecutionResultInput;
  executionAdapterResult?: ExecutionAdapterResultV1;
};

export type RunnerQueueItem = {
  runId: string;
  taskId?: string;
  featureId?: string;
  prompt: string;
  policy: RunnerPolicy;
  files?: string[];
  commands?: string[];
  taskText?: string;
  statusCheck?: RunnerStatusCheckInput;
  adapterConfig?: CliAdapterConfig;
  recoveryDispatcher?: (dispatch: RecoveryDispatch) => void | Promise<void>;
  executionInvocation?: ExecutionAdapterInvocationV1;
};

export type SkillOperatorInputContract = {
  clarificationText?: string;
  comment?: string;
  specChangeIntent?: string;
  desiredOutcome?: string;
  targetFeatureStatus?: string;
  nextUserAction?: string;
};

export type SkillArtifactContract = {
  path: string;
  kind: string;
  required: boolean;
};

export type SkillTraceabilityContract = {
  featureId?: string;
  taskId?: string;
  requirementIds?: string[];
  changeIds?: string[];
};

export type SkillInvocationConstraints = {
  allowedFiles: string[];
  sandboxMode?: RunnerSandboxMode;
  approvalPolicy?: RunnerApprovalPolicy;
  risk: RiskLevel;
};

export type SkillOutputArtifact = {
  path: string;
  kind: string;
  status: "created" | "updated" | "unchanged" | "missing" | "skipped";
  checksum?: string;
  summary?: string;
};

export type SkillOutputContract = {
  contractVersion: "skill-contract/v1" | "skill-contract/v2";
  executionId: string;
  skillName: string;
  requestedAction: string;
  status: SkillOutputStatus;
  summary: string;
  nextAction: string | null;
  producedArtifacts: SkillOutputArtifact[];
  traceability: SkillTraceabilityContract;
  result: Record<string, unknown>;
};

export type SkillContractValidationResult = {
  valid: boolean;
  reasons: string[];
};

export type JourneyClosureGate = {
  passed: boolean;
  reason?: "journey_not_closed" | "acceptance_gap" | "evidence_missing";
  details: string[];
};

export type DeliveryFidelityGate = {
  passed: boolean;
  reason?: "quality_evidence_gap" | "test_semantics_gap" | "journey_bypassed_by_fixture";
  details: string[];
};

export type GitDeliveryGate = {
  passed: boolean;
  reason?: "delivery_evidence_missing" | "delivery_not_closed";
  details: string[];
};

export type WorkspaceValidationResult = {
  valid: boolean;
  workspaceRoot?: string;
  blockedReasons: string[];
};

export type RecoveryDispatch = {
  scheduledAt: string;
  policy: RunnerPolicy;
  dispatchInput: RecoveryDispatchInput;
};

export type PersistedRecoveryDispatch = RecoveryDispatch & {
  dispatchId: string;
  status: "running";
};

export type RecoveryDispatchRunner = (dispatch: PersistedRecoveryDispatch) => Promise<void> | void;

export type RunnerQueueWorkerResult = {
  runId: string;
  status: RunnerQueueStatus;
  safety: SafetyGateResult;
  adapterResult?: CliAdapterResult;
  statusCheckResult?: StatusCheckResult;
  recoveryTask?: RecoveryTask;
  recoveryDispatchInput?: RecoveryDispatchInput;
  recoverySafety?: SafetyGateResult;
  recoveryDispatch?: RecoveryDispatch;
  summary: string;
};

export type RunnerStatusCheckInput = {
  dbPath?: string;
  workspaceRoot?: string;
  artifactRoot?: string;
  diff?: DiffSummary;
  commandChecks?: CommandCheckResult[];
  requiredCommandChecks?: CommandCheckKind[];
  specAlignment?: SpecAlignmentInput;
  allowedFiles?: string[];
  forbiddenFiles?: string[];
  failureHistory?: Array<StatusDecision | RunnerTerminalStatus | CommandCheckStatus>;
  failureThreshold?: number;
  artifacts?: ExecutionArtifactRef[];
  recoveryAttempts?: RecoveryAttempt[];
  forbiddenRetryItems?: ForbiddenRetryRecord[];
  recoveryResult?: RecoveryResultHandling;
  testEnvironmentIsolation?: TestRunnerIsolationInput;
};

export type RunnerConsoleSnapshot = {
  runnerId: string;
  online: boolean;
  lastHeartbeatAt?: string;
  runnerModel?: string;
  sandboxMode: RunnerSandboxMode;
  approvalPolicy: RunnerApprovalPolicy;
  queue: Array<{ runId: string; status: RunnerQueueStatus }>;
  recentLogs: Array<{ runId: string; stdout: string; stderr: string; createdAt: string }>;
  heartbeatStale: boolean;
};

const DEFAULT_REASONING_EFFORT: RunnerReasoningEffort = DEFAULT_CLI_ADAPTER_CONFIG.defaults.reasoningEffort ?? "high";
const DEFAULT_COMMAND_TIMEOUT_MS = 15 * 60 * 1000;

export function cliAdapterConfigToExecutionAdapterConfig(config: CliAdapterConfig): ExecutionAdapterConfigV1 {
  const capabilities = ["process", "json-events", "skill-output-contract"];
  if (config.imageGeneration) {
    capabilities.push("image-generation");
    for (const operation of config.imageGeneration.operations) {
      capabilities.push(`image-generation:${operation}`);
    }
  }
  return {
    id: config.id,
    kind: "cli",
    displayName: config.displayName,
    provider: config.id,
    schemaVersion: config.schemaVersion,
    transport: "process",
    capabilities,
    defaults: {
      model: config.defaults.model,
      reasoningEffort: config.defaults.reasoningEffort ?? config.defaults.reasoning_effort,
      serviceTier: config.defaults.serviceTier ?? config.defaults.service_tier,
      fastMode: config.defaults.fastMode ?? config.defaults.fast_mode,
      profile: config.defaults.profile,
      sandbox: config.defaults.sandbox,
      approval: config.defaults.approval,
      costRates: config.defaults.costRates,
    },
    inputMapping: {
      executable: config.executable,
      argumentTemplate: config.argumentTemplate,
      resumeArgumentTemplate: config.resumeArgumentTemplate,
      imageGeneration: config.imageGeneration,
    },
    outputMapping: config.outputMapping,
    security: {
      environmentAllowlist: config.environmentAllowlist,
    },
    status: config.status,
    updatedAt: config.updatedAt,
  };
}

export function defaultCliEnvironmentFiles(env: NodeJS.ProcessEnv = process.env): string[] {
  const home = env.HOME?.trim() || homedir();
  const explicitFiles = String(env.AUTOBUILD_CLI_ENV_FILE ?? "")
    .split(pathDelimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return uniqueStrings([
    join(home, ".bashrc"),
    join(home, ".bash_profile"),
    join(home, ".profile"),
    join(home, ".zshrc"),
    join(home, ".config", "specdrive", "cli.env"),
    join(home, ".specdrive", "cli.env"),
    join(home, ".claude-code-env"),
    ...explicitFiles.map((entry) => expandHomePath(entry, home)),
  ]);
}

export function buildCliAdapterEnvironment(
  config: CliAdapterConfig,
  baseEnv: NodeJS.ProcessEnv = process.env,
  envFiles: string[] = defaultCliEnvironmentFiles(baseEnv),
): NodeJS.ProcessEnv {
  const allowed = new Set(config.environmentAllowlist);
  if (allowed.size === 0) return { ...baseEnv };
  const fileEnv: Record<string, string> = {};
  for (const file of envFiles) {
    const parsed = parseCliEnvironmentFile(file);
    for (const [key, value] of Object.entries(parsed)) {
      if (allowed.has(key)) fileEnv[key] = value;
    }
  }
  const merged: NodeJS.ProcessEnv = { ...baseEnv };
  for (const [key, value] of Object.entries(fileEnv)) {
    if (merged[key] === undefined || merged[key] === "") {
      merged[key] = value;
    }
  }
  return merged;
}

function parseCliEnvironmentFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  let content = "";
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  const values: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseCliEnvironmentLine(line);
    if (parsed) values[parsed.key] = parsed.value;
  }
  return values;
}

function parseCliEnvironmentLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;
  const withoutExport = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trim() : trimmed;
  const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(withoutExport);
  if (!match) return undefined;
  return { key: match[1], value: unquoteEnvValue(match[2].trim()) };
}

function unquoteEnvValue(value: string): string {
  if (value.length >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
    return value.slice(1, -1).replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  const commentIndex = value.search(/\s+#/);
  return commentIndex >= 0 ? value.slice(0, commentIndex).trimEnd() : value;
}

function expandHomePath(path: string, home: string): string {
  return path === "~" ? home : path.startsWith("~/") ? join(home, path.slice(2)) : path;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
export const DEFAULT_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "contractVersion",
    "executionId",
    "skillName",
    "requestedAction",
    "status",
    "summary",
    "nextAction",
    "producedArtifacts",
    "traceability",
    "result",
  ],
  properties: {
    contractVersion: { type: "string", const: "skill-contract/v1" },
    executionId: { type: "string" },
    skillName: { type: "string" },
    requestedAction: { type: "string" },
    summary: { type: "string" },
    nextAction: { type: ["string", "null"] },
    status: { type: "string", enum: [...SKILL_OUTPUT_STATUSES] },
    producedArtifacts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "kind", "status", "checksum", "summary"],
        properties: {
          path: { type: "string" },
          kind: { type: "string" },
          status: { type: "string", enum: ["created", "updated", "unchanged", "missing", "skipped"] },
          checksum: { type: ["string", "null"] },
          summary: { type: ["string", "null"] },
        },
      },
    },
    traceability: {
      type: "object",
      additionalProperties: false,
      required: ["featureId"],
      properties: {
        featureId: { type: ["string", "null"] },
      },
    },
    result: {
      type: "object",
      additionalProperties: false,
      required: ["resultSummary", "details", "items", "openQuestions"],
      properties: {
        resultSummary: { type: ["string", "null"] },
        details: { type: ["string", "null"] },
        items: { type: "array", items: { type: "string" } },
        openQuestions: { type: "array", items: { type: "string" } },
      },
    },
  },
};
const TASK_SLICING_RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["features", "queuePlan", "dependencyGraph", "userStoryMapping", "verificationPlan", "openQuestions"],
  properties: {
    features: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "status", "milestone", "dependencies", "primaryRequirements"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          status: { type: "string" },
          milestone: { type: "string" },
          dependencies: { type: "array", items: { type: "string" } },
          primaryRequirements: { type: "array", items: { type: "string" } },
        },
      },
    },
    queuePlan: {
      type: "object",
      additionalProperties: false,
      required: ["path", "runnableOrder", "blockedEntries", "summary"],
      properties: {
        path: { type: "string" },
        runnableOrder: { type: "array", items: { type: "string" } },
        blockedEntries: { type: "array", items: { type: "string" } },
        summary: { type: ["string", "null"] },
      },
    },
    dependencyGraph: {
      type: "object",
      additionalProperties: false,
      required: ["relationships", "missingDependencies"],
      properties: {
        relationships: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["from", "to", "type"],
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              type: { type: "string" },
            },
          },
        },
        missingDependencies: { type: "array", items: { type: "string" } },
      },
    },
    userStoryMapping: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["userStoryId", "featureId", "taskCheckpoints"],
        properties: {
          userStoryId: { type: "string" },
          featureId: { type: "string" },
          taskCheckpoints: { type: "array", items: { type: "string" } },
        },
      },
    },
    verificationPlan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["scope", "checks"],
        properties: {
          scope: { type: "string" },
          checks: { type: "array", items: { type: "string" } },
        },
      },
    },
    openQuestions: { type: "array", items: { type: "string" } },
  },
};
const CANONICAL_EVIDENCE_STATUS_SCHEMA = { type: "string", enum: ["passed", "failed", "blocked", "review_needed", "skipped"] };
const CANONICAL_DELIVERY_STATUS_SCHEMA = { type: "string", enum: ["passed", "failed", "blocked", "skipped", "not_required"] };
const FEATURE_EXECUTION_RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "resultSummary",
    "details",
    "items",
    "openQuestions",
    "changedFiles",
    "requirementCoverage",
    "acceptanceEvidence",
    "journeyEvidence",
    "runtimeEvidence",
    "runtimeExemption",
    "deliveryFidelity",
    "foundationExemption",
    "verification",
    "tasks",
    "gates",
    "delegation",
    "gitDelivery",
    "tokenUsage",
    "risks",
    "blockedReason",
  ],
  properties: {
    resultSummary: { type: ["string", "null"] },
    details: { type: ["string", "null"] },
    items: { type: "array", items: { type: "string" } },
    openQuestions: { type: "array", items: { type: "string" } },
    changedFiles: { type: "array", items: { type: "string" } },
    requirementCoverage: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirementId", "status", "evidence"],
        properties: {
          requirementId: { type: "string" },
          status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
          evidence: { type: "array", items: { type: "string" } },
        },
      },
    },
    acceptanceEvidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["scenarioId", "status", "evidence"],
        properties: {
          scenarioId: { type: "string" },
          status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
          evidence: { type: "array", items: { type: "string" } },
        },
      },
    },
    journeyEvidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["userStoryId", "scenario", "status", "evidence"],
        properties: {
          userStoryId: { type: "string" },
          scenario: { type: "string" },
          status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
          evidence: { type: "array", items: { type: "string" } },
        },
      },
    },
    runtimeEvidence: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["appLaunch", "journeys", "stateAssertions", "negativePaths"],
      properties: {
        appLaunch: {
          type: "object",
          additionalProperties: false,
          required: ["command", "status", "url", "evidence"],
          properties: {
            command: { type: "string" },
            status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
            url: { type: ["string", "null"] },
            evidence: { type: "array", items: { type: "string" } },
          },
        },
        journeys: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["journeyId", "status", "mode", "steps", "evidence"],
            properties: {
              journeyId: { type: "string" },
              status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
              mode: { type: "string" },
              steps: { type: "array", items: { type: "string" } },
              evidence: { type: "array", items: { type: "string" } },
            },
          },
        },
        stateAssertions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["assertion", "status", "evidence"],
            properties: {
              assertion: { type: "string" },
              status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
              evidence: { type: "array", items: { type: "string" } },
            },
          },
        },
        negativePaths: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["scenario", "status", "evidence"],
            properties: {
              scenario: { type: "string" },
              status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
              evidence: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    runtimeExemption: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["exempt", "reason", "evidence"],
      properties: {
        exempt: { type: "boolean" },
        reason: { type: "string" },
        evidence: { type: "array", items: { type: "string" } },
      },
    },
    deliveryFidelity: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["sourceIntent", "journeys", "behaviorObligations", "handoffs", "losses", "evidence", "agentReviews", "completionDecision"],
      properties: {
        sourceIntent: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "summary", "sourceRef", "status"],
            properties: {
              id: { type: "string" },
              summary: { type: "string" },
              sourceRef: { type: "string" },
              status: { type: "string", enum: ["preserved", "deferred", "changed", "lost"] },
            },
          },
        },
        journeys: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "summary", "status", "obligations"],
            properties: {
              id: { type: "string" },
              summary: { type: "string" },
              status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
              obligations: { type: "array", items: { type: "string" } },
            },
          },
        },
        behaviorObligations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "sourceRef", "description", "status", "evidenceRefs"],
            properties: {
              id: { type: "string" },
              sourceRef: { type: "string" },
              description: { type: "string" },
              status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
              evidenceRefs: { type: "array", items: { type: "string" } },
            },
          },
        },
        handoffs: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["from", "to", "preservedObligations", "losses", "status"],
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              preservedObligations: { type: "array", items: { type: "string" } },
              losses: { type: "array", items: { type: "string" } },
              status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
            },
          },
        },
        losses: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["type", "severity", "status", "description", "owner", "evidenceRefs"],
            properties: {
              type: { type: "string" },
              severity: { type: "string" },
              status: { type: "string", enum: ["closed", "deferred", "accepted", "open"] },
              description: { type: "string" },
              owner: { type: "string" },
              evidenceRefs: { type: "array", items: { type: "string" } },
            },
          },
        },
        evidence: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "type", "mode", "assertion", "source", "covers", "status", "artifactRefs"],
            properties: {
              id: { type: "string" },
              type: { type: "string" },
              mode: { type: "string" },
              assertion: { type: "string" },
              source: { type: "string" },
              covers: { type: "array", items: { type: "string" } },
              status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
              artifactRefs: { type: "array", items: { type: "string" } },
            },
          },
        },
        agentReviews: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["role", "reviewer", "status", "findings", "evidenceRefs"],
            properties: {
              role: { type: "string" },
              reviewer: { type: "string" },
              status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
              findings: { type: "array", items: { type: "string" } },
              evidenceRefs: { type: "array", items: { type: "string" } },
            },
          },
        },
        completionDecision: {
          type: "object",
          additionalProperties: false,
          required: ["status", "reason", "decidedBy", "unresolvedLosses"],
          properties: {
            status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
            reason: { type: "string" },
            decidedBy: { type: "string" },
            unresolvedLosses: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    foundationExemption: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["exempt", "reason", "downstreamFeatures", "integrationEvidence"],
      properties: {
        exempt: { type: "boolean" },
        reason: { type: "string" },
        downstreamFeatures: { type: "array", items: { type: "string" } },
        integrationEvidence: { type: "array", items: { type: "string" } },
      },
    },
    verification: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["command", "status", "summary"],
        properties: {
          command: { type: "string" },
          status: { type: "string", enum: ["passed", "failed", "skipped"] },
          summary: { type: "string" },
        },
      },
    },
    tasks: {
      type: "object",
      additionalProperties: false,
      required: ["done", "blocked"],
      properties: {
        done: { type: "array", items: { type: "string" } },
        blocked: { type: "array", items: { type: "string" } },
      },
    },
    gates: {
      type: "object",
      additionalProperties: false,
      required: ["requirements", "design", "codeReview"],
      properties: {
        requirements: { type: "string" },
        design: { type: "string" },
        codeReview: { type: "string" },
      },
    },
    delegation: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["role", "status", "files", "note"],
        properties: {
          role: { type: "string" },
          status: CANONICAL_EVIDENCE_STATUS_SCHEMA,
          files: { type: "array", items: { type: "string" } },
          note: { type: "string" },
        },
      },
    },
    gitDelivery: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["ownerWorkspace", "implementationWorkspace", "worktree", "branch", "commitHash", "prUrl", "checks", "merge", "remoteBranchCleanup", "localBranchCleanup", "worktreeCleanup", "deliveryExemption"],
      properties: {
        ownerWorkspace: { type: "string" },
        implementationWorkspace: { type: "string" },
        worktree: { type: "string" },
        branch: { type: "string" },
        commitHash: { type: "string" },
        prUrl: { type: ["string", "null"] },
        checks: CANONICAL_DELIVERY_STATUS_SCHEMA,
        merge: CANONICAL_DELIVERY_STATUS_SCHEMA,
        remoteBranchCleanup: CANONICAL_DELIVERY_STATUS_SCHEMA,
        localBranchCleanup: CANONICAL_DELIVERY_STATUS_SCHEMA,
        worktreeCleanup: CANONICAL_DELIVERY_STATUS_SCHEMA,
        deliveryExemption: {
          type: ["object", "null"],
          additionalProperties: false,
          required: ["approved", "reason", "evidence"],
          properties: {
            approved: { type: "boolean" },
            reason: { type: "string" },
            evidence: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    tokenUsage: {
      type: "object",
      additionalProperties: false,
      required: ["parentUsagePresent", "subagentUsageObservable"],
      properties: {
        parentUsagePresent: { type: "boolean" },
        subagentUsageObservable: { type: "boolean" },
      },
    },
    risks: { type: "array", items: { type: "string" } },
    blockedReason: { type: ["string", "null"] },
  },
};
const FORBIDDEN_FILE_PATTERNS = [
  /(^|\/)\.env($|\.)/,
  /(^|\/)secrets?\//i,
  /(^|\/)credentials?\//i,
  /(^|\/)id_rsa$/,
  /(^|\/)\.ssh\//,
  /(^|\/)payment/i,
  /(^|\/)auth/i,
  /(^|\/)permission/i,
  /migration/i,
];
const DANGEROUS_COMMAND_PATTERNS = [
  /\brm\s+-rf\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+push\b.*\s--force\b/,
  /\bchmod\s+777\b/,
  /\bsudo\b/,
  /\bdrop\s+database\b/i,
];
const HIGH_RISK_TEXT_PATTERNS = [/\bauth/i, /\bpermission/i, /\bpayment/i, /\bmigrat(?:e|ion)\b/i, /\bsecret/i, /\btoken/i, /\bkey/i];

export function resolveRunnerPolicy(input: RunnerPolicyInput): RunnerPolicy {
  const now = input.now ?? new Date();
  const requestedSandboxMode = input.requestedSandboxMode ?? "danger-full-access";
  const requestedApprovalPolicy = input.requestedApprovalPolicy ?? "never";
  const sandboxMode = requestedSandboxMode;
  const approvalPolicy = requestedApprovalPolicy === "bypass" ? "never" : requestedApprovalPolicy;
  const heartbeatIntervalSeconds = clampHeartbeat(input.heartbeatIntervalSeconds ?? 20);
  const commandTimeoutMs = clampCommandTimeout(input.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS);

  if (!input.workspaceRoot.trim()) {
    throw new Error("RunnerPolicy requires a workspace root.");
  }

  return {
    id: randomUUID(),
    runId: input.runId,
    risk: input.risk,
    sandboxMode,
    approvalPolicy,
    model: input.model ?? DEFAULT_CLI_ADAPTER_CONFIG.defaults.model ?? "gpt-5.5",
    reasoningEffort: input.reasoningEffort ?? DEFAULT_REASONING_EFFORT,
    profile: input.profile,
    outputSchema: input.outputSchema ?? DEFAULT_OUTPUT_SCHEMA,
    workspaceRoot: input.workspaceRoot,
    testEnvironmentIsolation: input.testEnvironmentIsolation,
    resumeSessionId: input.resumeSessionId,
    heartbeatIntervalSeconds,
    commandTimeoutMs,
    createdAt: now.toISOString(),
  };
}

export function buildRunnerPolicyFromContract(input: {
  runId: string;
  risk: RiskLevel;
  workspace: Pick<WorktreeRecord, "path">;
  outputSchema?: Record<string, unknown>;
  resumeSessionId?: string;
  testEnvironmentIsolation?: TestRunnerIsolationInput;
  now?: Date;
}): RunnerPolicy {
  return resolveRunnerPolicy({
    runId: input.runId,
    risk: input.risk,
    workspaceRoot: input.workspace.path,
    outputSchema: input.outputSchema,
    resumeSessionId: input.resumeSessionId,
    testEnvironmentIsolation: input.testEnvironmentIsolation,
    now: input.now,
  });
}

export function evaluateRunnerSafety(input: SafetyGateInput): SafetyGateResult {
  const reasons: string[] = [];
  if (input.policy.approvalPolicy === "bypass") {
    reasons.push("approval bypass is not allowed for automatic runner execution");
  }

  for (const file of input.files ?? []) {
    if (FORBIDDEN_FILE_PATTERNS.some((pattern) => pattern.test(normalizePath(file)))) {
      reasons.push(`forbidden or high-risk file requires review: ${file}`);
    }
  }

  for (const command of input.commands ?? []) {
    if (DANGEROUS_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) {
      reasons.push(`dangerous command requires review: ${command}`);
    }
    if (HIGH_RISK_TEXT_PATTERNS.some((pattern) => pattern.test(command))) {
      reasons.push(`high-risk command requires review: ${command}`);
    }
  }

  const safetyText = [input.taskText, input.prompt].filter(Boolean).join("\n");
  if (safetyText && DANGEROUS_COMMAND_PATTERNS.some((pattern) => pattern.test(safetyText))) {
    reasons.push("prompt or task text includes a dangerous command and requires review");
  }
  if (safetyText && HIGH_RISK_TEXT_PATTERNS.some((pattern) => pattern.test(safetyText))) {
    reasons.push("task text or prompt references high-risk auth, permission, payment, migration, secret, token, or key changes");
  }

  const reviewNeeded = reasons.length > 0;
  return {
    allowed: !reviewNeeded,
    reviewNeeded,
    reasons,
    summary: reviewNeeded ? `Runner safety gate blocked execution: ${reasons.join("; ")}.` : "Runner safety gate passed.",
  };
}

export function isTrustedDocsDirectWriteInvocation(invocation?: ExecutionAdapterInvocationV1): boolean {
  return isTrustedDirectWriteInvocation(invocation);
}

export function isTrustedDirectWriteInvocation(invocation?: ExecutionAdapterInvocationV1, allowedFiles: string[] = []): boolean {
  if (!invocation) return false;
  const instruction = invocation.skillInstruction;
  if (!isSafeSkillName(instruction.skillName)) return false;

  const safeAllowedFiles = allowedFiles.filter(isSafeWorkspaceWritePath);
  if (instruction.skillName === "implement-feature") {
    return safeAllowedFiles.length > 0 && safeAllowedFiles.length === allowedFiles.length;
  }

  const safeArtifacts = instruction.expectedArtifacts.map((artifact) => artifact.path).filter(isSafeExpectedArtifactPath);
  return safeArtifacts.length > 0 && safeArtifacts.length === instruction.expectedArtifacts.length;
}

export function normalizeCliAdapterConfig(input: Partial<CliAdapterConfig> | Record<string, unknown>): CliAdapterConfig {
  const inputRecord = input as Record<string, unknown>;
  const baseConfig = defaultCliAdapterConfigForId(inputRecord.id);
  const defaults = isRecord(input.defaults) ? input.defaults : {};
  const costRatesSource = "costRates" in defaults || "cost_rates" in defaults
    ? defaults.costRates ?? defaults.cost_rates
    : baseConfig.defaults.costRates;
  const outputMapping = isRecord(input.outputMapping) ? input.outputMapping : {};
  const imageGeneration = normalizeImageGenerationInterface(inputRecord.imageGeneration ?? inputRecord.image_generation ?? baseConfig.imageGeneration);
  const normalized: CliAdapterConfig = {
    ...baseConfig,
    id: optionalConfigString(input.id) ?? baseConfig.id,
    displayName: optionalConfigString(input.displayName) ?? optionalConfigString(input.display_name) ?? baseConfig.displayName,
    schemaVersion: Number(input.schemaVersion ?? input.schema_version ?? baseConfig.schemaVersion),
    executable: optionalConfigString(input.executable) ?? baseConfig.executable,
    argumentTemplate: stringArray(input.argumentTemplate ?? input.argument_template, baseConfig.argumentTemplate),
    resumeArgumentTemplate: stringArray(input.resumeArgumentTemplate ?? input.resume_argument_template, baseConfig.resumeArgumentTemplate ?? []),
    configSchema: isRecord(input.configSchema) ? input.configSchema : isRecord(input.config_schema) ? input.config_schema : baseConfig.configSchema,
    formSchema: isRecord(input.formSchema) ? input.formSchema : isRecord(input.form_schema) ? input.form_schema : baseConfig.formSchema,
    defaults: {
      model: optionalConfigString(defaults.model) ?? baseConfig.defaults.model,
      reasoningEffort: normalizeReasoningEffort(defaults.reasoningEffort ?? defaults.reasoning_effort) ?? baseConfig.defaults.reasoningEffort,
      serviceTier: normalizeServiceTier(defaults.serviceTier ?? defaults.service_tier) ?? baseConfig.defaults.serviceTier,
      fastMode: optionalBoolean(defaults.fastMode ?? defaults.fast_mode) ?? baseConfig.defaults.fastMode,
      profile: optionalConfigString(defaults.profile),
      sandbox: normalizeSandbox(defaults.sandbox) ?? baseConfig.defaults.sandbox,
      approval: normalizeApproval(defaults.approval) ?? baseConfig.defaults.approval,
      costRates: normalizeCostRates(costRatesSource),
    },
    imageGeneration,
    environmentAllowlist: stringArray(input.environmentAllowlist ?? input.environment_allowlist, baseConfig.environmentAllowlist),
    outputMapping: {
      eventStream: outputMapping.eventStream === "json" || outputMapping.event_stream === "json" ? "json" : baseConfig.outputMapping.eventStream,
      outputSchema: optionalConfigString(outputMapping.outputSchema) ??
        optionalConfigString(outputMapping.output_schema) ??
        baseConfig.outputMapping.outputSchema,
      sessionIdPath: optionalConfigString(outputMapping.sessionIdPath) ?? optionalConfigString(outputMapping.session_id_path) ?? baseConfig.outputMapping.sessionIdPath,
      responseTextPaths: stringArray(outputMapping.responseTextPaths ?? outputMapping.response_text_paths, baseConfig.outputMapping.responseTextPaths ?? []),
    },
    status: normalizeAdapterStatus(input.status) ?? baseConfig.status,
    updatedAt: optionalConfigString(input.updatedAt) ?? optionalConfigString(input.updated_at) ?? new Date().toISOString(),
  };
  return upgradeBuiltInAdapterConfig(normalized);
}

function defaultCliAdapterConfigForId(id: unknown): CliAdapterConfig {
  const adapterId = optionalConfigString(id);
  if (adapterId === GEMINI_CLI_ADAPTER_CONFIG.id) return GEMINI_CLI_ADAPTER_CONFIG;
  if (adapterId === CLAUDE_CLI_ADAPTER_CONFIG.id) return CLAUDE_CLI_ADAPTER_CONFIG;
  return DEFAULT_CLI_ADAPTER_CONFIG;
}

function upgradeBuiltInAdapterConfig(config: CliAdapterConfig): CliAdapterConfig {
  const baseConfig = defaultCliAdapterConfigForId(config.id);
  if (config.id !== baseConfig.id || config.schemaVersion >= baseConfig.schemaVersion) {
    return config;
  }
  const upgraded: CliAdapterConfig = {
    ...config,
    schemaVersion: baseConfig.schemaVersion,
    imageGeneration: config.imageGeneration ?? baseConfig.imageGeneration,
  };
  if (config.id !== DEFAULT_CLI_ADAPTER_CONFIG.id) return upgraded;
  return {
    ...upgraded,
    argumentTemplate: DEFAULT_CLI_ADAPTER_CONFIG.argumentTemplate,
    resumeArgumentTemplate: DEFAULT_CLI_ADAPTER_CONFIG.resumeArgumentTemplate,
    configSchema: DEFAULT_CLI_ADAPTER_CONFIG.configSchema,
    formSchema: DEFAULT_CLI_ADAPTER_CONFIG.formSchema,
    outputMapping: DEFAULT_CLI_ADAPTER_CONFIG.outputMapping,
    imageGeneration: DEFAULT_CLI_ADAPTER_CONFIG.imageGeneration,
    defaults: {
      ...config.defaults,
      sandbox: DEFAULT_CLI_ADAPTER_CONFIG.defaults.sandbox,
      approval: DEFAULT_CLI_ADAPTER_CONFIG.defaults.approval,
      reasoningEffort: DEFAULT_CLI_ADAPTER_CONFIG.defaults.reasoningEffort,
      serviceTier: DEFAULT_CLI_ADAPTER_CONFIG.defaults.serviceTier,
      fastMode: DEFAULT_CLI_ADAPTER_CONFIG.defaults.fastMode,
    },
  };
}

export function validateCliAdapterConfig(config: CliAdapterConfig): CliAdapterValidationResult {
  const errors: string[] = [];
  if (!config.id.trim()) errors.push("id is required");
  if (!config.executable.trim()) errors.push("executable is required");
  if (config.status === "disabled") errors.push("adapter is disabled");
  if (config.status === "invalid") errors.push("adapter status is invalid");
  if (!Number.isInteger(config.schemaVersion) || config.schemaVersion < 1) errors.push("schemaVersion must be a positive integer");
  if (config.argumentTemplate.length === 0) errors.push("argumentTemplate must contain at least one argument");
  if (!config.argumentTemplate.some((entry) => entry.includes("{{prompt}}"))) errors.push("argumentTemplate must include {{prompt}}");
  if (config.outputMapping.eventStream !== "json") errors.push("outputMapping.eventStream must be json");
  if (!config.outputMapping.outputSchema.trim()) errors.push("outputMapping.outputSchema is required");
  if (!config.outputMapping.sessionIdPath.trim()) errors.push("outputMapping.sessionIdPath is required");
  if (config.defaults.approval === "bypass") errors.push("default approval may not bypass approvals");
  if (!normalizeReasoningEffort(config.defaults.reasoningEffort)) errors.push("default reasoning effort must be low, medium, high, or xhigh");
  const serviceTier = config.defaults.serviceTier ?? config.defaults.service_tier;
  const fastMode = config.defaults.fastMode ?? config.defaults.fast_mode;
  const normalizedServiceTier = normalizeServiceTier(serviceTier);
  if (serviceTier !== undefined && !normalizedServiceTier) errors.push("default service tier must be standard or fast");
  if (fastMode !== undefined && typeof fastMode !== "boolean") errors.push("default fast mode must be boolean");
  if (config.id === CODEX_CLI_ADAPTER_CONFIG.id && fastMode === true && normalizedServiceTier !== "fast") {
    errors.push("codex-cli fast mode requires defaults.serviceTier to be fast");
  }
  if (config.imageGeneration) {
    if (!config.imageGeneration.provider.trim()) errors.push("imageGeneration.provider is required");
    if (!config.imageGeneration.invocation.trim()) errors.push("imageGeneration.invocation is required");
    if (config.imageGeneration.operations.length === 0) errors.push("imageGeneration.operations must include at least one operation");
    if (config.imageGeneration.outputFormats.length === 0) errors.push("imageGeneration.outputFormats must include at least one format");
  }
  errors.push(...validateCostRates(config.defaults.costRates));
  return { valid: errors.length === 0, errors };
}

export function dryRunCliAdapterConfig(input: {
  config: CliAdapterConfig;
  policy?: RunnerPolicy;
  prompt?: string;
  outputSchemaPath?: string;
}): CliAdapterValidationResult {
  const validation = validateCliAdapterConfig(input.config);
  if (!validation.valid) {
    return validation;
  }
  try {
    const rendered = renderCliAdapterCommand({
      config: input.config,
      policy: input.policy ?? resolveRunnerPolicy({
        runId: "DRY-RUN",
        risk: "low",
        workspaceRoot: "/workspace/project",
        model: input.config.defaults.model,
        reasoningEffort: input.config.defaults.reasoningEffort,
        requestedSandboxMode: input.config.defaults.sandbox,
        requestedApprovalPolicy: input.config.defaults.approval,
        now: new Date(0),
      }),
      prompt: input.prompt ?? "Dry-run prompt",
      outputSchemaPath: input.outputSchemaPath ?? "/tmp/skill-output.schema.json",
    });
    return { valid: true, errors: [], command: rendered.command, args: rendered.args };
  } catch (error) {
    return { valid: false, errors: [error instanceof Error ? error.message : String(error)] };
  }
}

export function renderCliAdapterCommand(input: {
  config?: CliAdapterConfig;
  policy: RunnerPolicy;
  prompt: string;
  outputSchemaPath: string;
  imagePaths?: string[];
}): { command: string; args: string[] } {
  const config = input.config ?? DEFAULT_CLI_ADAPTER_CONFIG;
  const validation = validateCliAdapterConfig(config);
  if (!validation.valid) {
    throw new Error(`CLI Adapter ${config.id} is invalid: ${validation.errors.join("; ")}`);
  }
  const template = input.policy.resumeSessionId && config.resumeArgumentTemplate?.length
    ? config.resumeArgumentTemplate
    : config.argumentTemplate;
  const values = {
    approval: input.policy.approvalPolicy,
    sandbox: input.policy.sandboxMode,
    model: input.policy.model,
    reasoning_effort: input.policy.reasoningEffort,
    service_tier: normalizeServiceTier(config.defaults.serviceTier ?? config.defaults.service_tier) ?? "standard",
    service_tier_config_flag: normalizeServiceTier(config.defaults.serviceTier ?? config.defaults.service_tier) === "fast" ? "-c" : "",
    service_tier_config: normalizeServiceTier(config.defaults.serviceTier ?? config.defaults.service_tier) === "fast" ? "service_tier=\"fast\"" : "",
    fast_mode: String(config.defaults.fastMode ?? config.defaults.fast_mode ?? false),
    profile: input.policy.profile ?? "",
    profile_flag: input.policy.profile ? "-p" : "",
    output_schema: input.outputSchemaPath,
    output_schema_json: readOutputSchemaJson(input.outputSchemaPath, input.policy.outputSchema),
    workspace: input.policy.workspaceRoot,
    prompt: input.prompt,
    resume_session_id: input.policy.resumeSessionId ?? "",
    resume_prompt: buildResumePrompt(input.policy, input.prompt, input.outputSchemaPath),
    gemini_approval_mode: geminiApprovalMode(input.policy.approvalPolicy),
    claude_permission_mode: claudePermissionMode(input.policy.approvalPolicy),
    claude_allowed_tools: claudeAllowedTools(input.policy.approvalPolicy),
  };
  const rendered = template
    .map((entry) => renderTemplateEntry(entry, values))
    .filter((entry) => entry.length > 0);
  if (rendered.some((arg) => /{{[^}]+}}/.test(arg))) {
    throw new Error("CLI Adapter command contains unresolved template variables");
  }
  // Terminate the variadic --image values so the final positional prompt is not consumed as another image path.
  const imageFlags: string[] = (input.imagePaths ?? []).flatMap((p) => ["-i", p]);
  const args = imageFlags.length
    ? [...rendered.slice(0, -1), ...imageFlags, "--", rendered[rendered.length - 1]]
    : rendered;
  return { command: config.executable, args };
}

export function validateWorkspaceRoot(workspaceRoot: string | undefined): WorkspaceValidationResult {
  const blockedReasons: string[] = [];
  const trimmed = workspaceRoot?.trim();
  if (!trimmed) {
    return { valid: false, blockedReasons: ["Project workspace root is required."] };
  }
  try {
    const stat = statSync(trimmed);
    if (!stat.isDirectory()) {
      blockedReasons.push(`Project workspace root is not a directory: ${trimmed}`);
    }
    accessSync(trimmed, constants.R_OK | constants.X_OK);
  } catch {
    blockedReasons.push(`Project workspace root is missing or unreadable: ${trimmed}`);
  }

  const skillsPath = join(trimmed, ".agents", "skills");
  try {
    const stat = statSync(skillsPath);
    if (!stat.isDirectory()) {
      blockedReasons.push(`Project workspace skills directory is not a directory: ${skillsPath}`);
    }
    accessSync(skillsPath, constants.R_OK | constants.X_OK);
  } catch {
    blockedReasons.push(`Project workspace is missing readable .agents/skills: ${skillsPath}`);
  }

  const agentsPath = join(trimmed, "AGENTS.md");
  try {
    const stat = statSync(agentsPath);
    if (!stat.isFile()) {
      blockedReasons.push(`Project workspace AGENTS.md is not a file: ${agentsPath}`);
    }
    accessSync(agentsPath, constants.R_OK);
  } catch {
    blockedReasons.push(`Project workspace is missing readable AGENTS.md: ${agentsPath}`);
  }

  return { valid: blockedReasons.length === 0, workspaceRoot: trimmed, blockedReasons };
}

export function buildExecutionInvocationPrompt(invocation: ExecutionAdapterInvocationV1, _context = ""): string {
  const instruction = invocation.skillInstruction;
  const featureExecution = instruction.skillName === "implement-feature"
    && (invocation.operation === "feature_execution" || instruction.requestedAction === "feature_execution");
  const taskSlicingRules = instruction.skillName === "decompose-feature-specs"
    ? [
        "- For split_feature_specs, decompose PRD, user stories, and HLD into implementation-ready Feature Spec package directories.",
        "- Do not treat .autobuild/specs/FEAT-INTAKE-*.json as a Feature Spec package; it is only an intake artifact.",
        "- Write Feature Spec packages under docs/agentic-spec/features/<feature-id>/ with requirements.md, design.md, tasks.md, and update docs/agentic-spec/features/README.md.",
        "- The final response must be the last full SkillOutputContractV1 object, not shorthand JSON with only summary/status/evidence.",
        "- In the task-slicing result, include features, queuePlan, dependencyGraph, userStoryMapping, verificationPlan, and openQuestions.",
      ]
    : [];
  const clarificationRules = instruction.skillName === "manage-spec-change" || instruction.requestedAction === "resolve_clarification"
    ? [
        "- For resolve_clarification, treat operatorInput.clarificationText or operatorInput.comment as an operator-provided answer/decision, not as a new question to ask back.",
        "- Apply the operator-provided answer to the most relevant expected spec artifact or source path when it resolves an existing ambiguity.",
        "- Return status completed after applying the provided answer, even if unrelated open questions remain; mention those residual questions in result instead of blocking this run.",
        "- Return status blocked only when the provided answer is empty, conflicts with the source documents, or is insufficient to resolve the targeted clarification.",
      ]
    : [];
  const userStoriesRules = instruction.skillName === "generate-user-stories" || instruction.requestedAction === "generate_user_stories"
    ? [
        "- Use the expected artifact path as the source of truth for the User Stories output path.",
        "- For a mainline User Stories artifact, the document title and H1 must say \"User Stories\", not \"Requirements\".",
        ...(instruction.expectedArtifacts.some((artifact) => artifact.path.endsWith("/user-stories.md")) ? [
          "- Do not create or update docs/agentic-spec/requirements.md unless it is explicitly listed as an expected artifact or source path.",
        ] : []),
      ]
    : [];
  const featureReadyRules = instruction.operatorInput?.desiredOutcome === "feature_spec_ready_for_execution"
    ? [
        "- For this change flow, do not stop after updating only PRD, requirements, or HLD.",
        "- Create or update the affected Feature Spec package so it can be scheduled from the UI immediately after this run completes.",
        "- Ensure docs/agentic-spec/features/README.md lists the affected Feature with status ready, docs/agentic-spec/features/feature-pool-queue.json contains a runnable queue entry, and the Feature spec-state.json records status ready with cleared blocking reasons unless a real blocker remains.",
        "- If the change cannot produce a ready Feature Spec, return status blocked or review_needed with the exact missing decision instead of reporting a partial documentation-only success.",
      ]
    : [];
  const hasExpectedImageArtifact = instruction.expectedArtifacts.some((artifact) => artifact.kind === "image");
  const uiSpecRules = invocation.operation === "generate_ui_spec" || instruction.requestedAction === "generate_ui_spec"
    ? [
        "- UI Spec now means UI System Design: derive complete page coverage, interaction flows, state/data bindings, design tokens, component rules, accessibility, and verification obligations from PRD, requirements, HLD, and Feature Specs.",
        "- High-fidelity static HTML artifacts are required when expected: generate a browsable prototype index and one concrete WYSIWYG page artifact for each expected docs/agentic-spec/ui/prototype/<page-id>.html or feature-scoped prototype path.",
        "- Static HTML prototypes must be backend-free, locally browsable, responsive, representative of real states, and must not call Control Plane APIs or mutate real workspace state.",
        "- Do not generate concept images when high-fidelity static HTML artifacts are expected and no concrete image artifact is listed.",
        ...(hasExpectedImageArtifact ? [
        "- UI concept image artifacts are page-specific: generate or preserve one distinct image for each concrete expected docs/agentic-spec/ui/concepts/<page-id>.png artifact.",
        "- Do not satisfy multiple expected UI concept image artifacts with one copied image, one generic overview image, or repeated overwrites of the same path.",
        "- If a required concept image already exists and no explicit repair is needed, keep it unchanged and list it as unchanged instead of regenerating that same path.",
        "- If a concept image must be repaired or replaced, report the replaced path and reason in result.details or result.items.",
        ] : []),
      ]
    : [];
  const featureExecutionRules = featureExecution
    ? [
        "- For feature_execution, load and follow .agents/skills/implement-feature/SKILL.md as the workflow source of truth.",
        "- Keep this prompt as an invocation contract; do not rely on it for lifecycle detail that belongs in the skill.",
        "- Use CLI-native subagents for bounded implementation, verification, review, or repair slices when the skill says delegation is appropriate; keep the owner thread responsible for integration and final delivery.",
        `- Before delegation and after each completed slice, preserve resumable state in .autobuild/runs/${invocation.executionId}/checkpoint.json or an equivalent run checkpoint.`,
        "- A completed feature_execution result must use skill-contract/v2 and include the structured closure fields required by the schema: requirementCoverage, acceptanceEvidence, journeyEvidence, runtimeEvidence/runtimeExemption, deliveryFidelity/foundationExemption, gitDelivery, tokenUsage, verification, tasks, gates, delegation, risks, and blockedReason.",
        "- Use canonical nested status words in result fields: evidence/review statuses must be passed, failed, blocked, review_needed, or skipped; gitDelivery statuses must be passed, failed, blocked, skipped, or not_required. Put commit hashes, branch deletion details, and repair notes in evidence or summary fields, not in status fields.",
      ]
    : [];
  const contractVersionRule = featureExecution
    ? "- The output contract must use contractVersion skill-contract/v2 and echo executionId, skillName, requestedAction, and traceability.featureId from this task instruction."
    : "- The output contract must use contractVersion skill-contract/v1 and echo executionId, skillName, requestedAction, and traceability.featureId from this task instruction.";
  return [
    renderInvocationContextManifest(buildInvocationContextManifest(invocation)),
    "",
    "Execute this SpecDrive task inside the current workspace.",
    "",
    `Execution ID: ${invocation.executionId}`,
    `Operation: ${invocation.operation}`,
    `Feature: ${invocation.featureId ?? "none"}`,
    `Skill: ${instruction.skillName}`,
    `Action: ${instruction.requestedAction}`,
    "",
    "Source paths to read:",
    ...instruction.sourcePaths.map((path) => `- ${path}`),
    "",
    "Expected artifacts:",
    ...instruction.expectedArtifacts.map((artifact) => `- ${artifact.path} (${artifact.kind}, required=${artifact.required})`),
    ...(instruction.operatorInput ? ["", "Operator input:", JSON.stringify(instruction.operatorInput, null, 2)] : []),
    "",
    "Rules:",
    "- Use only skills discovered from this workspace's .agents/skills directory.",
    "- Treat AGENTS.md and the referenced source paths as governing context.",
    "- Stream progress only as SkillOutputContractV1 objects with status running, waiting_input, or approval_needed; the final SkillOutputContractV1 object must be the last valid contract in the stream.",
    "- The JSON object must include contractVersion, executionId, skillName, requestedAction, status, summary, nextAction, producedArtifacts, traceability, and result.",
    "- Final status must be completed, review_needed, blocked, failed, or cancelled. Use review_needed only for a real human/risk review gate with a clear reason in summary or result.reviewNeededReason.",
    "- Each producedArtifacts item must include path, kind, status, checksum, and summary; use null for checksum or summary when unknown.",
    "- traceability must include only featureId; use null when no Feature applies. Do not include requirementIds, taskId, changeIds, or other non-Feature traceability in the common output contract.",
    contractVersionRule,
    "- When Feature state is present in source files, treat it as the machine-readable Feature state. Return status and result fields that allow the scheduler to patch docs/agentic-spec/features/<feature-id>/spec-state.json.",
    "- Produce the expected artifacts and list every produced or intentionally unchanged artifact in producedArtifacts.",
    "- Prefer writing expected artifacts directly to the workspace paths named in this task instruction.",
    "- Do not assume a platform Skill Registry or Skill Center exists.",
    ...featureExecutionRules,
    ...userStoriesRules,
    ...uiSpecRules,
    ...taskSlicingRules,
    ...clarificationRules,
    ...featureReadyRules,
  ].join("\n");
}

export async function runCliAdapter(input: CliAdapterInput): Promise<CliAdapterResult> {
  const now = input.now ?? new Date();
  const adapterConfig = input.adapterConfig ?? DEFAULT_CLI_ADAPTER_CONFIG;
  const promptWithInvocation = ensureInvocationContextPrompt(input.prompt, input.executionInvocation);
  const prompt = adapterConfig.id === CODEX_CLI_ADAPTER_CONFIG.id
    ? applyCodexCliAdapterPromptRules(promptWithInvocation, input.executionInvocation)
    : promptWithInvocation;
  const shouldCleanupOutputSchema = !input.outputSchemaPath;
  const outputSchema = outputSchemaForExecutionInvocation(input.policy.outputSchema, input.executionInvocation);
  const outputSchemaPath = input.outputSchemaPath ?? writeOutputSchema(input.policy, outputSchema);
  const rendered = renderCliAdapterCommand({
    config: adapterConfig,
    policy: input.policy,
    prompt,
    outputSchemaPath,
    imagePaths: input.imagePaths,
  });
  const commandEnv = buildCliAdapterEnvironment(adapterConfig);
  const workpad = createRunWorkpad({
    workspaceRoot: input.policy.workspaceRoot,
    executionId: input.policy.runId,
    featureId: input.featureId,
    taskId: input.taskId,
    invocation: input.executionInvocation,
  });
  const logFiles = {
    ...writeCliInputLog({
      policy: input.policy,
      prompt,
      taskId: input.taskId,
      featureId: input.featureId,
      command: rendered.command,
      args: rendered.args,
      outputSchemaPath,
      imagePaths: input.imagePaths,
      executionInvocation: input.executionInvocation,
      createdAt: now.toISOString(),
    }),
    workpadMarkdown: workpad.markdownPath,
    workpadJson: workpad.jsonPath,
  };
  try {
    let result: CliCommandResult;
    try {
      result = input.asyncRunner
        ? await input.asyncRunner(rendered.command, rendered.args, input.policy.workspaceRoot, commandEnv)
        : input.runner
          ? input.runner(rendered.command, rendered.args, input.policy.workspaceRoot, commandEnv)
          : await runCommand(
              rendered.command,
              rendered.args,
              input.policy.workspaceRoot,
              input.policy.heartbeatIntervalSeconds,
              input.policy.commandTimeoutMs,
              input.onHeartbeat,
              {
                terminalOutputGraceMs: input.terminalContractGraceMs ?? DEFAULT_TERMINAL_CONTRACT_DRAIN_MS,
                hasTerminalOutput: (stdout) => {
                  const latest = extractSkillOutputContract(parseJsonEvents(stdout), adapterConfig.outputMapping.responseTextPaths);
                  return !!latest && isTerminalSkillOutputStatus(latest.status);
                },
                terminationReason: terminalContractTerminationReason,
                env: commandEnv,
              },
            );
    } catch (error) {
      writeCliOutputLog(logFiles, {
        status: null,
        stdout: "",
        stderr: "",
        error: error instanceof Error ? error : new Error(String(error)),
        completedAt: new Date().toISOString(),
      });
      writeRunReport(input.policy.workspaceRoot, input.policy.runId, {
        runId: input.policy.runId,
        taskId: input.taskId,
        featureId: input.featureId,
        status: "failed",
        exitCode: null,
        eventCount: 0,
        executionInvocation: input.executionInvocation,
        logFiles,
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date().toISOString(),
      });
      throw error;
    }
    const stdout = result.stdout ?? "";
    const stderr = [result.stderr, result.error?.message].filter(Boolean).join("\n");
    const events = parseJsonEvents(stdout);
    const redactedEvents = events.map(redactEvent);
    const sessionId = extractMappedString(events, adapterConfig.outputMapping.sessionIdPath) ??
      events.find((event) => typeof event.session_id === "string")?.session_id ??
      input.policy.resumeSessionId;
    const completedAt = new Date().toISOString();
    const session: CliSessionRecord = {
      id: randomUUID(),
      runId: input.policy.runId,
      sessionId,
      workspaceRoot: input.policy.workspaceRoot,
      command: rendered.command,
      args: rendered.args.map(redactLog),
      exitCode: result.status,
      startedAt: now.toISOString(),
      completedAt,
    };
    const rawLog: RawExecutionLog = {
      id: randomUUID(),
      runId: input.policy.runId,
      stdout: redactLog(stdout),
      stderr: redactLog(stderr),
      events: redactedEvents,
      files: logFiles,
      commandTermination: result.commandTermination,
      createdAt: completedAt,
    };
    const skillOutput = extractSkillOutputContract(events, adapterConfig.outputMapping.responseTextPaths);
    const contractValidation = validateSkillOutputContract(input.executionInvocation, skillOutput);
    const projectedStatus = projectAdapterRunStatus(result.status, skillOutput, contractValidation);
    const projectedSummary = projectAdapterRunSummary(adapterConfig.id, result.status, skillOutput, projectedStatus, contractValidation);
    const usage = extractUsage(events);
    writeCliOutputLog(logFiles, {
      status: result.status,
      stdout,
      stderr,
      error: result.error,
      completedAt,
      eventCount: redactedEvents.length,
      sessionId,
      usage,
      commandTermination: result.commandTermination,
    });
    writeRunReport(input.policy.workspaceRoot, input.policy.runId, {
      runId: input.policy.runId,
      taskId: input.taskId,
      featureId: input.featureId,
      status: projectedStatus,
      exitCode: result.status,
      sessionId,
      eventCount: redactedEvents.length,
      usage,
      executionInvocation: input.executionInvocation,
      skillOutput,
      contractValidation,
      producedArtifacts: skillOutput?.producedArtifacts ?? [],
      logFiles,
      error: stderr || undefined,
      commandTermination: result.commandTermination,
      completedAt,
    });
    const executionResult: RunnerExecutionResultInput = {
      runId: input.policy.runId,
      taskId: input.taskId,
      featureId: input.featureId,
      sessionId,
      exitCode: result.status,
      events: redactedEvents,
      stdout: rawLog.stdout,
      stderr: rawLog.stderr,
      testEnvironmentIsolation: input.policy.testEnvironmentIsolation,
      executionInvocation: input.executionInvocation,
      skillOutput,
      contractValidation,
      logFiles,
      commandTermination: result.commandTermination,
    };
    const providerSession: ExecutionAdapterProviderSessionV1 = {
      provider: adapterConfig.id,
      transport: "process",
      command: rendered.command,
      args: rendered.args.map(redactLog),
      cwd: input.policy.workspaceRoot,
      sessionId,
      model: input.policy.model,
      exitCode: result.status,
      startedAt: now.toISOString(),
      completedAt,
      eventRefs: redactedEvents.map((event, index) => ({
        index,
        type: typeof event.type === "string" ? event.type : undefined,
      })),
    };
    const executionAdapterResult: ExecutionAdapterResultV1 = {
      contractVersion: "execution-adapter/v1",
      executionId: input.policy.runId,
      status: projectedStatus,
      providerSession,
      summary: projectedSummary,
      skillOutput,
      producedArtifacts: skillOutput?.producedArtifacts ?? [],
      traceability: skillOutput?.traceability ?? input.executionInvocation?.traceability ?? { requirementIds: [], changeIds: [] },
      nextAction: skillOutput?.nextAction,
      rawLogRefs: [logFiles.input, logFiles.output, logFiles.stdout, logFiles.stderr, logFiles.report, logFiles.workpadMarkdown, logFiles.workpadJson].filter(Boolean) as string[],
      error: rawLog.stderr || undefined,
    };

    return { session, rawLog, result: executionResult, executionAdapterResult };
  } finally {
    if (shouldCleanupOutputSchema) {
      rmSync(dirname(outputSchemaPath), { recursive: true, force: true });
    }
  }
}

function projectAdapterRunStatus(
  exitCode: number | null | undefined,
  skillOutput: SkillOutputContract | undefined,
  contractValidation: SkillContractValidationResult | undefined,
): RunnerQueueStatus {
  if (contractValidation && !contractValidation.valid) return "review_needed";
  if (skillOutput) {
    if (isTerminalSkillOutputStatus(skillOutput.status)) return skillOutput.status;
    return (exitCode ?? 1) === 0 ? "review_needed" : "failed";
  }
  return (exitCode ?? 1) === 0 ? "completed" : "failed";
}

function projectAdapterRunSummary(
  adapterId: string,
  exitCode: number | null | undefined,
  skillOutput: SkillOutputContract | undefined,
  status: RunnerQueueStatus,
  contractValidation?: SkillContractValidationResult,
): string {
  if (contractValidation && !contractValidation.valid) {
    return `Skill output contract review needed: ${contractValidation.reasons.join("; ")}`;
  }
  if (skillOutput && !isTerminalSkillOutputStatus(skillOutput.status) && (exitCode ?? 1) === 0) {
    return `Skill output contract review needed: process ended after non-terminal status ${skillOutput.status}; missing final terminal SkillOutputContractV1.`;
  }
  return skillOutput?.summary ?? `CLI adapter ${adapterId} exit=${exitCode ?? "unknown"}${status ? ` (${status})` : ""}.`;
}

function isTerminalSkillOutputStatus(status: RunnerQueueStatus): boolean {
  return TERMINAL_SKILL_OUTPUT_STATUSES.has(status);
}

function terminalContractTerminationReason(stdout: string, stderr: string): CliCommandTerminationReason {
  return STDIN_WAIT_AFTER_TERMINAL_CONTRACT_PATTERN.test(`${stdout}\n${stderr}`)
    ? "stdin_wait_after_terminal_contract"
    : "terminal_contract_drain_timeout";
}

function extractSkillOutputContract(events: CliJsonEvent[], responseTextPaths: string[] = []): SkillOutputContract | undefined {
  let latest: SkillOutputContract | undefined;
  let latestTerminal: SkillOutputContract | undefined;
  const accept = (candidate: SkillOutputContract | undefined) => {
    if (!candidate) return;
    latest = candidate;
    if (isTerminalSkillOutputStatus(candidate.status)) latestTerminal = candidate;
  };
  for (const event of events) {
    const direct = parseSkillOutputRecord(event);
    accept(direct);

    const output = typeof event.output === "object" && event.output !== null ? event.output as Record<string, unknown> : undefined;
    const fromOutput = parseSkillOutputRecord(output);
    accept(fromOutput);

    for (const path of responseTextPaths) {
      const value = readJsonPath(event, path);
      const fromMappedRecord = isRecord(value) ? parseSkillOutputRecord(value) : undefined;
      accept(fromMappedRecord);
      const fromMappedText = parseSkillOutputText(typeof value === "string" ? value : undefined);
      accept(fromMappedText);
    }

    const item = typeof event.item === "object" && event.item !== null ? event.item as Record<string, unknown> : undefined;
    const itemText = typeof item?.text === "string" ? item.text : undefined;
    const fromItemText = parseSkillOutputText(itemText);
    accept(fromItemText);

    const responseText = typeof event.response === "string" ? event.response : undefined;
    const fromResponseText = parseSkillOutputText(responseText);
    accept(fromResponseText);
  }
  return latestTerminal ?? latest;
}

function parseSkillOutputText(text: string | undefined): SkillOutputContract | undefined {
  if (!text) return undefined;
  for (const candidate of candidateJsonTexts(text)) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      const fromText = parseSkillOutputRecord(parsed);
      if (fromText) return fromText;
    } catch {
      continue;
    }
  }
  return undefined;
}

function parseSkillOutputRecord(record: Record<string, unknown> | undefined): SkillOutputContract | undefined {
  if (!record || (record.contractVersion !== "skill-contract/v1" && record.contractVersion !== "skill-contract/v2")) return undefined;
  const status = normalizeQueueStatus(typeof record.status === "string" ? record.status : undefined);
  if (!status) return undefined;
  const traceability = parseTraceabilityContract(record.traceability);
  if (!traceability) return undefined;
  if (!hasOwn(record, "summary")) return undefined;
  if (!hasOwn(record, "nextAction")) return undefined;
  if (!hasOwn(record, "result")) return undefined;
  const nextAction = typeof record.nextAction === "string"
    ? record.nextAction
    : record.nextAction === null
      ? null
      : undefined;
  if (nextAction === undefined) return undefined;
  if (typeof record.result !== "object" || record.result === null || Array.isArray(record.result)) return undefined;
  return {
    contractVersion: record.contractVersion,
    executionId: String(record.executionId ?? ""),
    skillName: String(record.skillName ?? ""),
    requestedAction: String(record.requestedAction ?? ""),
    status,
    summary: String(record.summary ?? ""),
    nextAction,
    producedArtifacts: parseProducedArtifacts(record.producedArtifacts),
    traceability,
    result: record.result as Record<string, unknown>,
  };
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function parseTraceabilityContract(value: unknown): SkillTraceabilityContract | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  return {
    featureId: typeof record.featureId === "string" ? record.featureId : undefined,
  };
}

function parseProducedArtifacts(value: unknown): SkillOutputArtifact[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const status = ["created", "updated", "unchanged", "missing", "skipped"].includes(String(record.status))
      ? record.status as SkillOutputArtifact["status"]
      : undefined;
    if (!status || typeof record.path !== "string" || typeof record.kind !== "string") return [];
    return [{
      path: normalizePath(record.path),
      kind: record.kind,
      status,
      checksum: typeof record.checksum === "string" ? record.checksum : undefined,
      summary: typeof record.summary === "string" ? record.summary : undefined,
    }];
  });
}

export function validateSkillOutputContract(invocation: ExecutionAdapterInvocationV1 | undefined, output: SkillOutputContract | undefined): SkillContractValidationResult {
  if (!invocation) return { valid: true, reasons: [] };
  const instruction = invocation.skillInstruction;
  const reasons: string[] = [];
  if (!output) {
    return { valid: false, reasons: ["Skill output contract is missing or invalid JSON."] };
  }
  if (typeof output.summary !== "string" || output.summary.trim().length === 0) reasons.push("Skill output summary is required.");
  if (output.nextAction !== null && typeof output.nextAction !== "string") reasons.push("Skill output nextAction must be a string or null.");
  if (typeof output.result !== "object" || output.result === null || Array.isArray(output.result)) reasons.push("Skill output result must be an object.");
  const featureExecution = isFeatureExecutionInvocation(invocation, output);
  if (output.contractVersion !== "skill-contract/v1" && output.contractVersion !== "skill-contract/v2") {
    reasons.push(`Skill output contractVersion mismatch: ${output.contractVersion}.`);
  }
  if (featureExecution && output.status === "completed" && output.contractVersion !== "skill-contract/v2") {
    reasons.push("Feature execution completed outputs must use skill-contract/v2 with deliveryFidelity.");
  }
  if (output.executionId !== invocation.executionId) reasons.push(`Skill output executionId mismatch: ${output.executionId}.`);
  if (output.skillName !== instruction.skillName) reasons.push(`Skill output skillName mismatch: ${output.skillName}.`);
  if (output.requestedAction !== instruction.requestedAction) reasons.push(`Skill output requestedAction mismatch: ${output.requestedAction}.`);
  if (!sameOptionalString(output.traceability.featureId, invocation.featureId ?? invocation.traceability.featureId)) reasons.push("Skill output traceability.featureId mismatch.");
  const completionGate = validateFeatureCompletion({
    invocation,
    skillOutput: output,
    changedFiles: [...instruction.sourcePaths, ...output.producedArtifacts.map((artifact) => artifact.path)],
    expectedArtifacts: instruction.expectedArtifacts,
  });
  if (completionGate.status !== "completed") {
    reasons.push(...completionGate.details);
  }
  for (const artifact of instruction.expectedArtifacts.filter((entry) => entry.required && isMaterializedSpecArtifact(entry.path))) {
    const produced = output.producedArtifacts.find((entry) => entry.path === artifact.path && entry.status !== "missing" && entry.status !== "skipped");
    const existsOnDisk = existsSync(join(invocation.workspaceRoot, artifact.path));
    if (!produced && !existsOnDisk) {
      reasons.push(`Required artifact was not produced: ${artifact.path}.`);
    }
  }
  return { valid: reasons.length === 0, reasons };
}

function sameOptionalString(left: string | undefined, right: string | undefined): boolean {
  return (left ?? null) === (right ?? null);
}

function completionEvidenceFromSkillOutput(output: SkillOutputContract | undefined, inputFiles: string[] | undefined): CompletionEvidenceInput | undefined {
  if (!output || output.status !== "completed" || output.requestedAction !== "feature_execution") return undefined;
  const result = output.result;
  const changedFiles = Array.isArray(result.changedFiles)
    ? result.changedFiles.map(String)
    : [...(inputFiles ?? []), ...output.producedArtifacts.map((artifact) => artifact.path)];
  const evidence: CompletionEvidenceInput & { productUsability?: unknown } = {
    requirementCoverage: Array.isArray(result.requirementCoverage) ? result.requirementCoverage : undefined,
    acceptanceEvidence: Array.isArray(result.acceptanceEvidence) ? result.acceptanceEvidence : undefined,
    journeyEvidence: Array.isArray(result.journeyEvidence) ? result.journeyEvidence : undefined,
    runtimeEvidence: result.runtimeEvidence,
    deliveryFidelity: result.deliveryFidelity,
    gitDelivery: result.gitDelivery,
    productUsability: result.productUsability,
    requireRuntimeEvidence: changedFiles.some(isAppTouchingFile),
  };
  return evidence;
}

export async function processRunnerQueueItem(
  input: RunnerQueueItem,
  runner?: CliCommandRunner,
  onHeartbeat?: () => void,
): Promise<RunnerQueueWorkerResult> {
  const safety = evaluateRunnerSafety(input);
  if (!safety.allowed) {
    return {
      runId: input.runId,
      status: "review_needed",
      safety,
      summary: safety.summary,
    };
  }

  const adapterResult = await runCliAdapter({
    policy: input.policy,
    prompt: input.prompt,
    taskId: input.taskId,
    featureId: input.featureId,
    imagePaths: input.executionInvocation?.skillInstruction.imagePaths,
    adapterConfig: input.adapterConfig,
    executionInvocation: input.executionInvocation,
    runner,
    onHeartbeat,
  });
  const status = classifyQueueStatus(adapterResult);
  const testEnvironmentIsolation = input.statusCheck?.testEnvironmentIsolation ?? input.policy.testEnvironmentIsolation;
  let statusCheckResult = input.statusCheck
    ? runStatusCheck({
        runId: input.runId,
        taskId: input.taskId,
        featureId: input.featureId,
        agentType: "cli",
        dbPath: input.statusCheck.dbPath,
        workspaceRoot: input.statusCheck.workspaceRoot ?? input.policy.workspaceRoot,
        artifactRoot: input.statusCheck.artifactRoot,
        runner: {
          status: status === "completed" ? "completed" : status,
          exitCode: adapterResult.session.exitCode,
          summary: `CLI runner ${status}.`,
          stdout: adapterResult.rawLog.stdout,
          stderr: adapterResult.rawLog.stderr,
          result: { ...adapterResult.result, testEnvironmentIsolation },
        },
        diff: input.statusCheck.diff,
        commandChecks: input.statusCheck.commandChecks,
        requiredCommandChecks: input.statusCheck.requiredCommandChecks,
        completionEvidence: completionEvidenceFromSkillOutput(adapterResult.result.skillOutput, input.files),
        specAlignment: input.statusCheck.specAlignment,
        allowedFiles: input.statusCheck.allowedFiles,
        forbiddenFiles: input.statusCheck.forbiddenFiles,
        failureHistory: input.statusCheck.failureHistory,
        failureThreshold: input.statusCheck.failureThreshold,
        attachments: input.statusCheck.attachments,
      })
    : undefined;
  if (input.statusCheck?.recoveryResult && input.statusCheck.dbPath) {
    try {
      persistRecoveryResultHandling(input.statusCheck.dbPath, input.statusCheck.recoveryResult);
    } catch (error) {
      if (statusCheckResult) {
        statusCheckResult = recoveryPersistenceFailureResult(statusCheckResult, error);
        persistRecoveryPersistenceFailureStatus(input, statusCheckResult);
      } else {
        throw error;
      }
    }
  }
  let shouldRecover = statusCheckResult ? shouldCreateRecoveryTask(statusCheckResult) : false;
  const recoveryTaskId = statusCheckResult && shouldRecover
    ? recoverableTaskId(input.taskId ?? statusCheckResult.taskId, input.policy.workspaceRoot)
    : undefined;
  const recoveryHistoryTaskId = traceableRecoveryTaskId(recoveryTaskId);
  const recoveryHistoryFingerprintId = statusCheckResult && shouldRecover
    ? buildFailureFingerprint({ taskId: recoveryTaskId, statusCheckResult, relatedFiles: input.files }).id
    : undefined;
  let recoveryHistory = { attempts: input.statusCheck?.recoveryAttempts ?? [], forbiddenRetryItems: input.statusCheck?.forbiddenRetryItems ?? [] };
  if (statusCheckResult && shouldRecover) {
    try {
      recoveryHistory = mergeRecoveryHistory(
        recoveryHistoryTaskId && input.statusCheck.dbPath
          ? listRecoveryHistory(input.statusCheck.dbPath, { taskId: recoveryHistoryTaskId })
          : { attempts: [], forbiddenRetryItems: [] },
        recoveryHistory,
      );
    } catch (error) {
      statusCheckResult = recoveryPersistenceFailureResult(statusCheckResult, error);
      persistRecoveryPersistenceFailureStatus(input, statusCheckResult);
      shouldRecover = false;
    }
  }
  if (recoveryHistoryFingerprintId && hasActiveDispatcherBlockedAttempt(recoveryHistory.attempts, recoveryHistoryFingerprintId)) {
    shouldRecover = false;
  }
  const recoveryTask = statusCheckResult && shouldRecover
    ? buildRecoveryTask({
        taskId: recoveryTaskId,
        featureId: input.featureId,
        statusCheckResult,
        failureStage: "status_check",
        recoverable: shouldRecover,
        dangerousOperation: input.policy.risk === "high" ||
          statusCheckResult.status === "review_needed" ||
          hasHighRiskFailedCommand(statusCheckResult) ||
          hasHighRiskRecoveryFiles(statusCheckResult) ||
          !recoveryHistoryTaskId,
        relatedFiles: input.files,
        historicalAttempts: recoveryHistory.attempts,
        forbiddenRetryItems: recoveryHistory.forbiddenRetryItems,
      })
    : undefined;
  const recoveryDispatchInput = recoveryTask ? buildRecoveryDispatchInput(recoveryTask) : undefined;
  const recoveryPolicy = recoveryTask
    ? {
        ...input.policy,
        id: randomUUID(),
        runId: `${input.runId}:recovery:${recoveryTask.id}`,
        resumeSessionId: adapterResult.session.sessionId ?? input.policy.resumeSessionId,
        createdAt: new Date().toISOString(),
      }
    : undefined;
  const recoverySafety = recoveryTask && recoveryPolicy && recoveryDispatchInput
    ? evaluateRunnerSafety({
        policy: recoveryPolicy,
        files: recoveryTask.proposedFileScope ?? recoveryTask.relatedFiles,
        commands: recoveryTask.proposedCommand ? [recoveryTask.proposedCommand] : [],
        taskText: `failure recovery action ${recoveryTask.requestedAction}`,
      })
    : undefined;
  let recoveryDispatch: RunnerQueueWorkerResult["recoveryDispatch"];
  let recoveryPersistenceBlocked = false;
  if (recoveryTask?.retrySchedule?.status === "scheduled" && recoverySafety && !recoverySafety.allowed) {
    try {
      if (input.statusCheck.dbPath) {
        persistRecoveryAttempt(input.statusCheck.dbPath, buildSafetyBlockedRecoveryAttempt(recoveryTask, recoverySafety));
      }
    } catch (error) {
      if (statusCheckResult) {
        statusCheckResult = recoveryPersistenceFailureResult(statusCheckResult, error);
        persistRecoveryPersistenceFailureStatus(input, statusCheckResult);
        recoveryPersistenceBlocked = true;
      } else {
        throw error;
      }
    }
  }
  const shouldDispatchRecovery = !recoveryPersistenceBlocked &&
    recoveryTask &&
    recoveryPolicy &&
    recoveryDispatchInput &&
    recoverySafety?.allowed &&
    input.statusCheck.dbPath &&
    shouldEnqueueRecoveryTask(recoveryTask);
  if (shouldDispatchRecovery) {
    const recoveryDispatcher = input.recoveryDispatcher ?? createDefaultRecoveryDispatcher(input.statusCheck.dbPath!);
    try {
      recoveryDispatch = {
        scheduledAt: recoveryTask.retrySchedule!.scheduledAt!,
        policy: recoveryPolicy,
        dispatchInput: recoveryDispatchInput,
      };
      if (recoveryTask.retrySchedule?.status === "scheduled" && input.statusCheck.dbPath) {
        persistRecoveryAttempt(input.statusCheck.dbPath, buildScheduledRecoveryAttempt(recoveryTask));
      }
      await recoveryDispatcher(recoveryDispatch);
    } catch (error) {
      if (recoveryTask.retrySchedule?.status === "scheduled") {
        try {
          persistRecoveryAttempt(input.statusCheck.dbPath, buildDispatchBlockedRecoveryAttempt(recoveryTask, error));
        } catch {
          // The status-check result below still reports the dispatch persistence failure.
        }
      }
      if (statusCheckResult) {
        statusCheckResult = recoveryDispatchFailureResult(statusCheckResult, error);
        persistRecoveryPersistenceFailureStatus(input, statusCheckResult);
        recoveryDispatch = undefined;
      } else {
        throw error;
      }
    }
  }
  if (!recoveryPersistenceBlocked && recoveryTask && input.statusCheck?.dbPath && shouldRecordRoutedRecoveryTask(recoveryTask)) {
    try {
      persistRecoveryAttempt(input.statusCheck.dbPath, buildRoutedRecoveryAttempt(recoveryTask));
    } catch (error) {
      if (statusCheckResult) {
        statusCheckResult = recoveryPersistenceFailureResult(statusCheckResult, error);
        persistRecoveryPersistenceFailureStatus(input, statusCheckResult);
        recoveryPersistenceBlocked = true;
      } else {
        throw error;
      }
    }
  }
  const finalStatus = statusCheckResult ? queueStatusFromStatusCheck(statusCheckResult.status, status) : status;
  const contractSummary = adapterResult.session.exitCode !== 0
    ? `Codex CLI exited with ${adapterResult.session.exitCode ?? "unknown"}.`
    : adapterResult.result.contractValidation && !adapterResult.result.contractValidation.valid
    ? `Skill output contract review needed: ${adapterResult.result.contractValidation.reasons.join("; ")}`
    : adapterResult.result.skillOutput?.summary;
  return {
    runId: input.runId,
    status: finalStatus,
    safety,
    adapterResult,
    statusCheckResult,
    recoveryTask,
    recoveryDispatchInput,
    recoverySafety,
    recoveryDispatch,
    summary: contractSummary ?? `Codex CLI exited with ${adapterResult.session.exitCode ?? "unknown"}.`,
  };
}

function shouldCreateRecoveryTask(statusCheckResult: StatusCheckResult): boolean {
  if (statusCheckResult.status === "failed") return !isTerminalStatusCheckFailure(statusCheckResult) && !isInfrastructureBlockedStatus(statusCheckResult);
  if (statusCheckResult.status === "review_needed") return hasFailureSignal(statusCheckResult) || statusCheckResult.specAlignment?.aligned === false;
  if (statusCheckResult.status !== "blocked") return false;
  return !isInfrastructureBlockedStatus(statusCheckResult);
}

function shouldEnqueueRecoveryTask(recoveryTask: RecoveryTask): boolean {
  if (recoveryTask.route !== "automatic" || !recoveryTask.retrySchedule?.scheduledAt) return false;
  if (recoveryTask.retrySchedule.status === "scheduled") return true;
  return false;
}

function shouldRecordRoutedRecoveryTask(recoveryTask: RecoveryTask): boolean {
  return recoveryTask.route === "review_needed" || recoveryTask.route === "manual";
}

export function listDueRecoveryDispatches(dbPath: string, now: Date = new Date()): PersistedRecoveryDispatch[] {
  const rows = runSqlite(dbPath, [], [
    {
      name: "runs",
      sql: `SELECT id, status, scheduled_at, policy_json, dispatch_input_json FROM recovery_dispatches
        WHERE status IN (?, ?)
        ORDER BY created_at, id`,
      params: ["queued", "scheduled"],
    },
  ]).queries.runs;
  const due: PersistedRecoveryDispatch[] = [];
  const dueIds: string[] = [];
  for (const row of rows) {
    const dispatch = parseRecoveryDispatchRow(row);
    if (!dispatch) continue;
    const status = String(row.status);
    if (status === "scheduled" && new Date(dispatch.scheduledAt).getTime() > now.getTime()) continue;
    due.push({
      dispatchId: String(row.id),
      status: "running",
      scheduledAt: dispatch.scheduledAt,
      policy: dispatch.policy,
      dispatchInput: dispatch.dispatchInput,
    });
    dueIds.push(String(row.id));
  }
  if (dueIds.length) {
    runSqlite(dbPath, dueIds.map((id) => ({
      sql: "UPDATE recovery_dispatches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      params: ["running", id],
    })));
  }
  return due;
}

export async function runDueRecoveryDispatches(
  dbPath: string,
  runner: RecoveryDispatchRunner,
  now: Date = new Date(),
): Promise<PersistedRecoveryDispatch[]> {
  const dispatches = listDueRecoveryDispatches(dbPath, now);
  for (const dispatch of dispatches) {
    try {
      await runner(dispatch);
      updateRecoveryDispatchStatus(dbPath, dispatch.dispatchId, "completed");
    } catch (error) {
      updateRecoveryDispatchStatus(dbPath, dispatch.dispatchId, "failed", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  return dispatches;
}

function createDefaultRecoveryDispatcher(dbPath: string): (dispatch: RecoveryDispatch) => void {
  return (dispatch) => {
    const runStatus = new Date(dispatch.scheduledAt).getTime() > Date.now() ? "scheduled" : "queued";
    runSqlite(dbPath, [
      {
        sql: `INSERT INTO recovery_dispatches (id, run_id, status, scheduled_at, policy_json, dispatch_input_json)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            run_id = excluded.run_id,
            status = excluded.status,
            scheduled_at = excluded.scheduled_at,
            policy_json = excluded.policy_json,
            dispatch_input_json = excluded.dispatch_input_json,
            updated_at = CURRENT_TIMESTAMP`,
        params: [
          dispatch.dispatchInput.recovery_task_id,
          dispatch.policy.runId,
          runStatus,
          dispatch.scheduledAt,
          JSON.stringify(dispatch.policy),
          JSON.stringify(dispatch.dispatchInput),
        ],
      },
    ]);
  };
}

function parseRecoveryDispatchRow(row: Record<string, unknown>): RecoveryDispatch | undefined {
  try {
    const scheduledAt = String(row.scheduled_at ?? "");
    if (!scheduledAt) return undefined;
    return {
      scheduledAt,
      policy: JSON.parse(String(row.policy_json ?? "{}")) as RunnerPolicy,
      dispatchInput: JSON.parse(String(row.dispatch_input_json ?? "{}")) as RecoveryDispatchInput,
    };
  } catch {
    return undefined;
  }
}

function updateRecoveryDispatchStatus(dbPath: string, id: string, status: string, output?: string): void {
  runSqlite(dbPath, [
    {
      sql: "UPDATE recovery_dispatches SET status = ?, output_json = COALESCE(?, output_json), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      params: [status, output ? JSON.stringify({ error: output }) : null, id],
    },
  ]);
}

function hasActiveDispatcherBlockedAttempt(attempts: RecoveryAttempt[], fingerprintId: string): boolean {
  return attempts.some((attempt) =>
    attempt.fingerprintId === fingerprintId &&
    attempt.status === "blocked" &&
    /blocked by recovery dispatcher/i.test(attempt.summary) &&
    new Date(attempt.attemptedAt).getTime() + 30 * 60_000 > Date.now()
  );
}

function traceableRecoveryTaskId(taskId?: string): string | undefined {
  if (!taskId || taskId === "unknown-task" || taskId.startsWith("untraceable:")) return undefined;
  return taskId;
}

function recoverableTaskId(taskId: string | undefined, workspaceRoot: string): string {
  if (taskId && taskId !== "unknown-task") return taskId;
  const workspaceKey = createHash("sha256").update(workspaceRoot).digest("hex").slice(0, 16);
  return `untraceable:${workspaceKey}`;
}

function safeArtifactName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isTerminalStatusCheckFailure(statusCheckResult: StatusCheckResult): boolean {
  return statusCheckResult.reasons.some((reason) => reason.includes("Failure threshold reached"));
}

function mergeRecoveryHistory(
  stored: { attempts: RecoveryAttempt[]; forbiddenRetryItems: ForbiddenRetryRecord[] },
  provided: { attempts: RecoveryAttempt[]; forbiddenRetryItems: ForbiddenRetryRecord[] },
): { attempts: RecoveryAttempt[]; forbiddenRetryItems: ForbiddenRetryRecord[] } {
  return {
    attempts: uniqueById([...stored.attempts, ...provided.attempts]),
    forbiddenRetryItems: uniqueById([...stored.forbiddenRetryItems, ...provided.forbiddenRetryItems]),
  };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function buildScheduledRecoveryAttempt(recoveryTask: RecoveryTask): RecoveryAttempt {
  return {
    id: recoveryTask.id,
    fingerprintId: recoveryTask.fingerprint.id,
    taskId: recoveryTask.taskId,
    action: recoveryTask.requestedAction,
    strategy: recoveryTask.proposedStrategy ?? recoveryTask.requestedAction,
    command: recoveryTask.proposedCommand,
    fileScope: recoveryTask.proposedFileScope ?? recoveryTask.relatedFiles,
    status: "scheduled",
    summary: `Automatic recovery ${recoveryTask.requestedAction} scheduled for ${recoveryTask.fingerprint.id}.`,
    attemptedAt: recoveryTask.retrySchedule?.scheduledAt ?? recoveryTask.createdAt,
  };
}

function buildSafetyBlockedRecoveryAttempt(recoveryTask: RecoveryTask, safety: SafetyGateResult): RecoveryAttempt {
  return {
    id: recoveryTask.id,
    fingerprintId: recoveryTask.fingerprint.id,
    taskId: recoveryTask.taskId,
    action: recoveryTask.requestedAction,
    strategy: recoveryTask.proposedStrategy ?? recoveryTask.requestedAction,
    command: recoveryTask.proposedCommand,
    fileScope: recoveryTask.proposedFileScope ?? recoveryTask.relatedFiles,
    status: "blocked",
    summary: `Automatic recovery ${recoveryTask.requestedAction} blocked by runner safety gate: ${safety.reasons.join("; ")}`,
    attemptedAt: new Date().toISOString(),
  };
}

function writeCliInputLog(input: {
  policy: RunnerPolicy;
  prompt: string;
  taskId?: string;
  featureId?: string;
  command: string;
  args: string[];
  outputSchemaPath: string;
  imagePaths?: string[];
  executionInvocation?: ExecutionAdapterInvocationV1;
  createdAt: string;
}): CliInvocationLogFiles {
  const dir = cliRunLogDir(input.policy.workspaceRoot, input.policy.runId);
  const files = cliInvocationLogFiles(input.policy.workspaceRoot, input.policy.runId);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(
    files.input,
    `${JSON.stringify(
      {
        runId: input.policy.runId,
        taskId: input.taskId,
        featureId: input.featureId,
        workspaceRoot: input.policy.workspaceRoot,
        command: input.command,
        args: input.args.map(redactLog),
        prompt: redactLog(input.prompt),
        outputSchemaPath: input.outputSchemaPath,
        imagePaths: input.imagePaths,
        policy: {
          sandboxMode: input.policy.sandboxMode,
          approvalPolicy: input.policy.approvalPolicy,
          model: input.policy.model,
          profile: input.policy.profile,
          heartbeatIntervalSeconds: input.policy.heartbeatIntervalSeconds,
          commandTimeoutMs: input.policy.commandTimeoutMs,
        },
        executionInvocation: input.executionInvocation,
        createdAt: input.createdAt,
      },
      null,
      2,
    )}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  return files;
}

function writeCliOutputLog(
  files: CliInvocationLogFiles,
  output: {
    status: number | null;
    stdout: string;
    stderr: string;
    error?: Error;
    completedAt: string;
    eventCount?: number;
    sessionId?: string;
    usage?: Record<string, number>;
    commandTermination?: CliCommandTermination;
  },
): void {
  writeFileSync(files.stdout, redactLog(output.stdout), { encoding: "utf8", mode: 0o600 });
  writeFileSync(files.stderr, redactLog([output.stderr, output.error?.message].filter(Boolean).join("\n")), {
    encoding: "utf8",
    mode: 0o600,
  });
  writeFileSync(
    files.output,
    `${JSON.stringify(
      {
        status: output.status,
        sessionId: output.sessionId,
        eventCount: output.eventCount ?? 0,
        usage: output.usage,
        commandTermination: output.commandTermination,
        error: output.error
          ? {
              name: output.error.name,
              message: redactLog(output.error.message),
              stack: output.error.stack ? redactLog(output.error.stack) : undefined,
            }
          : undefined,
        stdoutPath: files.stdout,
        stderrPath: files.stderr,
        completedAt: output.completedAt,
      },
      null,
      2,
    )}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}

export function writeRunReport(
  workspaceRoot: string,
  runId: string,
  input: {
    runId: string;
    taskId?: string;
    featureId?: string;
    status: RunnerQueueStatus | "unknown";
    exitCode?: number | null;
    sessionId?: string;
    eventCount?: number;
    usage?: Record<string, number>;
    executionInvocation?: ExecutionAdapterInvocationV1;
    skillOutput?: SkillOutputContract;
    contractValidation?: SkillContractValidationResult;
    producedArtifacts?: SkillOutputArtifact[];
    logFiles?: Partial<CliInvocationLogFiles>;
    error?: string;
    commandTermination?: CliCommandTermination;
    completedAt: string;
  },
): string | undefined {
  const dir = cliRunLogDir(workspaceRoot, runId);
  const reportPath = cliInvocationLogFiles(workspaceRoot, runId).report;
  try {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    writeFileSync(
      reportPath,
      `${JSON.stringify(
        {
          reportVersion: "specdrive-run-report/v1",
          runId: input.runId,
          taskId: input.taskId,
          featureId: input.featureId,
          status: input.status,
          exitCode: input.exitCode,
          sessionId: input.sessionId,
          eventCount: input.eventCount ?? 0,
          usage: input.usage,
          executionInvocation: input.executionInvocation,
          skillOutput: input.skillOutput,
          contractValidation: input.contractValidation,
          producedArtifacts: input.producedArtifacts ?? input.skillOutput?.producedArtifacts ?? [],
          logFiles: input.logFiles,
          error: input.error ? redactLog(input.error) : undefined,
          commandTermination: input.commandTermination,
          completedAt: input.completedAt,
        },
        null,
        2,
      )}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
    return reportPath;
  } catch {
    return undefined;
  }
}

function cliInvocationLogFiles(workspaceRoot: string, runId: string): CliInvocationLogFiles {
  const dir = cliRunLogDir(workspaceRoot, runId);
  return {
    input: join(dir, "cli-input.json"),
    output: join(dir, "cli-output.json"),
    stdout: join(dir, "stdout.log"),
    stderr: join(dir, "stderr.log"),
    report: join(dir, "report.json"),
  };
}

function cliRunLogDir(workspaceRoot: string, runId: string): string {
  return join(workspaceRoot, ".autobuild", "runs", sanitizePathSegment(runId));
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-") || "run";
}

function buildDispatchBlockedRecoveryAttempt(recoveryTask: RecoveryTask, error: unknown): RecoveryAttempt {
  const message = error instanceof Error ? error.message : String(error);
  return {
    id: recoveryTask.id,
    fingerprintId: recoveryTask.fingerprint.id,
    taskId: recoveryTask.taskId,
    action: recoveryTask.requestedAction,
    strategy: recoveryTask.proposedStrategy ?? recoveryTask.requestedAction,
    command: recoveryTask.proposedCommand,
    fileScope: recoveryTask.proposedFileScope ?? recoveryTask.relatedFiles,
    status: "blocked",
    summary: `Automatic recovery ${recoveryTask.requestedAction} blocked by recovery dispatcher: ${message}`,
    attemptedAt: new Date().toISOString(),
  };
}

function buildRoutedRecoveryAttempt(recoveryTask: RecoveryTask): RecoveryAttempt {
  const routeLabel = recoveryTask.route === "manual" ? "manual approval" : "review";
  return {
    id: recoveryTask.id,
    fingerprintId: recoveryTask.fingerprint.id,
    taskId: recoveryTask.taskId,
    action: recoveryTask.requestedAction,
    strategy: recoveryTask.proposedStrategy ?? recoveryTask.requestedAction,
    command: recoveryTask.proposedCommand,
    fileScope: recoveryTask.proposedFileScope ?? recoveryTask.relatedFiles,
    status: "review_needed",
    summary: `Failure recovery routed to ${routeLabel} for ${recoveryTask.fingerprint.id}.`,
    attemptedAt: recoveryTask.createdAt,
  };
}

function recoveryPersistenceFailureResult(result: StatusCheckResult, error: unknown): StatusCheckResult {
  const message = error instanceof Error ? error.message : String(error);
  const summary = "Status check blocked because recovery history persistence failed.";
  const reasons = [...result.reasons, `Recovery history persistence failed: ${message}`];
  const recommendedActions = [
    "Inspect recovery database configuration and retry the status check.",
    ...result.recommendedActions,
  ];
  const executionResult = {
    ...result.executionResult,
    status: "blocked" as const,
    summary,
    reasons,
    recommendedActions,
  };
  return {
    ...result,
    status: "blocked",
    summary,
    reasons,
    recommendedActions,
    executionResult,
  };
}

function recoveryDispatchFailureResult(result: StatusCheckResult, error: unknown): StatusCheckResult {
  const message = error instanceof Error ? error.message : String(error);
  const summary = "Status check blocked because recovery dispatch scheduling failed.";
  const reasons = [...result.reasons, `Recovery dispatch scheduling failed: ${message}`];
  const recommendedActions = [
    "Inspect recovery dispatcher configuration and retry the status check.",
    ...result.recommendedActions,
  ];
  const executionResult = {
    ...result.executionResult,
    status: "blocked" as const,
    summary,
    reasons,
    recommendedActions,
  };
  return {
    ...result,
    status: "blocked",
    summary,
    reasons,
    recommendedActions,
    executionResult,
  };
}

function persistRecoveryPersistenceFailureStatus(input: RunnerQueueItem, result: StatusCheckResult): void {
  if (!input.statusCheck?.dbPath) return;
  try {
    runSqlite(input.statusCheck.dbPath, [
      {
        sql: `UPDATE status_check_results
          SET status = ?, summary = ?, reasons_json = ?, recommended_actions_json = ?, execution_result_json = ?
          WHERE id = ?`,
        params: [
          result.status,
          redactLog(result.summary),
          JSON.stringify(result.reasons.map(redactLog)),
          JSON.stringify(result.recommendedActions.map(redactLog)),
          redactLog(JSON.stringify(result.executionResult)),
          result.id,
        ],
      },
    ]);
  } catch {
    return;
  }
}

function isInfrastructureBlockedStatus(statusCheckResult: StatusCheckResult): boolean {
  return [statusCheckResult.summary, ...statusCheckResult.reasons].some((text) =>
    /runner output is missing/i.test(text) ||
    /status check persistence failed/i.test(text) ||
    /recovery history persistence failed/i.test(text) ||
    /recovery dispatch scheduling failed/i.test(text)
  );
}

function hasHighRiskFailedCommand(statusCheckResult: StatusCheckResult): boolean {
  return statusCheckResult.executionResult.commands.some((command) =>
    command.status === "failed" &&
    Boolean(command.command) &&
    [...DANGEROUS_COMMAND_PATTERNS, ...HIGH_RISK_TEXT_PATTERNS].some((pattern) => pattern.test(command.command ?? ""))
  );
}

function hasHighRiskRecoveryFiles(statusCheckResult: StatusCheckResult): boolean {
  return statusCheckResult.executionResult.diff.files.some((file) =>
    FORBIDDEN_FILE_PATTERNS.some((pattern) => pattern.test(normalizePath(file)))
  );
}

function hasFailureSignal(statusCheckResult: StatusCheckResult): boolean {
  const runner = statusCheckResult.executionResult.runner;
  return runner.status === "failed" ||
    (runner.exitCode ?? 0) !== 0 ||
    statusCheckResult.executionResult.commands.some((command) => command.status === "failed");
}

function queueStatusFromStatusCheck(status: StatusDecision, fallback: RunnerQueueStatus): RunnerQueueStatus {
  if (fallback === "failed") return "failed";
  if (status === "done") return "completed";
  if (status === "review_needed" || status === "blocked" || status === "failed") return status;
  return fallback;
}

export function recordRunnerHeartbeat(input: {
  runId: string;
  runnerId: string;
  policy: RunnerPolicy;
  queueStatus: RunnerQueueStatus;
  status?: "online" | "offline";
  message?: string;
  now?: Date;
}): RunnerHeartbeat {
  return {
    id: randomUUID(),
    runId: input.runId,
    runnerId: input.runnerId,
    status: input.status ?? "online",
    sandboxMode: input.policy.sandboxMode,
    approvalPolicy: input.policy.approvalPolicy,
    queueStatus: input.queueStatus,
    message: input.message,
    beatAt: (input.now ?? new Date()).toISOString(),
  };
}

export function buildExecutionResultInput(input: RunnerExecutionResultInput): {
  runId: string;
  taskId?: string;
  featureId?: string;
  kind: "cli_runner";
  summary: string;
  metadata: Record<string, unknown>;
} {
  return {
    runId: input.runId,
    taskId: input.taskId,
    featureId: input.featureId,
    kind: "cli_runner",
    summary: `CLI run exit=${input.exitCode ?? "unknown"} session=${input.sessionId ?? "none"} events=${input.events.length}`,
    metadata: {
      sessionId: input.sessionId,
      exitCode: input.exitCode,
      eventTypes: input.events.map((event) => event.type).filter(Boolean),
      executionInvocation: input.executionInvocation,
      skillOutput: input.skillOutput,
      contractValidation: input.contractValidation,
      producedArtifacts: input.skillOutput?.producedArtifacts ?? [],
      logFiles: input.logFiles,
    },
  };
}

export function buildRunnerConsoleSnapshot(input: {
  runnerId: string;
  runnerModel?: string;
  policy: RunnerPolicy;
  heartbeats?: RunnerHeartbeat[];
  queue?: Array<{ runId: string; status: RunnerQueueStatus }>;
  logs?: RawExecutionLog[];
  now?: Date;
}): RunnerConsoleSnapshot {
  const now = input.now ?? new Date();
  const lastHeartbeat = [...(input.heartbeats ?? [])]
    .filter((heartbeat) => heartbeat.runnerId === input.runnerId)
    .sort((a, b) => b.beatAt.localeCompare(a.beatAt))[0];
  const lastHeartbeatAt = lastHeartbeat?.beatAt;
  const heartbeatStale = lastHeartbeatAt
    ? now.getTime() - new Date(lastHeartbeatAt).getTime() > input.policy.heartbeatIntervalSeconds * 2 * 1000
    : true;

  return {
    runnerId: input.runnerId,
    online: lastHeartbeat?.status === "online" && !heartbeatStale,
    lastHeartbeatAt,
    runnerModel: input.runnerModel,
    sandboxMode: input.policy.sandboxMode,
    approvalPolicy: input.policy.approvalPolicy,
    queue: input.queue ?? [],
    recentLogs: [...(input.logs ?? [])]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((log) => ({ runId: log.runId, stdout: log.stdout, stderr: log.stderr, createdAt: log.createdAt })),
    heartbeatStale,
  };
}

export function persistCliRunnerArtifacts(
  dbPath: string,
  input: {
    policy: RunnerPolicy;
    heartbeat?: RunnerHeartbeat;
    session?: CliSessionRecord;
    rawLog?: RawExecutionLog;
  },
): void {
  const statements: SqlStatement[] = [
    {
      sql: `INSERT INTO runner_policies (
        id, run_id, risk, sandbox_mode, approval_policy, model, reasoning_effort, profile,
        output_schema_json, workspace_root, resume_session_id, heartbeat_interval_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        risk = excluded.risk,
        sandbox_mode = excluded.sandbox_mode,
        approval_policy = excluded.approval_policy,
        model = excluded.model,
        reasoning_effort = excluded.reasoning_effort,
        profile = excluded.profile,
        output_schema_json = excluded.output_schema_json,
        workspace_root = excluded.workspace_root,
        resume_session_id = excluded.resume_session_id,
        heartbeat_interval_seconds = excluded.heartbeat_interval_seconds`,
      params: [
        input.policy.id,
        input.policy.runId,
        input.policy.risk,
        input.policy.sandboxMode,
        input.policy.approvalPolicy,
        input.policy.model,
        input.policy.reasoningEffort,
        input.policy.profile ?? null,
        JSON.stringify(input.policy.outputSchema),
        input.policy.workspaceRoot,
        input.policy.resumeSessionId ?? null,
        input.policy.heartbeatIntervalSeconds,
        input.policy.createdAt,
      ],
    },
  ];

  if (input.heartbeat) {
    statements.push({
      sql: `INSERT INTO runner_heartbeats (
        id, run_id, runner_id, status, sandbox_mode, approval_policy, queue_status, message, beat_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        input.heartbeat.id,
        input.heartbeat.runId,
        input.heartbeat.runnerId,
        input.heartbeat.status,
        input.heartbeat.sandboxMode,
        input.heartbeat.approvalPolicy,
        input.heartbeat.queueStatus,
        input.heartbeat.message ?? null,
        input.heartbeat.beatAt,
      ],
    });
  }

  if (input.session) {
    statements.push({
      sql: `INSERT INTO cli_session_records (
        id, run_id, session_id, workspace_root, command, args_json, exit_code, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        input.session.id,
        input.session.runId,
        input.session.sessionId ?? null,
        input.session.workspaceRoot,
        input.session.command,
        JSON.stringify(input.session.args),
        input.session.exitCode,
        input.session.startedAt,
        input.session.completedAt,
      ],
    });
  }

  if (input.rawLog) {
    const eventRefs = input.rawLog.events.map((event, index) => ({
      index,
      type: typeof event.type === "string" ? event.type : undefined,
    }));
    statements.push({
      sql: `INSERT INTO raw_execution_logs (
        id, run_id, stdout, stderr, events_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      params: [
        input.rawLog.id,
        input.rawLog.runId,
        "",
        "",
        JSON.stringify({
          storage: "file",
          stdoutPath: input.rawLog.files?.stdout,
          stderrPath: input.rawLog.files?.stderr,
          outputPath: input.rawLog.files?.output,
          reportPath: input.rawLog.files?.report,
          eventCount: input.rawLog.events.length,
          eventRefs,
        }),
        input.rawLog.createdAt,
      ],
    });
  }

  runSqlite(dbPath, statements);
}

export function redactLog(value: string): string {
  let redacted = value;
  for (const pattern of ORDINARY_LOG_SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, "$1[REDACTED]");
  }
  return redacted;
}

function classifyQueueStatus(result: CliAdapterResult): RunnerQueueStatus {
  if (result.session.exitCode !== 0) {
    return "failed";
  }

  if (result.result.executionInvocation) {
    if (!result.result.contractValidation?.valid) {
      return "review_needed";
    }
    return projectAdapterRunStatus(result.session.exitCode, result.result.skillOutput, result.result.contractValidation);
  }

  const reportedStatus = extractReportedStatus(result.rawLog.events);
  if (reportedStatus) {
    return reportedStatus;
  }

  if (result.result.executionInvocation && missingExpectedArtifacts(result).length > 0) {
    return "failed";
  }

  if (result.session.args.includes("resume")) {
    return "review_needed";
  }

  return "completed";
}

function extractReportedStatus(events: CliJsonEvent[]): RunnerQueueStatus | undefined {
  for (const event of events) {
    const status = typeof event.status === "string" ? event.status : undefined;
    const normalizedStatus = normalizeQueueStatus(status);
    if (normalizedStatus) return normalizedStatus;

    const output = typeof event.output === "object" && event.output !== null ? event.output as Record<string, unknown> : undefined;
    const outputStatus = typeof output?.status === "string" ? output.status : undefined;
    const normalizedOutputStatus = normalizeQueueStatus(outputStatus);
    if (normalizedOutputStatus) return normalizedOutputStatus;

    const item = typeof event.item === "object" && event.item !== null ? event.item as Record<string, unknown> : undefined;
    const itemStatus = normalizeQueueStatus(typeof item?.status === "string" ? item.status : undefined);
    if (itemStatus) return itemStatus;
    const itemTextStatus = parseReportedStatusFromText(typeof item?.text === "string" ? item.text : undefined);
    if (itemTextStatus) return itemTextStatus;
  }
  return undefined;
}

function normalizeQueueStatus(status?: string): RunnerQueueStatus | undefined {
  return SKILL_OUTPUT_STATUSES.includes(status as SkillOutputStatus)
    ? status as SkillOutputStatus
    : undefined;
}

function parseReportedStatusFromText(text?: string): RunnerQueueStatus | undefined {
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return normalizeQueueStatus(typeof parsed.status === "string" ? parsed.status : undefined);
  } catch {
    return undefined;
  }
}

function missingExpectedArtifacts(result: CliAdapterResult): string[] {
  const invocation = result.result.executionInvocation;
  if (!invocation) return [];
  return invocation.skillInstruction.expectedArtifacts.filter((artifact) => {
    if (!isMaterializedSpecArtifact(artifact.path)) return false;
    return !existsSync(join(invocation.workspaceRoot, artifact.path));
  }).map((artifact) => artifact.path);
}

function isMaterializedSpecArtifact(artifact: string): boolean {
  return artifact.startsWith("docs/agentic-spec/") && !artifact.includes("<") && !artifact.startsWith("/");
}

function outputSchemaForExecutionInvocation(schema: Record<string, unknown>, invocation: ExecutionAdapterInvocationV1 | undefined): Record<string, unknown> {
  if (invocation?.skillInstruction.skillName !== "decompose-feature-specs"
    && !(invocation?.skillInstruction.skillName === "implement-feature"
      && (invocation.operation === "feature_execution" || invocation.skillInstruction.requestedAction === "feature_execution"))) return schema;
  const cloned = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
  const properties = cloned.properties;
  if (properties && typeof properties === "object" && !Array.isArray(properties)) {
    if (invocation?.skillInstruction.skillName === "implement-feature") {
      ((properties as Record<string, unknown>).contractVersion as Record<string, unknown>).const = "skill-contract/v2";
    }
    (properties as Record<string, unknown>).result = invocation?.skillInstruction.skillName === "decompose-feature-specs"
      ? TASK_SLICING_RESULT_SCHEMA
      : FEATURE_EXECUTION_RESULT_SCHEMA;
  }
  return cloned;
}

function writeOutputSchema(policy: RunnerPolicy, outputSchema: Record<string, unknown> = policy.outputSchema): string {
  const directory = mkdtempSync(join(tmpdir(), "specdrive-codex-schema-"));
  const path = join(directory, `${policy.runId}.schema.json`);
  writeFileSync(path, JSON.stringify(outputSchema, null, 2));
  return path;
}

function readOutputSchemaJson(outputSchemaPath: string, fallbackSchema: Record<string, unknown>): string {
  try {
    return JSON.stringify(JSON.parse(readFileSync(outputSchemaPath, "utf8")));
  } catch {
    return JSON.stringify(fallbackSchema);
  }
}

function buildResumePrompt(policy: RunnerPolicy, prompt: string, outputSchemaPath: string): string {
  return [
    prompt,
    "",
    "Continue from the resumed session, but return the final response as JSON matching this schema:",
    JSON.stringify(policy.outputSchema),
    `Schema path for audit: ${outputSchemaPath}`,
  ].join("\n");
}

function renderTemplateEntry(entry: string, values: Record<string, string>): string {
  return entry.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => values[key] ?? `{{${key}}}`);
}

function optionalConfigString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const strings = value.filter((entry): entry is string => typeof entry === "string");
  return strings.length > 0 ? strings : fallback;
}

function normalizeImageGenerationInterface(value: unknown): CliImageGenerationInterface | undefined {
  if (!isRecord(value)) return undefined;
  const operations = stringArray(value.operations, [])
    .filter((operation): operation is CliImageGenerationOperation =>
      operation === "generate" ||
      operation === "edit" ||
      operation === "restore" ||
      operation === "icon" ||
      operation === "pattern" ||
      operation === "story" ||
      operation === "diagram" ||
      operation === "natural_language");
  const commands = isRecord(value.commands)
    ? Object.fromEntries(
      Object.entries(value.commands).filter((entry): entry is [CliImageGenerationOperation, string] =>
        typeof entry[1] === "string" && operations.includes(entry[0] as CliImageGenerationOperation)),
    )
    : undefined;
  return {
    provider: optionalConfigString(value.provider) ?? "",
    invocation: value.invocation === "codex-skill" || value.invocation === "gemini-extension-command" || value.invocation === "cli-command"
      ? value.invocation
      : "cli-command",
    operations,
    commands,
    defaultModel: optionalConfigString(value.defaultModel) ?? optionalConfigString(value.default_model),
    modelEnvVar: optionalConfigString(value.modelEnvVar) ?? optionalConfigString(value.model_env_var),
    requiredEnv: stringArray(value.requiredEnv ?? value.required_env, []),
    outputFormats: stringArray(value.outputFormats ?? value.output_formats, []),
    maxVariations: Number.isInteger(value.maxVariations) ? Number(value.maxVariations) : Number.isInteger(value.max_variations) ? Number(value.max_variations) : undefined,
    outputPathArgument: optionalConfigString(value.outputPathArgument) ?? optionalConfigString(value.output_path_argument),
    inputImageArgument: optionalConfigString(value.inputImageArgument) ?? optionalConfigString(value.input_image_argument),
    countArgument: optionalConfigString(value.countArgument) ?? optionalConfigString(value.count_argument),
    notes: stringArray(value.notes, []),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSandbox(value: unknown): RunnerSandboxMode | undefined {
  return value === "read-only" || value === "workspace-write" || value === "danger-full-access" ? value : undefined;
}

function normalizeApproval(value: unknown): RunnerApprovalPolicy | undefined {
  return value === "untrusted" || value === "on-failure" || value === "on-request" || value === "never" || value === "bypass"
    ? value
    : undefined;
}

function normalizeReasoningEffort(value: unknown): RunnerReasoningEffort | undefined {
  return value === "low" || value === "medium" || value === "high" || value === "xhigh" ? value : undefined;
}

function normalizeServiceTier(value: unknown): RunnerServiceTier | undefined {
  if (value === "flex") return "standard";
  return value === "standard" || value === "fast" ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeAdapterStatus(value: unknown): CliAdapterStatus | undefined {
  return value === "draft" || value === "active" || value === "disabled" || value === "invalid" ? value : undefined;
}

function redactEvent(event: CliJsonEvent): CliJsonEvent {
  return redactJsonValue(event) as CliJsonEvent;
}

function redactJsonValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactLog(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactJsonValue);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactJsonValue(entry)]));
  }
  return value;
}

function parseJsonEvents(stdout: string): CliJsonEvent[] {
  const trimmed = stdout.trim();
  if (trimmed) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(isRecord).map((entry) => entry as CliJsonEvent);
      }
      if (isRecord(parsed)) {
        return [parsed as CliJsonEvent];
      }
    } catch {
      // Fall back to JSONL parsing below.
    }
  }
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as CliJsonEvent];
      } catch {
        return [];
      }
    });
}

function extractMappedString(events: CliJsonEvent[], path: string): string | undefined {
  for (const event of events) {
    const value = readJsonPath(event, path);
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function readJsonPath(value: unknown, path: string): unknown {
  const segments = path.split(".").map((segment) => segment.trim()).filter(Boolean);
  if (segments.length === 0) return undefined;
  let current: unknown = value;
  for (const segment of segments) {
    if (typeof current !== "object" || current === null) return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0) return undefined;
      current = current[index];
      continue;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function candidateJsonTexts(text: string): string[] {
  const trimmed = text.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }
  return [...new Set(candidates.filter(Boolean))];
}

function extractUsage(events: CliJsonEvent[]): Record<string, number> | undefined {
  for (const event of events) {
    const usage = readJsonPath(event, "usage") ?? readJsonPath(event, "stats") ?? readJsonPath(event, "result.stats");
    if (usage && typeof usage === "object" && !Array.isArray(usage)) {
      const flat = Object.fromEntries(
        Object.entries(usage)
          .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1])),
      );
      if (Object.keys(flat).length > 0) return normalizeUsageKeys(flat);
    }
  }
  return undefined;
}

function normalizeUsageKeys(usage: Record<string, number>): Record<string, number> {
  return {
    ...usage,
    ...(usage.inputTokens === undefined && usage.input_tokens !== undefined ? { inputTokens: usage.input_tokens } : {}),
    ...(usage.outputTokens === undefined && usage.output_tokens !== undefined ? { outputTokens: usage.output_tokens } : {}),
    ...(usage.cachedInputTokens === undefined && usage.cached_input_tokens !== undefined ? { cachedInputTokens: usage.cached_input_tokens } : {}),
    ...(usage.reasoningOutputTokens === undefined && usage.reasoning_output_tokens !== undefined ? { reasoningOutputTokens: usage.reasoning_output_tokens } : {}),
    ...(usage.totalTokens === undefined && usage.total_tokens !== undefined ? { totalTokens: usage.total_tokens } : {}),
  };
}

function clampHeartbeat(value: number): number {
  if (!Number.isFinite(value)) return 20;
  return Math.min(30, Math.max(10, Math.round(value)));
}

function clampCommandTimeout(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_COMMAND_TIMEOUT_MS;
  return Math.min(60 * 60 * 1000, Math.max(1000, Math.round(value)));
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isSafeSkillName(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isSafeWorkspaceWritePath(value: string): boolean {
  const normalized = normalizePath(normalizeFilePath(value.trim()));
  return normalized.length > 0 &&
    normalized !== "." &&
    normalized !== ".." &&
    !normalized.startsWith("/") &&
    !normalized.startsWith("../") &&
    !normalized.includes("/../") &&
    !FORBIDDEN_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isSafeExpectedArtifactPath(value: string): boolean {
  const normalized = normalizePath(value.trim());
  return isSafeWorkspaceWritePath(normalized) &&
    (normalized.startsWith("docs/agentic-spec/") || normalized.startsWith(".autobuild/reports/") || normalized.startsWith(".autobuild/runs/"));
}

export function runCommand(
  command: string,
  args: string[],
  cwd: string,
  heartbeatIntervalSeconds: number,
  commandTimeoutMs: number,
  onHeartbeat?: () => void,
  options: RunCommandOptions = {},
): Promise<CliCommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: options.env, stdio: ["ignore", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let timedOut = false;
    let terminalOutputSeen = false;
    let commandTermination: CliCommandTermination | undefined;
    let terminalOutputTimeout: NodeJS.Timeout | undefined;
    const heartbeat = onHeartbeat
      ? setInterval(onHeartbeat, Math.max(10, heartbeatIntervalSeconds) * 1000)
      : undefined;
    let timeout: NodeJS.Timeout | undefined;
    let killTimeout: NodeJS.Timeout | undefined;
    const refreshActivityTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        killTimeout = setTimeout(() => child.kill("SIGKILL"), 2000);
        killTimeout.unref();
      }, commandTimeoutMs);
    };
    const bufferedStdout = () => Buffer.concat(stdout).toString("utf8");
    const bufferedStderr = () => Buffer.concat(stderr).toString("utf8");
    const maybeStartTerminalDrain = () => {
      if (terminalOutputSeen || !options.hasTerminalOutput?.(bufferedStdout(), bufferedStderr())) return;
      terminalOutputSeen = true;
      const graceMs = Math.max(0, options.terminalOutputGraceMs ?? DEFAULT_TERMINAL_CONTRACT_DRAIN_MS);
      terminalOutputTimeout = setTimeout(() => {
        commandTermination = {
          terminatedAfterTerminalContract: true,
          reason: options.terminationReason?.(bufferedStdout(), bufferedStderr()) ?? "terminal_contract_drain_timeout",
        };
        child.kill("SIGTERM");
        killTimeout = setTimeout(() => child.kill("SIGKILL"), 2000);
        killTimeout.unref();
      }, graceMs);
      terminalOutputTimeout.unref();
    };
    refreshActivityTimeout();

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout.push(chunk);
      refreshActivityTimeout();
      maybeStartTerminalDrain();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr.push(chunk);
      refreshActivityTimeout();
      maybeStartTerminalDrain();
    });
    child.on("error", (error) => {
      if (heartbeat) clearInterval(heartbeat);
      if (timeout) clearTimeout(timeout);
      if (terminalOutputTimeout) clearTimeout(terminalOutputTimeout);
      if (killTimeout) clearTimeout(killTimeout);
      resolve({
        status: null,
        stdout: bufferedStdout(),
        stderr: bufferedStderr(),
        error,
        commandTermination,
      });
    });
    child.on("close", (code) => {
      if (heartbeat) clearInterval(heartbeat);
      if (timeout) clearTimeout(timeout);
      if (terminalOutputTimeout) clearTimeout(terminalOutputTimeout);
      if (killTimeout) clearTimeout(killTimeout);
      resolve({
        status: code,
        stdout: bufferedStdout(),
        stderr: bufferedStderr(),
        error: timedOut ? new Error(`Codex command timed out after ${commandTimeoutMs}ms of output inactivity`) : undefined,
        commandTermination,
      });
    });
  });
}
