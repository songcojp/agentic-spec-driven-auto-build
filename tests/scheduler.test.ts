import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initializeSchema, listTables } from "../src/schema.ts";
import { runSqlite } from "../src/sqlite.ts";
import {
  BULLMQ_CLI_RUNNER_QUEUE,
  BULLMQ_EXECUTION_ADAPTER_QUEUE,
  CLI_WORKER_LOCK_DURATION_MS,
  CLI_RUNNER_QUEUE,
  EXECUTION_ADAPTER_QUEUE,
  createLocalScheduler,
  createMemoryScheduler,
  bullMqExecutionAdapterQueueName,
  listRecoverableSchedulerJobs,
  requeueBullMqJob,
  runCodexAppServerRunJob,
  runCliRunJob,
  runRpcRunJob,
} from "../src/scheduler.ts";
import type { CliJsonEvent } from "../src/cli-adapter.ts";
import type { CodexAppServerTransport } from "../src/codex-rpc-adapter.ts";
import type { GeminiAcpTransport } from "../src/gemini-rpc-adapter.ts";

test("BullMQ queue names avoid reserved colon separator while logical queue names stay traceable", () => {
  assert.equal(EXECUTION_ADAPTER_QUEUE, "specdrive:execution-adapter");
  assert.equal(CLI_RUNNER_QUEUE, EXECUTION_ADAPTER_QUEUE);
  assert.equal(BULLMQ_EXECUTION_ADAPTER_QUEUE.includes(":"), false);
  assert.equal(BULLMQ_CLI_RUNNER_QUEUE.includes(":"), false);
  assert.match(bullMqExecutionAdapterQueueName("/tmp/project-a/.autobuild/autobuild.db"), /^specdrive-execution-adapter-[a-f0-9]{12}$/);
  assert.notEqual(
    bullMqExecutionAdapterQueueName("/tmp/project-a/.autobuild/autobuild.db"),
    bullMqExecutionAdapterQueueName("/tmp/project-b/.autobuild/autobuild.db"),
  );
});

test("CLI worker lock is long enough for skill invocations", () => {
  assert.equal(CLI_WORKER_LOCK_DURATION_MS >= 60 * 60 * 1000, true);
});

test("scheduler schema records executor job metadata without feature target columns", () => {
  const dbPath = makeDbPath();
  const tables = listTables(dbPath);
  assert.equal(tables.includes("scheduler_job_records"), true);
  assert.equal(tables.includes("execution_records"), true);

  const scheduler = createMemoryScheduler(dbPath);
  const job = scheduler.enqueueCliRun({
    executionId: "EXEC-001",
    operation: "feature_execution",
    projectId: "project-1",
    context: { featureId: "FEAT-001", featureSpecPath: "docs/agentic-spec/features/feat-001" },
  });
  assert.equal(job.queueName, "specdrive:execution-adapter");
  const appServerJob = scheduler.enqueueRpcRun?.({
    executionId: "EXEC-APP",
    operation: "feature_execution",
    projectId: "project-1",
    context: { featureId: "FEAT-001", featureSpecPath: "docs/agentic-spec/features/feat-001" },
  });
  assert.equal(appServerJob?.jobType, "rpc.run");
  const query = runSqlite(dbPath, [], [
    { name: "jobs", sql: "SELECT id, queue_name, job_type, status, payload_json FROM scheduler_job_records ORDER BY rowid" },
    { name: "columns", sql: "PRAGMA table_info(scheduler_job_records)" },
  ]).queries;
  const rows = query.jobs;
  const columns = query.columns.map((row) => row.name);
  assert.equal(columns.includes("target_type"), false);
  assert.equal(columns.includes("target_id"), false);
  assert.deepEqual(rows.map((row) => [row.queue_name, row.job_type, row.status, JSON.parse(String(row.payload_json)).operation]), [
    ["specdrive:execution-adapter", "cli.run", "queued", "feature_execution"],
    ["specdrive:execution-adapter", "rpc.run", "queued", "feature_execution"],
  ]);
});

test("local embedded scheduler executes queued CLI jobs without Redis", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-local-scheduler-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const scheduler = createLocalScheduler(dbPath, {
    runner: () => ({
      status: 0,
      stdout: `{"type":"session","session_id":"SESSION-LOCAL"}\n${skillOutputEvent("RUN-LOCAL")}`,
      stderr: "",
    }),
  });

  const job = scheduler.enqueueCliRun(cliRunPayload("RUN-LOCAL"));
  await scheduler.drain();
  await scheduler.close();
  const rows = runSqlite(dbPath, [], [
    { name: "job", sql: "SELECT status, queue_name, job_type FROM scheduler_job_records WHERE id = ?", params: [job.schedulerJobId] },
    { name: "execution", sql: "SELECT status, summary FROM execution_records WHERE id = 'RUN-LOCAL'" },
  ]).queries;

  assert.equal(scheduler.health?.().status, "ready");
  assert.deepEqual([rows.job[0].queue_name, rows.job[0].job_type, rows.job[0].status], ["specdrive:execution-adapter", "cli.run", "completed"]);
  assert.equal(rows.execution[0].status, "completed");
  assert.equal(rows.execution[0].summary, "Skill completed.");
});

test("local embedded scheduler preserves review_needed job status", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-local-scheduler-review-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const scheduler = createLocalScheduler(dbPath, {
    runner: () => ({
      status: 0,
      stdout: `{"type":"session","session_id":"SESSION-LOCAL-REVIEW"}\n${skillOutputEvent("RUN-LOCAL-REVIEW", {
        status: "review_needed",
        summary: "Operator authorization is required before delivery.",
      })}`,
      stderr: "",
    }),
  });

  const job = scheduler.enqueueCliRun(cliRunPayload("RUN-LOCAL-REVIEW"));
  await scheduler.drain();
  await scheduler.close();
  const rows = runSqlite(dbPath, [], [
    { name: "job", sql: "SELECT status FROM scheduler_job_records WHERE id = ?", params: [job.schedulerJobId] },
    { name: "execution", sql: "SELECT status FROM execution_records WHERE id = 'RUN-LOCAL-REVIEW'" },
    { name: "review", sql: "SELECT status FROM review_items WHERE run_id = 'RUN-LOCAL-REVIEW'" },
  ]).queries;

  assert.equal(rows.job[0].status, "review_needed");
  assert.equal(rows.execution[0].status, "review_needed");
  assert.equal(rows.review[0].status, "review_needed");
});

test("cli.run failed exit overrides non-terminal SkillOutput in Feature spec-state", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-failed-running-state-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const scheduler = createLocalScheduler(dbPath, {
    runner: () => ({
      status: 1,
      stdout: `{"type":"session","session_id":"SESSION-FAILED-RUNNING"}\n${skillOutputEvent("RUN-FAILED-RUNNING", {
        status: "running",
        summary: "Validation is still running.",
      })}`,
      stderr: "Reading additional input from stdin...",
    }),
  });

  const payload = cliRunPayload("RUN-FAILED-RUNNING");
  const job = scheduler.enqueueCliRun({
    ...payload,
    context: {
      ...payload.context,
      featureSpecPath: "docs/agentic-spec/features/FEAT-CLI",
    },
  });
  await scheduler.drain();
  await scheduler.close();
  const rows = runSqlite(dbPath, [], [
    { name: "job", sql: "SELECT status FROM scheduler_job_records WHERE id = ?", params: [job.schedulerJobId] },
    { name: "execution", sql: "SELECT status, summary FROM execution_records WHERE id = 'RUN-FAILED-RUNNING'" },
  ]).queries;
  const state = JSON.parse(readFileSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI", "spec-state.json"), "utf8"));

  assert.equal(rows.job[0].status, "failed");
  assert.equal(rows.execution[0].status, "failed");
  assert.notEqual(rows.execution[0].summary, "Validation is still running.");
  assert.equal(state.status, "failed");
  assert.equal(state.executionStatus, "failed");
  assert.equal(state.lastResult.status, "failed");
  assert.deepEqual(state.blockedReasons, [rows.execution[0].summary]);
  assert.notEqual(state.lastResult.summary, "Validation is still running.");
});

test("cli.run writes review_needed Feature execution status to spec-state file", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-review-state-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const payload = cliRunPayload("RUN-REVIEW-STATE");

  const result = await runCliRunJob(dbPath, {
    ...payload,
    context: {
      ...payload.context,
      featureSpecPath: "docs/agentic-spec/features/FEAT-CLI",
    },
  }, () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-REVIEW-STATE"}\n${skillOutputEvent("RUN-REVIEW-STATE", {
      status: "review_needed",
      summary: "Independent review is required before delivery.",
    })}`,
    stderr: "",
  }));
  const state = JSON.parse(readFileSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI", "spec-state.json"), "utf8"));

  assert.equal(result.status, "review_needed");
  assert.equal(state.status, "review_needed");
  assert.equal(state.executionStatus, "review_needed");
  assert.equal(state.currentJob.executionId, "RUN-REVIEW-STATE");
  assert.equal(state.lastResult.status, "review_needed");
});

test("scheduler worker startup can recover transient queued jobs created while worker was unavailable", () => {
  const dbPath = makeDbPath();
  runSqlite(dbPath, [
    {
      sql: `INSERT INTO scheduler_job_records (id, bullmq_job_id, queue_name, job_type, status, error, payload_json)
        VALUES ('JOB-OFF', 'BULL-OFF', 'specdrive:execution-adapter', 'cli.run', 'blocked', 'Scheduler worker mode is off.', ?)`,
      params: [JSON.stringify({
        executionId: "RUN-OFF",
        operation: "generate_user_stories",
        projectId: "project-1",
        requestedAction: "generate_user_stories",
      })],
    },
    {
      sql: `INSERT INTO execution_records (id, scheduler_job_id, executor_type, operation, project_id, context_json, status)
        VALUES ('RUN-OFF', 'JOB-OFF', 'cli', 'generate_user_stories', 'project-1', '{}', 'queued')`,
    },
    {
      sql: `INSERT INTO scheduler_job_records (id, bullmq_job_id, queue_name, job_type, status, error, payload_json)
        VALUES ('JOB-REAL-BLOCKED', 'BULL-REAL-BLOCKED', 'specdrive:execution-adapter', 'cli.run', 'blocked', 'Project workspace root is required.', ?)`,
      params: [JSON.stringify({ executionId: "RUN-REAL-BLOCKED", operation: "generate_user_stories" })],
    },
  ]);

  assert.deepEqual(listRecoverableSchedulerJobs(dbPath).map((job) => [job.schedulerJobId, job.bullmqJobId, job.jobType, job.payload.operation]), [
    ["JOB-OFF", "BULL-OFF", "cli.run", "generate_user_stories"],
  ]);
});

test("requeueBullMqJob removes completed job ids before replaying run-now work", async () => {
  const calls: string[] = [];
  const queue = {
    async getJob(id: string) {
      calls.push(`get:${id}`);
      return {
        async getState() {
          calls.push("state:completed");
          return "completed";
        },
        async remove() {
          calls.push("remove");
        },
      };
    },
    async add(name: string, data: unknown, options: { jobId?: string }) {
      calls.push(`add:${name}:${options.jobId}:${(data as { schedulerJobId?: string }).schedulerJobId}`);
      return {};
    },
  };

  await requeueBullMqJob(queue, {
    schedulerJobId: "JOB-RUN-NOW",
    bullmqJobId: "BULL-RUN-NOW",
    jobType: "rpc.run",
    payload: {
      executionId: "RUN-RUN-NOW",
      operation: "feature_execution",
      projectId: "project-1",
    },
  });

  assert.deepEqual(calls, [
    "get:BULL-RUN-NOW",
    "state:completed",
    "remove",
    "add:rpc.run:BULL-RUN-NOW:JOB-RUN-NOW",
  ]);
});

test("cli.run executes mocked CLI runner and persists runner artifacts", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: Array<{ cwd: string; args: string[] }> = [];

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-CLI"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-CLI"}\n${skillOutputEvent("RUN-CLI")}`,
    stderr: "",
  }));
  const resultWithSpy = await runCliRunJob(dbPath, cliRunPayload("RUN-CLI-SPY"), (_command, args, cwd) => {
    calls.push({ cwd, args });
    return {
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-CLI"}\n${skillOutputEvent("RUN-CLI-SPY")}`,
    stderr: "",
    };
  });
  const rows = runSqlite(dbPath, [], [
    { name: "runs", sql: "SELECT status, metadata_json FROM execution_records WHERE id = 'RUN-CLI'" },
    { name: "task", sql: "SELECT status FROM task_graph_tasks WHERE id = 'TASK-CLI'" },
    { name: "sessions", sql: "SELECT session_id, exit_code FROM cli_session_records WHERE run_id = 'RUN-CLI'" },
    { name: "logs", sql: "SELECT stdout, events_json FROM raw_execution_logs WHERE run_id = 'RUN-CLI'" },
    { name: "statusChecks", sql: "SELECT kind, summary, metadata_json FROM status_check_results WHERE run_id = 'RUN-CLI-SPY'" },
    { name: "policy", sql: "SELECT sandbox_mode FROM runner_policies WHERE run_id = 'RUN-CLI-SPY'" },
  ]).queries;

  assert.equal(result.status, "completed");
  assert.equal(resultWithSpy.status, "completed");
  assert.equal(calls[0].cwd, root);
  assert.match(calls[0].args.join("\n"), /Execute this SpecDrive task/);
  assert.match(calls[0].args.join("\n"), /\[AUTOBUILD INVOCATION\]/);
  assert.match(calls[0].args.join("\n"), /\.autobuild\/memory\/constitution\.md/);
  assert.match(calls[0].args.join("\n"), /implement-feature/);
  assert.match(calls[0].args.join("\n"), /Source paths to read:/);
  assert.doesNotMatch(calls[0].args.join("\n"), /Skill Invocation/);
  assert.doesNotMatch(calls[0].args.join("\n"), /Workspace Context/);
  assert.doesNotMatch(calls[0].args.join("\n"), /# Test workspace/);
  assert.doesNotMatch(calls[0].args.join("\n"), /# Feat implement skill/);
  assert.equal(rows.policy[0].sandbox_mode, "danger-full-access");
  assert.match(calls[0].args.join("\n"), /--sandbox\ndanger-full-access/);
  assert.equal(rows.runs[0].status, "completed");
  assert.equal(JSON.parse(String(rows.runs[0].metadata_json)).contractValidation.valid, true);
  assert.equal(rows.task[0].status, "done");
  assert.deepEqual(rows.sessions.map((row) => [row.session_id, row.exit_code]), [["SESSION-CLI", 0]]);
  const cliLogIndex = JSON.parse(String(rows.logs[0].events_json));
  assert.equal(rows.logs[0].stdout, "");
  assert.equal(cliLogIndex.storage, "file");
  assert.match(readFileSync(cliLogIndex.stdoutPath, "utf8"), /skill-contract\/v2/);
  assert.equal(existsSync(join(root, ".autobuild", "runs", "RUN-CLI", "WORKPAD.md")), true);
  assert.equal(rows.statusChecks.length, 0);
});

test("cli.run default Feature paths use context Feature Spec folder", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-feature-folder-"));
  prepareSkillWorkspace(root);
  mkdirSync(join(root, "docs", "agentic-spec", "features", "feat-cli"), { recursive: true });
  writeFileSync(join(root, "docs", "agentic-spec", "features", "feat-cli", "requirements.md"), "# Requirements\n");
  writeFileSync(join(root, "docs", "agentic-spec", "features", "feat-cli", "design.md"), "# Design\n");
  writeFileSync(join(root, "docs", "agentic-spec", "features", "feat-cli", "tasks.md"), "# Tasks\n");
  commitWorkspace(root, "add lowercase feature fixture");
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: Array<{ args: string[] }> = [];
  const payload = cliRunPayload("RUN-FEATURE-FOLDER");

  const result = await runCliRunJob(
    dbPath,
    {
      ...payload,
      context: {
        ...payload.context,
        featureSpecPath: "docs/agentic-spec/features/feat-cli",
      },
    },
    (_command, args) => {
      calls.push({ args });
      return {
        status: 0,
        stdout: `{"type":"session","session_id":"SESSION-FEATURE-FOLDER"}\n${skillOutputEvent("RUN-FEATURE-FOLDER")}`,
        stderr: "",
      };
    },
  );
  const prompt = calls[0].args.join("\n");

  assert.equal(result.status, "completed");
  assert.match(prompt, /docs\/agentic-spec\/features\/feat-cli\/requirements\.md/);
  assert.match(prompt, /docs\/agentic-spec\/features\/feat-cli\/tasks\.md/);
  assert.doesNotMatch(prompt, /docs\/agentic-spec\/features\/FEAT-CLI\/tasks\.md/);
});

test("cli.run feature execution prompt delegates workflow detail to implement-feature skill", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-feature-skill-prompt-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: Array<{ args: string[] }> = [];

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-FEATURE-SKILL-PROMPT"), (_command, args) => {
    calls.push({ args });
    return {
      status: 0,
      stdout: `{"type":"session","session_id":"SESSION-FEATURE-SKILL-PROMPT"}\n${skillOutputEvent("RUN-FEATURE-SKILL-PROMPT")}`,
      stderr: "",
    };
  });

  const prompt = calls[0].args.join("\n");
  assert.equal(result.status, "completed");
  assert.match(prompt, /\.agents\/skills\/implement-feature\/SKILL\.md/);
  assert.match(prompt, /skill-contract\/v2/);
  assert.doesNotMatch(prompt, /The output contract must use contractVersion skill-contract\/v1/);
  assert.doesNotMatch(prompt, /Expected artifacts:\n- docs\/agentic-spec\/features\/FEAT-CLI\/design\.md/);
  assert.doesNotMatch(prompt, /Expected artifacts:\n- docs\/agentic-spec\/features\/FEAT-CLI\/tasks\.md/);
});

test("cli.run creates a ReviewItem when feature execution returns review_needed", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-review-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-CLI-REVIEW"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-CLI-REVIEW"}\n${skillOutputEvent("RUN-CLI-REVIEW", {
      status: "review_needed",
      summary: "Implementation is verified; AGENTS.md requires operator authorization before commit or PR delivery.",
    })}`,
    stderr: "",
    commandTermination: {
      terminatedAfterTerminalContract: true,
      reason: "stdin_wait_after_terminal_contract",
    },
  }));
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, metadata_json FROM execution_records WHERE id = 'RUN-CLI-REVIEW'" },
    { name: "reviews", sql: "SELECT id, project_id, feature_id, run_id, status, review_needed_reason, trigger_reasons_json, recommended_actions_json FROM review_items WHERE run_id = 'RUN-CLI-REVIEW'" },
    { name: "feature", sql: "SELECT status FROM features WHERE id = 'FEAT-CLI'" },
  ]).queries;
  const metadata = JSON.parse(String(rows.run[0].metadata_json));

  assert.equal(result.status, "review_needed");
  assert.equal(rows.run[0].status, "review_needed");
  assert.equal(metadata.commandTermination.reason, "stdin_wait_after_terminal_contract");
  assert.equal(rows.reviews.length, 1);
  assert.equal(rows.reviews[0].id, "execution-review-RUN-CLI-REVIEW");
  assert.equal(rows.reviews[0].project_id, "project-1");
  assert.equal(rows.reviews[0].feature_id, "FEAT-CLI");
  assert.equal(rows.reviews[0].status, "review_needed");
  assert.equal(rows.reviews[0].review_needed_reason, "approval_needed");
  assert.deepEqual(JSON.parse(String(rows.reviews[0].trigger_reasons_json)), ["permission_escalation"]);
  assert.deepEqual(JSON.parse(String(rows.reviews[0].recommended_actions_json)), ["approve_continue", "request_changes", "reject"]);
  assert.equal(rows.feature[0].status, "review_needed");
});

test("cli.run classifies review_needed delivery fidelity losses as risk review before approval wording", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-review-risk-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-CLI-RISK-REVIEW"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-CLI-RISK-REVIEW"}\n${skillOutputEvent("RUN-CLI-RISK-REVIEW", {
      status: "review_needed",
      summary: "PR #14 is merged, but independent review found P1 behavior-obligation gaps that require review before approval.",
      result: {
        ...validJourneyResult(),
        deliveryFidelity: validDeliveryFidelity({
          completionDecision: {
            status: "review_needed",
            reason: "Open behavior-obligation gaps remain.",
            decidedBy: "release-reviewer",
            unresolvedLosses: ["LOSS-016-E2E"],
          },
        }),
      },
    })}`,
    stderr: "",
  }));
  const rows = runSqlite(dbPath, [], [
    { name: "reviews", sql: "SELECT status, review_needed_reason, trigger_reasons_json, body FROM review_items WHERE run_id = 'RUN-CLI-RISK-REVIEW'" },
  ]).queries;

  assert.equal(result.status, "review_needed");
  assert.equal(rows.reviews[0].status, "review_needed");
  assert.equal(rows.reviews[0].review_needed_reason, "risk_review_needed");
  assert.deepEqual(JSON.parse(String(rows.reviews[0].trigger_reasons_json)), ["quality_evidence_gap"]);
  assert.match(String(rows.reviews[0].body), /behavior-obligation gaps/);
});

test("cli.run projects product usability gate failures into risk review items", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-product-usability-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const productUsability = {
    protocolGaps: [{
      id: "GAP-PUA-1",
      category: "runtime_gap",
      severity: "P1",
      status: "open",
      message: "Execution Workbench lacks product evidence for the priority story.",
      affectedStories: ["US-CLI"],
      evidenceRefs: ["tests/specdrive-ide-webview-boundary.test.ts"],
    }],
  };

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-CLI-PRODUCT-USABILITY"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-CLI-PRODUCT-USABILITY"}\n${skillOutputEvent("RUN-CLI-PRODUCT-USABILITY", {
      status: "review_needed",
      summary: "Product Usability Gate failed: priority user story lacks runtime evidence.",
      result: {
        ...validJourneyResult(),
        productUsability,
      },
    })}`,
    stderr: "",
  }));
  const rows = runSqlite(dbPath, [], [
    { name: "reviews", sql: "SELECT status, review_needed_reason, trigger_reasons_json, body FROM review_items WHERE run_id = 'RUN-CLI-PRODUCT-USABILITY'" },
  ]).queries;
  const body = JSON.parse(String(rows.reviews[0].body));

  assert.equal(result.status, "review_needed");
  assert.equal(rows.reviews[0].status, "review_needed");
  assert.equal(rows.reviews[0].review_needed_reason, "risk_review_needed");
  assert.deepEqual(JSON.parse(String(rows.reviews[0].trigger_reasons_json)), ["product_usability_gap"]);
  assert.deepEqual(body.productUsability, productUsability);
});

test("cli.run keeps large source documents out of the provider prompt", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-compact-prompt-"));
  prepareSkillWorkspace(root);
  mkdirSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI"), { recursive: true });
  const largeRequirements = `# Requirements\n\n${"REQ: keep prompt compact.\n".repeat(400)}`;
  writeFileSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI", "requirements.md"), largeRequirements);
  writeFileSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI", "design.md"), "# Design\n");
  writeFileSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI", "tasks.md"), "# Tasks\n");
  commitWorkspace(root, "update large feature fixture");
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: Array<{ args: string[] }> = [];

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-COMPACT-PROMPT"), (_command, args) => {
    calls.push({ args });
    return {
      status: 0,
      stdout: `{"type":"session","session_id":"SESSION-COMPACT"}\n${skillOutputEvent("RUN-COMPACT-PROMPT")}`,
      stderr: "",
    };
  });

  const prompt = calls[0].args.join("\n");
  assert.equal(result.status, "completed");
  assert.match(prompt, /docs\/agentic-spec\/features\/FEAT-CLI\/requirements\.md/);
  assert.match(prompt, /\[AUTOBUILD INVOCATION\]/);
  assert.match(prompt, /Source paths to read:/);
  assert.doesNotMatch(prompt, /Context:/);
  assert.doesNotMatch(prompt, /REQ: keep prompt compact\./);
  assert.equal(prompt.length < 20_000, true);
});

test("cli.run passes clarification operator input into the skill invocation prompt", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-clarification-run-"));
  prepareSkillWorkspace(root);
  mkdirSync(join(root, ".agents", "skills", "manage-spec-change"), { recursive: true });
  mkdirSync(join(root, "docs", "agentic-spec", "zh-CN"), { recursive: true });
  writeFileSync(join(root, ".agents", "skills", "manage-spec-change", "SKILL.md"), "# Ambiguity clarification skill\n");
  writeFileSync(join(root, "docs", "agentic-spec", "zh-CN", "requirements.md"), "# Requirements\n\n## Open Questions\n\n1. 彩票类型未明确。\n");
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: Array<{ args: string[] }> = [];

  const result = await runCliRunJob(
    dbPath,
    {
      projectId: "project-1",
      executionId: "RUN-CLARIFICATION",
      operation: "resolve_clarification",
      requestedAction: "resolve_clarification",
      traceability: { requirementIds: [] },
      context: {
        sourcePaths: ["docs/agentic-spec/zh-CN/requirements.md"],
        expectedArtifacts: ["docs/agentic-spec/zh-CN/requirements.md"],
        workspaceRoot: root,
        skillName: "manage-spec-change",
        skillPhase: "resolve_clarification",
        clarificationText: "彩票类型支持大乐透和双色球",
        comment: "彩票类型支持大乐透和双色球",
        specChangeIntent: "clarification",
      },
    },
    (_command, args) => {
      calls.push({ args });
      return {
        status: 0,
        stdout: `{"type":"session","session_id":"SESSION-CLARIFICATION"}\n${skillOutputEvent("RUN-CLARIFICATION", { skillName: "manage-spec-change", requestedAction: "resolve_clarification" })}`,
        stderr: "",
      };
    },
  );

  const prompt = calls[0].args.join("\n");
  assert.equal(result.status, "completed");
  assert.match(prompt, /Operator input:/);
  assert.match(prompt, /\"clarificationText\": \"彩票类型支持大乐透和双色球\"/);
  assert.match(prompt, /operator-provided answer\/decision/);
});

test("cli.run uses danger-full-access for trusted direct-write runs with bounded scope", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-"));
  prepareSkillWorkspace(root);
  mkdirSync(join(root, ".agents", "skills", "generate-user-stories"), { recursive: true });
  writeFileSync(join(root, ".agents", "skills", "generate-user-stories", "SKILL.md"), "# PR user stories skill\n");
  mkdirSync(join(root, "docs", "agentic-spec"), { recursive: true });
  writeFileSync(join(root, "docs", "agentic-spec", "PRD.md"), "# PRD\n");
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: Array<{ args: string[] }> = [];

  const result = await runCliRunJob(
    dbPath,
    {
      projectId: "project-1",
      executionId: "RUN-USER-STORIES-DIRECT",
      operation: "generate_user_stories",
      requestedAction: "generate_user_stories",
      traceability: { requirementIds: [] },
      context: {
        skillName: "generate-user-stories",
        skillPhase: "generate_user_stories",
        sourcePaths: ["docs/agentic-spec/PRD.md"],
        expectedArtifacts: ["docs/agentic-spec/requirements.md"],
      },
    },
    (_command, args) => {
      calls.push({ args });
      writeFileSync(join(root, "docs", "agentic-spec", "requirements.md"), "# Requirements\n");
      return {
        status: 0,
        stdout: `{"type":"session","session_id":"SESSION-USER-STORIES"}\n${skillOutputEvent("RUN-USER-STORIES-DIRECT", {
          skillName: "generate-user-stories",
          requestedAction: "generate_user_stories",
          producedArtifacts: [{ path: "docs/agentic-spec/requirements.md", kind: "markdown", status: "created" }],
        })}`,
        stderr: "",
      };
    },
  );
  const rows = runSqlite(dbPath, [], [
    { name: "policy", sql: "SELECT sandbox_mode FROM runner_policies WHERE run_id = 'RUN-USER-STORIES-DIRECT'" },
  ]).queries;

  assert.equal(result.status, "completed");
  assert.equal(rows.policy[0].sandbox_mode, "danger-full-access");
  assert.match(calls[0].args.join("\n"), /--sandbox\ndanger-full-access/);
});

test("cli.run uses development sandbox defaults when allowed file scope is missing", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  runSqlite(dbPath, [
    { sql: "UPDATE task_graph_tasks SET allowed_files_json = '[]' WHERE id = 'TASK-CLI'" },
  ]);
  const calls: Array<{ args: string[] }> = [];

  const result = await runCliRunJob(
    dbPath,
    cliRunPayload("RUN-CODING-UNBOUNDED"),
    (_command, args) => {
      calls.push({ args });
      return {
        status: 0,
        stdout: `{"type":"session","session_id":"SESSION-CODING"}\n${skillOutputEvent("RUN-CODING-UNBOUNDED")}`,
        stderr: "",
      };
    },
  );
  const rows = runSqlite(dbPath, [], [
    { name: "policy", sql: "SELECT sandbox_mode FROM runner_policies WHERE run_id = 'RUN-CODING-UNBOUNDED'" },
  ]).queries;

  assert.equal(result.status, "completed");
  assert.equal(rows.policy[0].sandbox_mode, "danger-full-access");
  assert.match(calls[0].args.join("\n"), /--sandbox\ndanger-full-access/);
});

test("cli.run does not include change ids in the execution invocation", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);

  const result = await runCliRunJob(
    dbPath,
    {
      ...cliRunPayload("RUN-NO-CHANGE-ID"),
      traceability: { requirementIds: [] },
    },
    () => ({
      status: 0,
      stdout: `{"type":"session","session_id":"SESSION-NO-CHANGE-ID"}\n${skillOutputEvent("RUN-NO-CHANGE-ID", { changeIds: [] })}`,
      stderr: "",
    }),
  );
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT metadata_json FROM execution_records WHERE id = 'RUN-NO-CHANGE-ID'" },
  ]).queries.run;
  const metadata = JSON.parse(String(rows[0].metadata_json));

  assert.equal(result.status, "completed");
  const inputLog = JSON.parse(readFileSync(join(root, ".autobuild", "runs", "RUN-NO-CHANGE-ID", "cli-input.json"), "utf8"));
  assert.equal(Object.prototype.hasOwnProperty.call(inputLog.executionInvocation.traceability, "changeIds"), false);
  assert.equal(metadata.executionInvocation, undefined);
});

test("cli.run blocks when target project workspace is missing or lacks workspace skills", async () => {
  const dbPath = makeDbPath();
  runSqlite(dbPath, [
    { sql: "INSERT INTO projects (id, name, goal, project_type, tech_preferences_json, target_repo_path, default_branch, environment) VALUES ('project-1', 'Project', 'Goal', 'app', '[]', '/tmp/specdrive-missing-workspace', 'main', 'dev')" },
    { sql: "INSERT INTO features (id, project_id, title, status, priority, dependencies_json, primary_requirements_json) VALUES ('FEAT-CLI', 'project-1', 'CLI', 'tasked', 1, '[]', '[]')" },
    {
      sql: `INSERT INTO task_graph_tasks (
          id, graph_id, feature_id, title, status, source_requirements_json,
          acceptance_criteria_json, allowed_files_json, dependencies_json, risk, estimated_effort
        ) VALUES ('TASK-CLI', 'TG-CLI', 'FEAT-CLI', 'Run CLI task', 'scheduled', '[]', '[]', '["src/index.ts"]', '[]', 'low', 1)`,
    },
  ]);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-BLOCKED"), () => {
    throw new Error("runner should not be called");
  });
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary FROM execution_records WHERE id = 'RUN-BLOCKED'" },
  ]).queries.run;

  assert.equal(result.status, "blocked");
  assert.equal(rows[0].status, "blocked");
  assert.match(String(rows[0].summary), /workspace root is missing or unreadable/);
});

test("cli.run blocks when CLI adapters exist in DB but none is active", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  // Insert a disabled adapter so the table is non-empty with no active row
  runSqlite(dbPath, [
    {
      sql: `INSERT INTO cli_adapter_configs (id, display_name, schema_version, executable, argument_template_json,
          resume_argument_template_json, config_schema_json, form_schema_json, defaults_json,
          environment_allowlist_json, output_mapping_json, status, updated_at)
        VALUES ('adapter-disabled', 'Disabled Adapter', 1, 'codex', '[]', '[]', '{}', '{}', '{}', '[]', '{}', 'disabled', CURRENT_TIMESTAMP)`,
    },
  ]);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-NO-ADAPTER"), () => {
    throw new Error("runner should not be called");
  });
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary FROM execution_records WHERE id = 'RUN-NO-ADAPTER'" },
  ]).queries.run;

  assert.equal(result.status, "blocked");
  assert.equal(rows[0].status, "blocked");
  assert.match(String(rows[0].summary), /No active CLI adapter/);
});

test("cli.run uses default built-in adapter when cli_adapter_configs table is empty", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  // Table is empty (no adapters configured) — should fall back to DEFAULT and succeed

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-DEFAULT-ADAPTER"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-DEFAULT"}\n${skillOutputEvent("RUN-DEFAULT-ADAPTER")}`,
    stderr: "",
  }));

  assert.equal(result.status, "completed");
});

test("cli.run uses active Gemini CLI adapter from adapter configuration", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: Array<{ command: string; args: string[]; cwd: string }> = [];
  runSqlite(dbPath, [
    {
      sql: `INSERT INTO cli_adapter_configs (id, display_name, schema_version, executable, argument_template_json,
          resume_argument_template_json, config_schema_json, form_schema_json, defaults_json,
          environment_allowlist_json, output_mapping_json, status, updated_at)
        VALUES ('gemini-cli', 'Google Gemini CLI', 1, 'gemini', ?, '[]', '{}', '{}', ?, '[]', ?, 'active', CURRENT_TIMESTAMP)`,
      params: [
        JSON.stringify(["--model", "{{model}}", "--output-format", "stream-json", "-p", "{{prompt}}"]),
        JSON.stringify({ model: "gemini-3-pro-preview", reasoningEffort: "medium", sandbox: "danger-full-access", approval: "never" }),
        JSON.stringify({ eventStream: "json", outputSchema: "skill-output.schema.json", sessionIdPath: "session_id", responseTextPaths: ["response"] }),
      ],
    },
  ]);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-GEMINI-ADAPTER"), (command, args, cwd) => {
    calls.push({ command, args, cwd });
    return {
      status: 0,
      stdout: `{"type":"init","session_id":"SESSION-GEMINI"}\n${JSON.stringify({ type: "message", response: JSON.stringify(skillOutputObject("RUN-GEMINI-ADAPTER")) })}`,
      stderr: "",
    };
  });

  assert.equal(result.status, "completed");
  assert.equal(calls[0].command, "gemini");
  assert.deepEqual(calls[0].args.slice(0, 5), ["--model", "gemini-3-pro-preview", "--output-format", "stream-json", "-p"]);
  assert.equal(calls[0].cwd, root);
});

test("cli.run can select built-in Claude Code CLI adapter from job execution preference", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-claude-cli-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: Array<{ command: string; args: string[]; cwd: string }> = [];
  const payload = {
    ...cliRunPayload("RUN-CLAUDE-ADAPTER"),
    executionPreference: { runMode: "cli" as const, adapterId: "claude-cli", source: "job" as const },
  };

  const result = await runCliRunJob(dbPath, payload, (command, args, cwd) => {
    calls.push({ command, args, cwd });
    return {
      status: 0,
      stdout: JSON.stringify({
        type: "result",
        session_id: "SESSION-CLAUDE",
        structured_output: skillOutputObject("RUN-CLAUDE-ADAPTER"),
      }),
      stderr: "",
    };
  });

  assert.equal(result.status, "completed");
  assert.equal(calls[0].command, "claude");
  assert.deepEqual(calls[0].args.slice(0, 8), ["-p", calls[0].args[1], "--model", "sonnet", "--effort", "medium", "--output-format", "json"]);
  assert.equal(calls[0].args[calls[0].args.indexOf("--permission-mode") + 1], "acceptEdits");
  assert.equal(calls[0].cwd, root);
});

test("codex.rpc.run executes mocked app-server transport and persists runner artifacts", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-app-server-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const calls: string[] = [];
  let turnStartPrompt = "";
  const transport: CodexAppServerTransport = {
    async request(method, params) {
      calls.push(method);
      if (method === "turn/start") {
        const input = (params.input ?? []) as Array<{ type: string; text?: string }>;
        turnStartPrompt = input.find((item) => item.type === "text")?.text ?? "";
      }
      if (method === "thread/start") return { threadId: "THREAD-APP" };
      if (method === "turn/start") return { turnId: "TURN-APP" };
      return {};
    },
    notify(method) {
      calls.push(method);
    },
    async *events() {
      yield { type: "item/agentMessage/delta", delta: "done" };
      yield {
        type: "turn/completed",
        status: "completed",
        output: {
          contractVersion: "skill-contract/v2",
          executionId: "RUN-APP-SERVER",
          skillName: "implement-feature",
          requestedAction: "feature_execution",
          status: "completed",
          summary: "App server completed.",
          nextAction: "Continue.",
          producedArtifacts: [],
          traceability: {
            featureId: "FEAT-CLI",
          },
          result: validJourneyResult(),
        },
      };
    },
  };

  const result = await runCodexAppServerRunJob(dbPath, cliRunPayload("RUN-APP-SERVER"), transport);
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, metadata_json FROM execution_records WHERE id = 'RUN-APP-SERVER'" },
    { name: "policy", sql: "SELECT model, reasoning_effort FROM runner_policies WHERE run_id = 'RUN-APP-SERVER'" },
    { name: "session", sql: "SELECT session_id, command, args_json, exit_code FROM cli_session_records WHERE run_id = 'RUN-APP-SERVER'" },
    { name: "log", sql: "SELECT stdout, events_json FROM raw_execution_logs WHERE run_id = 'RUN-APP-SERVER'" },
    { name: "statusChecks", sql: "SELECT kind, summary FROM status_check_results WHERE run_id = 'RUN-APP-SERVER'" },
  ]).queries;

  assert.equal(result.status, "completed");
  assert.deepEqual(calls, ["initialize", "initialized", "thread/start", "turn/start"]);
  assert.match(turnStartPrompt, /\[AUTOBUILD INVOCATION\]/);
  assert.match(turnStartPrompt, /\.autobuild\/memory\/project\.md/);
  assert.equal(rows.run[0].status, "completed");
  const metadata = JSON.parse(String(rows.run[0].metadata_json));
  assert.equal(metadata.threadId, "THREAD-APP");
  assert.equal(metadata.turnId, "TURN-APP");
  assert.equal(metadata.transport, "stdio");
  assert.equal(metadata.model, "gpt-5.5");
  assert.equal(metadata.contractValidation.valid, true);
  assert.equal(rows.policy[0].model, "gpt-5.5");
  assert.equal(rows.policy[0].reasoning_effort, "high");
  assert.equal(rows.session[0].session_id, "THREAD-APP");
  assert.equal(rows.session[0].command, "codex");
  assert.deepEqual(JSON.parse(String(rows.session[0].args_json)), ["app-server"]);
  assert.equal(rows.session[0].exit_code, 0);
  const appServerLogIndex = JSON.parse(String(rows.log[0].events_json));
  assert.equal(rows.log[0].stdout, "");
  assert.equal(appServerLogIndex.storage, "file");
  assert.equal(appServerLogIndex.eventCount, appServerLogIndex.eventRefs.length);
  assert.ok(appServerLogIndex.eventCount >= 1);
  assert.equal(existsSync(join(root, ".autobuild", "runs", "RUN-APP-SERVER", "WORKPAD.md")), true);
  assert.equal(rows.statusChecks.length, 0);
});

test("rpc.run dispatches active Gemini ACP provider and persists runner artifacts", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-gemini-acp-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  runSqlite(dbPath, [
    {
      sql: `INSERT INTO rpc_adapter_configs (
        id, display_name, provider, schema_version, executable, args_json, transport, endpoint,
        request_timeout_ms, config_schema_json, form_schema_json, defaults_json, status
      ) VALUES ('gemini-acp-test', 'Gemini ACP Test', 'gemini-acp', 1, 'gemini',
        '["--acp","--skip-trust"]', 'stdio', 'stdio://', 1000, '{}', '{}', '{}', 'active')`,
    },
  ]);
  const calls: string[] = [];
  let sessionPrompt = "";
  const transport: GeminiAcpTransport = {
    async request(method, params) {
      calls.push(method);
      if (method === "session/new") return { sessionId: "GEMINI-ACP-THREAD" };
      if (method === "session/prompt") {
        const prompt = (params.prompt ?? []) as Array<{ type: string; text?: string }>;
        sessionPrompt = prompt.find((item) => item.type === "text")?.text ?? "";
        return new Promise((resolve) => setTimeout(() => resolve({ stopReason: "end_turn" }), 0));
      }
      return {};
    },
    async *events(): AsyncIterable<CliJsonEvent> {
      yield {
        type: "session/update",
        sessionId: "GEMINI-ACP-THREAD",
        update: {
          sessionUpdate: "agent_message_chunk",
          content: { text: JSON.stringify(skillOutputObject("RUN-GEMINI-ACP-RPC")) },
        },
      };
    },
  };

  const result = await runRpcRunJob(dbPath, cliRunPayload("RUN-GEMINI-ACP-RPC"), undefined, transport);
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, metadata_json FROM execution_records WHERE id = 'RUN-GEMINI-ACP-RPC'" },
    { name: "session", sql: "SELECT session_id, command, args_json, exit_code FROM cli_session_records WHERE run_id = 'RUN-GEMINI-ACP-RPC'" },
    { name: "log", sql: "SELECT stdout, events_json FROM raw_execution_logs WHERE run_id = 'RUN-GEMINI-ACP-RPC'" },
  ]).queries;

  assert.equal(result.status, "completed");
  assert.deepEqual(calls, ["initialize", "session/new", "session/prompt"]);
  assert.match(sessionPrompt, /\[AUTOBUILD INVOCATION\]/);
  assert.match(sessionPrompt, /\.autobuild\/memory\/project\.md/);
  assert.equal(rows.run[0].status, "completed");
  const metadata = JSON.parse(String(rows.run[0].metadata_json));
  assert.equal(metadata.provider, "gemini-acp");
  assert.equal(metadata.sessionId, "GEMINI-ACP-THREAD");
  assert.equal(metadata.contractValidation.valid, true);
  assert.equal(rows.session[0].session_id, "GEMINI-ACP-THREAD");
  assert.equal(rows.session[0].command, "gemini");
  assert.deepEqual(JSON.parse(String(rows.session[0].args_json)), ["--acp", "--skip-trust"]);
  assert.equal(rows.session[0].exit_code, 0);
  const geminiLogIndex = JSON.parse(String(rows.log[0].events_json));
  assert.equal(rows.log[0].stdout, "");
  assert.equal(geminiLogIndex.storage, "file");
  assert.equal(geminiLogIndex.eventCount, geminiLogIndex.eventRefs.length);
  assert.ok(geminiLogIndex.eventCount >= 1);
  assert.equal(existsSync(join(root, ".autobuild", "runs", "RUN-GEMINI-ACP-RPC", "WORKPAD.md")), true);
});

test("codex.rpc.run projects approval pending to Feature spec-state", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-app-server-approval-"));
  prepareSkillWorkspace(root);
  const featureDir = join(root, "docs", "agentic-spec", "features", "feat-cli");
  mkdirSync(featureDir, { recursive: true });
  writeFileSync(join(featureDir, "requirements.md"), "# Feature Spec: FEAT-CLI\n");
  writeFileSync(join(featureDir, "design.md"), "# Design\n");
  writeFileSync(join(featureDir, "tasks.md"), "# Tasks\n");
  commitWorkspace(root, "add approval feature fixture");
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const transport: CodexAppServerTransport = {
    async request(method) {
      if (method === "thread/start") return { threadId: "THREAD-APPROVAL" };
      if (method === "turn/start") return { turnId: "TURN-APPROVAL" };
      return {};
    },
    notify() {},
    async *events() {
      yield {
        type: "approval/request",
        threadId: "THREAD-APPROVAL",
        turnId: "TURN-APPROVAL",
        request: { id: "APPROVAL-1", summary: "Approve file write." },
      };
    },
  };
  const payload = cliRunPayload("RUN-APPROVAL");

  const result = await runCodexAppServerRunJob(dbPath, {
    ...payload,
    context: {
      ...payload.context,
      featureSpecPath: "docs/agentic-spec/features/feat-cli",
      skillName: "implement-feature",
    },
  }, transport);
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary, metadata_json FROM execution_records WHERE id = 'RUN-APPROVAL'" },
  ]).queries.run;
  const state = JSON.parse(readFileSync(join(featureDir, "spec-state.json"), "utf8"));
  const metadata = JSON.parse(String(rows[0].metadata_json));

  assert.equal(result.status, "approval_needed");
  assert.equal(rows[0].status, "approval_needed");
  assert.match(String(rows[0].summary), /waiting for approval/i);
  assert.equal(metadata.approvalState, "pending");
  assert.equal(state.status, "approval_needed");
  assert.equal(state.executionStatus, "approval_needed");
  assert.equal(state.resumeTarget.status, "running");
  assert.equal(state.resumeTarget.executionId, "RUN-APPROVAL");
  assert.match(state.nextAction, /approval/i);
});

test("codex.rpc.run writes completed Feature execution to spec-state file", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-app-server-completed-state-"));
  prepareSkillWorkspace(root);
  const featureDir = join(root, "docs", "agentic-spec", "features", "feat-cli");
  mkdirSync(featureDir, { recursive: true });
  writeFileSync(join(featureDir, "requirements.md"), "# Feature Spec: FEAT-CLI\n");
  writeFileSync(join(featureDir, "design.md"), "# Design\n");
  writeFileSync(join(featureDir, "tasks.md"), "# Tasks\n");
  commitWorkspace(root, "add completed-state feature fixture");
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const transport: CodexAppServerTransport = {
    async request(method) {
      if (method === "thread/start") return { threadId: "THREAD-COMPLETED" };
      if (method === "turn/start") return { turnId: "TURN-COMPLETED" };
      return {};
    },
    notify() {},
    async *events() {
      yield {
        type: "turn/completed",
        status: "completed",
        output: skillOutputObject("RUN-COMPLETED-STATE"),
      };
    },
  };
  const payload = cliRunPayload("RUN-COMPLETED-STATE");

  const result = await runCodexAppServerRunJob(dbPath, {
    ...payload,
    context: {
      ...payload.context,
      featureSpecPath: "docs/agentic-spec/features/feat-cli",
    },
  }, transport);
  const state = JSON.parse(readFileSync(join(featureDir, "spec-state.json"), "utf8"));

  assert.equal(result.status, "completed");
  assert.equal(state.status, "completed");
  assert.equal(state.executionStatus, "completed");
  assert.equal(state.currentJob.executionId, "RUN-COMPLETED-STATE");
  assert.equal(state.lastResult.status, "completed");
  assert.equal(state.lastResult.summary, "Skill completed.");
});

test("codex.rpc.run fails when app-server cannot be started", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-app-server-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  runSqlite(dbPath, [
    {
      sql: `INSERT INTO codex_app_server_adapter_configs (
        id, display_name, schema_version, executable, args_json, transport, endpoint,
        request_timeout_ms, config_schema_json, form_schema_json, defaults_json, status
      ) VALUES ('bad-app-server', 'Bad app-server', 1, '/tmp/specdrive-missing-codex-rpc',
        '["app-server","--listen","stdio://"]', 'stdio', 'stdio://', 1000, '{}', '{}', '{}', 'active')`,
    },
  ]);

  const result = await runCodexAppServerRunJob(dbPath, cliRunPayload("RUN-NO-APP-SERVER"));
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary FROM execution_records WHERE id = 'RUN-NO-APP-SERVER'" },
  ]).queries.run;

  assert.equal(result.status, "failed");
  assert.equal(rows[0].status, "failed");
  assert.match(String(rows[0].summary), /ENOENT|spawn/);
});

test("codex.rpc.run blocks when configured Codex RPC adapters are disabled", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-app-server-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  runSqlite(dbPath, [
    {
      sql: `INSERT INTO codex_app_server_adapter_configs (
        id, display_name, schema_version, executable, args_json, transport, endpoint,
        request_timeout_ms, config_schema_json, form_schema_json, defaults_json, status
      ) VALUES ('disabled-app-server', 'Disabled app-server', 1, 'codex',
        '["app-server","--listen","stdio://"]', 'stdio', 'stdio://', 1000, '{}', '{}', '{}', 'disabled')`,
    },
  ]);

  const result = await runCodexAppServerRunJob(dbPath, cliRunPayload("RUN-DISABLED-APP-SERVER"), {
    async request() {
      throw new Error("transport should not be called");
    },
    notify() {
      throw new Error("transport should not be called");
    },
    async *events() {},
  });
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary FROM execution_records WHERE id = 'RUN-DISABLED-APP-SERVER'" },
  ]).queries.run;

  assert.equal(result.status, "blocked");
  assert.equal(rows[0].status, "blocked");
  assert.match(String(rows[0].summary), /No active Codex RPC adapter/);
});

test("codex.rpc.run routes invalid completed SkillOutputContractV1 to review_needed", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-app-server-run-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);
  const transport: CodexAppServerTransport = {
    async request(method) {
      if (method === "thread/start") return { thread: { id: "THREAD-BAD-CONTRACT" } };
      if (method === "turn/start") return { turn: { id: "TURN-BAD-CONTRACT" } };
      return {};
    },
    notify() {},
    async *events() {
      yield {
        type: "turn/completed",
        status: "completed",
        output: {
          contractVersion: "skill-contract/v1",
          executionId: "WRONG-RUN",
          skillName: "implement-feature",
          requestedAction: "feature_execution",
          status: "completed",
          summary: "Bad contract.",
          nextAction: "Review mismatch.",
          producedArtifacts: [],
          traceability: {
            featureId: "FEAT-CLI",
            taskId: "TASK-CLI",
            requirementIds: [],
            changeIds: ["CHG-016"],
          },
          result: {},
        },
      };
    },
  };

  const result = await runCodexAppServerRunJob(dbPath, cliRunPayload("RUN-BAD-CONTRACT"), transport);
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary, metadata_json FROM execution_records WHERE id = 'RUN-BAD-CONTRACT'" },
    { name: "log", sql: "SELECT stderr, events_json FROM raw_execution_logs WHERE run_id = 'RUN-BAD-CONTRACT'" },
  ]).queries;
  const metadata = JSON.parse(String(rows.run[0].metadata_json));

  assert.equal(result.status, "review_needed");
  assert.equal(rows.run[0].status, "review_needed");
  assert.match(String(rows.run[0].summary), /executionId mismatch/);
  assert.equal(metadata.contractValidation.valid, false);
  const badContractLogIndex = JSON.parse(String(rows.log[0].events_json));
  assert.equal(rows.log[0].stderr, "");
  assert.equal(badContractLogIndex.storage, "file");
  assert.equal(badContractLogIndex.eventCount, badContractLogIndex.eventRefs.length);
  assert.ok(badContractLogIndex.eventCount >= 1);
});

test("cli.run accepts completed feature execution without optional journey ledger", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-journey-gap-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-JOURNEY-GAP"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-JOURNEY-GAP"}\n${skillOutputEvent("RUN-JOURNEY-GAP", { result: {} })}`,
    stderr: "",
  }));
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary, metadata_json FROM execution_records WHERE id = 'RUN-JOURNEY-GAP'" },
    { name: "reviews", sql: "SELECT status, review_needed_reason, trigger_reasons_json, body FROM review_items WHERE run_id = 'RUN-JOURNEY-GAP'" },
  ]).queries;
  const metadata = JSON.parse(String(rows.run[0].metadata_json));

  assert.equal(result.status, "completed");
  assert.equal(rows.run[0].status, "completed");
  assert.equal(metadata.contractValidation.valid, true);
  assert.equal(rows.reviews.length, 0);
});

test("cli.run accepts completed feature execution without optional Git delivery ledger", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-git-gap-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-GIT-GAP"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-GIT-GAP"}\n${skillOutputEvent("RUN-GIT-GAP", {
      result: {
        requirementCoverage: [{ requirementId: "REQ-CLI", status: "passed", evidence: ["tests/scheduler.test.ts"] }],
        acceptanceEvidence: [{ scenarioId: "AC-CLI", status: "passed", evidence: ["run report"] }],
        journeyEvidence: [{ userStoryId: "US-CLI", scenario: "user completes feature flow", status: "passed", evidence: ["run report"] }],
        deliveryFidelity: validDeliveryFidelity(),
      },
    })}`,
    stderr: "",
  }));
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary, metadata_json FROM execution_records WHERE id = 'RUN-GIT-GAP'" },
    { name: "reviews", sql: "SELECT status, review_needed_reason, trigger_reasons_json, body FROM review_items WHERE run_id = 'RUN-GIT-GAP'" },
  ]).queries;
  const metadata = JSON.parse(String(rows.run[0].metadata_json));

  assert.equal(result.status, "completed");
  assert.equal(rows.run[0].status, "completed");
  assert.equal(metadata.contractValidation.valid, true);
  assert.equal(rows.reviews.length, 0);
});

test("cli.run routes completed feature execution with fidelity loss to review_needed", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-fidelity-gap-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-FIDELITY-GAP"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-FIDELITY-GAP"}\n${skillOutputEvent("RUN-FIDELITY-GAP", {
      result: {
        ...validJourneyResult(),
        deliveryFidelity: validDeliveryFidelity({
          losses: [{
            type: "test_bypass",
            severity: "P1",
            status: "open",
            description: "Verification used an API fixture instead of the user behavior.",
            owner: "test-engineer",
            evidenceRefs: [],
          }],
        }),
      },
    })}`,
    stderr: "",
  }));
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, summary, metadata_json FROM execution_records WHERE id = 'RUN-FIDELITY-GAP'" },
    { name: "reviews", sql: "SELECT status, review_needed_reason, trigger_reasons_json, body FROM review_items WHERE run_id = 'RUN-FIDELITY-GAP'" },
  ]).queries;
  const metadata = JSON.parse(String(rows.run[0].metadata_json));

  assert.equal(result.status, "review_needed");
  assert.equal(rows.run[0].status, "review_needed");
  assert.match(String(rows.run[0].summary), /Delivery Fidelity Gate failed: quality_evidence_gap/);
  assert.equal(metadata.contractValidation.valid, false);
  assert.match(metadata.contractValidation.reasons.join("\n"), /unclosed critical loss P1:test_bypass/);
  assert.equal(rows.reviews[0].status, "review_needed");
  assert.equal(rows.reviews[0].review_needed_reason, "risk_review_needed");
  assert.match(String(rows.reviews[0].trigger_reasons_json), /quality_evidence_gap/);
  assert.match(String(rows.reviews[0].body), /Delivery Fidelity Gate/);
});

test("cli.run accepts completed foundation feature with explicit downstream journey exemption", async () => {
  const root = mkdtempSync(join(tmpdir(), "specdrive-cli-run-foundation-"));
  prepareSkillWorkspace(root);
  const dbPath = makeDbPath();
  seedCliRunData(dbPath, root);

  const result = await runCliRunJob(dbPath, cliRunPayload("RUN-FOUNDATION-EXEMPT"), () => ({
    status: 0,
    stdout: `{"type":"session","session_id":"SESSION-FOUNDATION"}\n${skillOutputEvent("RUN-FOUNDATION-EXEMPT", {
      result: {
        deliveryFidelity: validDeliveryFidelity({
          journeys: [],
          sourceIntent: [{ id: "INTENT-FOUNDATION", summary: "Foundation work supports downstream UI closure.", sourceRef: "docs/agentic-spec/features/FEAT-CLI/requirements.md", status: "preserved" }],
        }),
        foundationExemption: {
          exempt: true,
          reason: "Infrastructure-only adapter needed before user journeys can close.",
          downstreamFeatures: ["FEAT-UI-CLOSURE"],
          integrationEvidence: ["tests/adapter-contract.test.ts"],
        },
        gitDelivery: validGitDelivery(),
      },
    })}`,
    stderr: "",
  }));
  const rows = runSqlite(dbPath, [], [
    { name: "run", sql: "SELECT status, metadata_json FROM execution_records WHERE id = 'RUN-FOUNDATION-EXEMPT'" },
  ]).queries.run;
  const metadata = JSON.parse(String(rows[0].metadata_json));

  assert.equal(result.status, "completed");
  assert.equal(rows[0].status, "completed");
  assert.equal(metadata.contractValidation.valid, true);
});

function makeDbPath(): string {
  const root = mkdtempSync(join(tmpdir(), "specdrive-scheduler-"));
  const dbPath = join(root, ".autobuild", "autobuild.db");
  initializeSchema(dbPath);
  return dbPath;
}

function seedFeatureSchedulerData(dbPath: string): void {
  runSqlite(dbPath, [
    { sql: "INSERT INTO projects (id, name, goal, project_type, tech_preferences_json, target_repo_path, default_branch, environment) VALUES ('project-1', 'Project', 'Goal', 'app', '[]', '/tmp/project', 'main', 'dev')" },
    {
      sql: `INSERT INTO features (id, project_id, title, status, priority, dependencies_json, primary_requirements_json)
        VALUES
          ('FEAT-A', 'project-1', 'Lower priority', 'ready', 1, '[]', '[]'),
          ('FEAT-B', 'project-1', 'Higher priority', 'ready', 10, '[]', '[]')`,
    },
  ]);
}

function seedCliRunData(dbPath: string, root: string): void {
  runSqlite(dbPath, [
    { sql: "INSERT INTO projects (id, name, goal, project_type, tech_preferences_json, target_repo_path, default_branch, environment) VALUES (?, 'Project', 'Goal', 'app', '[]', ?, 'main', 'dev')", params: ["project-1", root] },
    { sql: "INSERT INTO features (id, project_id, title, status, priority, dependencies_json, primary_requirements_json) VALUES ('FEAT-CLI', 'project-1', 'CLI', 'tasked', 1, '[]', '[]')" },
    {
      sql: `INSERT INTO task_graph_tasks (
          id, graph_id, feature_id, title, status, source_requirements_json,
          acceptance_criteria_json, allowed_files_json, dependencies_json, risk, estimated_effort
        ) VALUES ('TASK-CLI', 'TG-CLI', 'FEAT-CLI', 'Run CLI task', 'scheduled', '[]', '[]', '["src/index.ts"]', '[]', 'low', 1)`,
    },
  ]);
}

function cliRunPayload(executionId: string) {
  return {
    projectId: "project-1",
    executionId,
    operation: "feature_execution",
    traceability: { requirementIds: [] },
    context: {
      featureId: "FEAT-CLI",
      taskId: "TASK-CLI",
      skillPhase: "feature_execution",
    },
  };
}

function skillOutputEvent(executionId: string, overrides: {
  skillName?: string;
  requestedAction?: string;
  producedArtifacts?: Array<{ path: string; kind: string; status: string }>;
  changeIds?: string[];
  status?: "queued" | "running" | "waiting_input" | "approval_needed" | "completed" | "review_needed" | "blocked" | "failed" | "cancelled";
  summary?: string;
  result?: Record<string, unknown>;
} = {}): string {
  const output = {
    contractVersion: overrides.skillName ? "skill-contract/v1" : "skill-contract/v2",
    executionId,
    skillName: overrides.skillName ?? "implement-feature",
    requestedAction: overrides.requestedAction ?? "feature_execution",
    status: overrides.status ?? "completed",
    summary: overrides.summary ?? "Skill completed.",
    nextAction: "Continue scheduler flow.",
    producedArtifacts: overrides.producedArtifacts ?? [],
    traceability: {
      featureId: overrides.skillName ? undefined : "FEAT-CLI",
      taskId: overrides.skillName ? undefined : "TASK-CLI",
      requirementIds: [],
      changeIds: overrides.changeIds ?? ["CHG-016"],
    },
    result: overrides.result ?? validJourneyResult(),
  };
  return JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify(output) } });
}

function skillOutputObject(executionId: string): Record<string, unknown> {
  return {
    contractVersion: "skill-contract/v2",
    executionId,
    skillName: "implement-feature",
    requestedAction: "feature_execution",
    status: "completed",
    summary: "Skill completed.",
    nextAction: "Continue scheduler flow.",
    producedArtifacts: [],
    traceability: {
      featureId: "FEAT-CLI",
    },
    result: validJourneyResult(),
  };
}

function validJourneyResult(): Record<string, unknown> {
  return {
    requirementCoverage: [{ requirementId: "REQ-CLI", status: "passed", evidence: ["tests/scheduler.test.ts"] }],
    acceptanceEvidence: [{ scenarioId: "AC-CLI", status: "passed", evidence: ["run report"] }],
    journeyEvidence: [{ userStoryId: "US-CLI", scenario: "user completes feature flow", status: "passed", evidence: ["run report"] }],
    deliveryFidelity: validDeliveryFidelity(),
    gitDelivery: validGitDelivery(),
  };
}

function validDeliveryFidelity(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sourceIntent: [{ id: "INTENT-CLI", summary: "Feature execution preserves the requested behavior.", sourceRef: "docs/agentic-spec/features/FEAT-CLI/requirements.md", status: "preserved" }],
    journeys: [{ id: "US-CLI", summary: "User completes feature flow", status: "verified", obligations: ["BO-CLI"] }],
    behaviorObligations: [{ id: "BO-CLI", sourceRef: "AC-CLI", description: "Complete the feature behavior and verify it.", status: "verified", evidenceRefs: ["EV-CLI"] }],
    handoffs: [
      { from: "define", to: "plan", preservedObligations: ["BO-CLI"], losses: [], status: "passed" },
      { from: "plan", to: "build", preservedObligations: ["BO-CLI"], losses: [], status: "passed" },
      { from: "build", to: "verify", preservedObligations: ["BO-CLI"], losses: [], status: "passed" },
    ],
    losses: [],
    evidence: [{
      id: "EV-CLI",
      type: "browser_interaction",
      mode: "no_seed",
      assertion: "state_change_roundtrip",
      source: "tests/scheduler.test.ts",
      covers: ["BO-CLI", "AC-CLI", "US-CLI"],
      status: "passed",
      artifactRefs: ["raw-log://RUN-CLI/output"],
    }],
    agentReviews: [{ role: "test-engineer", reviewer: "independent", status: "passed", findings: [], evidenceRefs: ["EV-CLI"] }],
    completionDecision: { status: "passed", reason: "Fidelity chain is closed.", decidedBy: "release-reviewer", unresolvedLosses: [] },
    ...overrides,
  };
}

function validGitDelivery(): Record<string, unknown> {
  return {
    ownerWorkspace: "/workspace/project",
    implementationWorkspace: "/workspace/project.worktrees/feat-cli",
    worktree: "/workspace/project.worktrees/feat-cli",
    branch: "feat/feat-cli",
    commitHash: "abc1234",
    prUrl: "https://github.com/example/specdrive/pull/8",
    checks: "passed",
    merge: "merged",
    remoteBranchCleanup: "completed",
    localBranchCleanup: "completed",
    worktreeCleanup: "cleaned",
    deliveryExemption: null,
  };
}

function prepareSkillWorkspace(root: string): void {
  mkdirSync(join(root, ".agents", "skills", "implement-feature"), { recursive: true });
  mkdirSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI"), { recursive: true });
  writeFileSync(join(root, "AGENTS.md"), "# Test workspace\n");
  writeFileSync(join(root, ".agents", "skills", "implement-feature", "SKILL.md"), "# Feat implement skill\n");
  writeFileSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI", "requirements.md"), "# Requirements\n");
  writeFileSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI", "design.md"), "# Design\n");
  writeFileSync(join(root, "docs", "agentic-spec", "features", "FEAT-CLI", "tasks.md"), "# Tasks\n");
  initializeGitWorkspace(root);
}

function initializeGitWorkspace(root: string): void {
  runGit(root, ["init", "-b", "main"]);
  runGit(root, ["config", "user.email", "specdrive-tests@example.invalid"]);
  runGit(root, ["config", "user.name", "SpecDrive Tests"]);
  commitWorkspace(root, "initial fixture");
}

function commitWorkspace(root: string, message: string): void {
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", message]);
}

function runGit(root: string, args: string[]): void {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
}
