import type { AdapterSettingsSection, SystemSettingsViewModel } from "../types";
import { workbenchTranslationsForLocale, type WorkbenchLocale } from "./i18n";
import {
  buttonIcon,
  commandButton,
  emptyState,
  escapeAttr,
  escapeHtml,
  renderWorkbenchPage,
  statusClass,
  webviewNonce,
  type WorkbenchTheme,
} from "./shared";

type AdapterKind = "cli" | "rpc";

export function renderSystemSettingsWebview(
  settings: SystemSettingsViewModel | undefined,
  locale: WorkbenchLocale = "en",
  theme: WorkbenchTheme = "vscode",
): string {
  const nonce = webviewNonce();
  const factSources = settings?.factSources ?? [];
  return renderWorkbenchPage("System Settings", nonce, `
    <style>
      html,body{height:100%;overflow:hidden}
      body{padding:0}
      .workbench-header{display:none}
      .settings-page{height:100vh;display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;padding:14px 16px 18px}
      .settings-fixed-top{position:relative;z-index:12;margin:0 0 12px;padding:0 0 10px;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 96%,#12252b),color-mix(in srgb,var(--bg) 88%,transparent));border-bottom:1px solid var(--border-soft);backdrop-filter:blur(10px)}
      .settings-fixed-top h1{margin:0;font-size:22px;font-weight:650}
      .settings-fixed-top .settings-hero{margin:0 0 8px}
      .settings-fixed-top .settings-toolbar{margin-bottom:0}
      .settings-content{min-height:0;overflow:auto;padding-right:4px}
    </style>
    <div class="settings-page">
      <div class="settings-fixed-top">
        <section class="settings-hero">
          <div>
            <div class="settings-heading-row">
              <h1>System Settings</h1>
              <span class="settings-count-chip">${settings ? settingsCompletionCount(settings, factSources) : "0 / 5"}</span>
            </div>
            <p>Configure adapters, defaults, fact sources, and appearance.</p>
          </div>
          <div class="settings-health-strip" aria-label="Settings health summary">
            ${renderHealthPill("Adapters", settings ? adapterOnlineCount(settings) : "0 / 2", "Online", settings ? "ok" : "warn")}
            ${renderHealthPill("Fact Sources", String(factSources.length), "configured", factSources.length > 0 ? "ok" : "warn")}
          </div>
        </section>
        <section class="settings-toolbar">
          ${commandButton("Refresh", "refresh", {})}
          <span id="workbench-status" class="status-text" role="status" aria-live="polite">Settings projection loaded.</span>
        </section>
      </div>
      ${settings ? `
      <main class="settings-shell settings-content">
        ${renderSettingsRail(settings, factSources)}
        <div class="settings-main">
          ${renderAppearanceSection(locale, theme)}
          ${renderExecutionPreferenceSection(settings.projectExecutionPreference, locale)}
          <div class="settings-adapter-matrix">
            ${renderAdapterSection("CLI Adapter", "cli", settings.cliAdapter)}
            ${renderAdapterSection("RPC Adapter", "rpc", settings.rpcAdapter)}
          </div>
          <section class="settings-panel settings-facts">
            <div class="settings-panel-title"><h2>Fact Sources</h2><span>${factSources.length}</span></div>
            <div class="settings-chip-row">
              ${factSources.length === 0 ? emptyState("No settings fact sources returned.") : factSources.map((source) => `<span class="badge">${escapeHtml(source)}</span>`).join(" ")}
            </div>
          </section>
        </div>
      </main>
      ` : `<main class="settings-content">${emptyState("System settings are unavailable.")}</main>`}
    </div>
  `, undefined, locale, theme);
}

function renderHealthPill(label: string, value: string, suffix: string, className: string): string {
  return `<span class="settings-health-pill"><span>${escapeHtml(label)}</span><strong class="${escapeAttr(className)}">${escapeHtml(value)} <span>${escapeHtml(suffix)}</span></strong></span>`;
}

function translateStatic(locale: WorkbenchLocale, source: string): string {
  return locale === "en" ? source : workbenchTranslationsForLocale(locale)[source] ?? source;
}

function renderAppearanceSection(locale: WorkbenchLocale, theme: WorkbenchTheme): string {
  const languageOptions: Array<[WorkbenchLocale, string]> = [
    ["en", "English"],
    ["zh-CN", "中文"],
    ["ja", "日本語"],
  ];
  const themeOptions: Array<[string, string]> = [
    ["vscode", "VS Code"],
    ["light", "Light"],
    ["dark", "Dark"],
    ["highContrast", "High Contrast"],
  ];
  return `<section class="settings-panel settings-appearance">
    <div class="settings-panel-title"><h2>Appearance</h2><span>Set your language and visual theme.</span></div>
    <div class="appearance-grid">
      <label class="appearance-field">
        <span>Language</span>
        <select id="workbench-language" aria-label="Language">
          ${languageOptions.map(([value, label]) => `<option value="${escapeAttr(value)}"${value === locale ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
      </label>
      <div class="appearance-field">
        <span>Theme</span>
        <div class="theme-segmented" role="group" aria-label="Theme">
          ${themeOptions.map(([value, label]) => `<button class="workbench-button button-secondary" data-command="setWorkbenchTheme" data-theme-option="${escapeAttr(value)}" aria-pressed="${value === theme ? "true" : "false"}">${escapeHtml(label)}</button>`).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

function renderSettingsRail(settings: SystemSettingsViewModel, factSources: string[]): string {
  const preference = settings.projectExecutionPreference;
  const active = preference?.active ?? {};
  const cliValidation = settings.cliAdapter?.validation;
  const rpcValidation = settings.rpcAdapter?.validation;
  const cards = [
    settingsSummaryCard("Project", preference?.projectId ?? "none", "ok", "Project context"),
    settingsSummaryCard("Provider Adapter", String(active.adapterId ?? "none"), statusClass(preference?.validation?.valid ? "passed" : "failed"), "Execution default"),
    settingsSummaryCard("CLI Adapter", validationLabel(cliValidation), statusClass(cliValidation?.valid ? "passed" : "failed"), "Command runner"),
    settingsSummaryCard("RPC Adapter", validationLabel(rpcValidation), statusClass(rpcValidation?.valid ? "passed" : "failed"), "App server lane"),
    settingsSummaryCard("Fact Sources", String(factSources.length), factSources.length > 0 ? "ok" : "warn", "Configured sources"),
  ];
  return `<aside class="settings-rail" aria-label="Settings Summary">
    <div class="settings-rail-title">
      <h2>Settings Summary</h2>
      <span>${settingsCompletionCount(settings, factSources)}</span>
    </div>
    <div class="settings-summary-list">
      ${cards.join("")}
    </div>
    <h3>Fact Sources</h3>
    <div class="settings-source-list">
      ${factSources.slice(0, 5).map((source) => `<span class="settings-source-item"><span>${escapeHtml(source)}</span><strong class="ok">active</strong></span>`).join("") || emptyState("No settings fact sources returned.")}
    </div>
  </aside>`;
}

function settingsSummaryCard(label: string, value: string, className: string, caption: string): string {
  return `<div class="settings-summary-card">
    <div>
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value)}</span>
      <small>${escapeHtml(caption)}</small>
    </div>
    <span class="settings-card-status ${escapeAttr(className)}">${buttonIcon(className === "warn" || className === "bad" || className === "error" ? "warning" : "check-circle")}</span>
  </div>`;
}

function validationLabel(validation: { valid: boolean } | undefined): string {
  if (!validation) return "unavailable";
  return validation.valid ? "valid" : "invalid";
}

function renderExecutionPreferenceSection(section: SystemSettingsViewModel["projectExecutionPreference"], locale: WorkbenchLocale): string {
  if (!section) {
    return `<section class="settings-panel settings-execution-defaults">
      <div class="settings-panel-title"><h2>Project Execution Defaults</h2><span class="muted">unavailable</span></div>
      ${emptyState("Project execution defaults are unavailable from the current Control Plane response.")}
    </section>`;
  }
  const editorId = "project-execution-preference-json";
  const active = section.active ?? {};
  const validation = section.validation ?? { valid: false, errors: ["Execution preference validation result is unavailable."] };
  return `<section class="settings-panel settings-execution-defaults">
    <div class="settings-panel-title">
      <div><h2>Project Execution Defaults</h2><p>Defaults used when starting new executions.</p></div>
      <span class="settings-status-chip ${statusClass(validation.valid ? "passed" : "failed")}">${validation.valid ? "valid" : "invalid"}</span>
    </div>
    <div class="settings-defaults-grid">
      <div>
        <label class="settings-field">
          <span>Active Provider Preset</span>
          <select class="settings-select" aria-label="${escapeAttr(translateStatic(locale, "Active provider preset"))}">
            <option>${escapeHtml(String(active.adapterId ?? "none"))}</option>
          </select>
        </label>
        <label class="settings-field">
          <span>Execution Mode</span>
          <select class="settings-select" aria-label="${escapeAttr(translateStatic(locale, "Execution mode"))}">
            <option>${escapeHtml(translateStatic(locale, "Plan -> Execute -> Verify"))}</option>
          </select>
        </label>
      </div>
      <div class="settings-meta-grid settings-default-metrics">
        <div class="settings-meta-row"><span>Project</span><span><code>${escapeHtml(section.projectId ?? "none")}</code></span></div>
        <div class="settings-meta-row"><span>Provider Adapter</span><span><code>${escapeHtml(String(active.adapterId ?? "none"))}</code></span></div>
        <div class="settings-meta-row"><span>Validation</span><span class="${statusClass(validation.valid ? "passed" : "failed")}">${validation.valid ? "No errors" : `${validation.errors.length} errors`}</span></div>
      </div>
      <div>
        <h3>Config (JSON)</h3>
        <textarea id="${editorId}" class="settings-editor settings-editor-compact" spellcheck="false" aria-label="Project execution preference JSON">${escapeHtml(JSON.stringify({
          projectId: section.projectId,
          adapterId: active.adapterId,
        }, null, 2))}</textarea>
      </div>
    </div>
    <h3>Provider Presets</h3>
    <div class="settings-preset-row">
      ${section.cliAdapters.map((adapter) => executionPreferencePresetButton("CLI", editorId, section.projectId, adapter)).join("")}
      ${section.rpcAdapters.map((adapter) => executionPreferencePresetButton("RPC", editorId, section.projectId, adapter)).join("")}
    </div>
    ${validation.errors.length ? `<h3>Validation Errors</h3>${renderErrors(validation.errors)}` : ""}
    <div class="settings-actionbar">
      ${settingsCommandButton("Save Default", "save_project_execution_preference", "settings", editorId)}
    </div>
  </section>`;
}

function executionPreferencePresetButton(label: string, editorId: string, projectId: string | undefined, adapter: Record<string, unknown>): string {
  const adapterId = stringField(adapter, "id");
  const displayName = stringField(adapter, "displayName") ?? adapterId ?? "Adapter";
  return commandButton(`${label}: ${displayName}`, "loadSettingsPreset", {
    editorId,
    presetJson: JSON.stringify({ projectId, adapterId }, null, 2),
  });
}

function renderAdapterSection(title: string, kind: AdapterKind, section: AdapterSettingsSection | undefined): string {
  if (!section) {
    return `<section class="settings-panel settings-adapter-panel">
      <div class="settings-panel-title"><h2>${escapeHtml(title)}</h2><span class="muted">unavailable</span></div>
      ${emptyState(`${title} settings are unavailable from the current Control Plane response.`)}
    </section>`;
  }
  const editorId = `${kind}-adapter-json`;
  const source = section.draft ?? section.active ?? {};
  const activeId = stringField(section.active, "id");
  const draftId = section.draft ? stringField(section.draft, "id") : undefined;
  const presets = section.presets ?? [];
  const validation = section.validation ?? { valid: false, errors: ["Settings validation result is unavailable."] };
  const entityType = kind === "cli" ? "cli_adapter" : "rpc_adapter";
  const validateAction = kind === "cli" ? "validate_cli_adapter_config" : "validate_rpc_adapter_config";
  const saveAction = kind === "cli" ? "save_cli_adapter_config" : "save_rpc_adapter_config";
  const activateAction = kind === "cli" ? "activate_cli_adapter_config" : "activate_rpc_adapter_config";
  const disableAction = kind === "cli" ? "disable_cli_adapter_config" : "disable_rpc_adapter_config";
  return `<section class="settings-panel settings-adapter-panel">
    <div class="settings-panel-title">
      <div class="settings-title-with-icon">${buttonIcon(kind === "cli" ? "file" : "branch")}<h2>${escapeHtml(title)}</h2></div>
      <span class="settings-status-chip ${statusClass(validation.valid ? "passed" : "failed")}">${validation.valid ? "valid" : "invalid"}</span>
    </div>
    <div class="settings-card-toolbar">
      <span class="${activeId ? "ok" : "warn"}">${activeId ? "Active" : "Inactive"}</span>
      <span class="${draftId ? "draft" : "muted"}">${draftId ? "Draft saved" : "No draft"}</span>
    </div>
    <div class="settings-meta-grid settings-adapter-stats">
      <div class="settings-meta-row"><span>Active</span><span><code>${escapeHtml(activeId ?? "none")}</code></span></div>
      <div class="settings-meta-row"><span>Draft</span><span><code>${escapeHtml(draftId ?? "none")}</code></span></div>
      <div class="settings-meta-row"><span>Status</span><span class="${statusClass(stringField(source, "status"))}">${escapeHtml(stringField(source, "status") ?? "unknown")}</span></div>
      <div class="settings-meta-row"><span>Schema Version</span><span>${escapeHtml(String(source.schemaVersion ?? source.schema_version ?? "unknown"))}</span></div>
      ${renderPricingSummary(source)}
      ${renderLastCheck(kind, section)}
    </div>
    <div class="settings-adapter-workspace">
      <div>
        <h3>Active Preset</h3>
        <div class="settings-preset-row">
          ${presets.map((preset) => commandButton(stringField(preset, "displayName") ?? stringField(preset, "id") ?? "Preset", "loadSettingsPreset", {
            editorId,
            presetJson: JSON.stringify(preset, null, 2),
          })).join("") || emptyState("No presets returned.")}
        </div>
        ${renderPricingEditor(editorId, source)}
        <h3>Config (JSON)</h3>
        <textarea id="${editorId}" class="settings-editor" spellcheck="false" aria-label="${escapeAttr(title)} JSON">${escapeHtml(JSON.stringify(source, null, 2))}</textarea>
      </div>
      <div class="settings-validation-column">
        <h3>Validation</h3>
        ${renderErrors(validation.errors)}
      </div>
    </div>
    <div class="settings-actionbar">
      ${settingsCommandButton("Validate", validateAction, entityType, editorId)}
      ${settingsCommandButton("Save Draft", saveAction, entityType, editorId)}
      ${settingsCommandButton("Activate", activateAction, entityType, editorId)}
      ${settingsCommandButton("Disable", disableAction, entityType, editorId)}
    </div>
  </section>`;
}

function renderPricingSummary(source: Record<string, unknown>): string {
  const defaults = recordField(source, "defaults");
  const model = stringField(defaults, "model") ?? "none";
  const costRates = recordField(defaults, "costRates") ?? recordField(defaults, "cost_rates");
  const pricingModels = costRates ? Object.keys(costRates).filter(Boolean) : [];
  return `<div class="settings-meta-row"><span>Pricing Model</span><span><code>${escapeHtml(model)}</code></span></div>
    <div class="settings-meta-row"><span>Pricing Rates</span><span>${escapeHtml(pricingModels.length ? pricingModels.join(", ") : "none")}</span></div>`;
}

function settingsCompletionCount(settings: SystemSettingsViewModel, factSources: string[]): string {
  const preferenceValid = settings.projectExecutionPreference?.validation?.valid ? 1 : 0;
  const cliValid = settings.cliAdapter?.validation?.valid ? 1 : 0;
  const rpcValid = settings.rpcAdapter?.validation?.valid ? 1 : 0;
  const factsValid = factSources.length > 0 ? 1 : 0;
  const appearanceAvailable = 1;
  return `${preferenceValid + cliValid + rpcValid + factsValid + appearanceAvailable} / 5`;
}

function adapterOnlineCount(settings: SystemSettingsViewModel): string {
  const total = [settings.cliAdapter, settings.rpcAdapter].filter(Boolean).length;
  const valid = [settings.cliAdapter, settings.rpcAdapter].filter((section) => section?.validation?.valid).length;
  return `${valid} / ${total || 2}`;
}

function renderPricingEditor(editorId: string, source: Record<string, unknown>): string {
  const defaults = recordField(source, "defaults");
  const model = stringField(defaults, "model") ?? "";
  const costRates = recordField(defaults, "costRates") ?? recordField(defaults, "cost_rates");
  const rate = model ? recordField(costRates, model) ?? {} : {};
  const modelInputId = `${editorId}-pricing-model`;
  return `<h3>Token Pricing</h3>
    <div class="pricing-editor" data-editor-id="${escapeAttr(editorId)}">
      <label class="settings-field">
        <span>Default Model</span>
        <input id="${escapeAttr(modelInputId)}" type="text" value="${escapeAttr(model)}" data-settings-field="model" data-editor-id="${escapeAttr(editorId)}">
      </label>
      <label class="settings-field">
        <span>Input USD / 1M</span>
        <input type="number" min="0" step="0.000001" value="${escapeAttr(numberishField(rate, "inputUsdPer1M"))}" data-pricing-field="inputUsdPer1M" data-editor-id="${escapeAttr(editorId)}" data-model-input-id="${escapeAttr(modelInputId)}">
      </label>
      <label class="settings-field">
        <span>Cached USD / 1M</span>
        <input type="number" min="0" step="0.000001" value="${escapeAttr(numberishField(rate, "cachedInputUsdPer1M"))}" data-pricing-field="cachedInputUsdPer1M" data-editor-id="${escapeAttr(editorId)}" data-model-input-id="${escapeAttr(modelInputId)}">
      </label>
      <label class="settings-field">
        <span>Output USD / 1M</span>
        <input type="number" min="0" step="0.000001" value="${escapeAttr(numberishField(rate, "outputUsdPer1M"))}" data-pricing-field="outputUsdPer1M" data-editor-id="${escapeAttr(editorId)}" data-model-input-id="${escapeAttr(modelInputId)}">
      </label>
      <label class="settings-field">
        <span>Reasoning USD / 1M</span>
        <input type="number" min="0" step="0.000001" value="${escapeAttr(numberishField(rate, "reasoningOutputUsdPer1M"))}" data-pricing-field="reasoningOutputUsdPer1M" data-editor-id="${escapeAttr(editorId)}" data-model-input-id="${escapeAttr(modelInputId)}">
      </label>
    </div>`;
}

function settingsCommandButton(label: string, action: string, entityType: string, editorId: string): string {
  return commandButton(label, "settingsCommand", {
    action,
    entityType,
    editorId,
    reason: `${label} ${entityType} from VSCode System Settings.`,
  });
}

function renderLastCheck(kind: AdapterKind, section: AdapterSettingsSection): string {
  const check = kind === "cli" ? section.lastDryRun : section.lastProbe;
  if (!check) return `<div class="settings-meta-row"><span>${kind === "cli" ? "Last Dry Run" : "Last Probe"}</span><span class="muted">none</span></div>`;
  const command = [check.command, ...(check.args ?? [])].filter(Boolean).join(" ");
  return `<div class="settings-meta-row"><span>${kind === "cli" ? "Last Dry Run" : "Last Probe"}</span><span class="${statusClass(check.status)}">${escapeHtml(check.status)}</span></div>
    ${command ? `<div class="settings-meta-row"><span>Command</span><span><code>${escapeHtml(command)}</code></span></div>` : ""}`;
}

function renderErrors(errors: string[] | undefined): string {
  const values = errors ?? [];
  if (values.length === 0) return emptyState("No validation errors.");
  return values.map((error) => `<div class="issue bad">${escapeHtml(error)}</div>`).join("");
}

function stringField(value: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!value) return undefined;
  const field = value[key];
  return typeof field === "string" ? field : undefined;
}

function recordField(value: Record<string, unknown> | undefined, key: string): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const field = value[key];
  return typeof field === "object" && field !== null && !Array.isArray(field) ? field as Record<string, unknown> : undefined;
}

function numberishField(value: Record<string, unknown> | undefined, key: string): string {
  if (!value) return "";
  const field = value[key];
  return typeof field === "number" || typeof field === "string" ? String(field) : "";
}
