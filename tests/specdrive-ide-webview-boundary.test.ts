import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readSourceTree(dir: string): string {
  return readdirSync(dir, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const entryPath = join(dir, entry.name);
      if (entry.isDirectory()) return readSourceTree(entryPath);
      if (!entry.name.endsWith(".ts")) return "";
      return readFileSync(entryPath, "utf8");
    })
    .filter(Boolean)
    .join("\n");
}

const extensionSource = readSourceTree("apps/vscode-extension/src");
const webviewSource = readSourceTree("apps/vscode-extension/src/webviews");
const executionWebviewSource = readFileSync("apps/vscode-extension/src/webviews/execution.ts", "utf8");
const sharedWebviewSource = readFileSync("apps/vscode-extension/src/webviews/shared.ts", "utf8");
const webviewI18nSource = readFileSync("apps/vscode-extension/src/webviews/i18n.ts", "utf8");
const webviewI18nZhSource = readFileSync("apps/vscode-extension/src/webviews/i18n.zh-CN.ts", "utf8");
const webviewI18nJaSource = readFileSync("apps/vscode-extension/src/webviews/i18n.ja.ts", "utf8");
const specWorkspaceWebviewSource = readFileSync("apps/vscode-extension/src/webviews/spec-workspace.ts", "utf8");
const executionQueueGroupsBlock = webviewSource.match(/const EXECUTION_QUEUE_GROUPS[\s\S]*?\];/)?.[0] ?? "";
const productConsoleSource = readFileSync("src/product-console.ts", "utf8");
const vscodeRestartBackendScript = readFileSync("scripts/vscode-restart-backend.sh", "utf8");
const vscodeDebugScript = readFileSync("scripts/vscode-debug.sh", "utf8");
const rootPackage = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
};
const extensionPackage = JSON.parse(readFileSync("apps/vscode-extension/package.json", "utf8")) as {
  activationEvents?: string[];
  files?: string[];
  contributes?: {
    commands?: Array<{ command: string; title: string }>;
    menus?: {
      "view/title"?: Array<{ command: string; group?: string }>;
    };
  };
};

test("VSCode IDE package includes bundled .agents runtime", () => {
  assert.equal((extensionPackage.files ?? []).includes(".agents/**"), true);
});

test("VSCode bundled server starts with embedded worker by default", () => {
  assert.match(extensionSource, /extensionConfig<"off" \| "embedded" \| "worker-only">\("serverWorkerMode", "embedded"\)/);
  assert.equal(extensionPackage.contributes?.configuration?.properties?.["specdrive.serverWorkerMode"]?.default, "embedded");
  assert.match(vscodeRestartBackendScript, /BACKEND_PORT="\$\{AUTOBUILD_PORT:-43117\}"/);
  assert.match(vscodeRestartBackendScript, /WORKER_MODE="\$\{AUTOBUILD_WORKER_MODE:-embedded\}"/);
  assert.match(vscodeRestartBackendScript, /worker-only/);
  assert.doesNotMatch(vscodeRestartBackendScript, /Redis must be running .*embedded/);
});

test("VSCode debug entry rebuilds artifacts and clears stale backend", () => {
  assert.equal(rootPackage.scripts?.["ide:debug"], "bash scripts/vscode-debug.sh");
  assert.match(vscodeDebugScript, /npm run ide:build/);
  assert.match(vscodeDebugScript, /esbuild src\/index\.ts/);
  assert.match(vscodeDebugScript, /outfile="\$\{EXTENSION_DIR\}\/server\/index\.cjs"/);
  assert.match(vscodeDebugScript, /BACKEND_PORT="\$\{AUTOBUILD_PORT:-43117\}"/);
  assert.match(vscodeDebugScript, /USER_DATA_DIR="\$\{AUTOBUILD_VSCODE_USER_DATA_DIR:-\$\{ROOT_DIR\}\/\.autobuild\/vscode-extension-host-user-data\}"/);
  assert.match(vscodeDebugScript, /EXTENSIONS_DIR="\$\{AUTOBUILD_VSCODE_EXTENSIONS_DIR:-\$\{ROOT_DIR\}\/\.autobuild\/vscode-extension-host-extensions\}"/);
  assert.match(vscodeDebugScript, /lsof -t -i:"\$\{BACKEND_PORT\}"/);
  assert.match(vscodeDebugScript, /--user-data-dir="\$\{USER_DATA_DIR\}"/);
  assert.match(vscodeDebugScript, /--extensions-dir="\$\{EXTENSIONS_DIR\}"/);
  assert.match(vscodeDebugScript, /--extensionDevelopmentPath="\$\{EXTENSION_DIR\}"/);
  assert.match(readFileSync(".vscode/launch.json", "utf8"), /--user-data-dir=\$\{workspaceFolder\}\/\.autobuild\/vscode-extension-host-user-data/);
  assert.match(readFileSync(".vscode/launch.json", "utf8"), /--extensions-dir=\$\{workspaceFolder\}\/\.autobuild\/vscode-extension-host-extensions/);
});

test("VSCode IDE Webviews expose independent workbench commands", () => {
  const activationEvents = new Set(extensionPackage.activationEvents ?? []);
  const commands = new Set((extensionPackage.contributes?.commands ?? []).map((command) => command.command));

  assert.equal(extensionPackage.contributes?.configuration?.properties?.["specdrive.openSpecWorkspaceOnStartup"]?.default, false);
  assert.match(extensionSource, /extensionConfig\("openSpecWorkspaceOnStartup", false\)/);
  assert.match(extensionSource, /function collapsibleStateFor/);
  assert.match(extensionSource, /element\.type === "root"\) return vscode\.TreeItemCollapsibleState\.Expanded/);

  for (const command of [
    "specdrive.openExecutionWorkbench",
    "specdrive.openSpecWorkspace",
    "specdrive.openFeatureSpec",
    "specdrive.openSystemSettings",
  ]) {
    assert.equal(activationEvents.has(`onCommand:${command}`), true);
    assert.equal(commands.has(command), true);
  }

  assert.match(extensionSource, /renderExecutionWorkbenchWebview/);
  assert.match(extensionSource, /renderSpecWorkspaceWebview/);
  assert.match(extensionSource, /renderFeatureSpecWebview/);
  assert.match(extensionSource, /renderSystemSettingsWebview/);
  assert.match(extensionSource, /onDidReceiveMessage/);
  assert.match(extensionSource, /Content-Security-Policy/);
  assert.match(sharedWebviewSource, /class="workbench-app-shell"/);
  assert.match(sharedWebviewSource, /aria-label="Workbench navigation"/);
  assert.match(sharedWebviewSource, /data-command="openWorkbenchView"/);
  assert.match(sharedWebviewSource, /view: "specWorkspace"/);
  assert.match(sharedWebviewSource, /view: "featureSpec"/);
  assert.match(sharedWebviewSource, /view: "executionWorkbench"/);
  assert.match(sharedWebviewSource, /view: "systemSettings"/);
  assert.match(sharedWebviewSource, /data-command="toggleWorkbenchSidebar"/);
  assert.match(sharedWebviewSource, /SIDEBAR_STORAGE_KEY = "specdrive\.ide\.sidebarCollapsed"/);
  assert.match(sharedWebviewSource, /localStorage\.getItem\(SIDEBAR_STORAGE_KEY\) === "true"/);
  assert.match(sharedWebviewSource, /localStorage\.setItem\(SIDEBAR_STORAGE_KEY, selected \? "true" : "false"\)/);
  assert.doesNotMatch(sharedWebviewSource, /sidebarCollapsed: selected/);
  assert.doesNotMatch(sharedWebviewSource, /workbenchState\(\)\.sidebarCollapsed/);
  assert.match(extensionSource, /async function openWorkbenchView\(view: string, provider: SpecExplorerProvider\): Promise<void>/);
  assert.match(extensionSource, /message\.command === "openWorkbenchView" && typeof message\.view === "string"/);
  assert.match(webviewI18nZhSource, /"Collapse navigation": "折叠导航"/);
  assert.match(webviewI18nJaSource, /"Collapse navigation": "ナビゲーションを折りたたむ"/);
});

test("VSCode Execution Workbench requires selected queue tasks for stateful actions", () => {
  assert.match(extensionSource, /let selectedQueueKey: string \| undefined/);
  assert.match(extensionSource, /message\.command === "selectQueueItem"/);
  assert.match(extensionSource, /executionItemByKey\(view, selectedQueueKey\)/);
  assert.match(extensionSource, /renderExecutionWorkbenchWebview\(view, detail, selectedQueueKey, autoRefreshEnabled, sharedWorkbenchLocale, sharedWorkbenchTheme\)/);
  assert.match(extensionSource, /automation\?: SpecDriveIdeAutomationState/);
  assert.match(extensionSource, /autoRunButton\(view\)/);
  assert.match(extensionSource, /let autoRefreshEnabled = true/);
  assert.match(extensionSource, /WEBVIEW_AUTO_REFRESH_INTERVAL_MS = 60_000/);
  assert.match(extensionSource, /setInterval\(\(\) => \{/);
  assert.match(extensionSource, /\}, WEBVIEW_AUTO_REFRESH_INTERVAL_MS\)/);
  assert.match(extensionSource, /message\.command === "toggleAutoRefresh"/);
  assert.match(extensionSource, /if \(autoRefreshEnabled && view && !selectedQueueKey\)/);
  assert.match(extensionSource, /runningExecutionItem\(view\)/);
  assert.match(webviewSource, /autoRefreshSwitch\(autoRefreshEnabled\)/);
  assert.match(webviewSource, /role="switch"/);
  assert.match(webviewSource, /title="Refresh every 60 seconds"/);
  assert.match(webviewSource, /data-command="toggleAutoRefresh"/);
  assert.match(extensionSource, /view\?\.automation\?\.status === "running"/);
  assert.match(extensionSource, /commandButton\("Pause Auto Run", "controlled"/);
  assert.match(extensionSource, /action: "pause_runner"/);
  assert.match(extensionSource, /commandButton\("Start Auto Run", "controlled"/);
  assert.match(extensionSource, /commandButton\(selected \? "Selected" : "Select", "selectQueueItem"/);
  assert.match(extensionSource, /class="queue-item\$\{selected \? " selected" : ""\}"/);
  assert.match(extensionSource, /const EXECUTION_QUEUE_GROUPS: Array<\{ label: string; statuses: string\[\]; open: boolean \}> = \[/);
  assert.match(extensionSource, /\{ label: "running", statuses: \["running"\], open: true \},\n  \{ label: "queued", statuses: \["queued"\], open: true \}/);
  assert.match(extensionSource, /\{ label: "waiting_input", statuses: \["waiting_input"\], open: false \}/);
  assert.match(extensionSource, /\{ label: "approval \/ review", statuses: \["approval_needed", "approval_answered", "review_needed"\], open: false \}/);
  assert.match(extensionSource, /\{ label: "blocked \/ failed", statuses: \["blocked", "failed"\], open: false \}/);
  assert.doesNotMatch(executionQueueGroupsBlock, /status: "ready"/);
  assert.match(extensionSource, /renderQueueGroup\(group\.label, queueGroupItems\(group\.statuses, grouped\), selectedKey, group\.open\)/);
  assert.match(extensionSource, /function queueGroupItems\(statuses: string\[\], grouped: Record<string, SpecDriveIdeQueueItem\[\]>\): SpecDriveIdeQueueItem\[\]/);
  assert.match(extensionSource, /<details class="queue-group"\$\{open \? " open" : ""\}>/);
  assert.match(extensionSource, /<summary class="queue-head">/);
  assert.match(extensionSource, /\.queue-group\[open\] \.queue-head::before\{content:"-"\}/);
  assert.match(extensionSource, /Select a job to enable job actions\./);
  assert.match(extensionSource, /<main class="execution-layout">/);
  assert.match(executionWebviewSource, /<span>Title<\/span><span>Status<\/span><span>Runner<\/span><span>Started \/ Duration<\/span><span>Action<\/span>/);
  assert.doesNotMatch(executionWebviewSource, /<span>ID<\/span>/);
  assert.doesNotMatch(webviewSource, /item\.executionId \?\? item\.schedulerJobId \?\? item\.featureId \?\? "execution"/);
  assert.match(executionWebviewSource, /renderWorkbenchInputForm/);
  assert.match(extensionSource, /<h2>Current Selected<\/h2>/);
  assert.match(extensionSource, /<div class="title-actions">\$\{selectedTaskActionButtons\(selectedItem\)\}<\/div>/);
  assert.match(extensionSource, /queueActionButton\("Run Now", selectedItem, "run_now", \["ready", "queued"\]\)/);
  assert.match(extensionSource, /runScheduledReceiptNow\(response, provider, "Auto Run is enabled; run the scheduled Feature now\."\)/);
  assert.match(extensionSource, /queueAction: "run_now"/);
  assert.match(extensionSource, /pauseResumeButton\(selectedItem\)/);
  assert.match(extensionSource, /if \(status === "paused"\) return queueActionButton\("Resume", item, "resume", \["paused"\]\)/);
  assert.match(extensionSource, /return queueActionButton\("Pause", item, "pause", \["queued", "running"\]\)/);
  assert.match(extensionSource, /retryButton\(selectedItem\)/);
  assert.match(extensionSource, /queueActionButton\("Retry", item, "retry", \["failed", "cancelled", "skipped", "blocked"\]\)/);
  assert.match(extensionSource, /Retry requires an Execution Record for blocked work\./);
  assert.match(extensionSource, /queueActionButton\("Cancel", selectedItem, "cancel", \["ready", "queued", "running", "waiting_input", "approval_needed", "review_needed", "blocked", "paused"\]\)/);
  assert.match(extensionSource, /queueActionButton\("Skip", selectedItem, "skip", \["queued", "waiting_input", "approval_needed", "review_needed", "blocked", "failed", "paused"\]\)/);
  assert.match(extensionSource, /queueActionButton\("Enqueue", selectedItem, "enqueue", \["ready", "blocked"\]\)/);
  assert.match(extensionSource, /reviewDecisionButtons\(selectedItem, "Execution Workbench"\)/);
  assert.match(extensionSource, /request_review_changes/);
  assert.match(extensionSource, /rollback_review/);
  assert.match(extensionSource, /split_review_task/);
  assert.match(extensionSource, /update_spec/);
  assert.match(webviewSource, /function queueReviewButton\(item: SpecDriveIdeQueueItem\): string/);
  assert.match(webviewSource, /commandButton\("Review", "selectQueueItem"/);
  assert.match(extensionSource, /Select a job first\./);
  assert.match(extensionSource, /selected job is \$\{selectedItem\.status\}/);
  assert.doesNotMatch(extensionSource, /queueButton\("Run Now", queue\.find/);
});

test("VSCode Execution Workbench renders execution result sections from durable runtime fields", () => {
  assert.match(webviewSource, /<h2>Summary<\/h2>/);
  assert.match(webviewSource, /<h2>Raw Log Refs<\/h2>/);
  assert.match(webviewSource, /<h2>Token Consumption<\/h2>/);
  assert.match(webviewSource, /Feature Spec Description/);
  assert.match(webviewSource, /featureSpecLabel\(item\)/);
  assert.match(webviewSource, /item\.featureDescription/);
  assert.match(webviewSource, /queueItemMetricLabel\(item\)/);
  assert.match(webviewSource, /\["Started", item\.startedAt\]/);
  assert.match(webviewSource, /\["Duration", formatDurationMs\(item\.durationMs\)\]/);
  assert.match(webviewSource, /renderLatestExecutionSummary\(selectedItem\)/);
  assert.match(webviewSource, /const currentStep: \[string, string\] = \["Current Step", item\.stateReason \?\? item\.summary \?\? "none"\]/);
  assert.match(webviewSource, /state-flow state-flow-compact execution-summary-flow/);
  assert.match(webviewSource, /renderSummaryFlowItem\(currentStep, true\)/);
  assert.match(extensionSource, /featureTitle: detail\.featureTitle \?\? item\.featureTitle/);
  assert.match(extensionSource, /featureDescription: detail\.featureDescription \?\? item\.featureDescription/);
  assert.match(webviewSource, /<h3>State Flow<\/h3>/);
  assert.match(webviewSource, /renderStateFlow\(selectedItem\)/);
  assert.match(webviewSource, /state-flow state-flow-compact/);
  assert.match(webviewSource, /function renderStateFlowItem\(\[label, value\]: \[string, string\]\): string/);
  assert.match(sharedWebviewSource, /\.state-flow-compact\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(sharedWebviewSource, /@media \(max-width:1100px\).*\.state-flow-compact,\.feature-state-flow-compact\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(sharedWebviewSource, /\.state-flow-reason\{grid-column:1\/-1\}/);
  assert.match(webviewSource, /function renderStateFlowRow\(\[label, value\]: \[string, string\]\): string/);
  assert.match(webviewSource, /"Next Action"\]\.includes\(label\)/);
  assert.match(webviewSource, /"Message", "References", "Next Action"\]\.includes\(label\)/);
  assert.match(webviewSource, /Resume Target/);
  assert.match(webviewSource, /Review Reason/);
  assert.match(webviewSource, /Review Message/);
  assert.match(webviewSource, /Recommended Actions/);
  assert.match(webviewSource, /\["Duration", formatDurationMs\(item\.durationMs\) \?\? "none"\]/);
  assert.match(webviewSource, /function renderReviewDetails\(item: SpecDriveIdeQueueItem\): string/);
  assert.match(webviewSource, /review\.riskExplanation/);
  assert.match(webviewSource, /renderTokenConsumption\(executionDetail\)/);
  assert.match(webviewSource, /No token consumption recorded\./);
  assert.match(webviewSource, /<div class="token-consumption-line">/);
  assert.match(webviewSource, /\["Pricing Source", pricingSourceLabel\(token\.pricing\)\]/);
  assert.doesNotMatch(webviewSource, /\["Source", token\.sourcePath\]/);
  assert.match(webviewSource, /commandButton\("Open", "openRawLogRef"/);
  assert.match(extensionSource, /message\.command === "openRawLogRef"/);
  assert.match(extensionSource, /openRawLogRef\(message\.path\)/);
  assert.doesNotMatch(executionWebviewSource, /<h[23]>Diff Summary<\/h[23]>/);
  assert.doesNotMatch(executionWebviewSource, /<h3>SkillOutputContractV1<\/h3>/);
  assert.match(webviewSource, /const selectedBlockers = selectedBlockerItems\(selectedItem\)/);
  assert.match(webviewSource, /const blockerApprovalCount = selectedBlockers\.length \+ \(executionDetail\?\.approvalRequests\.length \?\? 0\)/);
  assert.match(webviewSource, /<details class="execution-detail-card execution-detail-card-full" open>/);
  assert.match(webviewSource, /<summary class="section-title"><h2>Blockers & Approvals<\/h2><span>\$\{blockerApprovalCount\}<\/span><\/summary>/);
  assert.match(webviewSource, /renderBlockersAndApprovals\(selectedBlockers, executionDetail\)/);
  assert.match(webviewSource, /function selectedBlockerItems\(item: SpecDriveIdeQueueItem \| undefined\): SpecDriveIdeQueueItem\[\]/);
  assert.match(webviewSource, /\["waiting_input", "approval_needed", "review_needed", "blocked", "failed", "paused"\]\.includes\(status\)/);
  assert.doesNotMatch(executionWebviewSource, /queue\.filter\(\(item\) => item\.status === "blocked" \|\| item\.status === "approval_needed"\)/);
  assert.match(webviewSource, /Approval Requests/);
  assert.match(webviewSource, /<h3>Review Item<\/h3>/);
  assert.match(webviewSource, /<h2>Result Projection<\/h2><span>spec-state\.json<\/span>/);
  assert.match(webviewSource, /renderSkillOutputSummary\(executionDetail\)/);
  assert.match(webviewSource, /renderTraceabilityChips/);
  assert.doesNotMatch(webviewSource, /<div class="row row-stacked"><span>Next Action<\/span>/);
  assert.doesNotMatch(webviewSource, /nextAction: output\.nextAction/);
  assert.match(webviewSource, /function renderResultEntry\(groupTitle: string, key: string, value: unknown\): string/);
  assert.match(webviewSource, /function isWideResultValue\(key: string, value: unknown\): boolean/);
  assert.match(webviewSource, /\["Decision", \["reason", "selectedFeature", "featureId"\]\]/);
  assert.match(webviewSource, /\["Verification", \["verification", "statusChecker", "failureClassification"\]\]/);
  assert.doesNotMatch(webviewSource, /\["Decision", \["decision", "reason", "selectedFeature", "featureId", "blockedReason"\]\]/);
  assert.doesNotMatch(webviewSource, /"recommendedNextAction"\]\]/);
  assert.match(webviewSource, /function renderGitDeliveryEntry\(value: unknown\): string/);
  assert.match(webviewSource, /function gitDeliveryPrUrl\(value: unknown\): string \| undefined/);
  assert.match(webviewSource, /firstSafeUrl\(record\.prUrl, record\.pullRequestUrl, record\.url\)/);
  assert.match(webviewSource, /<div class="result-entry result-entry-wide"><span>PR<\/span><div class="result-content" data-i18n-skip>\$\{prLink\}<\/div><\/div>/);
  assert.doesNotMatch(webviewSource, /\["gitDelivery", "commands", "verification", "blockers", "findings", "risks", "coverage", "updatedDocuments", "updatedArtifacts", "affectedDocuments"\]\.includes\(key\)/);
  assert.match(webviewSource, /\["commands", "verification", "blockers", "findings", "risks", "coverage", "updatedDocuments", "updatedArtifacts", "affectedDocuments"\]\.includes\(key\)/);
  assert.match(webviewSource, /result-entry-wide/);
  assert.doesNotMatch(executionWebviewSource, /<h3>Token Cost<\/h3>/);
  assert.doesNotMatch(executionWebviewSource, /renderTokenCostSummary\(executionDetail\)/);
  assert.doesNotMatch(executionWebviewSource, /Calculated Cost/);
  assert.match(webviewSource, /<h2>Produced Artifacts<\/h2>/);
  assert.match(webviewSource, /renderProducedArtifacts\(executionDetail\)/);
  assert.match(webviewSource, /\["Git Delivery", \["gitDelivery"\]\]/);
  assert.match(webviewSource, /\["Updated Documents", \["updatedDocuments", "updatedArtifacts", "affectedDocuments"\]\]/);
  assert.doesNotMatch(executionWebviewSource, /<h3>Additional Result<\/h3>/);
  assert.doesNotMatch(executionWebviewSource, /renderAdditionalResult\(executionDetail\)/);
  assert.match(webviewSource, /commandsChecked/);
  assert.match(webviewSource, /openQuestions/);
  assert.match(webviewSource, /updatedDocuments/);
  assert.equal(webviewSource.includes('<h3>SkillOutputContractV1</h3>\n        ${compactJsonBlock(executionDetail?.contractValidation'), false);
});

test("VSCode Webview disabled buttons are visually distinct", () => {
  assert.match(extensionSource, /button:disabled,button:disabled:hover/);
  assert.match(extensionSource, /workbench-button is-disabled/);
  assert.match(extensionSource, /cursor:not-allowed/);
  assert.match(extensionSource, /opacity:\.55/);
  assert.match(extensionSource, /vscode-disabledForeground/);
});

test("VSCode Webview buttons use shared inline SVG icons", () => {
  assert.match(webviewSource, /function buttonIcon\(name: string\): string/);
  assert.match(webviewSource, /aria-hidden="true"><svg viewBox="0 0 24 24"/);
  assert.match(webviewSource, /class="button-label"/);
  assert.match(webviewSource, /iconForButton\(label, command, data\)/);
  assert.match(webviewSource, /buttonContent\("Dependency Graph", "branch"\)/);
  assert.match(webviewSource, /buttonContent\("Close", "x"\)/);
  assert.match(webviewSource, /commandButton\("Open", "openDocument"/);
  assert.match(webviewSource, /buttonIcon\("warning"\)/);
});

test("VSCode IDE Webviews expose shared multilingual UI chrome", () => {
  assert.match(webviewI18nSource, /workbenchTranslationsForLocale/);
  assert.match(webviewI18nSource, /require\("\.\/i18n\.zh-CN"\)/);
  assert.match(webviewI18nSource, /require\("\.\/i18n\.ja"\)/);
  assert.doesNotMatch(webviewI18nSource, /"Execution Workbench": "执行工作台"/);
  assert.doesNotMatch(webviewI18nSource, /"Execution Workbench": "実行ワークベンチ"/);
  assert.match(sharedWebviewSource, /workbenchTranslationsForLocale/);
  assert.doesNotMatch(sharedWebviewSource, /"Execution Workbench": "执行工作台"/);
  assert.match(sharedWebviewSource, /WORKBENCH_LOADED_LOCALE/);
  assert.match(sharedWebviewSource, /const WORKBENCH_TRANSLATIONS = \$\{JSON\.stringify\(workbenchTranslations\)\}/);
  assert.match(sharedWebviewSource, /vscode\.postMessage\(\{command:"setWorkbenchLocale", locale:selected\}\)/);
  assert.doesNotMatch(sharedWebviewSource, /class="language-switch"/);
  assert.doesNotMatch(sharedWebviewSource, /<header class="workbench-header"><h1>\$\{escapeHtml\(title\)\}<\/h1><label/);
  assert.match(webviewSource, /id="workbench-language"/);
  assert.match(webviewSource, /<option value="\$\{escapeAttr\(value\)\}"/);
  assert.match(webviewSource, /\["en", "English"\]/);
  assert.match(webviewSource, /\["zh-CN", "中文"\]/);
  assert.match(webviewSource, /\["ja", "日本語"\]/);
  assert.match(sharedWebviewSource, /LOCALE_STORAGE_KEY = "specdrive\.ide\.locale"/);
  assert.match(sharedWebviewSource, /localStorage\.setItem\(LOCALE_STORAGE_KEY, selected\)/);
  assert.match(sharedWebviewSource, /vscode\.setState\(\{\.\.\.workbenchState\(\), locale: selected\}\)/);
  assert.match(sharedWebviewSource, /applyLocale\(currentWorkbenchLocale\(\)\)/);
  assert.match(sharedWebviewSource, /THEME_STORAGE_KEY = "specdrive\.ide\.theme"/);
  assert.match(sharedWebviewSource, /const supportedTheme = \(value\) => \["vscode", "light", "dark", "highContrast"\]/);
  assert.match(sharedWebviewSource, /document\.documentElement\.dataset\.workbenchTheme = selected/);
  assert.match(sharedWebviewSource, /const WORKBENCH_LOADED_THEME = \$\{JSON\.stringify\(workbenchTheme\)\}/);
  assert.match(sharedWebviewSource, /if \(notify\) vscode\.postMessage\(\{command:"setWorkbenchTheme", theme:selected\}\)/);
  assert.match(sharedWebviewSource, /applyTheme\(currentWorkbenchTheme\(\), false\)/);
  assert.match(sharedWebviewSource, /html\[data-workbench-theme="light"\]/);
  assert.match(sharedWebviewSource, /--fg:#18212f/);
  assert.match(sharedWebviewSource, /html\[data-workbench-theme="highContrast"\]/);
  assert.match(webviewSource, /data-command="setWorkbenchTheme"/);
  assert.match(webviewSource, /data-theme-option="\$\{escapeAttr\(value\)\}"/);
  assert.match(sharedWebviewSource, /shouldSkipLocaleNode\(node\)/);
  assert.match(sharedWebviewSource, /script,style,code,pre,textarea,input,select,\[data-i18n-skip\]/);
  assert.match(webviewI18nZhSource, /export const ZH_CN_TRANSLATIONS/);
  assert.match(webviewI18nZhSource, /"Execution Workbench": "执行工作台"/);
  assert.doesNotMatch(webviewI18nZhSource, /"Execution Workbench": "実行ワークベンチ"/);
  assert.match(webviewI18nJaSource, /export const JA_TRANSLATIONS/);
  assert.match(webviewI18nJaSource, /"Execution Workbench": "実行ワークベンチ"/);
  assert.match(webviewI18nJaSource, /"System Settings": "システム設定"/);
  assert.doesNotMatch(webviewI18nJaSource, /"Execution Workbench": "执行工作台"/);
  assert.match(extensionSource, /setWorkbenchLocale/);
  assert.match(extensionSource, /sharedWorkbenchLocale/);
  assert.match(extensionSource, /sharedWorkbenchTheme/);
  assert.match(extensionSource, /renderAllWorkbenchPanels/);
  assert.match(extensionSource, /workspaceState\.update\(WORKBENCH_THEME_STORAGE_KEY, theme\)/);
  assert.match(extensionSource, /isWorkbenchLocale\(message\.locale\)/);
});

test("VSCode Spec Explorer title actions are ordered by workflow", () => {
  const titleActions = extensionPackage.contributes?.menus?.["view/title"] ?? [];
  assert.deepEqual(titleActions.map((action) => action.command), [
    "specdrive.openSpecWorkspace",
    "specdrive.openFeatureSpec",
    "specdrive.openExecutionWorkbench",
    "specdrive.openSystemSettings",
    "specdrive.refresh",
    "specdrive.registerProject",
  ]);
  assert.deepEqual(titleActions.map((action) => action.group), [
    "navigation@1",
    "navigation@2",
    "navigation@3",
    "navigation@4",
    "navigation@5",
    "navigation@6",
  ]);
  assert.match(extensionSource, /registerCommand\("specdrive\.registerProject"/);
  assert.match(extensionSource, /function registerCurrentProject/);
  assert.match(extensionSource, /function isCompatibleControlPlane/);
  assert.match(extensionSource, /isCompatibleControlPlane\(configuredUrl, workspaceRoot\)/);
  assert.match(extensionSource, /expectedArtifactRoot = join\(workspaceRoot, "\.autobuild"\)/);
  assert.match(extensionSource, /normalizeFsPath\(body\.artifactRoot\) !== normalizeFsPath\(expectedArtifactRoot\)/);
  assert.match(extensionSource, /consoleCommandActions/);
  assert.match(extensionSource, /AUTOBUILD_AGENT_RUNTIME_PATHS/);
  assert.match(extensionSource, /this\.context\.extensionPath/);
  assert.match(extensionSource, /let specWorkspacePanel: ManagedWebviewPanel \| undefined/);
  assert.match(extensionSource, /let featureSpecPanel: \(ManagedWebviewPanel & \{ selectFeature: \(item\?: unknown\) => void \}\) \| undefined/);
  assert.match(extensionSource, /if \(specWorkspacePanel\) \{\n    specWorkspacePanel\.panel\.reveal\(vscode\.ViewColumn\.Active\);/);
  assert.match(extensionSource, /if \(featureSpecPanel\) \{\n    featureSpecPanel\.selectFeature\(item\);/);
  assert.match(extensionSource, /if \(executionWorkbenchPanel\) \{\n    executionWorkbenchPanel\.panel\.reveal\(vscode\.ViewColumn\.Active\);/);
  assert.match(extensionSource, /if \(systemSettingsPanel\) \{\n    systemSettingsPanel\.panel\.reveal\(vscode\.ViewColumn\.Active\);/);
  assert.match(extensionSource, /function specExplorePanelIconUri\(icon: "checklist" \| "layout" \| "run-all" \| "settings-gear"\): \{ light: vscode\.Uri; dark: vscode\.Uri \}/);
  assert.match(extensionSource, /spec-explore-\$\{icon\}-light\.svg/);
  assert.match(extensionSource, /spec-explore-\$\{icon\}-dark\.svg/);
  assert.match(extensionSource, /const resourceRoot = join\(__dirname, "\.\.", "resources"\)/);
  assert.match(extensionSource, /panel\.iconPath = specExplorePanelIconUri\("checklist"\)/);
  assert.match(extensionSource, /panel\.iconPath = specExplorePanelIconUri\("layout"\)/);
  assert.equal((extensionSource.match(/panel\.iconPath = specExplorePanelIconUri\("run-all"\)/g) ?? []).length, 2);
  assert.match(extensionSource, /panel\.iconPath = specExplorePanelIconUri\("settings-gear"\)/);
});

test("VSCode System Settings Webview manages adapter configs through controlled commands", () => {
  assert.match(extensionSource, /renderSystemSettingsWebview/);
  assert.match(extensionSource, new RegExp('new URL\\("/ide/system-settings", controlPlaneUrl\\)'));
  assert.match(extensionSource, new RegExp('new URL\\("/console/system-settings", controlPlaneUrl\\)'));
  assert.match(extensionSource, /normalizeSystemSettingsViewModel\(await response\.json\(\)\)/);
  assert.match(extensionSource, /class="settings-fixed-top"/);
  assert.match(extensionSource, /\.settings-page\{height:100vh;display:grid;grid-template-rows:auto minmax\(0,1fr\);overflow:hidden/);
  assert.match(extensionSource, /\.settings-content\{min-height:0;overflow:auto/);
  assert.match(extensionSource, /function normalizeAdapterSettingsSection/);
  assert.match(extensionSource, /message\.command === "settingsCommand"/);
  assert.match(extensionSource, /JSON\.parse\(message\.configText\)/);
  assert.match(extensionSource, /entityType: message\.entityType/);
  assert.match(extensionSource, /payload: \{ config \}/);
  assert.match(extensionSource, /"validate_cli_adapter_config"/);
  assert.match(extensionSource, /"activate_rpc_adapter_config"/);
  assert.match(extensionSource, /settingsCommandButton\("Validate"/);
  assert.match(extensionSource, /class="settings-editor"/);
  assert.match(extensionSource, /renderAppearanceSection\(locale, theme\)/);
  assert.match(extensionSource, /<h2>Appearance<\/h2>/);
  assert.match(extensionSource, /Set your language and visual theme\./);
  assert.match(extensionSource, /"loadSettingsPreset"/);
  assert.match(extensionSource, /renderPricingSummary\(source\)/);
  assert.match(extensionSource, /renderPricingEditor\(editorId, source\)/);
  assert.match(extensionSource, /Pricing Model/);
  assert.match(extensionSource, /Pricing Rates/);
  assert.match(extensionSource, /Token Pricing/);
  assert.match(extensionSource, /data-pricing-field="inputUsdPer1M"/);
  assert.match(extensionSource, /data-pricing-field="cachedInputUsdPer1M"/);
  assert.match(extensionSource, /data-pricing-field="outputUsdPer1M"/);
  assert.match(extensionSource, /data-pricing-field="reasoningOutputUsdPer1M"/);
  assert.match(extensionSource, /updatePricingRate\(pricingTarget\)/);
  assert.match(extensionSource, /costRates: \{/);
  assert.match(extensionSource, /class="settings-shell settings-content"/);
  assert.match(extensionSource, /class="settings-rail"/);
  assert.match(extensionSource, /class="settings-adapter-matrix"/);
  assert.match(extensionSource, /\.appearance-grid\{display:grid;grid-template-columns:minmax\(160px,280px\) minmax\(280px,1fr\)/);
  assert.match(extensionSource, /\.theme-segmented\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(extensionSource, /\.pricing-editor\{/);
  assert.match(extensionSource, /\.settings-shell\{display:grid;grid-template-columns:minmax\(230px,260px\) minmax\(0,1fr\)/);
  assert.match(extensionSource, /\.settings-adapter-matrix\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(extensionSource, /\.settings-defaults-grid\{display:grid;grid-template-columns:minmax\(220px,1fr\) minmax\(220px,1fr\) minmax\(300px,1\.3fr\)/);
  assert.match(extensionSource, /\.settings-adapter-workspace\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(180px,240px\)/);
  assert.match(extensionSource, /@media \(max-width:560px\)\{\.pricing-editor/);
  assert.match(extensionSource, /\.row\{grid-template-columns:minmax\(0,1fr\) minmax\(0,max-content\)\}/);
  assert.match(extensionSource, /\.row code\{white-space:pre-wrap;overflow-wrap:anywhere\}/);
});

test("VSCode System Settings Webview tolerates partial settings responses", () => {
  assert.match(extensionSource, /cliAdapter\?: AdapterSettingsSection/);
  assert.match(extensionSource, /rpcAdapter\?: AdapterSettingsSection/);
  assert.match(extensionSource, /renderAdapterSection\(title: string, kind: AdapterKind, section: AdapterSettingsSection \| undefined\)/);
  assert.match(extensionSource, /settings are unavailable from the current Control Plane response/);
  assert.match(extensionSource, /const source = section\.draft \?\? section\.active \?\? \{\}/);
  assert.match(extensionSource, /const validation = section\.validation \?\? \{ valid: false/);
});

test("VSCode Feature Spec Webview switches between list and dependency graph views", () => {
  assert.match(extensionSource, /data-command="toggleFeatureSpecView" data-view-mode="dependency"/);
  assert.match(extensionSource, /const mode = target\.dataset\.viewMode === "dependency" \? "dependency" : "list"/);
  assert.match(extensionSource, /target\.dataset\.viewMode = mode === "dependency" \? "list" : "dependency"/);
  assert.match(extensionSource, /setButtonLabel\(target, mode === "dependency" \? "Feature List" : "Dependency Graph"\)/);
  assert.doesNotMatch(extensionSource, /data-command="setFeatureSpecView"/);
  assert.match(extensionSource, /\.hidden\{display:none!important\}/);
  assert.match(extensionSource, /id="workbench-status" class="status-text" role="status" aria-live="polite"/);
  assert.match(extensionSource, /id="workbench-form" class="panel workbench-form" hidden/);
  assert.match(extensionSource, /id="workbench-form-subtitle">Add or change/);
  assert.match(extensionSource, /clarify: \["Clarify Feature", "Clarification", "Enter clarification content\."\]/);
  assert.match(extensionSource, /specChange: \["Requirement Change", "Global Spec request", "Enter the requirement change\."\]/);
  assert.match(extensionSource, /newRequirement: \["New Requirement", "Global Spec request", "Enter the new requirement\."\]/);
  assert.match(extensionSource, /featureSpecChange: \["Feature Spec Change", "Feature request", "Enter the Feature-scoped requirement change\."\]/);
  assert.match(extensionSource, /const workbenchState = \(\) => vscode\.getState\(\) \|\| \{\}/);
  assert.match(extensionSource, /vscode\.setState\(\{\.\.\.workbenchState\(\), workbenchForm: formState\}\)/);
  assert.match(extensionSource, /const workbenchDraftKey = \(mode, featureId, intent\) => \[mode \|\| "newFeature", featureId \|\| "", intent \|\| ""\]\.join\("::"\)/);
  assert.match(extensionSource, /saveWorkbenchFormState\(\)/);
  assert.match(extensionSource, /restoreWorkbenchFormState\(\)/);
  assert.match(extensionSource, /textarea id="workbench-form-input"/);
  assert.match(webviewSource, /class="workbench-chat"/);
  assert.match(webviewSource, /class="workbench-compose"/);
  assert.match(webviewSource, /\.workbench-chat\{display:grid;gap:0\}/);
  assert.match(webviewSource, /\.workbench-compose\{display:grid;width:100%/);
  assert.doesNotMatch(webviewSource, /class="workbench-dialog system"/);
  assert.doesNotMatch(webviewSource, /id="workbench-form-prompt"/);
  assert.doesNotMatch(webviewSource, /workbench-dialog-label">You/);
  assert.match(extensionSource, /commandButton\("New Feature", "openWorkbenchForm", \{ formMode: "newFeature" \}\)/);
  assert.match(extensionSource, /intent: "requirement_change_or_intake"/);
  assert.match(extensionSource, /intent: "clarification"/);
  assert.match(extensionSource, /command:"newFeature", content/);
  assert.match(extensionSource, /command:"reviewFeature", featureId: form\.dataset\.featureId, comment: content/);
  assert.match(extensionSource, /command:"featureSpecRequest", featureId: form\.dataset\.featureId, intent: form\.dataset\.intent, content/);
  assert.match(extensionSource, /setWorkbenchStatus\("Refreshing\.\.\."\)/);
  assert.match(extensionSource, /setWorkbenchStatus\("Running command\.\.\."\)/);
  assert.match(extensionSource, /data-view-panel="list"/);
  assert.match(extensionSource, /data-view-panel="dependency"/);
  assert.match(extensionSource, /data-command="toggleDependencyGraphBranches" data-expanded="true"/);
  assert.match(extensionSource, /#dependency-graph-panel \.dependency-branch/);
  assert.match(extensionSource, /setButtonLabel\(target, expanded \? "Collapse All" : "Expand All"\)/);
  assert.match(extensionSource, /class="dependency-branch"\$\{open\}/);
  assert.match(extensionSource, /const open = depth < 2/);
  assert.match(extensionSource, /\.feature-panel summary::before\{content:"\+"/);
  assert.match(extensionSource, /\.feature-panel\[open\] summary::before\{content:"-"\}/);
  assert.match(extensionSource, /\.feature-card\.current\{background:linear-gradient/);
  assert.match(extensionSource, /box-shadow:inset 4px 0 0 var\(--accent\)/);
  assert.match(extensionSource, /\.feature-card\.selected\{border-color:var\(--accent\);box-shadow:0 0 0 2px/);
  assert.match(extensionSource, /\.feature-card\.current\.selected\{box-shadow:inset 4px 0 0 var\(--accent\),0 0 0 2px/);
  assert.match(extensionSource, /data-feature-card="\$\{escapeAttr\(feature\.id\)\}"/);
  assert.match(extensionSource, /class="feature-card\$\{current \? " current" : ""\}"/);
  assert.match(extensionSource, /setCurrentFeatureCard\(card\)/);
  assert.match(extensionSource, /setCurrentFeatureCard\(featureCard\)/);
  assert.match(extensionSource, /const featurePanelOpenState = \(\) =>/);
  assert.match(extensionSource, /vscode\.postMessage\(\{command:"selectFeature", featureId: featureCard\.dataset\.featureCard, panelOpenState: featurePanelOpenState\(\)\}\)/);
  assert.match(extensionSource, /let panelOpenState: Record<string, boolean> = \{\}/);
  assert.match(extensionSource, /renderFeatureSpecWebview\(view, selectedFeatureId, autoRefreshEnabled, panelOpenState, sharedWorkbenchLocale, sharedWorkbenchTheme\)/);
  assert.match(extensionSource, /card\.classList\.toggle\("selected", selected\)/);
  assert.match(extensionSource, /card\.setAttribute\("aria-selected", selected \? "true" : "false"\)/);
  assert.match(extensionSource, /aria-current=\\"true\\"/);
  assert.match(extensionSource, /const actions = featureDetailActions\(feature, projectId\)/);
  assert.match(extensionSource, /function featureDetailActions\(feature: SpecDriveIdeFeatureNode, projectId\?: string\): string/);
  assert.match(extensionSource, /if \(isReadyFeature\(feature\)\) \{\n    return `\$\{scheduleFeatureButton\("Schedule", feature, projectId, "Feature Detail"\)\}\$\{specActions\}\$\{queueActions\}`;/);
  assert.match(extensionSource, /reviewActionsForReason\(reason\)/);
  assert.match(extensionSource, /reviewDecisionButtons\(feature, reviewReason, "Feature Detail"\)/);
  assert.match(extensionSource, /\["Request Changes", "request_review_changes", "edit"\]/);
  assert.match(extensionSource, /\["Rollback", "rollback_review", "undo"\]/);
  assert.match(extensionSource, /\["Split Task", "split_review_task", "branch"\]/);
  assert.match(extensionSource, /disabledButtonHtml\("Approval", "Resolve the adapter approval request in Execution Workbench\."/);
  assert.match(extensionSource, /isWaitingInputFeature\(feature\)/);
  assert.match(extensionSource, /return `\$\{specActions\}\$\{markFeatureReadyButton\("Ready", feature, projectId, "Feature Detail"\)\}\$\{queueActions\}`/);
  assert.match(extensionSource, /isReviewNeededFeature\(feature\)/);
  assert.match(extensionSource, /function clarifyFeatureButton\(feature: SpecDriveIdeFeatureNode\): string/);
  assert.match(extensionSource, /commandButton\("Clarify", "openWorkbenchForm"/);
  assert.match(extensionSource, /function featureSpecChangeButton\(feature: SpecDriveIdeFeatureNode\): string/);
  assert.match(extensionSource, /formMode: "featureSpecChange", intent: "spec_evolution"/);
  assert.match(extensionSource, /function featureQueueActionButtons\(feature: SpecDriveIdeFeatureNode\): string/);
  assert.match(extensionSource, /featureQueueActionButton\("Retry", feature, "retry", \["failed", "cancelled", "skipped", "blocked"\], true\)/);
  assert.match(extensionSource, /latestSchedulerJobId\?: string/);
  assert.match(extensionSource, /"approve_review"/);
  assert.match(extensionSource, /entityType: "review_item"/);
  assert.match(webviewSource, /<h3>State Flow<\/h3>/);
  assert.match(webviewSource, /renderFeatureStateFlow\(feature\)/);
  assert.match(webviewSource, /state-flow feature-state-flow-compact/);
  assert.match(webviewSource, /function renderFeatureStateItem\(\[label, value\]: \[string, string\]\): string/);
  assert.match(sharedWebviewSource, /\.feature-state-flow-compact\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(sharedWebviewSource, /@media \(max-width:1100px\).*\.state-flow-compact,\.feature-state-flow-compact\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(webviewSource, /function renderFeatureDescription\(feature: SpecDriveIdeFeatureNode\): string/);
  assert.match(webviewSource, /feature\.description \?\? "No Feature Spec description found\."/);
  assert.match(webviewSource, /<h3>Feature Spec Description<\/h3>/);
  assert.match(webviewSource, /renderFeatureStateRow/);
  assert.match(webviewSource, /<div class="feature-state-row"><span>\$\{escapeHtml\(label\)\}<\/span><span>\$\{escapeHtml\(value\)\}<\/span><\/div>/);
  assert.match(webviewSource, /\.feature-state-row\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
  assert.match(webviewSource, /Resume Target/);
  assert.match(webviewSource, /Review Reason/);
  assert.match(webviewSource, /renderFeatureReviewDetails\(feature\)/);
  assert.match(webviewSource, /review\.recommendedActions\.join/);
  assert.match(webviewSource, /featureExecutionLabel\(feature\)/);
  assert.doesNotMatch(extensionSource, /selected && isClarificationNeededFeature\(selected\)/);
  assert.doesNotMatch(extensionSource, /selected && isPassableFeature\(selected\)/);
  assert.doesNotMatch(extensionSource, /approveFeatureReviewButton\("Pass"/);
  assert.match(webviewSource, /reviewNoteRequired: reviewActionNeedsNote\(action\) \? "true" : undefined/);
  assert.match(webviewSource, /"approve_review", "request_review_changes", "update_spec", "reject_review", "rollback_review", "split_review_task"/);
  assert.doesNotMatch(webviewSource, /window\.prompt/);
  assert.match(webviewSource, /reviewDecision: \["Review Decision", "Approval opinion", "Enter the approval opinion before continuing\."\]/);
  assert.match(webviewSource, /openWorkbenchForm\("reviewDecision", payload\.entityId, payload\.action, \{controlledPayload: payload\}\)/);
  assert.match(webviewSource, /formMode === "reviewDecision"/);
  assert.match(webviewSource, /if \(!content && formMode !== "reviewDecision"\)/);
  assert.match(webviewSource, /reason: content \? baseReason \+ " Note: " \+ content : baseReason/);
  assert.match(webviewSource, /payload: \{\.\.\.controlledPayload, reviewNote: content, clarification: content\}/);
  assert.match(extensionSource, /markFeatureReadyButton\("Ready", feature, projectId, "Feature Detail"\)/);
  assert.match(extensionSource, /action: "mark_feature_ready"/);
  assert.match(extensionSource, /panelOpenState = Object\.fromEntries/);
  assert.match(extensionSource, /panel\.onDidDispose\(\(\) => \{\n    stopAutoRefresh\(\);\n    featureSpecPanel = undefined;/);
  assert.match(extensionSource, /async function openFeatureSpec[\s\S]*let autoRefreshEnabled = true[\s\S]*startAutoRefresh\(\);\n  await render\(\);/);
  assert.match(webviewSource, /autoRefreshSwitch\(autoRefreshEnabled\)/);
  assert.match(extensionSource, /title: "Blocked"/);
  assert.match(extensionSource, /title: "In-Process"/);
  assert.match(extensionSource, /title: "Todo"/);
  assert.match(webviewSource, /<h3>Latest Execution Cost<\/h3>/);
  assert.match(webviewSource, /renderTokenCost\(feature\.tokenConsumption\)/);
  assert.match(webviewSource, /renderProjectCostTotal\(view\)/);
  assert.match(webviewSource, /Project Cost Total/);
  assert.match(webviewSource, /formatCurrency\(cost\.totalUsd, cost\.currency, 2\)/);
  assert.match(webviewSource, /\.project-cost-total\{margin-left:auto/);
  assert.match(webviewSource, /\["Cached Input", formatInteger\(token\.cachedInputTokens\)\]/);
  assert.match(webviewSource, /\["Reasoning Output", formatInteger\(token\.reasoningOutputTokens\)\]/);
  assert.match(webviewSource, /\["Pricing Source", pricingSourceLabel\(token\.pricing\)\]/);
  assert.match(webviewSource, /function renderFeatureArtifacts\(documents: SpecDriveIdeDocument\[\]\): string/);
  assert.match(webviewSource, /const fileName = document\.path\.split\(\//);
  assert.match(webviewSource, /<strong>\$\{escapeHtml\(fileName\)\}<\/strong>/);
  assert.match(webviewSource, />Open<\/button>/);
  assert.match(webviewSource, /<div class="task-chip-row">/);
  assert.doesNotMatch(webviewSource, /<h3>Acceptance<\/h3>/);
  assert.match(webviewSource, /\.feature-artifacts\{display:grid;gap:5px\}/);
  assert.match(webviewSource, /\.artifact-row\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(72px,max-content\) auto/);
  assert.match(webviewSource, /\.task-chip-row\{display:flex;flex-wrap:wrap;gap:6px\}/);
  assert.match(webviewSource, /\.token-mini-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(webviewSource, /\.token-consumption-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(extensionSource, /Block \/ In Process \/ Todo/);
});

test("VSCode Feature Spec category panels keep their own scroll containers", () => {
  assert.match(webviewSource, /renderFeatureGroupedPanels\(features, selected\?\.id\)/);
  assert.match(webviewSource, /\.feature-board\{[^}]*grid-template-rows:minmax\(0,1fr\) auto[^}]*overflow:hidden/);
  assert.match(webviewSource, /function renderFeatureGroupedPanels\(features: SpecDriveIdeFeatureNode\[], selectedFeatureId: string \| undefined\): string/);
  assert.match(webviewSource, /const completed = sortDoneFeatures\(features\.filter\(isDoneFeature\)\)/);
  assert.match(webviewSource, /const active = features\.filter\(\(feature\) => !isDoneFeature\(feature\)\)/);
  assert.match(webviewSource, /renderFeatureGroupPanel\("Other Features", "Active, blocked, ready, and planned", active, selectedFeatureId, true\)/);
  assert.match(webviewSource, /renderFeatureGroupPanel\("Completed Features", "Completed by default folded", completed, selectedFeatureId, false\)/);
  assert.match(webviewSource, /<details class="feature-panel feature-group-panel" \$\{open \? "open" : ""\}>/);
  assert.match(webviewSource, /\.feature-panel-items\{display:grid;grid-template-columns:repeat\(auto-fill,minmax\(190px,1fr\)\)/);
  assert.match(webviewSource, /@media\(max-width:1300px\)[\s\S]*\.feature-panel-items\{grid-template-columns:repeat\(auto-fill,minmax\(170px,1fr\)\)\}/);
  assert.doesNotMatch(webviewSource, /grid-template-columns:minmax\(200px,1fr\) repeat\(2,minmax\(160px,\.78fr\)\)/);
  assert.doesNotMatch(webviewSource, /groups\.map\(\(group\) => renderFeaturePanel/);
  assert.doesNotMatch(webviewSource, /function renderFeaturePanel/);
  assert.match(webviewSource, /\.feature-panel\[open\]\{height:100%;min-height:0\}/);
  assert.match(webviewSource, /\.feature-panel:not\(\[open\]\)\{display:block;height:auto;min-height:0\}/);
  assert.match(webviewSource, /\.feature-panel-body\{min-height:0;overflow-y:auto;overflow-x:hidden[^}]*scrollbar-gutter:stable/);
  assert.match(webviewSource, /\.feature-card::before\{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var\(--feature-status-color,var\(--muted\)\)\}/);
  assert.match(webviewSource, /\.feature-card\[data-status="blocked"\]\{--feature-status-color:var\(--bad\)\}/);
  assert.match(webviewSource, /\.feature-card\[data-status="ready"\]\{--feature-status-color:#a266ff\}/);
  assert.match(webviewSource, /class="feature-status-badge \$\{statusClass\(feature\.status\)\}"/);
  assert.match(webviewSource, /function featureStatusKey\(feature: SpecDriveIdeFeatureNode\): string/);
  assert.doesNotMatch(webviewSource, /renderFeatureLifecycleColumn/);
  assert.doesNotMatch(webviewSource, /feature-lifecycle-column/);
});

test("VSCode Feature Spec Webview schedules selected Features with adapter preference", () => {
  assert.match(extensionSource, /executionPreferenceControls\(view\)/);
  assert.doesNotMatch(extensionSource, /id="job-run-mode"/);
  assert.match(extensionSource, /commandButton\("Schedule Selected", "scheduleSelectedFeatures"/);
  assert.match(extensionSource, /data-feature-select/);
  assert.match(extensionSource, /const selectedFeatureIds = \(\) =>/);
  assert.match(extensionSource, /payload\.command === "scheduleSelectedFeatures"/);
  assert.match(extensionSource, /command: "scheduleFeatures"/);
  assert.match(extensionSource, /executionPreference: selectedExecutionPreference\(\)/);
  assert.match(extensionSource, /message\.command === "scheduleFeatures"/);
  assert.match(extensionSource, /scheduleFeatureSelection\(message, provider\)/);
  assert.match(extensionSource, /const schedulableFeatureIds = featureIds\.filter/);
  assert.match(extensionSource, /Skipped completed or terminal Feature Specs/);
  assert.match(extensionSource, /function isSchedulableFeature/);
  assert.match(extensionSource, /for \(const featureId of schedulableFeatureIds\)/);
  assert.match(extensionSource, /const shouldRunNowAfterSchedule = view\?\.automation\?\.status === "running" && !hasActiveQueueItem\(view\)/);
  assert.match(extensionSource, /action: "schedule_run"/);
  assert.match(extensionSource, /mode: "manual"/);
  assert.match(extensionSource, /operation: "feature_execution"/);
  assert.match(extensionSource, /requestedAction: "feature_execution"/);
  assert.match(extensionSource, /\.\.\.\(executionPreference \? \{ executionPreference \} : \{\}\)/);
  assert.match(extensionSource, /payload\.action === "schedule_run" \|\| payload\.action === "start_auto_run"/);
  assert.match(extensionSource, /scheduleRunPayload\(payload, executionPreference\)/);
  assert.match(extensionSource, /runScheduledReceiptNow\(response, provider, `Auto Run is enabled; run \$\{featureId\} now\.`\)/);
});

test("VSCode Spec Workspace keeps global skill input at top and document actions inside lifecycle", () => {
  assert.match(extensionSource, /renderSpecWorkspaceWebview/);
  assert.match(extensionSource, /renderSpecWorkspaceWebview\(view, uiConceptImages, autoRefreshEnabled, panel\.webview\.cspSource, sharedWorkbenchLocale, sharedWorkbenchTheme\)/);
  assert.match(extensionSource, /panel\.onDidDispose\(\(\) => \{\n    stopAutoRefresh\(\);\n    specWorkspacePanel = undefined;/);
  assert.match(specWorkspaceWebviewSource, /autoRefreshSwitch\(autoRefreshEnabled\)/);
  assert.match(specWorkspaceWebviewSource, /autoRefreshEnabled = false/);
  assert.match(extensionSource, /commandButton\("New Requirement", "openWorkbenchForm", \{ formMode: "newRequirement", intent: "requirement_intake" \}\)/);
  assert.match(extensionSource, /commandButton\("Requirement Change", "openWorkbenchForm", \{ formMode: "specChange", intent: "spec_evolution" \}\)/);
  assert.match(extensionSource, /commandButton\("Clarification", "openWorkbenchForm", \{ formMode: "specClarification", intent: "clarification" \}\)/);
  assert.doesNotMatch(extensionSource, /commandButton\("Diagnostics & Blockers", "showDiagnostics", \{\}\)/);
  assert.match(extensionSource, /vscode\.postMessage\(\{command:"specWorkspaceRequest", intent: form\.dataset\.intent, content\}\)/);
  assert.match(extensionSource, /data-command="selectSpecStage" data-stage-id/);
  assert.match(specWorkspaceWebviewSource, /docs\/ui-v2\/spec-workspace\.png|spec-v2-shell/);
  assert.match(specWorkspaceWebviewSource, /renderWorkbenchPage\("Spec Workspace"/);
  assert.match(specWorkspaceWebviewSource, /Diagnostics & Blockers/);
  assert.match(extensionSource, /payload\.command === "showDiagnostics"/);
  assert.match(extensionSource, /entry\.id !== "spec-diagnostics-panel"/);
  assert.match(specWorkspaceWebviewSource, /class="spec-v2-shell"/);
  assert.doesNotMatch(specWorkspaceWebviewSource, /class="spec-v2-sidebar"/);
  assert.doesNotMatch(specWorkspaceWebviewSource, /class="spec-v2-nav"/);
  assert.match(specWorkspaceWebviewSource, /class="spec-v2-inspector"/);
  assert.match(specWorkspaceWebviewSource, /renderSourceDocumentsCard\(view, t\)/);
  assert.match(specWorkspaceWebviewSource, /renderRequirementQueueCard\(view, t\)/);
  assert.match(specWorkspaceWebviewSource, /renderTraceabilityCard\(view, t\)/);
  assert.match(specWorkspaceWebviewSource, /renderDiagnosticsCard\(view, t\)/);
  assert.match(specWorkspaceWebviewSource, /renderConceptCard\(uiConceptImages, t\)/);
  assert.match(extensionSource, /data-workspace-panel="stage" data-stage-detail/);
  assert.match(extensionSource, /id="spec-diagnostics-panel" data-workspace-panel="diagnostics" hidden/);
  assert.match(extensionSource, /function renderGlobalDiagnosticsPanel/);
  assert.match(specWorkspaceWebviewSource, /function renderSelectedInspector/);
  assert.match(specWorkspaceWebviewSource, /escapeHtml\(`\$\{t\("STAGE"\)\}-\$\{stage\.index\}`\)/);
  assert.doesNotMatch(specWorkspaceWebviewSource, /const selectedFeature = view\?\.features\[0\]/);
  assert.match(specWorkspaceWebviewSource, /Linked Documents/);
  assert.match(specWorkspaceWebviewSource, /Controlled Commands/);
  assert.doesNotMatch(extensionSource, /<h3>Diagnostics & Blockers<\/h3>/);
  assert.doesNotMatch(extensionSource, /function filterLifecycleDiagnostics/);
  assert.match(extensionSource, /function renderLifecycleDiagnostic/);
  assert.match(extensionSource, /No active diagnostics or blockers\./);
  assert.match(extensionSource, /label: "Project Initialization"/);
  assert.match(extensionSource, /label: "Project created or imported"/);
  assert.match(extensionSource, /label: "Workspace root resolved"/);
  assert.match(extensionSource, /label: "Git repository connected"/);
  assert.match(extensionSource, /label: "\.autobuild \/ Spec Protocol"/);
  assert.match(extensionSource, /label: "Project constitution"/);
  assert.match(extensionSource, /label: "Project Memory"/);
  assert.match(extensionSource, /label: "Workspace health check"/);
  assert.match(extensionSource, /label: "Current project context"/);
  assert.match(extensionSource, /label: "\.agents skill runtime initialized"/);
  assert.match(extensionSource, /function normalizeInitializationSteps/);
  assert.match(extensionSource, /function normalizeSpecDriveIdeView/);
  assert.match(extensionSource, /pathExists\("\.agents\/skills"\)/);
  assert.match(extensionSource, /key: "copy_skill_runtime"/);
  assert.match(extensionSource, /view\.workspaceRoot \? "Draft"/);
  assert.match(extensionSource, /label: "Register Current Project"/);
  assert.match(extensionSource, /action: "register_project"/);
  assert.match(extensionSource, /action: "connect_git_repository"/);
  assert.match(extensionSource, /entityType: "project"/);
  assert.match(extensionSource, /action: "initialize_spec_protocol"/);
  assert.match(extensionSource, /action: "import_or_create_constitution"/);
  assert.match(extensionSource, /action: "initialize_project_memory"/);
  assert.match(extensionSource, /action: "check_project_health"/);
  assert.match(extensionSource, /label: "Requirement Intake"/);
  assert.match(extensionSource, /label: "Feature Split"/);
  assert.match(extensionSource, /action: "scan_spec_sources"/);
  assert.match(extensionSource, /action: "upload_prd_source"/);
  assert.match(extensionSource, /action: "generate_ears"/);
  assert.match(extensionSource, /label: "PRD"/);
  assert.match(extensionSource, /label: "EARS Requirements"/);
  assert.match(extensionSource, /label: "HLD"/);
  assert.match(extensionSource, /label: "UI Spec"/);
  assert.doesNotMatch(extensionSource, /label: "UI Spec document and concept images"/);
  assert.match(extensionSource, /reason: "Generate HLD from Requirement Intake lifecycle\."/);
  assert.match(extensionSource, /reason: "Generate UI Spec from Requirement Intake lifecycle\."/);
  assert.doesNotMatch(extensionSource, /reason: "Generate HLD from Feature Split lifecycle\."/);
  assert.doesNotMatch(extensionSource, /reason: "Generate UI Spec from Feature Split lifecycle\."/);
  assert.match(extensionSource, /action: "split_feature_specs"/);
  assert.match(specWorkspaceWebviewSource, /<h2>\$\{escapeHtml\(t\("UI Concept Images"\)\)\}<\/h2>/);
  assert.match(specWorkspaceWebviewSource, /images\.map\(renderUiConceptImage\)/);
  assert.doesNotMatch(specWorkspaceWebviewSource, /images\.slice\(0, 6\)\.map\(renderUiConceptImage\)/);
  assert.match(extensionSource, /const discovered = await discoverUiConceptImages\(rootUri, "docs\/ui\/concepts"\)/);
  assert.match(extensionSource, /const candidates = \[\.\.\.artifacts, \.\.\.discovered\]/);
  assert.doesNotMatch(extensionSource, /artifacts\.length > 0\s*\?\s*artifacts\s*:\s*await discoverUiConceptImages/);
  assert.doesNotMatch(extensionSource, /<h3>UI Spec Assets<\/h3>/);
  assert.doesNotMatch(extensionSource, /UI Spec includes the Markdown document above plus the concept images below\./);
  assert.match(extensionSource, /\.spec-v2-content \.concept-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:10px;padding:10px\}/);
  assert.match(extensionSource, /@media\(max-width:900px\)[\s\S]*\.spec-stage-strip,\s*\.spec-workspace-grid,\s*\.spec-lower-grid\{grid-template-columns:1fr\}/);
  assert.match(extensionSource, /class="concept-card" data-command="openConceptImage"/);
  assert.match(extensionSource, /id="concept-modal" class="concept-modal" hidden/);
  assert.match(extensionSource, /payload\.command === "openConceptImage"/);
  assert.match(extensionSource, /payload\.command === "closeConceptImage"/);
  assert.match(extensionSource, /asWebviewUri\(uri\)/);
  assert.match(extensionSource, /latestUiSpecExecutionDetail\(view\)/);
  assert.match(extensionSource, /skillOutputContract/);
  assert.match(extensionSource, /contract\.producedArtifacts/);
  assert.match(extensionSource, /detail\.producedArtifacts/);
  assert.match(extensionSource, /uiConceptWorkspaceRoot\(provider\.currentView\(\), workspaceRoot\)/);
  assert.match(extensionSource, /localResourceRoots/);
  assert.match(extensionSource, /discoverUiConceptImages\(rootUri, "docs\/ui\/concepts"\)/);
  assert.match(extensionSource, /readDirectory\(directoryUri\)/);
  assert.match(extensionSource, /img-src \$\{imgSource\}/);
  assert.doesNotMatch(extensionSource, /<h2>Lifecycle<\/h2>/);
  assert.doesNotMatch(extensionSource, /<h2>Control Guardrails<\/h2>/);
  assert.doesNotMatch(extensionSource, /function guardrailRow/);
  assert.doesNotMatch(extensionSource, /Command Approvals/);
  assert.doesNotMatch(extensionSource, /Safe Actions Only/);
  assert.doesNotMatch(extensionSource, /<h2>Evidence & Traceability<\/h2>/);
  assert.doesNotMatch(extensionSource, /Evidence Required/);
  assert.doesNotMatch(extensionSource, /Traceability Enforced/);
});

test("VSCode Webview controlled buttons only send supported Console command actions", () => {
  const consoleActionsMatch = productConsoleSource.match(/const CONSOLE_COMMAND_ACTIONS = new Set<ConsoleCommandAction>\(\[([\s\S]*?)\]\);/);
  assert.ok(consoleActionsMatch, "Console command action allowlist should be discoverable");
  const consoleActions = new Set([...consoleActionsMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]));
  const webviewControlledActions = new Set(
    [...webviewSource.matchAll(/action: "([^"]+)"/g)]
      .map((match) => match[1]),
  );

  assert.deepEqual(
    [...webviewControlledActions].filter((action) => !consoleActions.has(action)).sort(),
    [],
  );
  assert.equal(webviewControlledActions.has("check_project_health"), true);
  assert.equal(webviewControlledActions.has("scan_spec_sources"), true);
});

test("VSCode IDE Webviews do not import Product Console UI surfaces", () => {
  const forbiddenPatterns = [
    /from\s+["'][^"']*apps\/product-console/i,
    /import\([^)]*apps\/product-console/i,
    /from\s+["'][^"']*product-console\/src/i,
    /import\([^)]*product-console\/src/i,
    /RunnerPage\.tsx/,
    /SpecPage\.tsx/,
    /AppShell/,
    /react-router/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.test(extensionSource), false, `Forbidden Product Console UI dependency matched ${pattern}`);
  }
});
