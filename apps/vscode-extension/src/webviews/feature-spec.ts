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
  type WorkbenchTheme,
} from "./shared";

export function renderFeatureSpecWebview(
  view: SpecDriveIdeView | undefined,
  selectedFeatureId: string | undefined,
  autoRefreshEnabled = false,
  panelOpenState: Record<string, boolean> = {},
  locale: WorkbenchLocale = "en",
  theme: WorkbenchTheme = "vscode",
): string {
  const nonce = webviewNonce();
  const features = view?.features ?? [];
  const selected = features.find((feature) => feature.id === selectedFeatureId) ?? preferredFeature(view);
  const groups = groupFeaturePanels(features);
  const projectId = view?.project?.id;
  return renderWorkbenchPage("Feature Spec", nonce, `
    ${renderFeatureV2Styles()}
    <div class="feature-v2-shell">
      <main class="feature-v2-main">
        ${renderFeatureTopbar(view, groups)}
        <section class="feature-v2-titlebar">
          <div class="feature-v2-title">
            <h1>Feature Spec / Project Home</h1>
            <span>Plan, track, and ship features with traceable execution and review.</span>
          </div>
          <div class="feature-v2-actions">
            <button class="workbench-button button-secondary view-toggle" data-command="toggleFeatureSpecView" data-view-mode="dependency" aria-pressed="false">${buttonContent("Dependency Graph", "branch")}</button>
            ${executionPreferenceControls(view)}
            ${features.length > 0 ? commandButton("Schedule Selected", "scheduleSelectedFeatures", { projectId }) : ""}
            ${selected ? scheduleFeatureButton("Schedule Current", selected, projectId, "Feature Spec Webview") : ""}
            ${commandButton("New Feature", "openWorkbenchForm", { formMode: "newFeature" })}
            ${commandButton("Refresh", "refresh", {})}
            ${autoRefreshSwitch(autoRefreshEnabled)}
            ${renderProjectCostTotal(view)}
          </div>
        </section>
        <section class="feature-v2-content">
          <span id="workbench-status" class="status-text" role="status" aria-live="polite"></span>
          ${renderWorkbenchInputForm()}
          <main id="feature-list-panel" class="feature-layout" data-view-panel="list">
            <section class="feature-board">
              ${renderFeatureGroupedPanels(groups, selected?.id)}
            </section>
            <aside class="panel detail-panel">
              ${selected ? renderFeatureDetail(selected, projectId) : emptyState("No Feature Specs discovered.")}
            </aside>
          </main>
          <section id="dependency-graph-panel" class="panel dependency-panel hidden" data-view-panel="dependency">
            <div class="panel-title"><h2>Dependency Graph</h2><span>${features.length} Feature Specs</span><button class="workbench-button button-secondary dependency-toggle" data-command="toggleDependencyGraphBranches" data-expanded="true">${buttonContent("Collapse All", "branch")}</button></div>
            ${renderDependencyGraph(features)}
          </section>
        </section>
        <footer class="feature-v2-footer">
          <span>Showing ${features.length} of ${features.length} features</span>
          <span><span class="footer-dot bad"></span>Blocked by Dependency</span>
          <span><span class="footer-link-mark"></span>Has Dependencies</span>
          <span>Last updated: live projection</span>
        </footer>
      </main>
    </div>
  `, undefined, locale, theme);
}

function renderFeatureV2Styles(): string {
  return `<style>
    html{overflow:hidden}body{padding:0;background:#071015;overflow:hidden}.workbench-header{display:none}.feature-v2-shell{height:100vh;display:grid;background:linear-gradient(180deg,#081117,#0b1419);color:var(--fg);overflow:hidden}.feature-v2-main{min-width:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;height:100vh;overflow:hidden}.feature-v2-topbar{min-height:62px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(126,231,236,.15);background:rgba(5,12,17,.74)}.feature-v2-metrics{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:12px}.feature-context-card{border-left:1px solid rgba(126,231,236,.22);padding-left:10px;min-width:0}.feature-context-card span{display:block;color:var(--muted);font-size:11px}.feature-context-card strong{display:flex;align-items:center;gap:6px;min-height:24px;font-size:12px;min-width:0;overflow-wrap:anywhere}.feature-v2-top-actions{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:12px}.feature-v2-avatar{display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--border);border-radius:999px;color:var(--fg)}.feature-v2-titlebar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end;padding:12px 14px;border-bottom:1px solid rgba(126,231,236,.12);background:#071116}.feature-v2-title h1{margin:0;font-size:20px}.feature-v2-title span{color:var(--muted);font-size:12px}.feature-v2-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.feature-v2-actions .toolbar{margin:0}.feature-v2-actions .project-cost-total{margin-left:0}.feature-v2-content{min-height:0;overflow:hidden;padding:10px 14px;display:grid;grid-template-rows:auto auto minmax(0,1fr)}.feature-v2-content .workbench-form{margin-bottom:10px}.feature-layout{height:100%;min-height:0;display:grid;grid-template-columns:minmax(560px,.82fr) minmax(520px,1fr);gap:10px;overflow:hidden}.feature-board{height:100%;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;gap:8px;align-items:stretch;min-width:0;min-height:0;overflow:hidden}.feature-panel{display:grid;grid-template-rows:auto minmax(0,1fr);min-height:0;margin:0;background:linear-gradient(180deg,rgba(14,28,35,.96),rgba(8,17,22,.96));border-color:rgba(126,231,236,.20);box-shadow:none}.feature-panel[open]{height:100%;min-height:0}.feature-panel:not([open]){display:block;height:auto;min-height:0}.feature-panel summary{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(11,24,31,.88);padding:8px 9px;cursor:pointer;list-style:none}.feature-panel summary::-webkit-details-marker{display:none}.feature-panel summary::before{content:"+";display:inline-flex;width:14px;color:var(--muted);font-weight:650}.feature-panel[open] summary::before{content:"-"}.feature-panel summary h2{font-size:12px;margin-right:auto}.feature-panel-body{min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable}.feature-panel-body::-webkit-scrollbar{width:10px;height:10px}.feature-panel-body::-webkit-scrollbar-thumb{background:rgba(126,231,236,.32);border-radius:999px}.feature-panel-body::-webkit-scrollbar-track{background:rgba(7,16,22,.85)}.feature-panel-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));align-content:start;gap:8px;padding:8px}.feature-card{position:relative;min-height:136px;padding:8px 8px 8px 11px;background:linear-gradient(180deg,rgba(16,34,43,.96),rgba(9,20,26,.96));border-color:rgba(126,231,236,.16);box-shadow:none;overflow:hidden}.feature-card::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--feature-status-color,var(--muted))}.feature-card[data-status="blocked"]{--feature-status-color:var(--bad)}.feature-card[data-status="in-process"],.feature-card[data-status="running"]{--feature-status-color:var(--info)}.feature-card[data-status="ready"]{--feature-status-color:#a266ff}.feature-card[data-status="done"],.feature-card[data-status="completed"]{--feature-status-color:var(--ok)}.feature-card[data-status="todo"],.feature-card[data-status="draft"]{--feature-status-color:var(--muted)}.feature-card.current{border-color:var(--accent);box-shadow:inset 3px 0 0 var(--accent),0 0 0 1px color-mix(in srgb,var(--accent) 40%,transparent);background:linear-gradient(180deg,rgba(22,55,68,.96),rgba(9,20,26,.96))}.feature-card header{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px}.feature-status-badge{display:inline-flex;align-items:center;gap:5px;min-height:20px;border:1px solid currentColor;border-radius:999px;padding:2px 7px;font-size:10px;line-height:1;white-space:nowrap;background:color-mix(in srgb,currentColor 12%,transparent)}.feature-card-title{display:grid;gap:3px;margin-bottom:7px}.feature-card-title strong{font-size:12px;font-weight:620}.feature-card-title span{color:var(--muted);font-size:11px}.feature-card .metric{font-size:11px;margin-top:4px}.feature-card-meta{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:6px;color:var(--muted);font-size:11px}.feature-card-meta span{min-width:0;overflow-wrap:anywhere}.feature-card-actions{margin-top:6px}.detail-panel{height:100%;min-height:0;position:static;overflow:auto;padding:10px;background:linear-gradient(180deg,rgba(14,28,35,.98),rgba(8,17,22,.98));border-color:rgba(126,231,236,.20);box-shadow:none}.selected-title{position:sticky;top:-10px;z-index:2;display:grid;grid-template-columns:minmax(0,1fr);align-items:start;gap:8px;background:#071116;margin:-10px -10px 10px;padding:9px 10px;border-bottom:1px solid rgba(126,231,236,.18)}.feature-detail-heading{min-width:0}.feature-detail-heading h2{font-size:13px;line-height:1.25;margin:0 0 2px;overflow-wrap:anywhere}.feature-detail-heading span{font-size:11px}.title-actions{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-start;align-items:center;min-width:0;max-width:100%}.title-actions button{min-height:26px;max-width:128px;padding:4px 7px;font-size:11px}.feature-detail-hero{display:grid;gap:6px;margin-bottom:10px}.feature-detail-hero p{margin:0;color:var(--muted);font-size:12px}.feature-detail-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border:1px solid rgba(126,231,236,.18);border-radius:4px;overflow:hidden;margin-bottom:10px}.feature-detail-kpis div{display:grid;gap:2px;padding:6px 8px;border-left:1px solid rgba(126,231,236,.14);font-size:11px}.feature-detail-kpis div:first-child{border-left:0}.feature-detail-kpis span{color:var(--muted)}.feature-state-flow-compact{position:relative;padding:8px 10px;border:1px solid rgba(126,231,236,.18);border-radius:4px;background:#081217;grid-template-columns:repeat(5,minmax(0,1fr))}.feature-state-reason,.feature-state-review{grid-column:1/-1;text-align:left;border-bottom:1px solid rgba(126,231,236,.14);padding-bottom:8px}.feature-state-reason{border-top:0}.feature-state-item{background:transparent;border:0;border-top:2px solid rgba(126,231,236,.24);border-radius:0;text-align:center}.feature-state-item span{font-size:10px}.feature-state-item strong{font-size:11px}.review-details,.result-group{border-color:rgba(126,231,236,.18)}.compact-section{background:transparent;border-color:rgba(126,231,236,.18);margin:8px 0}.compact-section>summary{background:transparent}.artifact-row{background:#081217;border-color:rgba(126,231,236,.15)}.token-cost-line{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:12px}.token-cost-line span{color:var(--muted)}.token-cost-line strong{font-weight:650}.dependency-panel{height:100%;overflow:auto;background:linear-gradient(180deg,rgba(14,28,35,.98),rgba(8,17,22,.98));border-color:rgba(126,231,236,.20);box-shadow:none}.feature-v2-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:30px;padding:5px 14px;border-top:1px solid rgba(126,231,236,.15);background:#071116;color:var(--muted);font-size:12px}.feature-v2-footer span{display:inline-flex;align-items:center;gap:6px;min-width:0}.footer-dot{width:7px;height:7px;border-radius:999px;background:currentColor}.footer-link-mark{width:12px;height:6px;border-bottom:1px solid var(--muted);border-left:1px solid var(--muted);transform:skewX(-22deg)}@media(max-width:1300px){.feature-v2-topbar,.feature-v2-titlebar{grid-template-columns:1fr}.feature-v2-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.feature-v2-actions{justify-content:flex-start}.feature-layout{grid-template-columns:minmax(500px,.8fr) minmax(460px,1fr)}.feature-panel-items{grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}}@media(max-width:980px){.feature-v2-shell,.feature-v2-main{height:100vh;overflow:hidden}.feature-v2-content{overflow:hidden}.feature-layout{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) minmax(260px,38vh);overflow:hidden}.detail-panel{height:100%;overflow:auto}.feature-v2-footer{flex-wrap:wrap;justify-content:flex-start}}@media(max-width:620px){.feature-v2-metrics,.feature-detail-kpis,.feature-state-flow-compact{grid-template-columns:minmax(0,1fr)}.feature-panel-items{grid-template-columns:minmax(0,1fr)}.feature-v2-top-actions{display:none}}
  </style>`;
}

function renderFeatureTopbar(view: SpecDriveIdeView | undefined, groups: FeaturePanelGroup[]): string {
  const running = groups.find((group) => group.id === "in-process")?.features.length ?? 0;
  const total = groups.reduce((sum, group) => sum + group.features.length, 0);
  const blocked = groups.find((group) => group.id === "blocked")?.features.length ?? 0;
  const health = view?.projectInitialization?.blocked || blocked > 0 ? "Needs Review" : "Healthy";
  const healthClass = view?.projectInitialization?.blocked || blocked > 0 ? "warn" : "ok";
  return `<header class="feature-v2-topbar">
    <div class="feature-v2-metrics">
      ${featureContextCard("Project", view?.project?.name ?? view?.project?.id ?? "No project")}
      ${featureContextCard("Branch", "workspace")}
      ${featureContextCard("Health", health, healthClass)}
      ${featureContextCard("Project Cost Total", projectCostLabel(view))}
      ${featureContextCard("Runner Status", `${running} / ${total} Active`)}
    </div>
    <div class="feature-v2-top-actions"><span>Docs</span><span>Help</span><span class="feature-v2-avatar">SD</span></div>
  </header>`;
}

function featureContextCard(label: string, value: string, className = ""): string {
  return `<div class="feature-context-card"><span>${escapeHtml(label)}</span><strong class="${escapeAttr(className)}">${escapeHtml(value)}</strong></div>`;
}

function projectCostLabel(view: SpecDriveIdeView | undefined): string {
  const cost = view?.projectCost;
  return cost ? formatCurrency(cost.totalUsd, cost.currency, 2) : "USD 0.00";
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

function renderFeatureGroupedPanels(groups: FeaturePanelGroup[], selectedFeatureId: string | undefined): string {
  return groups.map((group) =>
    renderFeatureGroupPanel(group.title, group.statuses, group.features, selectedFeatureId, group.open)
  ).join("");
}

function renderFeatureGroupPanel(
  title: string,
  subtitle: string,
  features: SpecDriveIdeFeatureNode[],
  selectedFeatureId: string | undefined,
  open: boolean,
): string {
  return `<details class="feature-panel feature-group-panel" ${open ? "open" : ""}>
    <summary><h2>${escapeHtml(title)} <span>${features.length}</span></h2><span>${escapeHtml(subtitle)}</span></summary>
    <div class="feature-panel-body">
      <div class="feature-panel-items">
        ${features.length === 0 ? emptyState("No Feature Specs in this group.") : features.map((feature) => renderFeatureCard(feature, feature.id === selectedFeatureId)).join("")}
      </div>
    </div>
  </details>`;
}

function renderFeatureCard(feature: SpecDriveIdeFeatureNode, current: boolean): string {
  const taskCount = feature.tasks?.length ?? 0;
  const doneTasks = (feature.tasks ?? []).filter((task) => ["done", "completed", "x"].includes(task.status.toLowerCase())).length;
  const progress = taskCount > 0
    ? Math.round((doneTasks / taskCount) * 100)
    : feature.latestExecutionStatus === "completed" ? 100 : feature.latestExecutionStatus === "running" ? 70 : feature.status === "ready" ? 60 : 30;
  const cost = feature.tokenConsumption ? formatCurrency(feature.tokenConsumption.costUsd, feature.tokenConsumption.currency, 2) : formatCurrency(0, "USD", 2);
  const statusKey = featureStatusKey(feature);
  return `<article class="feature-card${current ? " current" : ""}" data-feature-card="${escapeAttr(feature.id)}" data-status="${escapeAttr(statusKey)}" aria-selected="false" ${current ? "aria-current=\"true\"" : ""}>
    <header><strong>${escapeHtml(feature.id)}</strong><span class="feature-status-badge ${statusClass(feature.status)}">${escapeHtml(feature.status)}</span></header>
    <div class="feature-card-title">
      <strong data-i18n-skip>${escapeHtml(feature.title)}</strong>
      <span data-i18n-skip>${escapeHtml(feature.description ?? feature.nextAction ?? "No Feature Spec description found.")}</span>
    </div>
    <div class="metric"><span>Task Progress</span><strong>${progress}%</strong><div class="bar"><span style="width:${progress}%"></span></div></div>
    <div class="feature-card-meta">
      <span class="${statusClass(featureExecutionLabel(feature))}">${escapeHtml(featureExecutionLabel(feature))}</span>
      <span>${doneTasks}/${taskCount}</span>
      <span>${escapeHtml(cost)}</span>
    </div>
    <div class="feature-card-actions">
      <label class="feature-select"><input type="checkbox" data-feature-select="${escapeAttr(feature.id)}"> Select</label>
    </div>
  </article>`;
}

function renderFeatureDetail(feature: SpecDriveIdeFeatureNode, projectId?: string): string {
  const actions = featureDetailActions(feature, projectId);
  return `<div class="panel-title selected-title"><div class="feature-detail-heading"><h2 data-i18n-skip>${escapeHtml(feature.title)}</h2><span>${escapeHtml(feature.id)} · </span><span class="${statusClass(feature.status)}">${escapeHtml(feature.status)}</span></div><div class="title-actions">${actions}</div></div>
    <section class="feature-detail-hero">
      <h3>Feature Spec Description</h3>
      ${renderFeatureDescription(feature)}
    </section>
    <div class="feature-detail-kpis">
      <div><span>Priority</span><strong>${escapeHtml(feature.priority ?? "-")}</strong></div>
      <div><span>Latest Run</span><strong>${escapeHtml(feature.latestExecutionId ?? "-")}</strong></div>
      <div><span>Execution</span><strong>${escapeHtml(featureExecutionLabel(feature))}</strong></div>
    </div>
    <h3>State Flow</h3>
    ${renderFeatureStateFlow(feature)}
    <h3>Review Item</h3>
    ${renderFeatureReviewDetails(feature)}
    <details class="compact-section" open><summary><h3>Latest Execution Cost</h3><span>${feature.tokenConsumption ? "recorded" : "none"}</span></summary><div class="compact-section-body">
      ${renderTokenCost(feature.tokenConsumption)}
    </div></details>
    <details class="compact-section" open><summary><h3>Quality Evidence</h3><span>${feature.qualityEvidence ? "recorded" : "none"}</span></summary><div class="compact-section-body">
      ${renderQualityEvidence(feature)}
    </div></details>
    <details class="compact-section" open><summary><h3>Artifacts</h3><span>${feature.documents.length}</span></summary><div class="compact-section-body">
      ${renderFeatureArtifacts(feature.documents)}
    </div></details>
    <details class="compact-section" open><summary><h3>Tasks</h3><span>${feature.tasks?.length ?? 0}</span></summary><div class="compact-section-body">
      ${renderFeatureTasks(feature)}
    </div></details>
    <details class="compact-section" open><summary><h3>Blockers</h3><span>${feature.blockedReasons.length}</span></summary><div class="compact-section-body">
      ${feature.blockedReasons.length === 0 ? emptyState("No blockers.") : feature.blockedReasons.map((reason) => `<div class="issue bad">${escapeHtml(reason)}</div>`).join("")}
    </div></details>
    <details class="compact-section" open><summary><h3>Traceability</h3><span>${feature.dependencies.length}</span></summary><div class="compact-section-body">
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

function featureStatusKey(feature: SpecDriveIdeFeatureNode): string {
  const status = normalizedFeatureStatus(feature);
  const execution = (feature.latestExecutionStatus ?? "").toLowerCase();
  if (feature.blockedReasons.length > 0 || status === "blocked" || status === "block") return "blocked";
  if (execution === "running" || status === "running" || status === "in-process" || status === "in process") return "running";
  if (isDoneFeature(feature)) return "done";
  if (isReadyFeature(feature)) return "ready";
  if (status === "draft" || status === "todo" || status === "planning") return "todo";
  return status || "todo";
}

function renderFeatureStateFlow(feature: SpecDriveIdeFeatureNode): string {
  const resume = feature.resumeTarget;
  const rows: Array<[string, string]> = [
    ["Current", feature.status],
    ["Execution", featureExecutionLabel(feature)],
    ["Reason", feature.stateReason ?? firstFeatureStateReason(feature)],
    ["Review Reason", feature.latestReviewNeededReason ?? "none"],
    ["Review Message", feature.latestReview?.message ?? "none"],
    ["Review Triggers", feature.latestReview?.triggerReasons.join(", ") || "none"],
    ["Recommended Actions", feature.latestReview?.recommendedActions.join(", ") || "none"],
    ["Resume Target", resume ? `${resume.status} via ${resume.source}` : "none"],
    ["Resume Evidence", resume ? [resume.executionId, resume.schedulerJobId, resume.at].filter(Boolean).join(" · ") : "none"],
  ];
  const nextStep = renderFeatureStateRow(["Next Step", featureStateNextAction(feature)]);
  return `<div class="result-group state-flow feature-state-flow-compact">${rows.map(renderFeatureStateItem).join("")}${nextStep}</div>`;
}

function renderFeatureStateItem([label, value]: [string, string]): string {
  const layoutClass = label === "Reason" ? " feature-state-reason" : label === "Review Reason" ? " feature-state-review" : "";
  return `<div class="feature-state-item${layoutClass}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderFeatureStateRow([label, value]: [string, string]): string {
  return `<div class="feature-state-row" style="grid-column:1/-1"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
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

function renderQualityEvidence(feature: SpecDriveIdeFeatureNode): string {
  const evidence = feature.qualityEvidence;
  if (!evidence) return emptyState("No quality evidence recorded for the latest run.");
  const rows: Array<[string, unknown]> = [
    ["Requirement Coverage", evidence.requirementCoverage],
    ["Acceptance Evidence", evidence.acceptanceEvidence],
    ["Journey Evidence", evidence.journeyEvidence],
    ["Runtime Evidence", evidence.runtimeEvidence],
    ["Delivery Fidelity", evidence.deliveryFidelity],
    ["Git Delivery", evidence.gitDelivery],
    ["Workpad", evidence.workpadRefs],
  ];
  return `<div class="result-group quality-evidence">${rows.map(renderQualityEvidenceRow).join("")}</div>`;
}

function renderQualityEvidenceRow([label, value]: [string, unknown]): string {
  const display = renderQualityEvidenceValue(value);
  return `<div class="result-entry result-entry-wide"><span>${escapeHtml(label)}</span><div class="result-content" data-i18n-skip>${display}</div></div>`;
}

function renderQualityEvidenceValue(value: unknown): string {
  if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return `<span class="muted">not recorded</span>`;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return `<code>${escapeHtml(String(value))}</code>`;
  return `<pre data-i18n-skip>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
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
  return `<div class="token-cost-line">
    <span>Model <strong>${escapeHtml(token.model ?? "unknown")}</strong></span>
    <span>Input <strong>${escapeHtml(formatInteger(token.inputTokens))}</strong></span>
    <span>Cached <strong>${escapeHtml(formatInteger(token.cachedInputTokens))}</strong></span>
    <span>Output <strong>${escapeHtml(formatInteger(token.outputTokens))}</strong></span>
    <span>Reasoning <strong>${escapeHtml(formatInteger(token.reasoningOutputTokens))}</strong></span>
    <span>Total <strong>${escapeHtml(formatInteger(token.totalTokens))}</strong></span>
    <span>Cost <strong>${escapeHtml(formatCurrency(token.costUsd, token.currency))}</strong></span>
    <span>Pricing <strong>${escapeHtml(token.pricingStatus)}</strong></span>
    <span>Source <strong>${escapeHtml(pricingSourceLabel(token.pricing))}</strong></span>
  </div>`;
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
    { id: "in-process", title: "In-Process", statuses: "In process, running", features: inProcess, open: true },
    { id: "blocked", title: "Blocked", statuses: "Blocked", features: blocked, open: true },
    { id: "todo", title: "Todo", statuses: "Todo, planning, draft", features: todo, open: true },
    { id: "ready", title: "Ready", statuses: "Ready", features: ready, open: true },
    { id: "done", title: "Done", statuses: "Done", features: sortDoneFeatures(done), open: true },
  ];
}

function sortDoneFeatures(features: SpecDriveIdeFeatureNode[]): SpecDriveIdeFeatureNode[] {
  return [...features].sort((a, b) => featureDoneSortTime(b) - featureDoneSortTime(a) || a.id.localeCompare(b.id));
}

function featureDoneSortTime(feature: SpecDriveIdeFeatureNode): number {
  const value = feature.latestExecutionCompletedAt ?? feature.latestExecutionCreatedAt ?? feature.tokenConsumption?.recordedAt;
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : 0;
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
