import type { QueueAction, SpecDriveIdeExecutionDetail, SpecDriveIdeQueueItem, SpecDriveIdeView } from "../types";
import type { WorkbenchLocale } from "./i18n";
import {
  autoRefreshSwitch,
  buttonIcon,
  commandButton,
  compactJsonBlock,
  disabledButtonHtml,
  emptyState,
  escapeAttr,
  escapeHtml,
  executionFieldsHtml,
  jsonBlock,
  queueItemKey,
  queueButton,
  renderQueueGroup,
  renderRawLogRefs,
  renderWorkbenchInputForm,
  renderWorkbenchPage,
  statusClass,
  textBlock,
  webviewNonce,
  type WorkbenchTheme,
} from "./shared";

const EXECUTION_QUEUE_GROUPS: Array<{ label: string; statuses: string[]; open: boolean }> = [
  { label: "running", statuses: ["running"], open: true },
  { label: "queued", statuses: ["queued"], open: true },
  { label: "waiting_input", statuses: ["waiting_input"], open: false },
  { label: "approval / review", statuses: ["approval_needed", "approval_answered", "review_needed"], open: false },
  { label: "blocked / failed", statuses: ["blocked", "failed"], open: false },
  { label: "paused", statuses: ["paused"], open: false },
  { label: "cancelled", statuses: ["cancelled"], open: false },
  { label: "skipped", statuses: ["skipped"], open: false },
  { label: "completed", statuses: ["completed"], open: false },
];

export function renderExecutionWorkbenchWebview(
  view: SpecDriveIdeView | undefined,
  detail: SpecDriveIdeExecutionDetail | SpecDriveIdeQueueItem | undefined,
  selectedKey?: string,
  autoRefreshEnabled = false,
  locale: WorkbenchLocale = "en",
  theme: WorkbenchTheme = "vscode",
): string {
  const nonce = webviewNonce();
  const queue = view ? allQueueItems(view) : [];
  const grouped = view?.queue.groups ?? {};
  const selectedItem = selectedKey ? detail : undefined;
  const executionDetail = detail && "metadata" in detail ? detail as SpecDriveIdeExecutionDetail : undefined;
  const selectedBlockers = selectedBlockerItems(selectedItem);
  const blockerApprovalCount = selectedBlockers.length + (executionDetail?.approvalRequests.length ?? 0);
  const stats = queueStats(queue);
  return renderWorkbenchPage("Execution Workbench", nonce, `
    <style>
      body{padding:0;background:#071015;overflow:hidden}.workbench-header{display:none}.execution-v2-shell{height:100vh;display:grid;background:linear-gradient(180deg,#081117,#0b1419);color:var(--fg);overflow:hidden}.execution-v2-main{min-width:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;height:100vh;overflow:hidden}.execution-v2-topbar{min-height:62px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(126,231,236,.15);background:rgba(5,12,17,.74)}.execution-v2-metrics{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:12px}.execution-context-card{border:0;border-left:1px solid rgba(126,231,236,.22);border-radius:0;background:transparent;padding:0 0 0 10px}.execution-context-card span{font-size:11px;color:var(--muted)}.execution-context-card strong{font-size:12px;min-height:24px}.execution-v2-top-actions{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:12px}.execution-v2-avatar{display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--border);border-radius:999px;color:var(--fg)}.execution-v2-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(126,231,236,.12);background:#071116}.execution-v2-toolbar-title{display:flex;align-items:center;gap:10px;min-width:0}.execution-v2-toolbar-title h1{margin:0;font-size:20px}.execution-v2-toolbar-title span{color:var(--muted)}.execution-v2-toolbar .execution-toolbar{justify-content:flex-end;margin:0}.execution-v2-toolbar .inline-field select{background:#071116}.execution-v2-content{min-height:0;overflow:hidden;padding:10px 14px}.execution-v2-content .workbench-form{margin-bottom:10px}.execution-layout{height:100%;min-height:0;grid-template-columns:minmax(520px,41%) minmax(0,1fr);gap:10px}.panel,.execution-detail-card,.execution-feature-card{background:linear-gradient(180deg,rgba(14,28,35,.96),rgba(8,17,22,.96));border-color:rgba(126,231,236,.20);box-shadow:none}.execution-detail-card>summary{cursor:pointer;list-style:none}.execution-detail-card>summary::-webkit-details-marker{display:none}.execution-detail-card>summary::before{content:"+";color:var(--muted);font-weight:650}.execution-detail-card[open]>summary::before{content:"-"}.execution-queue-column,.current-selected-column{height:100%;min-height:0;overflow:auto}.execution-queue-column{padding:0}.execution-panel-title{padding:9px 10px;margin:0}.execution-queue-header{background:#071116;border-top:1px solid rgba(126,231,236,.10)}.queue-head{background:rgba(11,24,31,.88);padding:7px 10px}.queue-item{min-height:32px;padding:6px 8px}.queue-item .toolbar{margin:0;justify-content:flex-end}.current-selected-column{padding:10px}.selected-title{background:#071116;margin:-10px -10px 10px;padding:9px 10px;border-bottom:1px solid rgba(126,231,236,.18)}.title-actions{min-width:min(100%,620px)}.title-actions button{min-height:28px}.execution-selected-summary{display:none}.state-flow-compact{position:relative;padding:8px 10px;border:1px solid rgba(126,231,236,.18);border-radius:4px;background:#081217;grid-template-columns:repeat(6,minmax(0,1fr))}.state-flow-item{background:transparent;border:0;border-top:2px solid rgba(126,231,236,.24);border-radius:0;text-align:center}.state-flow-reason{grid-column:1/-1;text-align:left;border-top:0;border-bottom:1px solid rgba(126,231,236,.14);padding-bottom:8px}.execution-feature-card{margin:8px 0}.execution-feature-meta{grid-template-columns:repeat(5,minmax(0,1fr));border-color:rgba(126,231,236,.18)}.execution-detail-grid{grid-template-columns:minmax(0,1.2fr) minmax(220px,.75fr) minmax(210px,.7fr);gap:8px}.execution-detail-card-wide{grid-column:auto}.execution-detail-card-full{grid-column:1/-1}.token-consumption-line{display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:12px}.token-consumption-line span{color:var(--muted)}.token-consumption-line strong{font-weight:650}.compact-section{background:transparent;border-color:rgba(126,231,236,.18);margin:0}.compact-section>summary{background:transparent}.section-title{margin:0 0 6px;padding:0 0 6px;border-top:0}.execution-v2-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:30px;padding:5px 14px;border-top:1px solid rgba(126,231,236,.15);background:#071116;color:var(--muted);font-size:12px}.execution-v2-footer div{display:flex;gap:14px;align-items:center;min-width:0}.execution-v2-dot{width:7px;height:7px;border-radius:999px;background:var(--ok);box-shadow:0 0 8px var(--ok)}@media(max-width:1100px){.execution-v2-topbar,.execution-v2-toolbar{grid-template-columns:1fr}.execution-v2-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.execution-layout{grid-template-columns:1fr}.execution-detail-grid{grid-template-columns:1fr}}@media(max-width:620px){.execution-v2-metrics,.execution-feature-meta{grid-template-columns:1fr}.state-flow-compact{grid-template-columns:1fr}.execution-v2-top-actions{display:none}}
    </style>
    <div class="execution-v2-shell">
      <section class="execution-v2-main">
        <header class="execution-v2-topbar">
          <div class="execution-v2-metrics">
            ${executionContextCard("Project", view?.project?.name ?? view?.project?.id ?? "No project", "file")}
            ${executionContextCard("Branch", "workspace", "branch")}
            ${executionContextCard("Spec Health", view?.projectInitialization?.blocked ? "Blocked" : "Healthy", view?.projectInitialization?.blocked ? "warning" : "check-circle", view?.projectInitialization?.blocked ? "bad" : "ok")}
            ${executionContextCard("Queue Load", `${stats.running} Running · ${stats.queued} Queued`, "play", stats.blocked > 0 ? "warn" : "info")}
            ${executionContextCard("Total Cost", projectCostLabel(view), "dot")}
          </div>
          <div class="execution-v2-top-actions"><span>Alerts ${stats.blocked + stats.review}</span><span>Docs</span><span class="execution-v2-avatar">AD</span></div>
        </header>
        <section class="execution-v2-toolbar">
          <div class="execution-v2-toolbar-title"><h1>Execution Workbench</h1><span>/ Runner</span><span class="badge">Page 3 of 5</span></div>
          <div class="execution-toolbar">
            ${executionPreferenceControls(view)}
            ${autoRunButton(view)}
            ${commandButton("Refresh", "refresh", {})}
            ${autoRefreshSwitch(autoRefreshEnabled)}
          </div>
        </section>
        <section class="execution-v2-content">
          <div id="workbench-status" class="status-text" role="status" aria-live="polite">${escapeHtml(selectedItem ? `Selected job: ${selectedItem.executionId ?? selectedItem.schedulerJobId ?? "unknown"} · ${selectedItem.status}` : "Select a job to enable job actions.")}</div>
          ${renderWorkbenchInputForm()}
          <main class="execution-layout">
            <section class="panel execution-queue-column">
              <div class="panel-title execution-panel-title"><h2>Execution Queue</h2><span>Total: ${queue.length}</span></div>
              <div class="execution-queue-header" aria-hidden="true"><span>ID</span><span>Title</span><span>Status</span><span>Runner</span><span>Started / Duration</span><span>Action</span></div>
              ${EXECUTION_QUEUE_GROUPS.map((group) => renderQueueGroup(group.label, queueGroupItems(group.statuses, grouped), selectedKey, group.open)).join("")}
            </section>
            <section class="panel current-selected-column">
              <div class="panel-title selected-title">
                <div>
                  <h2>Current Selected</h2>
                  <span>${escapeHtml(selectedItem ? `${selectedItem.status} · ${selectedItem.operation ?? selectedItem.jobType ?? "execution"}` : "none")}</span>
                </div>
                <div class="title-actions">${selectedTaskActionButtons(selectedItem)}</div>
              </div>
              <div class="execution-selected-summary">
                ${detail ? executionFieldsHtml(detail) : emptyState("No active execution selected.")}
              </div>
              <h3>State Flow</h3>
              ${renderStateFlow(selectedItem)}
              ${renderFeatureSummaryCard(selectedItem)}
              <div class="execution-detail-grid">
                <details class="execution-detail-card execution-detail-card-full" open>
                  <summary class="section-title"><h2>Latest Execution Summary</h2><span>${escapeHtml(selectedItem?.status ?? "none")}</span></summary>
                  ${renderLatestExecutionSummary(selectedItem)}
                </details>
                <details class="execution-detail-card execution-detail-card-full" open>
                  <summary class="section-title"><h2>Token Consumption</h2><span>${executionDetail?.tokenConsumption ? "recorded" : "none"}</span></summary>
                  ${renderTokenConsumption(executionDetail)}
                </details>
                <details class="execution-detail-card execution-detail-card-full" open>
                  <summary class="section-title"><h2>Raw Log Refs</h2><span>${executionDetail?.rawLogRefs?.length ?? 0}</span></summary>
                  ${renderRawLogRefs(detail)}
                </details>
                <details class="execution-detail-card execution-detail-card-full" open>
                  <summary class="section-title"><h2>Blockers & Approvals</h2><span>${blockerApprovalCount}</span></summary>
                  ${renderBlockersAndApprovals(selectedBlockers, executionDetail)}
                </details>
                <details class="execution-detail-card execution-detail-card-full" open>
                  <summary class="section-title"><h2>Result Projection</h2><span>spec-state.json</span></summary>
                  ${renderSkillOutputSummary(executionDetail)}
                </details>
                <details class="execution-detail-card execution-detail-card-full" open>
                  <summary class="section-title"><h2>Produced Artifacts</h2><span>${executionDetail?.producedArtifacts?.length ?? 0}</span></summary>
                  ${renderProducedArtifacts(executionDetail)}
                </details>
              </div>
            </section>
          </main>
        </section>
        <footer class="execution-v2-footer"><span>Last Updated: ${escapeHtml(new Date().toLocaleTimeString("en-US", { hour12: false }))}</span><div><span class="execution-v2-dot"></span><span>All Systems Operational</span><span>Auto Run: ${view?.automation?.status === "running" ? "ON" : "OFF"}</span></div></footer>
      </section>
    </div>
  `, undefined, locale, theme);
}

function executionContextCard(label: string, value: string, icon: string, className = "info"): string {
  return `<div class="execution-context-card"><span>${escapeHtml(label)}</span><strong class="${escapeAttr(className)}">${buttonIcon(icon)}${escapeHtml(value)}</strong></div>`;
}

function projectCostLabel(view: SpecDriveIdeView | undefined): string {
  const cost = view?.projectCost;
  if (!cost) return "USD 0.00";
  return `${cost.currency || "USD"} ${Number.isFinite(cost.totalUsd) ? cost.totalUsd.toFixed(2) : "0.00"}`;
}

function queueStats(queue: SpecDriveIdeQueueItem[]): { running: number; queued: number; waiting: number; blocked: number; review: number; completed: number } {
  return {
    running: queue.filter((item) => item.status === "running").length,
    queued: queue.filter((item) => item.status === "queued").length,
    waiting: queue.filter((item) => item.status === "waiting_input").length,
    blocked: queue.filter((item) => item.status === "blocked" || item.status === "failed").length,
    review: queue.filter((item) => item.status === "approval_needed" || item.status === "approval_answered" || item.status === "review_needed").length,
    completed: queue.filter((item) => item.status === "completed").length,
  };
}

function renderFeatureSummaryCard(item: SpecDriveIdeQueueItem | undefined): string {
  if (!item) return "";
  const title = item.featureTitle ?? item.featureId ?? item.taskId ?? "Selected execution";
  const description = item.featureDescription ?? item.summary ?? "No Feature Spec description found.";
  const rows: Array<[string, string]> = [
    ["Owner", item.threadId ?? "none"],
    ["Priority", item.reviewNeededReason ?? "none"],
    ["Type", item.operation ?? item.jobType ?? "execution"],
    ["Spec", item.featureId ?? "none"],
    ["Estimate", item.taskId ?? "none"],
  ];
  return `<section class="execution-feature-card">
    <div class="execution-feature-title"><h3>Feature Spec</h3><strong data-i18n-skip>${escapeHtml(title)}</strong></div>
    <p data-i18n-skip>${escapeHtml(description)}</p>
    <div class="execution-feature-meta">${rows.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong><code data-i18n-skip>${escapeHtml(value)}</code></span>`).join("")}</div>
  </section>`;
}

function renderLatestExecutionSummary(item: SpecDriveIdeQueueItem | undefined): string {
  if (!item) return emptyState("No active execution selected.");
  const currentStep: [string, string] = ["Current Step", item.stateReason ?? item.summary ?? "none"];
  const rows: Array<[string, string]> = [
    ["Operation", item.operation ?? item.jobType ?? "execution"],
    ["Runner", item.adapter ?? item.adapterId ?? item.runMode ?? "none"],
    ["Started At", item.startedAt ?? "none"],
    ["Duration", formatDurationMs(item.durationMs) ?? "none"],
    ["Status", item.status],
    ["Commit", item.threadId ?? "none"],
  ];
  return `<div class="result-group state-flow state-flow-compact execution-summary-flow">${renderSummaryFlowItem(currentStep, true)}${rows.map((row) => renderSummaryFlowItem(row)).join("")}</div>`;
}

function renderSummaryFlowItem([label, value]: [string, string], wide = false): string {
  return `<div class="state-flow-item${wide ? " state-flow-reason" : ""}"><span>${escapeHtml(label)}</span><strong data-i18n-skip>${escapeHtml(value)}</strong></div>`;
}

function selectedBlockerItems(item: SpecDriveIdeQueueItem | undefined): SpecDriveIdeQueueItem[] {
  if (!item) return [];
  const status = item.status.toLowerCase();
  return ["waiting_input", "approval_needed", "review_needed", "blocked", "failed", "paused"].includes(status) ? [item] : [];
}

function queueGroupItems(statuses: string[], grouped: Record<string, SpecDriveIdeQueueItem[]>): SpecDriveIdeQueueItem[] {
  return statuses.flatMap((status) => grouped[status] ?? []).sort(compareQueueItemsByEndTimeDesc);
}

function compareQueueItemsByEndTimeDesc(left: SpecDriveIdeQueueItem, right: SpecDriveIdeQueueItem): number {
  const rightTime = queueItemSortTime(right);
  const leftTime = queueItemSortTime(left);
  if (rightTime !== leftTime) return rightTime - leftTime;
  return (right.executionId ?? right.schedulerJobId ?? "").localeCompare(left.executionId ?? left.schedulerJobId ?? "");
}

function queueItemSortTime(item: SpecDriveIdeQueueItem): number {
  const value = item.completedAt ?? item.updatedAt;
  if (!value) return 0;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const time = Date.parse(normalized);
  return Number.isFinite(time) ? time : 0;
}

function renderTokenConsumption(detail: SpecDriveIdeExecutionDetail | undefined): string {
  const token = detail?.tokenConsumption;
  if (!token) return emptyState("No token consumption recorded.");
  const rows: Array<[string, string]> = [
    ["Model", token.model ?? "unknown"],
    ["Input", formatInteger(token.inputTokens)],
    ["Cached Input", formatInteger(token.cachedInputTokens)],
    ["Output", formatInteger(token.outputTokens)],
    ["Reasoning Output", formatInteger(token.reasoningOutputTokens)],
    ["Total", formatInteger(token.totalTokens)],
    ["Cost", formatCurrency(token.costUsd, token.currency)],
    ["Pricing", token.pricingStatus],
    ["Pricing Source", pricingSourceLabel(token.pricing)],
  ];
  return `<div class="token-consumption-line">${rows.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong>: ${escapeHtml(value)}</span>`).join("")}</div>`;
}

function pricingSourceLabel(pricing: Record<string, unknown> | undefined): string {
  if (!pricing) return "unknown";
  const adapterKind = typeof pricing.adapterKind === "string" ? pricing.adapterKind.toUpperCase() : undefined;
  const adapterId = typeof pricing.adapterId === "string" ? pricing.adapterId : undefined;
  return adapterKind && adapterId ? `${adapterKind}: ${adapterId}` : adapterId ?? "unknown";
}

function formatInteger(value: number): string {
  return Number.isFinite(value) ? Math.trunc(value).toLocaleString("en-US") : "0";
}

function formatCurrency(value: number, currency: string): string {
  const amount = Number.isFinite(value) ? value : 0;
  return `${currency || "USD"} ${amount.toFixed(6)}`;
}

function executionPreferenceControls(view: SpecDriveIdeView | undefined): string {
  const options = view?.executionPreferenceOptions;
  if (!options) return "";
  const activeMode = options.active.runMode ?? "cli";
  const activeAdapter = options.active.adapterId ?? (activeMode === "rpc" ? options.rpcAdapters[0]?.id : options.cliAdapters[0]?.id) ?? "";
  const adapters = [
    ...options.cliAdapters.map((adapter) => ({ ...adapter, mode: "cli" as const })),
    ...options.rpcAdapters.map((adapter) => ({ ...adapter, mode: "rpc" as const })),
  ];
  return `<label class="inline-field">Provider
      <select id="job-adapter-id" aria-label="Job provider adapter">
        ${adapters.map((adapter) => `<option value="${escapeAttr(adapter.id)}" data-run-mode="${adapter.mode}"${adapter.id === activeAdapter ? " selected" : ""}>${escapeHtml(`${adapter.mode.toUpperCase()}: ${adapter.displayName}`)}</option>`).join("")}
      </select>
    </label>`;
}

function renderBlockersAndApprovals(blockers: SpecDriveIdeQueueItem[], detail: SpecDriveIdeExecutionDetail | undefined): string {
  const approvalRequests = detail?.approvalRequests ?? [];
  const reviewHtml = detail?.review ? `<h3>Review Item</h3>${renderReviewDetails(detail)}` : "";
  const queueHtml = blockers.map(renderStateFlowCard).join("");
  const approvalHtml = approvalRequests.length > 0
    ? `<h3>Approval Requests</h3>${compactJsonBlock(approvalRequests)}`
    : "";
  return reviewHtml || queueHtml || approvalHtml
    ? `${reviewHtml}${queueHtml}${approvalHtml}`
    : emptyState("No blockers or approval requests.");
}

function renderStateFlow(item: SpecDriveIdeQueueItem | undefined): string {
  if (!item) return emptyState("Select a queue item to inspect its state flow.");
  const resume = item.resumeTarget;
  const rows: Array<[string, string]> = [
    ["Reason", item.stateReason ?? item.summary ?? "No state reason recorded."],
    ["Current Status", item.status],
    ["Review Reason", reviewReasonLabel(item.reviewNeededReason)],
    ["Review Message", item.review?.message ?? "none"],
    ["Review Triggers", item.review?.triggerReasons.join(", ") || "none"],
    ["Recommended Actions", item.review?.recommendedActions.join(", ") || "none"],
    ["Started", item.startedAt ?? "none"],
    ["Completed", item.completedAt ?? "none"],
    ["Duration", formatDurationMs(item.durationMs) ?? "none"],
    ["Resume Target", resume ? `${resume.status} via ${resume.source}` : "none"],
    ["Resume Evidence", resume ? [resume.executionId, resume.schedulerJobId, resume.at].filter(Boolean).join(" · ") : "none"],
    ["Next Action", stateFlowNextAction(item)],
  ];
  return `<div class="result-group state-flow state-flow-compact">${rows.map(renderStateFlowItem).join("")}</div>`;
}

function renderStateFlowItem([label, value]: [string, string]): string {
  const reason = label === "Reason";
  return `<div class="state-flow-item${reason ? " state-flow-reason" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderStateFlowRow([label, value]: [string, string]): string {
  const stacked = ["Reason", "Review Message", "Review Triggers", "Recommended Actions", "Resume Evidence", "Message", "References", "Next Action"].includes(label);
  return `<div class="row${stacked ? " row-stacked" : ""}"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

function renderStateFlowCard(item: SpecDriveIdeQueueItem): string {
  const actions = stateFlowCardActions(item);
  return `<div class="issue ${statusClass(item.status)}"><strong>${escapeHtml(item.featureId ?? item.executionId ?? item.schedulerJobId ?? item.status)}</strong><br>
    <span>${escapeHtml(item.stateReason ?? item.summary ?? item.operation ?? item.status)}</span>
    ${item.review ? renderReviewSummary(item) : ""}
    ${item.resumeTarget ? `<div class="row"><span>Resume Target</span><span>${escapeHtml(item.resumeTarget.status)}</span></div>` : ""}
    ${actions ? `<div class="toolbar">${actions}</div>` : ""}
  </div>`;
}

function renderReviewSummary(item: SpecDriveIdeQueueItem): string {
  const review = item.review;
  if (!review) return "";
  return `<div class="review-summary">
    <div class="row row-stacked"><span>Review Item</span><span>${escapeHtml(review.message ?? item.stateReason ?? "Review details unavailable.")}</span></div>
    <div class="row row-stacked"><span>Triggers</span><span>${escapeHtml(review.triggerReasons.join(", ") || "none")}</span></div>
  </div>`;
}

function renderReviewDetails(item: SpecDriveIdeQueueItem): string {
  const review = item.review;
  if (!review) return emptyState("No ReviewItem details recorded.");
  const rows: Array<[string, string]> = [
    ["ReviewItem", review.id],
    ["Status", review.status],
    ["Severity", review.severity ?? "none"],
    ["Reason", review.reviewNeededReason ?? "none"],
    ["Message", review.message ?? item.stateReason ?? "No review message recorded."],
    ["Risk", review.riskExplanation ?? "none"],
    ["Triggers", review.triggerReasons.join(", ") || "none"],
    ["Recommended Actions", review.recommendedActions.join(", ") || "none"],
    ["References", review.referenceRefs.join(", ") || "none"],
  ];
  return `<div class="result-group review-details">${rows.map(renderStateFlowRow).join("")}</div>`;
}

function stateFlowCardActions(item: SpecDriveIdeQueueItem): string {
  const status = item.status.toLowerCase();
  if (status === "review_needed") {
    return `${reviewDecisionButtons(item, "Execution Workbench state card")}${item.executionId ? queueButton("Retry", item, "retry") : ""}`;
  }
  if (status === "approval_needed") {
    return `${queueButton("Accept", item, "approve").replace("data-action=\"approve\"", "data-action=\"approve\" data-approval-decision=\"accept\"")}${queueButton("Decline", item, "approve").replace("data-action=\"approve\"", "data-action=\"approve\" data-approval-decision=\"decline\"")}${item.executionId ? queueButton("Retry", item, "retry") : ""}`;
  }
  if (status === "paused") return queueButton("Resume", item, "resume");
  if (status === "blocked" || status === "failed") return item.executionId ? queueButton("Retry", item, "retry") : "";
  return "";
}

function resultProjection(detail: SpecDriveIdeExecutionDetail | undefined): unknown {
  if (!detail) return null;
  const output = detail.skillOutputContract && typeof detail.skillOutputContract === "object"
    ? detail.skillOutputContract as Record<string, unknown>
    : {};
  return {
    status: detail.status,
    summary: output.summary ?? detail.summary,
    featureId: detail.featureId,
    taskId: detail.taskId,
    executionId: detail.executionId,
    producedArtifacts: detail.producedArtifacts,
    traceability: output.traceability,
  };
}

function renderSkillOutputSummary(detail: SpecDriveIdeExecutionDetail | undefined): string {
  if (!detail) return emptyState("No execution result selected.");
  const output = skillOutputRecord(detail);
  const projection = resultProjection(detail) as Record<string, unknown>;
  const result = resultRecord(output);
  return `
    <div class="result-summary">
      <div class="result-status"><span class="badge ${statusClass(detail.status)}">${escapeHtml(detail.status)}</span><strong data-i18n-skip>${escapeHtml(String(projection.summary ?? "No summary."))}</strong></div>
      ${renderTraceabilityChips(output?.traceability, detail)}
    </div>
    ${renderResultGroups(result)}
  `;
}

function selectedTaskActionButtons(selectedItem: SpecDriveIdeQueueItem | undefined): string {
  return [
    queueActionButton("Run Now", selectedItem, "run_now", ["ready", "queued"]),
    pauseResumeButton(selectedItem),
    retryButton(selectedItem),
    queueActionButton("Cancel", selectedItem, "cancel", ["ready", "queued", "running", "waiting_input", "approval_needed", "review_needed", "blocked", "paused"]),
    queueActionButton("Skip", selectedItem, "skip", ["queued", "waiting_input", "approval_needed", "review_needed", "blocked", "failed", "paused"]),
    queueActionButton("Reprioritize", selectedItem, "reprioritize", ["ready", "queued", "blocked", "paused"]),
    queueActionButton("Enqueue", selectedItem, "enqueue", ["ready", "blocked"]),
    reviewDecisionButtons(selectedItem, "Execution Workbench"),
  ].join("");
}

function retryButton(item: SpecDriveIdeQueueItem | undefined): string {
  if (item?.status.toLowerCase() === "blocked" && !item.executionId) {
    return disabledButton("Retry", "Retry requires an Execution Record for blocked work.");
  }
  return queueActionButton("Retry", item, "retry", ["failed", "cancelled", "skipped", "blocked"]);
}

function renderTraceabilityChips(traceability: unknown, detail: SpecDriveIdeExecutionDetail): string {
  const record = traceability && typeof traceability === "object" && !Array.isArray(traceability)
    ? traceability as Record<string, unknown>
    : {};
  const requirementIds = Array.isArray(record.requirementIds) ? record.requirementIds.filter((item): item is string => typeof item === "string") : [];
  const chips = [
    ["Feature", stringOrNone(record.featureId ?? detail.featureId)],
    ["Task", stringOrNone(record.taskId ?? detail.taskId)],
    ...requirementIds.map((id) => ["REQ", id]),
  ];
  return `<div class="chip-row">${chips.map(([label, value]) => `<span class="badge"><strong>${escapeHtml(label)}</strong>&nbsp;${escapeHtml(value)}</span>`).join("")}</div>`;
}

function renderProducedArtifacts(detail: SpecDriveIdeExecutionDetail | undefined): string {
  const artifacts = Array.isArray(detail?.producedArtifacts) ? detail.producedArtifacts : [];
  if (artifacts.length === 0) return emptyState("No produced artifacts.");
  return `<table class="artifact-table"><thead><tr><th>Path</th><th>Kind</th><th>Status</th><th>Summary</th></tr></thead><tbody>${artifacts.map((artifact) => {
    const record = artifact && typeof artifact === "object" && !Array.isArray(artifact) ? artifact as Record<string, unknown> : {};
    return `<tr><td><code>${escapeHtml(String(record.path ?? "-"))}</code></td><td data-i18n-skip>${escapeHtml(String(record.kind ?? "-"))}</td><td data-i18n-skip><span class="${statusClass(String(record.status ?? ""))}">${escapeHtml(String(record.status ?? "-"))}</span></td><td data-i18n-skip>${escapeHtml(String(record.summary ?? ""))}</td></tr>`;
  }).join("")}</tbody></table>`;
}

function renderResultGroups(result: Record<string, unknown>): string {
  const groups: Array<[string, string[]]> = [
    ["Decision", ["reason", "selectedFeature", "featureId"]],
    ["Commands", ["commands", "commandsChecked"]],
    ["Verification", ["verification", "statusChecker", "failureClassification"]],
    ["Blockers", ["blockers", "blockedReasons", "openQuestions", "residualQuestions"]],
    ["Findings", ["findings", "specDriftFindings", "requiredFixes"]],
    ["Risks", ["risks", "residualRisks", "residualRisk"]],
    ["Coverage", ["coverage", "traceabilityMatrix", "userStoryMapping"]],
    ["Git Delivery", ["gitDelivery"]],
    ["Updated Documents", ["updatedDocuments", "updatedArtifacts", "affectedDocuments"]],
  ];
  const html = groups.map(([title, keys]) => renderResultGroup(title, keys, result)).filter(Boolean).join("");
  return html || emptyState("No structured result fields.");
}

function renderResultGroup(title: string, keys: string[], result: Record<string, unknown>): string {
  const entries = keys.filter((key) => result[key] !== undefined).map((key) => [key, result[key]] as const);
  if (entries.length === 0) return "";
  return `<div class="result-group"><h3>${escapeHtml(title)}</h3>${entries.map(([key, value]) => renderResultEntry(title, key, value)).join("")}</div>`;
}

function renderResultEntry(groupTitle: string, key: string, value: unknown): string {
  if (key === "gitDelivery") return renderGitDeliveryEntry(value);
  const wide = isWideResultValue(key, value);
  const entryLabel = labelize(key);
  const label = wide && entryLabel === groupTitle ? "" : `<span>${escapeHtml(entryLabel)}</span>`;
  const valueHtml = wide ? `<div class="result-content" data-i18n-skip>${renderResultValue(value)}</div>` : `<span data-i18n-skip>${renderResultValue(value)}</span>`;
  return `<div class="result-entry${wide ? " result-entry-wide" : ""}">${label}${valueHtml}</div>`;
}

function renderGitDeliveryEntry(value: unknown): string {
  const prUrl = gitDeliveryPrUrl(value);
  const prLink = prUrl
    ? `<a href="${escapeAttr(prUrl)}">${escapeHtml(prUrl)}</a>`
    : `<span class="muted">No PR link recorded.</span>`;
  return `<div class="result-entry result-entry-wide"><span>PR</span><div class="result-content" data-i18n-skip>${prLink}</div></div>`;
}

function gitDeliveryPrUrl(value: unknown): string | undefined {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const direct = firstSafeUrl(record.prUrl, record.pullRequestUrl, record.url);
  if (direct) return direct;
  const pullRequest = record.pullRequest && typeof record.pullRequest === "object" && !Array.isArray(record.pullRequest)
    ? record.pullRequest as Record<string, unknown>
    : {};
  return firstSafeUrl(pullRequest.url, pullRequest.htmlUrl);
}

function firstSafeUrl(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== "string" || value.trim().length === 0) continue;
    const url = value.trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
    } catch {
      continue;
    }
  }
  return undefined;
}

function isWideResultValue(key: string, value: unknown): boolean {
  if (["commands", "verification", "blockers", "findings", "risks", "coverage", "updatedDocuments", "updatedArtifacts", "affectedDocuments"].includes(key)) return true;
  return value !== null && typeof value === "object";
}

function renderResultValue(value: unknown): string {
  if (value === null || value === undefined) return `<span class="muted">none</span>`;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return escapeHtml(String(value));
  if (Array.isArray(value)) {
    if (value.length === 0) return `<span class="muted">empty</span>`;
    return `<ul class="compact-list">${value.slice(0, 6).map((entry) => `<li>${escapeHtml(resultLabel(entry))}</li>`).join("")}${value.length > 6 ? `<li class="muted">+${value.length - 6} more</li>` : ""}</ul>`;
  }
  return `<code>${escapeHtml(resultLabel(value))}</code>`;
}

function resultLabel(value: unknown): string {
  if (value === null || value === undefined) return "none";
  if (typeof value !== "object") return String(value);
  const record = value as Record<string, unknown>;
  return String(record.summary ?? record.reason ?? record.command ?? record.path ?? record.id ?? record.name ?? JSON.stringify(value));
}

function skillOutputRecord(detail: SpecDriveIdeExecutionDetail | undefined): Record<string, unknown> | undefined {
  return detail?.skillOutputContract && typeof detail.skillOutputContract === "object" && !Array.isArray(detail.skillOutputContract)
    ? detail.skillOutputContract as Record<string, unknown>
    : undefined;
}

function resultRecord(output: Record<string, unknown> | undefined): Record<string, unknown> {
  return output?.result && typeof output.result === "object" && !Array.isArray(output.result)
    ? output.result as Record<string, unknown>
    : {};
}

function stringOrNone(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "none";
}

function formatDurationMs(value: number | undefined): string | undefined {
  if (value === undefined || !Number.isFinite(value) || value < 0) return undefined;
  const totalSeconds = Math.round(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function labelize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (match) => match.toUpperCase());
}

function autoRunButton(view: SpecDriveIdeView | undefined): string {
  return view?.automation?.status === "running"
    ? commandButton("Pause Auto Run", "controlled", {
      action: "pause_runner",
      entityType: "runner",
      entityId: "runner-main",
      reason: "Pause auto run from Execution Workbench.",
    })
    : commandButton("Start Auto Run", "controlled", {
      action: "start_auto_run",
      entityType: "project",
      entityId: view?.project?.id ?? "workspace",
      reason: "Start auto run from Execution Workbench.",
    });
}

function queueActionButton(
  label: string,
  item: SpecDriveIdeQueueItem | undefined,
  action: QueueAction,
  enabledStatuses: string[],
): string {
  const entityId = item?.executionId ?? item?.schedulerJobId;
  if (!entityId) return disabledButton(label, "Select a job first.");
  const selectedItem = item as SpecDriveIdeQueueItem;
  const status = selectedItem.status.toLowerCase();
  if (!enabledStatuses.includes(status)) {
    return disabledButton(label, `${label} is not available while the selected job is ${selectedItem.status}.`);
  }
  return queueButton(label, selectedItem, action);
}

function pauseResumeButton(item: SpecDriveIdeQueueItem | undefined): string {
  const status = item?.status.toLowerCase();
  if (status === "paused") return queueActionButton("Resume", item, "resume", ["paused"]);
  return queueActionButton("Pause", item, "pause", ["queued", "running"]);
}

function reviewDecisionButtons(item: SpecDriveIdeQueueItem | undefined, source: string): string {
  if (item?.status.toLowerCase() !== "review_needed") return "";
  const buttons: Array<[string, string, string]> = reviewActionsForReason(item.reviewNeededReason);
  return buttons.map(([label, action, icon]) => reviewDecisionButton(label, action, icon, item, source)).join("");
}

function reviewActionsForReason(reason: SpecDriveIdeQueueItem["reviewNeededReason"]): Array<[string, string, string]> {
  if (reason === "clarification_needed") {
    return [
      ["Request Changes", "request_review_changes", "edit"],
      ["Update Spec", "update_spec", "file"],
    ];
  }
  if (reason === "risk_review_needed") {
    return [
      ["Approve", "approve_review", "check"],
      ["Reject", "reject_review", "x"],
      ["Rollback", "rollback_review", "undo"],
      ["Split Task", "split_review_task", "branch"],
      ["Request Changes", "request_review_changes", "edit"],
      ["Update Spec", "update_spec", "file"],
    ];
  }
  return [
    ["Approve", "approve_review", "check"],
    ["Reject", "reject_review", "x"],
    ["Request Changes", "request_review_changes", "edit"],
  ];
}

function reviewDecisionButton(
  label: string,
  action: string,
  icon: string,
  item: SpecDriveIdeQueueItem,
  source: string,
): string {
  if (!item.reviewItemId) return disabledButton(label, "No Review Center item has been recorded for this run.");
  return commandButton(label, "controlled", {
    action,
    entityType: "review_item",
    entityId: item.reviewItemId,
    reason: `${label} ${item.featureId ?? item.executionId ?? "selected run"} from ${source}.`,
    reviewNoteRequired: reviewActionNeedsNote(action) ? "true" : undefined,
  }, { icon });
}

function reviewActionNeedsNote(action: string): boolean {
  return ["approve_review", "request_review_changes", "update_spec", "reject_review", "rollback_review", "split_review_task"].includes(action);
}

function reviewReasonLabel(reason: SpecDriveIdeQueueItem["reviewNeededReason"]): string {
  if (reason === "approval_needed") return "approval_needed";
  if (reason === "clarification_needed") return "clarification_needed";
  if (reason === "risk_review_needed") return "risk_review_needed";
  return "none";
}

function stateFlowNextAction(item: SpecDriveIdeQueueItem): string {
  const status = item.status.toLowerCase();
  if (status === "waiting_input") return "Provide the requested input or cancel the run.";
  if (status === "approval_needed") return "Accept or decline the adapter approval request.";
  if (status === "review_needed") return item.reviewItemId ? "Resolve the ReviewItem decision." : "Open Review Center after refresh creates a ReviewItem.";
  if (status === "paused") return "Resume, cancel, or reprioritize this job.";
  if (status === "blocked" || status === "failed") return item.executionId ? "Retry, skip, or inspect the failure evidence." : "Skip, reprioritize, or reschedule this job.";
  if (status === "cancelled") return "Retry, skip, or reschedule when ready.";
  if (status === "skipped") return "Select the next Feature or retry when ready.";
  return "Continue monitoring the selected job.";
}

function disabledButton(label: string, title: string): string {
  return disabledButtonHtml(label, title);
}

export function renderExecutionWebview(item: SpecDriveIdeExecutionDetail | SpecDriveIdeQueueItem): string {
  const detail = "metadata" in item ? item : undefined;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);padding:16px;line-height:1.45}
    code,pre{font-family:var(--vscode-editor-font-family)}
    pre{background:var(--vscode-textCodeBlock-background);padding:12px;overflow:auto}
  </style></head><body>
    <h1>SpecDrive Execution</h1>
    ${executionFieldsHtml(item)}
    <h2>Thread / Turn</h2>
    <ul><li>Thread: <code>${escapeHtml(item.threadId ?? "none")}</code></li><li>Turn: <code>${escapeHtml(item.turnId ?? "none")}</code></li></ul>
    <h2>Produced Artifacts</h2>
    ${jsonBlock(detail?.producedArtifacts ?? [])}
    <h2>Output Schema</h2>
    ${jsonBlock(detail?.outputSchema ?? null)}
    <h2>Contract Validation</h2>
    ${jsonBlock(detail?.contractValidation ?? detail?.metadata?.contractValidation ?? null)}
    <h2>Approval Requests</h2>
    ${jsonBlock(detail?.approvalRequests ?? [])}
    <h2>Raw Logs</h2>
    ${(detail?.rawLogs ?? []).map((log, index) => `<h3>Log ${index + 1}</h3><p>Stdout</p>${textBlock(log.stdout)}<p>Stderr</p>${textBlock(log.stderr)}`).join("")}
    <h2>Product Console</h2>
    <p><a href="http://127.0.0.1:5173/#runner">Open Runner Console</a></p>
  </body></html>`;
}

function allQueueItems(view: SpecDriveIdeView): SpecDriveIdeQueueItem[] {
  return Object.values(view.queue.groups).flat();
}

export function currentExecutionItem(view: SpecDriveIdeView): SpecDriveIdeQueueItem | undefined {
  const items = allQueueItems(view);
  return items.find((item) => item.status === "running")
    ?? items.find((item) => item.status === "approval_needed")
    ?? items.find((item) => item.status === "queued")
    ?? items[0];
}

export function runningExecutionItem(view: SpecDriveIdeView): SpecDriveIdeQueueItem | undefined {
  return allQueueItems(view).find((item) => item.status === "running");
}

export function executionItemByKey(view: SpecDriveIdeView | undefined, selectedKey: string | undefined): SpecDriveIdeQueueItem | undefined {
  if (!view || !selectedKey) return undefined;
  return allQueueItems(view).find((item) => queueItemKey(item) === selectedKey);
}
