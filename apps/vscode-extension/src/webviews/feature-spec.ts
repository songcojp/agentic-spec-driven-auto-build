import type { QueueAction, SpecDriveIdeDocument, SpecDriveIdeFeatureNode, SpecDriveIdeTokenConsumption, SpecDriveIdeView } from "../types";
import type { WorkbenchLocale } from "./i18n";
import {
  autoRefreshSwitch,
  buttonContent,
  commandButton,
  disabledButtonHtml,
  emptyState,
  escapeAttr,
  escapeHtml,
  renderWorkbenchInputForm,
  renderWorkbenchPage,
  statusClass,
  webviewNonce,
} from "./shared";

export function renderFeatureSpecWebview(
  view: SpecDriveIdeView | undefined,
  selectedFeatureId: string | undefined,
  autoRefreshEnabled = false,
  panelOpenState: Record<string, boolean> = {},
  locale: WorkbenchLocale = "en",
): string {
  const nonce = webviewNonce();
  const features = view?.features ?? [];
  const selected = features.find((feature) => feature.id === selectedFeatureId) ?? preferredFeature(view);
  const groups = groupFeaturePanels(features);
  const projectId = view?.project?.id;
  return renderWorkbenchPage("Feature Spec", nonce, `
    <section class="toolbar">
      <button class="workbench-button button-secondary view-toggle" data-command="toggleFeatureSpecView" data-view-mode="dependency" aria-pressed="false">${buttonContent("Dependency Graph", "branch")}</button>
      ${executionPreferenceControls(view)}
      ${features.length > 0 ? commandButton("Schedule Selected", "scheduleSelectedFeatures", { projectId }) : ""}
      ${selected ? scheduleFeatureButton("Schedule Current", selected, projectId, "Feature Spec Webview") : ""}
      ${commandButton("New Feature", "openWorkbenchForm", { formMode: "newFeature" })}
      ${commandButton("Refresh", "refresh", {})}
      ${autoRefreshSwitch(autoRefreshEnabled)}
      <span id="workbench-status" class="status-text" role="status" aria-live="polite"></span>
      ${renderProjectCostTotal(view)}
    </section>
    ${renderWorkbenchInputForm()}
    <main id="feature-list-panel" class="feature-layout" data-view-panel="list">
      <section class="feature-board">
        ${groups.map((group) => renderFeaturePanel(group, selected?.id, panelOpenState[group.id] ?? group.open)).join("")}
      </section>
      <aside class="panel detail-panel">
        ${selected ? renderFeatureDetail(selected, projectId) : emptyState("No Feature Specs discovered.")}
      </aside>
    </main>
    <section id="dependency-graph-panel" class="panel dependency-panel hidden" data-view-panel="dependency">
      <div class="panel-title"><h2>Dependency Graph</h2><span>${features.length} Feature Specs</span><button class="workbench-button button-secondary dependency-toggle" data-command="toggleDependencyGraphBranches" data-expanded="true">${buttonContent("Collapse All", "branch")}</button></div>
      ${renderDependencyGraph(features)}
    </section>
  `, undefined, locale);
}

function renderProjectCostTotal(view: SpecDriveIdeView | undefined): string {
  const cost = view?.projectCost;
  if (!cost) return "";
  return `<span class="project-cost-total" title="Project cost total from execution history"><span>Project Cost Total</span><strong>${escapeHtml(formatCurrency(cost.totalUsd, cost.currency, 2))}</strong></span>`;
}

type DependencyTreeNode = {
  id: string;
  feature?: SpecDriveIdeFeatureNode;
  missing?: boolean;
};

function renderDependencyGraph(features: SpecDriveIdeFeatureNode[]): string {
  if (features.length === 0) return emptyState("No Feature Specs discovered.");
  const byId = new Map(features.map((feature) => [feature.id, feature]));
  const childIdsByDependency = new Map<string, string[]>();
  const missingDependencyIds = new Set<string>();
  for (const feature of features) {
    for (const dependencyId of feature.dependencies) {
      childIdsByDependency.set(dependencyId, [...(childIdsByDependency.get(dependencyId) ?? []), feature.id]);
      if (!byId.has(dependencyId)) missingDependencyIds.add(dependencyId);
    }
  }
  const roots: DependencyTreeNode[] = [
    ...Array.from(missingDependencyIds).sort().map((id) => ({ id, missing: true })),
    ...features.filter((feature) => feature.dependencies.length === 0).map((feature) => ({ id: feature.id, feature })),
  ];
  const effectiveRoots = roots.length > 0 ? roots : features.map((feature) => ({ id: feature.id, feature }));
  return `<ul class="dependency-tree">${effectiveRoots.map((node) => renderDependencyNode(node, byId, childIdsByDependency, new Set(), 0)).join("")}</ul>`;
}

function renderDependencyNode(
  node: DependencyTreeNode,
  byId: Map<string, SpecDriveIdeFeatureNode>,
  childIdsByDependency: Map<string, string[]>,
  path: Set<string>,
  depth: number,
): string {
  const feature = node.feature ?? byId.get(node.id);
  const children = (childIdsByDependency.get(node.id) ?? [])
    .filter((childId) => !path.has(childId))
    .map((childId) => ({ id: childId, feature: byId.get(childId) }));
  const nextPath = new Set(path);
  nextPath.add(node.id);
  const label = feature
    ? `<button data-command="selectFeature" data-feature-id="${escapeAttr(feature.id)}">${escapeHtml(feature.id)}</button><span data-i18n-skip>${escapeHtml(feature.title)}</span><span class="${statusClass(feature.status)}">${escapeHtml(feature.status)}</span>`
    : `<strong>${escapeHtml(node.id)}</strong><span class="muted">missing dependency</span>`;
  const nodeHtml = `<span class="dependency-node ${feature ? "" : "missing"}">${label}</span>`;
  if (children.length === 0) return `<li><div class="dependency-leaf">${nodeHtml}</div></li>`;
  const open = depth < 2 ? " open" : "";
  return `<li><details class="dependency-branch"${open}><summary>${nodeHtml}</summary><ul>${children.map((child) => renderDependencyNode(child, byId, childIdsByDependency, nextPath, depth + 1)).join("")}</ul></details></li>`;
}

type FeaturePanelGroup = {
  id: "blocked" | "in-process" | "todo" | "ready" | "done";
  title: string;
  statuses: string;
  features: SpecDriveIdeFeatureNode[];
  open: boolean;
};

function renderFeaturePanel(group: FeaturePanelGroup, selectedFeatureId: string | undefined, open: boolean): string {
  return `<details class="feature-panel" data-panel="${escapeAttr(group.id)}" ${open ? "open" : ""}>
    <summary><h2>${escapeHtml(group.title)} <span>${group.features.length}</span></h2><span>${escapeHtml(group.statuses)}</span></summary>
    <div class="feature-panel-items">
      ${group.features.length === 0 ? emptyState("No Feature Specs in this category.") : group.features.map((feature) => renderFeatureCard(feature, feature.id === selectedFeatureId)).join("")}
    </div>
  </details>`;
}

function renderFeatureCard(feature: SpecDriveIdeFeatureNode, current: boolean): string {
  const taskCount = feature.tasks?.length ?? 0;
  const doneTasks = (feature.tasks ?? []).filter((task) => ["done", "completed", "x"].includes(task.status.toLowerCase())).length;
  const progress = taskCount > 0
    ? Math.round((doneTasks / taskCount) * 100)
    : feature.latestExecutionStatus === "completed" ? 100 : feature.latestExecutionStatus === "running" ? 70 : feature.status === "ready" ? 60 : 30;
  return `<article class="feature-card${current ? " current" : ""}" data-feature-card="${escapeAttr(feature.id)}" aria-selected="false" ${current ? "aria-current=\"true\"" : ""}>
    <header><strong>${escapeHtml(feature.id)}</strong><span class="${statusClass(feature.status)}">${escapeHtml(feature.status)}</span></header>
    <div data-i18n-skip>${escapeHtml(feature.title)}</div>
    <div class="metric"><span>Task Progress</span><strong>${progress}%</strong><div class="bar"><span style="width:${progress}%"></span></div></div>
    <div class="metric"><span>Execution State</span><strong>${escapeHtml(featureExecutionLabel(feature))}</strong></div>
    <div class="metric"><span>Tasks</span><strong>${doneTasks}/${taskCount}</strong></div>
    <div class="metric"><span>Next Action</span><strong>${escapeHtml(feature.nextAction ?? "None")}</strong></div>
    <div class="feature-card-actions">
      <label class="feature-select"><input type="checkbox" data-feature-select="${escapeAttr(feature.id)}"> Select</label>
    </div>
  </article>`;
}

function renderFeatureDetail(feature: SpecDriveIdeFeatureNode, projectId?: string): string {
  const actions = featureDetailActions(feature, projectId);
  return `<div class="panel-title selected-title"><div><h2 data-i18n-skip>${escapeHtml(feature.title)}</h2><span>${escapeHtml(feature.id)} · </span><span class="${statusClass(feature.status)}">${escapeHtml(feature.status)}</span></div><div class="title-actions">${actions}</div></div>
    <h3>Feature Spec Description</h3>
    ${renderFeatureDescription(feature)}
    <div class="row"><span>Priority</span><strong>${escapeHtml(feature.priority ?? "-")}</strong></div>
    <div class="row"><span>Latest Run</span><strong>${escapeHtml(feature.latestExecutionId ?? "-")}</strong></div>
    <div class="row"><span>Execution</span><strong>${escapeHtml(featureExecutionLabel(feature))}</strong></div>
    <h3>State Flow</h3>
    ${renderFeatureStateFlow(feature)}
    <h3>Review Item</h3>
    ${renderFeatureReviewDetails(feature)}
    <details class="compact-section"><summary><h3>Latest Execution Cost</h3><span>${feature.tokenConsumption ? "recorded" : "none"}</span></summary><div class="compact-section-body">
      ${renderTokenCost(feature.tokenConsumption)}
    </div></details>
    <details class="compact-section" open><summary><h3>Artifacts</h3><span>${feature.documents.length}</span></summary><div class="compact-section-body">
      ${renderFeatureArtifacts(feature.documents)}
    </div></details>
    <details class="compact-section" open><summary><h3>Tasks</h3><span>${feature.tasks?.length ?? 0}</span></summary><div class="compact-section-body">
      ${renderFeatureTasks(feature)}
    </div></details>
    <details class="compact-section"><summary><h3>Blockers</h3><span>${feature.blockedReasons.length}</span></summary><div class="compact-section-body">
      ${feature.blockedReasons.length === 0 ? emptyState("No blockers.") : feature.blockedReasons.map((reason) => `<div class="issue bad">${escapeHtml(reason)}</div>`).join("")}
    </div></details>
    <details class="compact-section"><summary><h3>Traceability</h3><span>${feature.dependencies.length}</span></summary><div class="compact-section-body">
      <div class="row"><span>Dependencies</span><strong>${escapeHtml(feature.dependencies.join(", ") || "-")}</strong></div>
    </div></details>`;
}

function renderFeatureDescription(feature: SpecDriveIdeFeatureNode): string {
  const descriptionText = feature.description ?? "No Feature Spec description found.";
  const description = feature.description
    ? `<span data-i18n-skip>${escapeHtml(descriptionText)}</span>`
    : `<span>${escapeHtml(descriptionText)}</span>`;
  return `<div class="issue"><strong data-i18n-skip>${escapeHtml(feature.title)}</strong><br>${description}</div>`;
}

function featureDetailActions(feature: SpecDriveIdeFeatureNode, projectId?: string): string {
  if (isDoneFeature(feature)) return featureSpecChangeButton(feature);
  const reviewReason = feature.latestReviewNeededReason;
  const specActions = `${featureSpecChangeButton(feature)}${clarifyFeatureButton(feature)}`;
  const queueActions = featureQueueActionButtons(feature);
  if (isApprovalPendingFeature(feature)) {
    return `${specActions}${disabledButtonHtml("Approval", "Resolve the adapter approval request in Execution Workbench.", "check")}${queueActions}`;
  }
  if (isWaitingInputFeature(feature)) {
    return `${specActions}${markFeatureReadyButton("Ready", feature, projectId, "Feature Detail")}${queueActions}`;
  }
  if (isActiveExecutionFeature(feature)) {
    return queueActions;
  }
  if (isReadyFeature(feature)) {
    return `${scheduleFeatureButton("Schedule", feature, projectId, "Feature Detail")}${specActions}${queueActions}`;
  }

  if (isReviewNeededFeature(feature)) {
    return `${reviewDecisionButtons(feature, reviewReason, "Feature Detail")}${specActions}${queueActions}`;
  }
  if (isBlockedFeature(feature)) {
    const blockedReviewReason = feature.latestReviewNeededReason;
    const reviewAction = blockedReviewReason
      ? reviewDecisionButtons(feature, blockedReviewReason, "Feature Detail")
      : "";
    return `${reviewAction}${specActions}${markFeatureReadyButton("Ready", feature, projectId, "Feature Detail")}${queueActions}`;
  }
  return `${specActions}${markFeatureReadyButton("Ready", feature, projectId, "Feature Detail")}${queueActions}`;
}

function featureExecutionLabel(feature: SpecDriveIdeFeatureNode): string {
  return feature.latestExecutionStatus ?? feature.status ?? "Not Started";
}

function renderFeatureStateFlow(feature: SpecDriveIdeFeatureNode): string {
  const resume = feature.resumeTarget;
  const rows: Array<[string, string]> = [
    ["Current Status", feature.status],
    ["Execution", featureExecutionLabel(feature)],
    ["Reason", feature.stateReason ?? firstFeatureStateReason(feature)],
    ["Review Reason", feature.latestReviewNeededReason ?? "none"],
    ["Review Message", feature.latestReview?.message ?? "none"],
    ["Review Triggers", feature.latestReview?.triggerReasons.join(", ") || "none"],
    ["Recommended Actions", feature.latestReview?.recommendedActions.join(", ") || "none"],
    ["Resume Target", resume ? `${resume.status} via ${resume.source}` : "none"],
    ["Resume Evidence", resume ? [resume.executionId, resume.schedulerJobId, resume.at].filter(Boolean).join(" · ") : "none"],
    ["Next Action", featureStateNextAction(feature)],
  ];
  return `<div class="result-group state-flow feature-state-flow-compact">${rows.map(renderFeatureStateItem).join("")}</div>`;
}

function renderFeatureStateItem([label, value]: [string, string]): string {
  return `<div class="feature-state-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderFeatureStateRow([label, value]: [string, string]): string {
  return `<div class="feature-state-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

function renderFeatureReviewDetails(feature: SpecDriveIdeFeatureNode): string {
  const review = feature.latestReview;
  if (!review) return emptyState("No active ReviewItem for this Feature.");
  const rows: Array<[string, string]> = [
    ["ReviewItem", review.id],
    ["Status", review.status],
    ["Severity", review.severity ?? "none"],
    ["Reason", review.reviewNeededReason ?? "none"],
    ["Message", review.message ?? feature.stateReason ?? "No review message recorded."],
    ["Risk", review.riskExplanation ?? "none"],
    ["Triggers", review.triggerReasons.join(", ") || "none"],
    ["Recommended Actions", review.recommendedActions.join(", ") || "none"],
    ["References", review.referenceRefs.join(", ") || "none"],
  ];
  return `<div class="result-group review-details">${rows.map(renderFeatureStateRow).join("")}</div>`;
}

function firstFeatureStateReason(feature: SpecDriveIdeFeatureNode): string {
  return feature.blockedReasons[0] ?? feature.nextAction ?? "No state reason recorded.";
}

function featureStateNextAction(feature: SpecDriveIdeFeatureNode): string {
  const status = normalizedRawFeatureStatus(feature);
  const executionStatus = normalizedExecutionStatus(feature);
  if (status === "approval needed" || executionStatus === "approval needed") return "Resolve adapter approval in Execution Workbench.";
  if (status === "waiting input" || executionStatus === "waiting input") return "Clarify the requested input or mark the Feature ready after updating the Spec.";
  if (status === "review needed" || status === "need review") return feature.latestReviewItemId ? "Resolve the ReviewItem decision." : "Refresh or open Execution Workbench to find the ReviewItem.";
  if (status === "blocked" || status === "block") return "Clarify, mark ready after correction, or inspect the latest run.";
  if (status === "failed") return "Inspect failure evidence and retry from Execution Workbench.";
  if (status === "cancelled") return "Retry, skip, or reschedule when ready.";
  if (status === "skipped") return "Select the next Feature or retry when ready.";
  if (status === "paused") return "Resume from Execution Workbench.";
  return feature.nextAction ?? "Continue the Feature lifecycle.";
}

function clarifyFeatureButton(feature: SpecDriveIdeFeatureNode): string {
  return commandButton("Clarify", "openWorkbenchForm", { formMode: "clarify", featureId: feature.id });
}

function featureSpecChangeButton(feature: SpecDriveIdeFeatureNode): string {
  return commandButton("Requirement Change", "openWorkbenchForm", { formMode: "featureSpecChange", intent: "spec_evolution", featureId: feature.id });
}

function scheduleFeatureButton(label: string, feature: SpecDriveIdeFeatureNode, projectId: string | undefined, source: string): string {
  return commandButton(label, "controlled", {
    action: "schedule_run",
    entityType: "feature",
    entityId: feature.id,
    projectId,
    featureId: feature.id,
    reason: `Schedule ${feature.id} from ${source}.`,
  });
}

function reviewDecisionButtons(
  feature: SpecDriveIdeFeatureNode,
  reason: SpecDriveIdeFeatureNode["latestReviewNeededReason"],
  source: string,
): string {
  return reviewActionsForReason(reason).map(([label, action, icon]) => reviewFeatureButton(label, action, icon, feature, source)).join("");
}

function reviewActionsForReason(reason: SpecDriveIdeFeatureNode["latestReviewNeededReason"]): Array<[string, string, string]> {
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

function reviewFeatureButton(label: string, action: string, icon: string, feature: SpecDriveIdeFeatureNode, source: string): string {
  if (!feature.latestReviewItemId) {
    return disabledButtonHtml(label, "No Review Center item has been recorded for this Feature.", "check");
  }
  return commandButton(label, "controlled", {
    action,
    entityType: "review_item",
    entityId: feature.latestReviewItemId,
    reason: `${label} ${feature.id} review from ${source}.`,
    reviewNoteRequired: reviewActionNeedsNote(action) ? "true" : undefined,
  }, { icon });
}

function reviewActionNeedsNote(action: string): boolean {
  return ["approve_review", "request_review_changes", "update_spec", "reject_review", "rollback_review", "split_review_task"].includes(action);
}

function markFeatureReadyButton(label: string, feature: SpecDriveIdeFeatureNode, projectId: string | undefined, source: string): string {
  return commandButton(label, "controlled", {
    action: "mark_feature_ready",
    entityType: "feature",
    entityId: feature.id,
    projectId,
    featureId: feature.id,
    reason: `Mark ${feature.id} ready from ${source}.`,
  });
}

function featureQueueActionButtons(feature: SpecDriveIdeFeatureNode): string {
  return [
    featurePauseResumeButton(feature),
    featureQueueActionButton("Retry", feature, "retry", ["failed", "cancelled", "skipped", "blocked"], true),
    featureQueueActionButton("Cancel", feature, "cancel", ["queued", "running", "waiting input", "approval needed", "review needed", "blocked", "paused"], false),
    featureQueueActionButton("Skip", feature, "skip", ["queued", "waiting input", "approval needed", "review needed", "blocked", "failed", "paused"], false),
    featureQueueActionButton("Reprioritize", feature, "reprioritize", ["queued", "blocked", "paused"], false),
  ].join("");
}

function featurePauseResumeButton(feature: SpecDriveIdeFeatureNode): string {
  if (featureStatusTokens(feature).includes("paused")) {
    return featureQueueActionButton("Resume", feature, "resume", ["paused"], false);
  }
  return featureQueueActionButton("Pause", feature, "pause", ["queued", "running"], false);
}

function featureQueueActionButton(
  label: string,
  feature: SpecDriveIdeFeatureNode,
  action: QueueAction,
  enabledStatuses: string[],
  requiresExecution: boolean,
): string {
  const target = featureQueueTarget(feature, requiresExecution);
  if (!target) return disabledButtonHtml(label, `${label} requires a latest Job or Execution Record for this Feature.`);
  const statuses = featureStatusTokens(feature);
  if (!statuses.some((status) => enabledStatuses.includes(status))) {
    return disabledButtonHtml(label, `${label} is not available while ${feature.id} is ${feature.latestExecutionStatus ?? feature.status}.`);
  }
  return commandButton(label, "queue", {
    action,
    entityType: target.entityType,
    entityId: target.entityId,
    reason: `${label} ${feature.id} from Feature Detail.`,
  });
}

function featureQueueTarget(feature: SpecDriveIdeFeatureNode, requiresExecution: boolean): { entityType: "run" | "job"; entityId: string } | undefined {
  if (feature.latestExecutionId) return { entityType: "run", entityId: feature.latestExecutionId };
  if (!requiresExecution && feature.latestSchedulerJobId) return { entityType: "job", entityId: feature.latestSchedulerJobId };
  return undefined;
}

function featureStatusTokens(feature: SpecDriveIdeFeatureNode): string[] {
  return [
    normalizedRawFeatureStatus(feature),
    normalizedExecutionStatus(feature),
  ].filter((status) => status.length > 0);
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
      <select id="job-adapter-id" aria-label="Feature schedule provider adapter">
        ${adapters.map((adapter) => `<option value="${escapeAttr(adapter.id)}" data-run-mode="${adapter.mode}"${adapter.id === activeAdapter ? " selected" : ""}>${escapeHtml(`${adapter.mode.toUpperCase()}: ${adapter.displayName}`)}</option>`).join("")}
      </select>
    </label>`;
}

function renderFeatureTasks(feature: SpecDriveIdeFeatureNode): string {
  const tasks = feature.tasks ?? [];
  const blockers = feature.taskParseBlockedReasons ?? [];
  if (tasks.length === 0) {
    return blockers.length > 0
      ? blockers.map((reason) => `<div class="issue bad">${escapeHtml(reason)}</div>`).join("")
      : emptyState("No tasks parsed.");
  }
  return `<div class="task-chip-row">${tasks.map((task) => `<span class="task-chip"><strong>${escapeHtml(task.id)}</strong><span class="${statusClass(task.status)}">${escapeHtml(task.status)}</span></span>`).join("")}</div>${blockers.map((reason) => `<div class="issue warn">${escapeHtml(reason)}</div>`).join("")}`;
}

function renderFeatureArtifacts(documents: SpecDriveIdeDocument[]): string {
  if (documents.length === 0) return emptyState("No source documents discovered.");
  return `<div class="feature-artifacts">${documents.map((document) => {
    const fileName = document.path.split(/[\\/]/).pop() ?? document.label;
    const state = document.exists ? "Available" : "Missing";
    return `<div class="artifact-row">
      <strong>${escapeHtml(fileName)}</strong>
      <span class="${document.exists ? "ok" : "bad"}">${escapeHtml(state)}</span>
      ${document.exists ? commandButton("Open", "openDocument", { path: document.path }, { icon: "external", variant: "button-open" }) : disabledButtonHtml("Open", "Document is missing.", "external")}
    </div>`;
  }).join("")}</div>`;
}

function renderTokenCost(token: SpecDriveIdeTokenConsumption | undefined): string {
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
  return `<div class="token-mini-grid">${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>`;
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

function formatCurrency(value: number, currency: string, fractionDigits = 6): string {
  const amount = Number.isFinite(value) ? value : 0;
  return `${currency || "USD"} ${amount.toFixed(fractionDigits)}`;
}

export function preferredFeature(view: SpecDriveIdeView | undefined): SpecDriveIdeFeatureNode | undefined {
  return view?.features.find((feature) => feature.status === "in_execution" || feature.latestExecutionStatus === "running")
    ?? view?.features[0];
}

function groupFeaturePanels(features: SpecDriveIdeFeatureNode[]): FeaturePanelGroup[] {
  const blocked: SpecDriveIdeFeatureNode[] = [];
  const inProcess: SpecDriveIdeFeatureNode[] = [];
  const todo: SpecDriveIdeFeatureNode[] = [];
  const ready: SpecDriveIdeFeatureNode[] = [];
  const done: SpecDriveIdeFeatureNode[] = [];
  for (const feature of features) {
    if (isDoneFeature(feature)) {
      done.push(feature);
    } else if (isReadyFeature(feature)) {
      ready.push(feature);
    } else if (isBlockedFeature(feature)) {
      blocked.push(feature);
    } else if (isInProcessFeature(feature)) {
      inProcess.push(feature);
    } else {
      todo.push(feature);
    }
  }
  return [
    { id: "blocked", title: "Blocked", statuses: "Blocked", features: blocked, open: true },
    { id: "in-process", title: "In-Process", statuses: "In process, running", features: inProcess, open: true },
    { id: "todo", title: "Todo", statuses: "Todo, planning, draft", features: todo, open: true },
    { id: "ready", title: "Ready", statuses: "Ready", features: ready, open: true },
    { id: "done", title: "Done", statuses: "Done", features: done, open: false },
  ];
}

function isBlockedFeature(feature: SpecDriveIdeFeatureNode): boolean {
  const status = normalizedFeatureStatus(feature);
  return feature.blockedReasons.length > 0 || status === "blocked" || status === "block";
}

function isInProcessFeature(feature: SpecDriveIdeFeatureNode): boolean {
  const status = normalizedFeatureStatus(feature);
  const executionStatus = (feature.latestExecutionStatus ?? "").toLowerCase().replaceAll("_", " ").replaceAll("-", " ");
  return status === "in process"
    || status === "in progress"
    || status === "in execution"
    || status === "running"
    || executionStatus === "running"
    || executionStatus === "in process"
    || executionStatus === "in progress";
}

function isReadyFeature(feature: SpecDriveIdeFeatureNode): boolean {
  return normalizedFeatureStatus(feature) === "ready";
}

function isDoneFeature(feature: SpecDriveIdeFeatureNode): boolean {
  const status = normalizedFeatureStatus(feature);
  return status === "done" || status === "delivered" || status === "completed";
}

function isActiveExecutionFeature(feature: SpecDriveIdeFeatureNode): boolean {
  const status = normalizedRawFeatureStatus(feature);
  const executionStatus = normalizedExecutionStatus(feature);
  return ["queued", "running"].includes(status) || ["queued", "running"].includes(executionStatus);
}

function isApprovalPendingFeature(feature: SpecDriveIdeFeatureNode): boolean {
  return normalizedRawFeatureStatus(feature) === "approval needed" || normalizedExecutionStatus(feature) === "approval needed";
}

function isWaitingInputFeature(feature: SpecDriveIdeFeatureNode): boolean {
  return normalizedRawFeatureStatus(feature) === "waiting input" || normalizedExecutionStatus(feature) === "waiting input";
}

function isReviewNeededFeature(feature: SpecDriveIdeFeatureNode): boolean {
  const status = normalizedRawFeatureStatus(feature);
  return status === "need review" || status === "review needed" || status === "review";
}

export function isClarificationNeededFeature(feature: SpecDriveIdeFeatureNode): boolean {
  return feature.latestReviewNeededReason === "clarification_needed" || isBlockedFeature(feature);
}

function normalizedFeatureStatus(feature: SpecDriveIdeFeatureNode): string {
  return normalizeStatusText(feature.blockedReasons.length > 0 ? "blocked" : feature.status);
}

function normalizedRawFeatureStatus(feature: SpecDriveIdeFeatureNode): string {
  return normalizeStatusText(feature.status);
}

function normalizedExecutionStatus(feature: SpecDriveIdeFeatureNode): string {
  return normalizeStatusText(feature.latestExecutionStatus ?? "");
}

function normalizeStatusText(status: string): string {
  return status.toLowerCase().replaceAll("_", " ").replaceAll("-", " ");
}

export function preferredFeatureReviewSource(feature: SpecDriveIdeFeatureNode): string {
  return feature.documents.find((document) => document.kind === "feature-requirements" && document.exists)?.path
    ?? feature.documents.find((document) => document.exists)?.path
    ?? "docs/features/README.md";
}
