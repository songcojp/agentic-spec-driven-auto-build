import type { SpecDriveIdeDiagnostic, SpecDriveIdeDocument, SpecDriveIdeView, UiConceptImage } from "../types";
import { workbenchTranslationsForLocale, type WorkbenchLocale } from "./i18n";
import {
  autoRefreshSwitch,
  buttonIcon,
  commandButton,
  emptyState,
  escapeAttr,
  escapeHtml,
  renderWorkbenchInputForm,
  renderWorkbenchPage,
  statusClass,
  webviewNonce,
  type WorkbenchTheme,
} from "./shared";

export function renderSpecWorkspaceWebview(
  view: SpecDriveIdeView | undefined,
  uiConceptImages: UiConceptImage[] = [],
  autoRefreshEnabled = false,
  cspSource?: string,
  locale: WorkbenchLocale = "en",
  theme: WorkbenchTheme = "vscode",
): string {
  const nonce = webviewNonce();
  const projectId = view?.project?.id ?? "workspace";
  const stages = specLifecycleStages(view);
  const active = stages.find((stage) => stage.active) ?? stages[0];
  const stats = workspaceStats(view, uiConceptImages);
  const t = specWorkspaceTranslator(locale);
  return renderWorkbenchPage("Spec Workspace", nonce, `
    <style>
      body{padding:0;background:#071015;overflow:hidden}.workbench-header{display:none}.spec-v2-shell{height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 360px;background:linear-gradient(180deg,#081117,#0b1419);color:var(--fg);overflow:hidden}.spec-v2-main{min-width:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;height:100vh;overflow:hidden}.spec-v2-topbar{min-height:64px;display:grid;grid-template-columns:minmax(330px,.72fr) minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 18px;border-bottom:1px solid rgba(126,231,236,.15);background:rgba(5,12,17,.74)}.spec-select-card{display:grid;gap:3px;min-width:0;border:1px solid rgba(126,231,236,.15);border-radius:5px;background:linear-gradient(180deg,rgba(28,41,52,.92),rgba(17,28,37,.94));padding:8px 10px}.spec-select-card span{font-size:11px;color:var(--muted)}.spec-select-card strong{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;font-size:13px}.spec-v2-health{display:flex;align-items:center;justify-content:flex-end;gap:24px;color:var(--muted);font-size:12px}.spec-v2-health-block{border-left:1px solid rgba(126,231,236,.18);padding-left:20px}.spec-v2-health-block strong{display:block;color:var(--fg);font-size:14px}.spec-v2-health-block .ok{color:var(--ok)}.spec-v2-avatar{display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--border);border-radius:999px;color:var(--fg);background:rgba(255,255,255,.08)}.spec-v2-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 18px;border-bottom:1px solid rgba(126,231,236,.12);background:#071116}.spec-v2-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.spec-v2-actions .workbench-button:first-child{background:linear-gradient(180deg,#22c8e8,#0d86a7);border-color:#4dd8f0;color:#021118}.spec-v2-refresh{display:flex;align-items:center;justify-content:flex-end;gap:10px;color:var(--muted);font-size:12px}.spec-v2-content{min-height:0;overflow:auto;padding:0 18px 12px}.spec-v2-content .workbench-form{margin:10px 0}.spec-stage-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0 12px}.spec-stage{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;min-height:74px;padding:12px 14px;border:1px solid rgba(126,231,236,.16);border-radius:5px;background:linear-gradient(180deg,rgba(17,31,40,.96),rgba(9,20,27,.96));box-shadow:none;text-align:left}.spec-stage::after{content:">";color:var(--muted);font-size:18px}.spec-stage:last-child::after{content:""}.spec-stage .button-icon{width:24px;height:24px;color:#d9f6ff}.spec-stage-title{display:block;font-size:13px;font-weight:650}.spec-stage-meta{display:flex;gap:12px;align-items:baseline;color:var(--muted);font-size:12px}.spec-stage-count{display:block;font-size:18px;color:var(--fg);line-height:1.1}.spec-stage.active,.spec-stage[aria-pressed="true"]{border-color:#22d3ee;background:linear-gradient(180deg,rgba(20,56,68,.94),rgba(9,24,31,.96));box-shadow:inset 0 0 0 1px rgba(34,211,238,.18)}.spec-stage.active .spec-stage-meta,.spec-stage[aria-pressed="true"] .spec-stage-meta{color:#67e8f9}.spec-workspace-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.spec-card{min-width:0;border:1px solid rgba(126,231,236,.16);border-radius:5px;background:linear-gradient(180deg,rgba(14,28,35,.96),rgba(8,17,22,.96));overflow:hidden}.spec-card-wide{grid-column:span 1}.spec-card-title{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:40px;padding:9px 10px;border-bottom:1px solid rgba(126,231,236,.12);background:rgba(255,255,255,.025)}.spec-card-title h2{font-size:14px}.spec-card-title span{color:var(--muted);font-size:12px}.spec-table{width:100%;border-collapse:collapse;font-size:12px}.spec-table th,.spec-table td{padding:8px 10px;border-top:1px solid rgba(126,231,236,.10);text-align:left;vertical-align:middle;overflow-wrap:anywhere}.spec-table th{color:var(--muted);font-weight:650;background:rgba(255,255,255,.025)}.spec-table button{min-height:0;padding:0;border:0;background:transparent;box-shadow:none;color:var(--fg);text-align:left}.spec-table button:hover{color:#67e8f9;background:transparent;box-shadow:none}.spec-tag{display:inline-flex;align-items:center;min-height:21px;border:1px solid currentColor;border-radius:4px;padding:2px 7px;font-size:11px;line-height:1;white-space:nowrap;background:color-mix(in srgb,currentColor 12%,transparent)}.spec-card-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-top:1px solid rgba(126,231,236,.10);color:var(--muted);font-size:12px}.spec-card-footer button{padding:3px 8px;font-size:12px}.spec-lower-grid{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1fr) minmax(310px,1fr);gap:12px;margin-top:12px}.trace-card-body{display:grid;place-items:center;gap:10px;padding:16px 10px}.trace-donut{display:grid;place-items:center;width:118px;height:118px;border-radius:999px;background:conic-gradient(var(--ok) 0 58%,var(--warn) 58% 83%,var(--bad) 83% 100%)}.trace-donut::before{content:"";position:absolute;width:74px;height:74px;border-radius:999px;background:#0d171d}.trace-donut strong{position:relative;font-size:24px}.trace-legend{width:100%;display:grid;gap:0;padding:0 10px 10px}.trace-legend .row{grid-template-columns:minmax(0,1fr) repeat(3,minmax(34px,max-content));padding:7px 0}.diagnostic-tabs{display:flex;gap:8px;flex-wrap:wrap;padding:8px 10px;border-bottom:1px solid rgba(126,231,236,.10)}.diagnostic-tabs .spec-tag{color:var(--warn)}.diagnostics-table td,.diagnostics-table th{font-size:11px}.spec-v2-content .concept-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:10px}.spec-v2-content .concept-card{border-radius:4px;border-color:rgba(126,231,236,.18);background:#101b22}.spec-v2-content .concept-card img{height:91px;object-fit:cover}.spec-v2-content .concept-card span{text-align:center;padding:5px;color:var(--muted)}.spec-v2-inspector{min-width:0;height:100vh;overflow:auto;border-left:1px solid rgba(126,231,236,.15);background:rgba(7,16,22,.86);padding:10px 12px}.spec-inspector-head{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:36px;border-bottom:1px solid rgba(126,231,236,.12);margin-bottom:14px}.spec-inspector-head h2{font-size:13px}.spec-selected-title{display:grid;gap:6px;margin-bottom:14px}.spec-selected-title strong{font-size:22px}.spec-selected-title p{margin:0;color:var(--fg);font-size:13px}.spec-inspector-section{border:1px solid rgba(126,231,236,.12);border-radius:5px;background:rgba(255,255,255,.025);margin-bottom:10px;overflow:hidden}.spec-inspector-section summary{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;cursor:pointer;list-style:none;background:rgba(255,255,255,.035)}.spec-inspector-section summary::-webkit-details-marker{display:none}.spec-inspector-section-body{padding:8px 10px}.spec-inspector-section .toolbar{margin:0}.spec-v2-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:30px;padding:5px 18px;border-top:1px solid rgba(126,231,236,.15);background:#071116;color:var(--muted);font-size:12px}.spec-v2-footer div{display:flex;gap:28px;align-items:center;min-width:0}.spec-v2-dot{width:8px;height:8px;border-radius:999px;background:var(--ok);box-shadow:0 0 8px var(--ok)}.spec-stage-panel{height:auto;min-height:0;padding:0;border:0;background:transparent;box-shadow:none}.spec-panel-inner{display:block}.spec-panel-heading{display:none}.spec-detail-grid{display:block}.spec-detail-column{border:0;background:transparent;padding:0}.spec-actions-bar{display:flex;gap:8px;flex-wrap:wrap}.spec-document-list{display:grid}.spec-step-row,.spec-document-row{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(0,max-content);gap:8px;align-items:center;min-height:28px;border-top:1px solid rgba(126,231,236,.10);font-size:12px}.spec-step-index{display:grid;place-items:center;width:18px;height:18px;border:1px solid currentColor;border-radius:4px;color:var(--ok);font-size:10px}.spec-diagnostics-list{padding:8px}@media(max-width:1280px){.spec-v2-shell{grid-template-columns:minmax(0,1fr)}.spec-v2-inspector{display:none}.spec-v2-topbar{grid-template-columns:repeat(2,minmax(0,1fr)) auto}.spec-lower-grid{grid-template-columns:1fr 1fr}.spec-lower-grid .spec-card:last-child{grid-column:1/-1}}@media(max-width:900px){body{overflow:auto}.spec-v2-shell{height:auto;min-height:100vh;display:block}.spec-v2-main{height:auto;min-height:100vh}.spec-v2-topbar,.spec-v2-toolbar,.spec-stage-strip,.spec-workspace-grid,.spec-lower-grid{grid-template-columns:1fr}.spec-v2-content{overflow:visible}.spec-v2-health{justify-content:flex-start}.spec-v2-footer{display:none}}
      .spec-feature-card{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;min-height:0}.spec-card-scroll{min-height:0;max-height:260px;overflow:auto;scrollbar-gutter:stable}.spec-card-scroll .spec-table{min-width:520px}
    </style>
    <div class="spec-v2-shell">
      <section class="spec-v2-main">
        <header class="spec-v2-topbar">
          <div class="spec-select-card"><span>${escapeHtml(t("Project"))}</span><strong>${escapeHtml(view?.project?.name ?? view?.project?.id ?? t("No project"))}${buttonIcon("select")}</strong></div>
          <div class="spec-select-card"><span>${escapeHtml(t("Branch"))}</span><strong>${buttonIcon("branch")}main${buttonIcon("select")}</strong></div>
          <div class="spec-v2-health">
            <div class="spec-v2-health-block"><span>${escapeHtml(t("System Health"))}</span><strong class="${escapeAttr(stats.healthClass)}">${escapeHtml(t(stats.healthLabel))}</strong></div>
            <div class="spec-v2-health-block"><span>${escapeHtml(t("Cost (MTD)"))}</span><strong>${escapeHtml(stats.costLabel)}</strong></div>
            <span class="spec-v2-avatar">AB</span>
          </div>
        </header>
        <section class="spec-v2-toolbar">
          <div class="spec-v2-actions">
            ${commandButton("New Requirement", "openWorkbenchForm", { formMode: "newRequirement", intent: "requirement_intake" })}
            ${commandButton("Requirement Change", "openWorkbenchForm", { formMode: "specChange", intent: "spec_evolution" })}
            ${commandButton("Clarification", "openWorkbenchForm", { formMode: "specClarification", intent: "clarification" })}
            ${commandButton("Refresh", "refresh", {})}
          </div>
          <div class="spec-v2-refresh">
            <span>${escapeHtml(t("Auto Refresh"))}</span>
            ${autoRefreshSwitch(autoRefreshEnabled)}
          </div>
        </section>
        <section class="spec-v2-content">
          <span id="workbench-status" class="status-text" role="status" aria-live="polite">${escapeHtml(`${t(active.label)} · ${t(active.status)}`)}</span>
          ${renderWorkbenchInputForm()}
          <section class="spec-stage-strip">
            ${stages.map((stage) => `
              <button class="spec-stage stage ${stage.active ? "active" : ""}" data-command="selectSpecStage" data-stage-id="${escapeAttr(stage.id)}" aria-pressed="${stage.active ? "true" : "false"}">
                ${buttonIcon(stageIcon(stage.id))}
                <span><span class="spec-stage-title">${escapeHtml(t(stage.label.replace("Project Initialization", "Intake")))}</span><span class="spec-stage-count">${escapeHtml(stage.index === "1" ? String(stats.documentCount) : stage.index === "2" ? String(stats.documentCount) : String(stats.featureCount))}</span><span class="spec-stage-meta">${escapeHtml(t(stage.status))}</span></span>
              </button>
            `).join("")}
            <button class="spec-stage stage" data-command="showDiagnostics" aria-pressed="false">
              ${buttonIcon("warning")}
              <span><span class="spec-stage-title">${escapeHtml(t("Diagnostics & Blockers"))}</span><span class="spec-stage-count">${view?.diagnostics.length ?? 0}</span><span class="spec-stage-meta">${escapeHtml(t("Open"))}</span></span>
            </button>
          </section>
          <main>
            <section class="spec-workspace-grid">
              ${renderSourceDocumentsCard(view, t)}
              ${renderRequirementQueueCard(view, t)}
            </section>
            <section class="spec-lower-grid">
              ${renderTraceabilityCard(view, t)}
              ${renderDiagnosticsCard(view, t)}
              ${renderConceptCard(uiConceptImages, t)}
            </section>
          </main>
        </section>
        <footer class="spec-v2-footer"><span>${escapeHtml(t("Last Refreshed"))}: ${escapeHtml(new Date().toLocaleString(locale, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }))}</span><div><span class="spec-v2-dot"></span><span>${escapeHtml(t("Auto Refresh"))}: ${escapeHtml(autoRefreshEnabled ? t("ON") : t("OFF"))} (60s)</span><span>${escapeHtml(t("Active Items"))}: ${stats.documentCount + stats.featureCount}</span><span>${escapeHtml(t("Blocked"))}: ${view?.diagnostics.length ?? 0}</span><span>${escapeHtml(t("Ready"))}: ${stats.featureCount}</span></div></footer>
      </section>
      <aside class="spec-v2-inspector">
        ${renderSelectedInspector(stages, view, projectId, active, t)}
      </aside>
    </div>
  `, cspSource, locale, theme);
}

type SpecLifecycleStage = {
  id: "project-init" | "requirement-intake" | "feature-split";
  index: string;
  label: string;
  status: string;
  active: boolean;
  description: string;
  documentKinds: string[];
  steps: Array<{ label: string; status: string }>;
  actions: Array<{ label: string; action: string; reason: string }>;
};

function stageIcon(stageId: SpecLifecycleStage["id"]): string {
  if (stageId === "project-init") return "settings";
  if (stageId === "requirement-intake") return "message";
  return "branch";
}

function workspaceStats(view: SpecDriveIdeView | undefined, uiConceptImages: UiConceptImage[]): {
  workspaceLabel: string;
  healthLabel: string;
  healthClass: string;
  healthIcon: string;
  documentCount: number;
  featureCount: number;
  costLabel: string;
  conceptCount: number;
} {
  const blocked = view?.projectInitialization?.blocked || (view?.diagnostics.length ?? 0) > 0;
  const ready = view?.projectInitialization?.ready ?? Boolean(view?.recognized);
  const cost = view?.projectCost;
  return {
    workspaceLabel: view?.workspaceRoot ? "Resolved" : "Missing",
    healthLabel: blocked ? "Blocked" : ready ? "Healthy" : "Pending",
    healthClass: blocked ? "bad" : ready ? "ok" : "warn",
    healthIcon: blocked ? "warning" : ready ? "check-circle" : "dot",
    documentCount: view?.documents.filter((document) => document.exists).length ?? 0,
    featureCount: view?.features.length ?? 0,
    costLabel: `${cost?.currency || "USD"} ${Number.isFinite(cost?.totalUsd) ? (cost?.totalUsd ?? 0).toFixed(2) : "0.00"}`,
    conceptCount: uiConceptImages.length,
  };
}

type SpecWorkspaceTranslator = (source: string) => string;

function specWorkspaceTranslator(locale: WorkbenchLocale): SpecWorkspaceTranslator {
  const translations = locale === "en" ? {} : workbenchTranslationsForLocale(locale);
  return (source: string): string => translations[source] ?? source;
}

function renderCount(count: number, noun: string, t: SpecWorkspaceTranslator): string {
  return `${count} ${t(noun)}`;
}

function renderSourceDocumentsCard(view: SpecDriveIdeView | undefined, t: SpecWorkspaceTranslator): string {
  const documents = (view?.documents ?? []).slice(0, 7);
  return `<section class="spec-card">
    <div class="spec-card-title"><h2>${escapeHtml(t("Source Documents"))}</h2><span>${escapeHtml(renderCount(documents.length, "items", t))}</span></div>
    ${documents.length === 0 ? emptyState(t("No source documents discovered.")) : `<table class="spec-table">
      <thead><tr><th>${escapeHtml(t("Type"))}</th><th>${escapeHtml(t("Document"))}</th><th>${escapeHtml(t("Status"))}</th><th>${escapeHtml(t("Owner"))}</th></tr></thead>
      <tbody>${documents.map((document) => `<tr>
        <td><span class="spec-tag ${document.exists ? "info" : "warn"}">${escapeHtml(document.kind.toUpperCase())}</span></td>
        <td><button data-command="openDocument" data-path="${escapeAttr(document.path)}">${escapeHtml(document.label)}</button></td>
        <td><span class="spec-tag ${document.exists ? "ok" : "warn"}">${escapeHtml(document.exists ? t("Approved") : t("Missing"))}</span></td>
        <td data-i18n-skip>${escapeHtml(ownerForDocument(document.kind))}</td>
      </tr>`).join("")}</tbody>
    </table>`}
    <div class="spec-card-footer"><span>${escapeHtml(renderCount(documents.length, "items", t))}</span><button data-command="selectSpecStage" data-stage-id="requirement-intake">${escapeHtml(t("View all documents"))}</button></div>
  </section>`;
}

function renderRequirementQueueCard(view: SpecDriveIdeView | undefined, t: SpecWorkspaceTranslator): string {
  const features = (view?.features ?? []).slice(0, 7);
  const statusCounts = countBy(features.map((feature) => feature.status));
  return `<section class="spec-card spec-feature-card">
    <div class="spec-card-title"><h2>${escapeHtml(t("Requirement / Change Queue"))}</h2><span>${escapeHtml(renderCount(features.length, "items", t))}</span></div>
    <div class="diagnostic-tabs">
      <span class="spec-tag info">${escapeHtml(t("All"))} ${features.length}</span>
      <span class="spec-tag ok">${escapeHtml(t("Ready"))} ${statusCounts.ready ?? 0}</span>
      <span class="spec-tag info">${escapeHtml(t("In Progress"))} ${statusCounts["in-progress"] ?? statusCounts.running ?? 0}</span>
      <span class="spec-tag bad">${escapeHtml(t("Blocked"))} ${statusCounts.blocked ?? 0}</span>
    </div>
    <div class="spec-card-scroll">${features.length === 0 ? emptyState(t("No Feature Specs discovered.")) : `<table class="spec-table">
      <thead><tr><th>ID</th><th>${escapeHtml(t("Title"))}</th><th>${escapeHtml(t("Status"))}</th><th>${escapeHtml(t("Priority"))}</th></tr></thead>
      <tbody>${features.map((feature) => `<tr>
        <td data-i18n-skip>${escapeHtml(feature.id)}</td>
        <td data-i18n-skip>${escapeHtml(feature.title)}</td>
        <td><span class="spec-tag ${statusClass(feature.status)}">${escapeHtml(t(feature.status))}</span></td>
        <td><span class="spec-tag ${feature.priority === "P1" ? "bad" : feature.priority === "P2" ? "warn" : "info"}">${escapeHtml(feature.priority ?? "P3")}</span></td>
      </tr>`).join("")}</tbody>
    </table>`}</div>
    <div class="spec-card-footer"><span>${escapeHtml(renderCount(features.length, "items", t))}</span><button data-command="selectSpecStage" data-stage-id="feature-split">${escapeHtml(t("View full queue"))}</button></div>
  </section>`;
}

function renderTraceabilityCard(view: SpecDriveIdeView | undefined, t: SpecWorkspaceTranslator): string {
  const documents = view?.documents.filter((document) => document.exists).length ?? 0;
  const features = view?.features.length ?? 0;
  const diagnostics = view?.diagnostics.length ?? 0;
  const total = documents + features + diagnostics;
  return `<section class="spec-card">
    <div class="spec-card-title"><h2>${escapeHtml(t("Traceability Status"))}</h2><span>${total} ${escapeHtml(t("total"))}</span></div>
    <div class="trace-card-body"><div class="trace-donut"><strong>${total}</strong></div></div>
    <div class="trace-legend">
      <div class="row"><span>${escapeHtml(t("Requirements"))}</span><strong class="ok">${documents}</strong><strong class="warn">${Math.min(diagnostics, 3)}</strong><strong class="bad">${diagnostics}</strong></div>
      <div class="row"><span>${escapeHtml(t("Features"))}</span><strong class="ok">${features}</strong><strong class="warn">${Math.max(0, features - documents)}</strong><strong class="bad">${view?.missing.length ?? 0}</strong></div>
      <div class="row"><span>${escapeHtml(t("Tasks"))}</span><strong class="ok">${view?.features.reduce((sum, feature) => sum + (feature.tasks?.length ?? 0), 0) ?? 0}</strong><strong class="warn">${diagnostics}</strong><strong class="bad">${view?.missing.length ?? 0}</strong></div>
    </div>
    <div class="spec-card-footer"><span></span><button data-command="selectSpecStage" data-stage-id="feature-split">${escapeHtml(t("View traceability matrix"))}</button></div>
  </section>`;
}

function renderDiagnosticsCard(view: SpecDriveIdeView | undefined, t: SpecWorkspaceTranslator): string {
  const diagnostics = (view?.diagnostics ?? []).slice(0, 4);
  const counts = countBy(diagnostics.map((diagnostic) => diagnostic.severity));
  return `<section class="spec-card">
    <div class="spec-card-title"><h2>${escapeHtml(t("Diagnostics / Blockers"))}</h2><span>${diagnostics.length} ${escapeHtml(t("open"))}</span></div>
    <div class="diagnostic-tabs">
      <span class="spec-tag info">${diagnostics.length} ${escapeHtml(t("Open"))}</span>
      <span class="spec-tag bad">${counts.error ?? 0} ${escapeHtml(t("Critical"))}</span>
      <span class="spec-tag warn">${counts.warning ?? 0} ${escapeHtml(t("High"))}</span>
      <span class="spec-tag info">${counts.info ?? 0} ${escapeHtml(t("Medium"))}</span>
    </div>
    ${diagnostics.length === 0 ? emptyState(t("No active diagnostics or blockers.")) : `<table class="spec-table diagnostics-table">
      <thead><tr><th>ID</th><th>${escapeHtml(t("Type"))}</th><th>${escapeHtml(t("Title"))}</th><th>${escapeHtml(t("Severity"))}</th></tr></thead>
      <tbody>${diagnostics.map((diagnostic, index) => `<tr>
        <td>BLK-${String(index + 1).padStart(3, "0")}</td>
        <td>${escapeHtml(diagnostic.source)}</td>
        <td>${escapeHtml(diagnostic.message)}</td>
        <td><span class="spec-tag ${statusClass(diagnostic.severity)}">${escapeHtml(t(diagnostic.severity))}</span></td>
      </tr>`).join("")}</tbody>
    </table>`}
    <div class="spec-card-footer"><span></span><button data-command="showDiagnostics">${escapeHtml(t("View all blockers"))}</button></div>
  </section>`;
}

function renderConceptCard(images: UiConceptImage[], t: SpecWorkspaceTranslator): string {
  return `<section class="spec-card">
    <div class="spec-card-title"><h2>${escapeHtml(t("UI Concept Images"))}</h2><span>${images.length}</span></div>
    ${images.length === 0 ? emptyState(t("No UI concept images discovered.")) : `<div class="concept-grid">${images.map(renderUiConceptImage).join("")}</div>`}
    <div class="spec-card-footer"><span></span><button data-command="selectSpecStage" data-stage-id="requirement-intake">${escapeHtml(t("View all UI concepts"))}</button></div>
  </section>`;
}

function renderSelectedInspector(
  stages: SpecLifecycleStage[],
  view: SpecDriveIdeView | undefined,
  projectId: string,
  active: SpecLifecycleStage,
  t: SpecWorkspaceTranslator,
): string {
  const stagePanels = stages.map((stage) => `<div data-workspace-panel="stage" data-stage-detail="${escapeAttr(stage.id)}" ${stage.id !== active.id ? "hidden" : ""}>
    <div class="spec-selected-title"><strong>${escapeHtml(`${t("STAGE")}-${stage.index}`)}</strong><p>${escapeHtml(t(stage.label))}</p><span class="spec-tag ${statusClass(stage.status)}">${escapeHtml(t(stage.status))}</span></div>
    <details class="spec-inspector-section" open><summary><span>${escapeHtml(t("Description"))}</span></summary><div class="spec-inspector-section-body"><p class="muted">${escapeHtml(t(stage.description))}</p></div></details>
    <details class="spec-inspector-section" open><summary><span>${escapeHtml(t("Facts"))}</span><span>${stage.steps.length}</span></summary><div class="spec-inspector-section-body">${stage.steps.slice(0, 6).map((step) => `<div class="row"><span>${escapeHtml(t(step.label))}</span><strong class="${statusClass(step.status)}">${escapeHtml(t(step.status))}</strong></div>`).join("")}</div></details>
    <details class="spec-inspector-section" open><summary><span>${escapeHtml(t("Linked Documents"))}</span><span>${stage.documentKinds.length}</span></summary><div class="spec-inspector-section-body">${renderLifecycleDocuments(filterLifecycleDocuments(view?.documents ?? [], stage.documentKinds).slice(0, 4), t)}</div></details>
    <details class="spec-inspector-section" open><summary><span>${escapeHtml(t("Controlled Commands"))}</span></summary><div class="spec-inspector-section-body"><div class="toolbar">${stage.actions.map((action) => commandButton(action.label, "controlled", { action: action.action, entityType: "project", entityId: projectId, reason: action.reason })).join("")}</div></div></details>
  </div>`).join("");
  return `<div class="spec-inspector-head"><h2>${escapeHtml(t("Selected Item"))}</h2><button data-command="showDiagnostics">${buttonIcon("x")}</button></div>
    ${stagePanels}
    ${renderGlobalDiagnosticsPanel(view, t)}`;
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function ownerForDocument(kind: string): string {
  if (kind.includes("feature")) return "SpecDrive";
  if (kind.includes("hld") || kind.includes("design")) return "John D.";
  if (kind.includes("ui")) return "Maya K.";
  return "Alice B.";
}

function specLifecycleStages(view: SpecDriveIdeView | undefined): SpecLifecycleStage[] {
  const docs = new Set((view?.documents ?? []).filter((document) => document.exists).map((document) => document.kind));
  const hasRequirementDocs = docs.has("prd") || docs.has("requirements") || docs.has("ears") || docs.has("feature-requirements");
  const hasFeatureSpecs = (view?.features.length ?? 0) > 0;
  const projectInitialization = view?.projectInitialization;
  const projectInitializationReady = projectInitialization?.ready ?? Boolean(view?.project?.id && view?.workspaceRoot && view?.recognized);
  const projectInitializationBlocked = projectInitialization?.blocked ?? !projectInitializationReady;
  const initializationSteps = normalizeInitializationSteps(projectInitialization?.steps ?? [
    { label: "Project created or imported", status: view?.project?.id ? "Ready" : "Blocked" },
    { label: "Workspace root resolved", status: view?.workspaceRoot ? "Ready" : "Blocked" },
    { label: "Git repository connected", status: view?.project?.targetRepoPath ? "Ready" : "Blocked" },
    { label: ".autobuild / Spec Protocol", status: view?.recognized ? "Ready" : "Blocked" },
    { label: ".agents skill runtime initialized", status: view?.workspaceRoot ? "Draft" : "Blocked" },
    { label: "Project constitution", status: "Draft" },
    { label: "Project Memory", status: "Draft" },
    { label: "Workspace health check", status: (view?.diagnostics.length ?? 0) === 0 ? "Draft" : "Active" },
    { label: "Current project context", status: view?.project?.id && view?.workspaceRoot ? "Ready" : "Blocked" },
  ], view);
  const activeId: SpecLifecycleStage["id"] = !projectInitializationReady
    ? "project-init"
    : !hasRequirementDocs
      ? "requirement-intake"
      : "feature-split";
  const stageStatus = (id: SpecLifecycleStage["id"], ready: boolean): string =>
    id === activeId ? (ready ? "Active" : "Blocked") : ready ? "Ready" : "Not Started";
  return [
    {
      id: "project-init",
      index: "1",
      label: "Project Initialization",
      status: projectInitializationReady ? "Ready" : projectInitializationBlocked ? "Blocked" : stageStatus("project-init", false),
      active: activeId === "project-init",
      description: "Recognize the project, repository, Spec protocol, constitution, memory, and workspace health before intake begins.",
      documentKinds: ["constitution", "memory", "readme"],
      steps: initializationSteps.map((step) => ({ label: step.label, status: step.status })),
      actions: [
        { label: "Register Current Project", action: "register_project", reason: "Register current VSCode workspace as a SpecDrive project." },
        { label: "Connect Git Repository", action: "connect_git_repository", reason: "Connect Git repository from Project Initialization lifecycle." },
        { label: "Initialize Spec Protocol", action: "initialize_spec_protocol", reason: "Initialize .autobuild / Spec Protocol from Project Initialization lifecycle." },
        { label: "Import or Create Constitution", action: "import_or_create_constitution", reason: "Import or create project constitution from Project Initialization lifecycle." },
        { label: "Initialize Project Memory", action: "initialize_project_memory", reason: "Initialize Project Memory from Project Initialization lifecycle." },
        { label: "Check Project Health", action: "check_project_health", reason: "Check project initialization from Spec Workspace lifecycle." },
      ],
    },
    {
      id: "requirement-intake",
      index: "2",
      label: "Requirement Intake",
      status: stageStatus("requirement-intake", hasRequirementDocs),
      active: activeId === "requirement-intake",
      description: "Scan PR, RP, PRD, EARS, requirements, HLD, design, UI Spec, Feature Spec, tasks, and index documents as the source pool for requirement flow.",
      documentKinds: ["prd", "requirements", "ears", "hld", "design", "ui-spec", "feature-requirements", "tasks", "readme"],
      steps: [
        { label: "Spec source scan", status: (view?.documents.length ?? 0) > 0 ? "Ready" : "Not Started" },
        { label: "PRD", status: docs.has("prd") ? "Ready" : "Draft" },
        { label: "EARS Requirements", status: docs.has("requirements") || docs.has("ears") ? "Ready" : "Draft" },
        { label: "HLD", status: docs.has("hld") ? "Ready" : "Draft" },
        { label: "UI Spec", status: docs.has("ui-spec") ? "Ready" : "Draft" },
        { label: "Clarification and quality check", status: (view?.diagnostics.length ?? 0) === 0 ? "Ready" : "Active" },
      ],
      actions: [
        { label: "Scan Sources", action: "scan_spec_sources", reason: "Scan Spec sources from Requirement Intake lifecycle." },
        { label: "Upload PRD", action: "upload_prd_source", reason: "Upload PRD source from Requirement Intake lifecycle." },
        { label: "Generate EARS", action: "generate_ears", reason: "Generate EARS requirements from Requirement Intake lifecycle." },
        { label: "Generate HLD", action: "generate_hld", reason: "Generate HLD from Requirement Intake lifecycle." },
        { label: "Generate UI Spec", action: "generate_ui_spec", reason: "Generate UI Spec from Requirement Intake lifecycle." },
      ],
    },
    {
      id: "feature-split",
      index: "3",
      label: "Feature Split",
      status: stageStatus("feature-split", hasFeatureSpecs),
      active: activeId === "feature-split",
      description: "Turn accepted requirements into Feature Specs, planning outputs, task slices, and Feature Pool Queue planning artifacts.",
      documentKinds: ["feature-requirements", "feature-design", "feature-tasks", "tasks"],
      steps: [
        { label: "Feature Spec directory", status: hasFeatureSpecs ? "Ready" : "Not Started" },
        { label: "Feature task slices", status: view?.features.some((feature) => (feature.tasks?.length ?? 0) > 0) ? "Ready" : "Draft" },
      ],
      actions: [
        { label: "Split Feature Specs", action: "split_feature_specs", reason: "Split Feature Specs from Feature Split lifecycle." },
      ],
    },
  ];
}

function normalizeInitializationSteps(
  steps: Array<{ label: string; status: string }>,
  view: SpecDriveIdeView | undefined,
): Array<{ label: string; status: string }> {
  if (steps.some((step) => step.label.includes(".agents") || step.label.toLowerCase().includes("skill runtime"))) {
    return steps.map((step) => step.label.toLowerCase().includes("skill runtime")
      ? { ...step, label: ".agents skill runtime initialized" }
      : step);
  }
  const specProtocolIndex = steps.findIndex((step) => step.label.includes("Spec Protocol") || step.label.includes(".autobuild"));
  const skillRuntimeStep = {
    label: ".agents skill runtime initialized",
    status: view?.recognized ? "Ready" : view?.workspaceRoot ? "Draft" : "Blocked",
  };
  if (specProtocolIndex < 0) return [...steps, skillRuntimeStep];
  return [
    ...steps.slice(0, specProtocolIndex + 1),
    skillRuntimeStep,
    ...steps.slice(specProtocolIndex + 1),
  ];
}

function renderLifecycleDocuments(documents: SpecDriveIdeDocument[], t: SpecWorkspaceTranslator): string {
  if (documents.length === 0) return emptyState(t("No source documents discovered."));
  return `<div class="spec-document-list">${documents.map((document) => `<div class="spec-document-row">
    ${buttonIcon(document.exists ? "file" : "warning")}
    <span>${escapeHtml(document.label)}</span>
    <button data-command="openDocument" data-path="${escapeAttr(document.path)}">${escapeHtml(document.exists ? t("Open") : t("Missing"))}</button>
  </div>`).join("")}</div>`;
}

function renderUiConceptImage(image: UiConceptImage): string {
  return `<button class="concept-card" data-command="openConceptImage" data-image-src="${escapeAttr(image.uri)}" data-image-title="${escapeAttr(image.label)}">
    <img src="${escapeAttr(image.uri)}" alt="${escapeAttr(image.label)}">
    <span>${escapeHtml(image.label)}</span>
  </button>`;
}

function renderGlobalDiagnosticsPanel(view: SpecDriveIdeView | undefined, t: SpecWorkspaceTranslator): string {
  const diagnostics = view?.diagnostics ?? [];
  return `<div id="spec-diagnostics-panel" data-workspace-panel="diagnostics" hidden>
    <div class="spec-panel-inner">
      <div class="spec-panel-heading"><div><h2>${escapeHtml(t("Diagnostics & Blockers"))}</h2><p>${escapeHtml(t("Active blockers collected from workspace, spec-state, and execution projections."))}</p></div><span>${diagnostics.length} ${escapeHtml(t("active"))}</span></div>
      <div class="spec-diagnostics-list">${diagnostics.length === 0 ? emptyState(t("No active diagnostics or blockers.")) : diagnostics.map((diagnostic) => renderLifecycleDiagnostic(diagnostic, t)).join("")}</div>
      <section class="spec-actions-bar" aria-label="${escapeAttr(t("Stage Actions"))}">${commandButton("Refresh", "refresh", {})}</section>
    </div>
  </div>`;
}

function filterLifecycleDocuments(documents: SpecDriveIdeDocument[], kinds: string[]): SpecDriveIdeDocument[] {
  const accepted = new Set(kinds);
  const filtered = documents.filter((document) => accepted.has(document.kind) || kinds.some((kind) => document.kind.includes(kind)));
  return filtered.length > 0 ? filtered : documents.slice(0, 8);
}

function renderLifecycleDiagnostic(diagnostic: SpecDriveIdeDiagnostic, t: SpecWorkspaceTranslator): string {
  return `<div class="issue ${statusClass(diagnostic.severity)}">
    <strong>${escapeHtml(diagnostic.path)}</strong>
    <br><span>${escapeHtml(diagnostic.message)}</span>
    <div class="toolbar"><button data-command="openDocument" data-path="${escapeAttr(diagnostic.path)}">${escapeHtml(t("Open"))}</button></div>
  </div>`;
}

export function preferredWorkspaceRequestSource(view: SpecDriveIdeView): string {
  return view.documents.find((document) => document.exists && document.path === "docs/README.md")?.path
    ?? view.documents.find((document) => document.exists && document.kind === "readme")?.path
    ?? view.documents.find((document) => document.exists)?.path
    ?? "docs/README.md";
}
