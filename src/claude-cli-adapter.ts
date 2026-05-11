import type { CliAdapterConfig, RunnerApprovalPolicy, RunnerReasoningEffort } from "./cli-adapter.ts";

const CLAUDE_DEFAULT_MODEL = "sonnet";
const CLAUDE_DEFAULT_REASONING_EFFORT: RunnerReasoningEffort = "medium";
const CLAUDE_ALLOWED_TOOLS_FOR_AUTOMATION = "Bash,Read,Edit,Write,Glob,Grep";
const CLAUDE_ALLOWED_TOOLS_FOR_REVIEW = "Read,Glob,Grep";

export const CLAUDE_CLI_ADAPTER_CONFIG: CliAdapterConfig = {
  id: "claude-cli",
  displayName: "Claude Code CLI",
  schemaVersion: 3,
  executable: "claude",
  argumentTemplate: [
    "-p",
    "{{prompt}}",
    "--model",
    "{{model}}",
    "--effort",
    "{{reasoning_effort}}",
    "--output-format",
    "json",
    "--json-schema",
    "{{output_schema_json}}",
    "--permission-mode",
    "{{claude_permission_mode}}",
    "--allowedTools",
    "{{claude_allowed_tools}}",
  ],
  resumeArgumentTemplate: [
    "-p",
    "{{resume_prompt}}",
    "--resume",
    "{{resume_session_id}}",
    "--model",
    "{{model}}",
    "--effort",
    "{{reasoning_effort}}",
    "--output-format",
    "json",
    "--json-schema",
    "{{output_schema_json}}",
    "--permission-mode",
    "{{claude_permission_mode}}",
    "--allowedTools",
    "{{claude_allowed_tools}}",
  ],
  configSchema: {
    type: "object",
    required: ["id", "executable", "argumentTemplate", "outputMapping"],
  },
  formSchema: {
    fields: [
      { path: "executable", label: "Executable", type: "text" },
      { path: "argumentTemplate", label: "Arguments", type: "list" },
      { path: "defaults.model", label: "Default model", type: "text" },
      { path: "defaults.reasoningEffort", label: "Default reasoning effort", type: "select" },
      { path: "defaults.sandbox", label: "Sandbox", type: "select" },
      { path: "defaults.approval", label: "Approval", type: "select" },
      { path: "defaults.costRates", label: "Token cost rates", type: "object" },
      { path: "outputMapping.sessionIdPath", label: "Session id path", type: "text" },
      { path: "outputMapping.responseTextPaths", label: "Response text paths", type: "list" },
    ],
  },
  defaults: {
    model: CLAUDE_DEFAULT_MODEL,
    reasoningEffort: CLAUDE_DEFAULT_REASONING_EFFORT,
    sandbox: "danger-full-access",
    approval: "never",
    costRates: {},
  },
  environmentAllowlist: [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_MODEL",
    "ANTHROPIC_SMALL_FAST_MODEL",
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    "CLAUDE_CODE_OAUTH_TOKEN",
    "CLAUDE_CODE_OAUTH_REFRESH_TOKEN",
    "CLAUDE_CODE_OAUTH_SCOPES",
    "CLAUDE_CODE_SKIP_PROMPT_HISTORY",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC",
    "CLAUDE_CODE_ENABLE_TELEMETRY",
    "CLAUDE_CODE_EFFORT_LEVEL",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
  ],
  outputMapping: {
    eventStream: "json",
    outputSchema: "skill-output.schema.json",
    sessionIdPath: "session_id",
    responseTextPaths: ["structured_output", "result", "message.content", "content", "text"],
  },
  status: "draft",
  updatedAt: new Date(0).toISOString(),
};

export function claudePermissionMode(approval: RunnerApprovalPolicy): "default" | "acceptEdits" {
  if (approval === "never" || approval === "bypass") return "acceptEdits";
  return "default";
}

export function claudeAllowedTools(approval: RunnerApprovalPolicy): string {
  if (approval === "never" || approval === "bypass") return CLAUDE_ALLOWED_TOOLS_FOR_AUTOMATION;
  return CLAUDE_ALLOWED_TOOLS_FOR_REVIEW;
}
