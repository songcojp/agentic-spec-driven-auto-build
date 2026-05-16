import type { QueueAction, SpecDriveIdeDocument, SpecDriveIdeExecutionDetail, SpecDriveIdeQueueItem } from "../types";

import { normalizeWorkbenchLocale, workbenchTranslationsForLocale, type WorkbenchLocale } from "./i18n";

export type WorkbenchTheme = "vscode" | "light" | "dark" | "highContrast";

export function normalizeWorkbenchTheme(value: unknown): WorkbenchTheme {
  return value === "light" || value === "dark" || value === "highContrast" || value === "vscode" ? value : "vscode";
}

export function renderWorkbenchPage(
  title: string,
  nonce: string,
  body: string,
  cspSource?: string,
  locale: WorkbenchLocale = "en",
  theme: WorkbenchTheme = "vscode",
): string {
  const imgSource = cspSource ? `${cspSource} data:` : "data:";
  const workbenchLocale = normalizeWorkbenchLocale(locale);
  const workbenchTheme = normalizeWorkbenchTheme(theme);
  const workbenchTranslations = workbenchTranslationsForLocale(workbenchLocale);
  return `<!doctype html><html lang="${escapeAttr(workbenchLocale)}" data-workbench-theme="${escapeAttr(workbenchTheme)}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${imgSource}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"><style>
    :root{color-scheme:dark;--fg:var(--vscode-foreground,#dbe7ef);--button-fg:var(--vscode-button-foreground,var(--fg));--input-fg:var(--vscode-input-foreground,var(--fg));--accent:var(--vscode-focusBorder,#20d7d2);--accent-strong:#13b8c2;--accent-soft:rgba(24,189,198,.15);--ok:#5bd46f;--warn:#f4b63d;--bad:#f26a63;--info:#5aa9ff;--muted:var(--vscode-descriptionForeground,#94a3ad);--bg:var(--vscode-editor-background,#0d1418);--bg-elevated:color-mix(in srgb,var(--bg) 86%,#16333b);--panel:color-mix(in srgb,var(--vscode-sideBar-background,#11181d) 88%,#0da7b0 4%);--panel-strong:color-mix(in srgb,var(--panel) 84%,#000);--border:color-mix(in srgb,var(--vscode-panel-border,#2b3942) 72%,#5fe5ea 18%);--border-soft:color-mix(in srgb,var(--border) 58%,transparent);--shadow:0 10px 28px rgba(0,0,0,.26);--radius:5px}
    html[data-workbench-theme="light"]{color-scheme:light;--fg:#18212f;--button-fg:#18212f;--input-fg:#18212f;--accent:#0875d1;--accent-strong:#075aa0;--accent-soft:rgba(8,117,209,.11);--ok:#218a43;--warn:#9a6700;--bad:#c9362c;--info:#0969da;--muted:#5f6b7a;--bg:#f6f8fb;--bg-elevated:#ffffff;--panel:#ffffff;--panel-strong:#edf2f7;--border:#d8dee8;--border-soft:#e8edf3;--shadow:0 8px 24px rgba(24,33,47,.08)}
    html[data-workbench-theme="dark"]{color-scheme:dark;--fg:#e7eef6;--button-fg:#e7eef6;--input-fg:#e7eef6;--accent:#20d7d2;--accent-strong:#13b8c2;--accent-soft:rgba(24,189,198,.15);--ok:#5bd46f;--warn:#f4b63d;--bad:#f26a63;--info:#5aa9ff;--muted:#94a3ad;--bg:#0d1418;--bg-elevated:#102029;--panel:#11181d;--panel-strong:#0b1115;--border:#31414c;--border-soft:#22313a;--shadow:0 10px 28px rgba(0,0,0,.28)}
    html[data-workbench-theme="highContrast"]{color-scheme:dark;--fg:#ffffff;--button-fg:#ffffff;--input-fg:#ffffff;--accent:#ffff00;--accent-strong:#ffffff;--accent-soft:rgba(255,255,0,.18);--ok:#00ff66;--warn:#ffff00;--bad:#ff6666;--info:#66ccff;--muted:#ffffff;--bg:#000;--bg-elevated:#050505;--panel:#000;--panel-strong:#050505;--border:#ffffff;--border-soft:#808080;--shadow:none}
    *{box-sizing:border-box}body{margin:0;padding:14px 16px 18px;font-family:var(--vscode-font-family,"Segoe UI",system-ui,sans-serif);color:var(--fg);background:radial-gradient(circle at 22% 0,rgba(20,184,166,.10),transparent 34%),linear-gradient(180deg,color-mix(in srgb,var(--bg) 88%,#12252b),var(--bg));line-height:1.45}
    .workbench-app-shell{height:100vh;display:grid;grid-template-columns:214px minmax(0,1fr);overflow:hidden;background:var(--bg)}.workbench-app-shell.sidebar-collapsed{grid-template-columns:54px minmax(0,1fr)}.workbench-sidebar{min-width:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;border-right:1px solid var(--border-soft);background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 94%,#09242c),color-mix(in srgb,var(--panel-strong) 94%,#000));padding:10px 8px;overflow:hidden}.workbench-brand{display:flex;align-items:center;gap:8px;min-height:34px;padding:0 4px 10px;border-bottom:1px solid var(--border-soft);margin-bottom:8px}.workbench-brand-mark{display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--border);border-radius:var(--radius);background:color-mix(in srgb,var(--accent) 15%,var(--bg-elevated));color:var(--fg);font-weight:700;font-size:12px;flex:0 0 auto}.workbench-brand-text{min-width:0}.workbench-brand-text strong,.workbench-brand-text span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.workbench-brand-text span{color:var(--muted);font-size:11px}.workbench-nav{display:grid;align-content:start;gap:4px;min-height:0;overflow:auto}.workbench-nav button{width:100%;display:grid;grid-template-columns:22px minmax(0,1fr);align-items:center;gap:8px;min-height:36px;padding:6px 8px;border-color:transparent;background:transparent;box-shadow:none;text-align:left;color:var(--fg)}.workbench-nav button:hover{border-color:var(--border);background:color-mix(in srgb,var(--accent) 10%,transparent);box-shadow:none}.workbench-nav button[aria-current="page"]{border-color:color-mix(in srgb,var(--accent) 68%,var(--border));background:linear-gradient(90deg,var(--accent-soft),transparent);box-shadow:inset 3px 0 0 var(--accent)}.workbench-nav .button-icon{width:18px;height:18px}.workbench-nav-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.workbench-sidebar-footer{display:grid;gap:7px;padding-top:8px;border-top:1px solid var(--border-soft)}.workbench-sidebar-toggle{width:100%;display:grid;grid-template-columns:22px minmax(0,1fr);align-items:center;gap:8px;min-height:32px;padding:5px 8px;background:transparent;box-shadow:none}.workbench-page-content{min-width:0;min-height:0;overflow:hidden}.workbench-app-shell.sidebar-collapsed .workbench-brand-text,.workbench-app-shell.sidebar-collapsed .workbench-nav-label,.workbench-app-shell.sidebar-collapsed .workbench-sidebar-toggle .button-label{display:none}.workbench-app-shell.sidebar-collapsed .workbench-brand{justify-content:center;padding-left:0;padding-right:0}.workbench-app-shell.sidebar-collapsed .workbench-nav button,.workbench-app-shell.sidebar-collapsed .workbench-sidebar-toggle{grid-template-columns:1fr;place-items:center;padding-left:0;padding-right:0}.workbench-app-shell.sidebar-collapsed .workbench-nav button[aria-current="page"]{box-shadow:inset 0 3px 0 var(--accent)}
    .workbench-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.workbench-header h1{margin-bottom:0}
    h1{font-size:22px;margin:4px 0 12px;font-weight:650;letter-spacing:0;color:var(--fg)}h2{font-size:14px;margin:0;font-weight:650}h3{font-size:12px;margin:14px 0 6px;color:var(--muted);text-transform:uppercase;letter-spacing:0}
    button{font:inherit;color:var(--button-fg);background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 88%,#fff 4%),var(--panel-strong));border:1px solid var(--border);border-radius:var(--radius);padding:6px 10px;cursor:pointer;max-width:100%;overflow-wrap:anywhere;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);transition:background .12s ease,border-color .12s ease,color .12s ease,box-shadow .12s ease}.workbench-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:30px;font-size:12px;line-height:1.2;white-space:normal;text-align:center}.button-icon{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;flex:0 0 auto}.button-icon svg{width:15px;height:15px;stroke:currentColor;stroke-width:1.9;fill:none;stroke-linecap:round;stroke-linejoin:round}.button-label{min-width:0;overflow-wrap:anywhere}button:hover{background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 82%,var(--accent) 12%),var(--panel-strong));border-color:color-mix(in srgb,var(--accent) 72%,var(--border));box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 18%,transparent),inset 0 1px 0 rgba(255,255,255,.07)}.button-primary,.button-run,.button-schedule,.button-submit{color:#eaffff;background:linear-gradient(180deg,#128f95,#0b6f76);border-color:#20c7ca}.button-danger,.button-cancel,.button-decline,.button-disable{color:#ffe8e6;background:linear-gradient(180deg,rgba(139,49,47,.82),rgba(73,31,32,.92));border-color:color-mix(in srgb,var(--bad) 72%,var(--border))}.button-warn,.button-retry,.button-skip,.button-reprioritize,.button-clarify{color:#fff6db;border-color:color-mix(in srgb,var(--warn) 68%,var(--border));background:linear-gradient(180deg,rgba(120,83,17,.72),rgba(57,44,25,.92))}.button-open,.button-refresh,.button-select,.button-settings{color:var(--fg)}button:disabled,button:disabled:hover,.workbench-button.is-disabled{color:var(--vscode-disabledForeground,var(--muted));background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 72%,#000),color-mix(in srgb,var(--panel-strong) 84%,#000));border-color:color-mix(in srgb,var(--vscode-disabledForeground,var(--border)) 48%,var(--border));opacity:.55;cursor:not-allowed;box-shadow:none}
    [hidden]{display:none!important}.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap}.inline-field{display:inline-flex;align-items:center;gap:6px;color:var(--muted);font-size:12px}.inline-field select{min-height:30px;max-width:220px;background:var(--bg-elevated);color:var(--input-fg);border:1px solid var(--border);border-radius:var(--radius);padding:4px 7px}.view-toggle{min-width:132px}.auto-refresh-switch{display:inline-flex;align-items:center;gap:7px;background:transparent;color:var(--muted);border-color:var(--border);padding:4px 7px}.auto-refresh-switch:hover{background:var(--vscode-toolbar-hoverBackground,var(--vscode-list-hoverBackground,var(--bg-elevated)))}.auto-refresh-switch .switch-track{position:relative;width:34px;height:18px;border:1px solid var(--border);border-radius:999px;background:var(--bg-elevated)}.auto-refresh-switch .switch-track::after{content:"";position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:999px;background:var(--muted);transition:transform .15s ease,background .15s ease}.auto-refresh-switch[aria-checked="true"]{color:var(--fg);border-color:var(--accent)}.auto-refresh-switch[aria-checked="true"] .switch-track{background:color-mix(in srgb,var(--accent) 28%,var(--bg-elevated));border-color:var(--accent)}.auto-refresh-switch[aria-checked="true"] .switch-track::after{transform:translateX(16px);background:var(--accent)}.status-text{color:var(--muted);font-size:12px;min-height:18px}.project-cost-total{margin-left:auto;display:inline-flex;align-items:center;gap:7px;min-height:30px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-elevated);padding:4px 8px;font-size:12px;white-space:nowrap}.project-cost-total span{color:var(--muted)}.project-cost-total strong{color:var(--fg);font-weight:650}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px}.span-3{grid-column:span 3}.span-4{grid-column:span 4}.span-5{grid-column:span 5}.span-8{grid-column:span 8}.span-12{grid-column:span 12}
    .panel{border:1px solid var(--border);background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 92%,#fff 2%),var(--panel));border-radius:var(--radius);padding:10px;min-width:0;box-shadow:var(--shadow)}.panel-title,.section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border-soft);padding-bottom:8px;margin-bottom:8px}.panel-title h2,.section-title h2{min-width:0;overflow-wrap:anywhere}.panel-title span,.section-title span,.muted{color:var(--muted)}.section-title{border-top:1px solid var(--border-soft);padding-top:12px;margin-top:14px}.selected-title{align-items:flex-start}.selected-title>div:first-child{min-width:0}.title-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;min-width:min(100%,360px)}.title-actions button{padding:4px 7px;font-size:12px}
    .execution-command-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;margin-bottom:10px}.execution-context-strip{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:8px}.execution-context-card{border:1px solid var(--border);border-radius:var(--radius);background:linear-gradient(180deg,var(--bg-elevated),var(--panel));padding:7px 9px;min-width:0}.execution-context-card span{display:block;color:var(--muted);font-size:11px}.execution-context-card strong{display:flex;align-items:center;gap:6px;min-width:0;overflow-wrap:anywhere;font-size:12px}.execution-toolbar{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.execution-layout{display:grid;grid-template-columns:minmax(430px,40%) minmax(0,1fr);gap:10px;align-items:start}.execution-queue-column,.current-selected-column{min-width:0}.current-selected-column{overflow:visible}.execution-panel-title{margin-bottom:0}.execution-queue-header{display:grid;grid-template-columns:minmax(150px,1.6fr) minmax(84px,.8fr) minmax(86px,.8fr) minmax(118px,1fr) minmax(96px,auto);gap:8px;padding:6px 8px;color:var(--muted);font-size:11px;border-bottom:1px solid var(--border-soft)}.execution-selected-summary{max-height:150px;overflow:auto;border:1px solid var(--border-soft);border-radius:var(--radius);padding:7px 8px;background:var(--bg-elevated);margin-bottom:8px}.execution-selected-summary ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px 12px;margin:0;padding-left:18px;font-size:12px}.execution-selected-summary h2{font-size:12px;margin:6px 0 3px}.execution-feature-card,.execution-detail-card{border:1px solid var(--border-soft);border-radius:var(--radius);background:linear-gradient(180deg,var(--bg-elevated),color-mix(in srgb,var(--panel) 84%,#000));padding:8px;min-width:0}.execution-feature-card{margin:8px 0}.execution-feature-title{display:flex;align-items:center;gap:8px;justify-content:space-between}.execution-feature-title h3{margin:0}.execution-feature-card p{margin:6px 0;color:var(--fg);font-size:12px}.execution-feature-meta{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;border:1px solid var(--border-soft);border-radius:var(--radius);overflow:hidden}.execution-feature-meta span{display:grid;gap:2px;padding:5px 7px;border-left:1px solid var(--border-soft);font-size:11px}.execution-feature-meta span:first-child{border-left:0}.execution-feature-meta strong{color:var(--muted);font-weight:650}.execution-feature-meta code{white-space:pre-wrap;overflow-wrap:anywhere}.execution-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.execution-detail-card-wide{grid-column:span 2}.execution-detail-card h3{margin-top:0}.execution-detail-card .section-title{border-top:0;margin-top:0;padding-top:0}.execution-summary-list{display:grid;gap:0}.queue-group{margin:0;border:0;border-bottom:1px solid var(--border-soft);border-radius:0;overflow:hidden;background:transparent}.queue-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;background:linear-gradient(90deg,var(--accent-soft),transparent 72%);cursor:pointer;user-select:none;list-style:none}.queue-head::-webkit-details-marker{display:none}.queue-head::before{content:"+";display:inline-flex;width:14px;color:var(--muted);font-weight:650}.queue-group[open] .queue-head::before{content:"-"}.queue-head strong{margin-right:auto}.queue-item,.row{display:grid;grid-template-columns:minmax(150px,1.6fr) minmax(84px,.8fr) minmax(86px,.8fr) minmax(118px,1fr) minmax(96px,auto);gap:8px;align-items:center;padding:6px 8px;border-top:1px solid var(--border-soft);font-size:12px;min-width:0}.queue-item.selected{background:color-mix(in srgb,var(--vscode-list-activeSelectionBackground,#123846) 72%,var(--accent-soft));box-shadow:inset 3px 0 0 var(--accent),0 0 0 1px color-mix(in srgb,var(--accent) 24%,transparent)}.row{grid-template-columns:minmax(0,1fr) minmax(0,max-content)}.row-stacked{grid-template-columns:minmax(0,1fr);gap:3px;align-items:start}.row-stacked>span:first-child,.result-entry>span:first-child{color:var(--muted);font-size:11px;font-weight:650;text-transform:uppercase}.row>*{min-width:0;overflow-wrap:anywhere}.row code{white-space:pre-wrap;overflow-wrap:anywhere}
    .badge{display:inline-flex;align-items:center;border:1px solid currentColor;border-radius:999px;padding:2px 7px;font-size:11px;max-width:100%;overflow-wrap:anywhere;background:color-mix(in srgb,currentColor 10%,transparent)}.ok{color:var(--ok)}.warning,.warn{color:var(--warn)}.error,.bad{color:var(--bad)}.info,.draft{color:var(--accent)}
    pre{max-height:180px;overflow:auto;background:color-mix(in srgb,var(--vscode-textCodeBlock-background,#071013) 88%,var(--accent) 4%);padding:8px;border:1px solid var(--border-soft);border-radius:var(--radius);font-family:var(--vscode-editor-font-family);font-size:11px}.issue{border:1px solid var(--border);border-radius:var(--radius);padding:8px;margin:6px 0;background:color-mix(in srgb,var(--panel) 86%,#000)}.issue span{color:var(--muted)}.compact-section{border:1px solid var(--border-soft);border-radius:var(--radius);background:color-mix(in srgb,var(--panel) 88%,transparent);margin:8px 0;overflow:hidden}.compact-section>summary{display:flex;align-items:center;justify-content:space-between;gap:8px;list-style:none;cursor:pointer;padding:8px 9px;background:linear-gradient(90deg,var(--accent-soft),transparent 72%)}.compact-section>summary::-webkit-details-marker{display:none}.compact-section>summary::before{content:"+";color:var(--muted);font-weight:650}.compact-section[open]>summary::before{content:"-"}.compact-section>summary h3{margin:0}.compact-section-body{padding:0 9px 9px}
    .result-summary{display:grid;gap:7px;margin-bottom:8px}.state-flow-compact{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;border-top:0;padding-top:0}.state-flow-item{border:1px solid var(--border-soft);border-radius:var(--radius);background:var(--bg-elevated);padding:6px;min-width:0}.state-flow-item span{display:block;color:var(--muted);font-size:10px;font-weight:650;text-transform:uppercase;overflow-wrap:anywhere}.state-flow-item strong{display:block;min-width:0;overflow-wrap:anywhere;font-size:12px;font-weight:600}.state-flow-reason{grid-column:1/-1}.result-status{display:flex;gap:8px;align-items:flex-start;min-width:0}.result-status strong{min-width:0;overflow-wrap:anywhere}.chip-row{display:flex;gap:6px;flex-wrap:wrap}.result-group{border-top:1px solid var(--border);padding-top:4px;margin-top:6px}.result-entry{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,max-content);gap:3px 8px;align-items:start;padding:6px 8px;border-top:1px solid var(--border-soft);font-size:12px;min-width:0}.result-entry-wide{grid-template-columns:minmax(0,1fr)}.result-entry>*{min-width:0;overflow-wrap:anywhere}.result-entry code{white-space:pre-wrap}.result-content{min-width:0;overflow-wrap:anywhere}.token-consumption-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:8px}.token-consumption-grid div{border:1px solid var(--border);border-radius:5px;padding:6px;min-width:0}.token-consumption-grid span{display:block;color:var(--muted);font-size:11px}.token-consumption-grid strong{display:block;min-width:0;overflow-wrap:anywhere;font-size:12px}.compact-list{margin:0;padding-left:16px}.compact-list li{margin:2px 0}.artifact-table{width:100%;border-collapse:collapse;font-size:12px}.artifact-table th,.artifact-table td{border-top:1px solid var(--border);padding:5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}.artifact-table th{color:var(--muted);font-weight:650}.artifact-table code{white-space:pre-wrap}
    .stage-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:6px;margin-bottom:10px}.stage{display:grid;place-items:center;gap:3px;background:linear-gradient(180deg,var(--panel),var(--panel-strong));color:var(--fg);min-height:64px}.stage .button-icon{color:var(--accent)}.stage span{display:block;color:var(--accent)}.stage.active,.stage[aria-pressed="true"]{border-color:var(--accent);background:linear-gradient(180deg,var(--accent-soft),color-mix(in srgb,var(--vscode-list-activeSelectionBackground,#123846) 72%,var(--panel)));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 38%,transparent)}.spec-stage-panel{width:100%;min-height:320px}
    .concept-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px}.concept-card{padding:0;text-align:left;background:var(--panel-strong);color:var(--fg);overflow:hidden}.concept-card img{display:block;width:100%;height:96px;object-fit:cover;background:var(--bg);border-bottom:1px solid var(--border)}.concept-card span{display:block;padding:7px 8px;color:var(--muted);font-size:12px}.concept-modal{position:fixed;inset:0;z-index:20;display:grid;place-items:center;background:rgba(0,0,0,.72);padding:18px}.concept-modal[hidden]{display:none!important}.concept-dialog{width:min(1100px,96vw);max-height:94vh;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);overflow:hidden}.concept-dialog header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--border)}.concept-dialog img{display:block;width:100%;max-height:calc(94vh - 54px);object-fit:contain;background:#000}
    .hidden{display:none!important}.workbench-form{margin-bottom:10px}.workbench-chat{display:grid;gap:0}.workbench-compose{display:grid;width:100%}.workbench-form textarea,.settings-editor{width:100%;max-width:100%;min-height:96px;resize:vertical;background:color-mix(in srgb,var(--bg-elevated) 82%,#000);color:var(--input-fg);border:1px solid var(--border);border-radius:var(--radius);padding:8px;font:inherit}.workbench-form textarea{border-color:color-mix(in srgb,var(--accent) 42%,var(--border));background:var(--vscode-input-background,var(--bg-elevated))}.settings-editor{min-height:170px;font-family:var(--vscode-editor-font-family,"SFMono-Regular",Consolas,monospace);font-size:12px;line-height:1.45}.settings-editor-compact{min-height:110px}.settings-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:-2px 0 12px}.settings-heading-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.settings-heading-row h2{font-size:20px;margin:0}.settings-hero p{margin:3px 0 0;color:var(--muted);font-size:12px}.settings-count-chip{display:inline-flex;align-items:center;min-height:22px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-elevated);padding:2px 7px;color:var(--muted);font-size:12px}.settings-health-strip{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.settings-health-pill{display:grid;grid-template-columns:minmax(0,max-content);gap:1px;border-left:1px solid var(--border);padding-left:12px;font-size:12px}.settings-health-pill span{color:var(--muted)}.settings-health-pill strong{font-weight:650}.settings-toolbar{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-bottom:12px;flex-wrap:wrap}.settings-toolbar .status-text{margin-left:0}.settings-shell{display:grid;grid-template-columns:minmax(230px,260px) minmax(0,1fr);gap:12px;align-items:start}.settings-main{display:grid;gap:12px;min-width:0}.settings-rail,.settings-panel{border:1px solid var(--border);background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 94%,#fff 2%),var(--panel-strong));border-radius:var(--radius);min-width:0;box-shadow:var(--shadow)}.settings-rail{position:sticky;top:12px;padding:10px}.settings-panel{padding:12px}.settings-panel p.muted{font-size:12px;margin:6px 0 8px}.settings-panel .issue{font-size:12px;padding:7px}.settings-rail-title,.settings-panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border-soft);padding-bottom:8px;margin-bottom:10px}.settings-rail-title h2,.settings-panel-title h2{min-width:0;overflow-wrap:anywhere}.settings-panel-title p{margin:2px 0 0;color:var(--muted);font-size:12px}.settings-rail-title span,.settings-panel-title span{color:var(--muted);font-size:12px}.appearance-grid{display:grid;grid-template-columns:minmax(160px,280px) minmax(280px,1fr);gap:16px}.appearance-field{display:grid;gap:5px;color:var(--muted);font-size:12px}.appearance-field select,.settings-select{min-height:32px;background:var(--bg-elevated);color:var(--input-fg);border:1px solid var(--border);border-radius:var(--radius);padding:5px 8px}.theme-segmented{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;width:min(100%,430px)}.theme-segmented button{min-height:32px;padding:5px 8px;border:0;border-right:1px solid var(--border);border-radius:0;background:var(--bg-elevated);box-shadow:none}.theme-segmented button:last-child{border-right:0}.theme-segmented button[aria-pressed="true"]{border-color:var(--accent);background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 34%,var(--panel)),color-mix(in srgb,var(--accent) 16%,var(--bg-elevated)));color:var(--fg);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 36%,transparent)}.settings-adapter-matrix{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.settings-summary-list,.settings-source-list,.settings-meta-grid{display:grid;gap:0}.settings-summary-card{display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid var(--border-soft);padding:10px 0;min-width:0}.settings-summary-card:first-child{border-top:0}.settings-summary-card div{display:grid;gap:1px;min-width:0}.settings-summary-card strong,.settings-summary-card span,.settings-summary-card small{min-width:0;overflow-wrap:anywhere}.settings-summary-card>div>strong{font-size:12px;color:var(--fg)}.settings-summary-card>div>span{font-size:12px;color:var(--fg)}.settings-summary-card small{font-size:11px;color:var(--muted)}.settings-card-status{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}.settings-card-status .button-icon{width:16px;height:16px}.settings-summary-row,.settings-meta-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,max-content);gap:10px;align-items:center;min-width:0;border-top:1px solid var(--border-soft);padding:7px 0;font-size:12px}.settings-summary-row:first-child,.settings-meta-row:first-child{border-top:0}.settings-summary-row span,.settings-meta-row span{min-width:0;overflow-wrap:anywhere}.settings-summary-row>span:first-child,.settings-meta-row>span:first-child{color:var(--muted)}.settings-summary-row strong,.settings-meta-row code{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere}.settings-status-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid currentColor;border-radius:var(--radius);padding:2px 7px;font-size:11px;text-transform:uppercase;background:color-mix(in srgb,currentColor 10%,transparent)}.settings-source-item{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-elevated);padding:6px 7px;margin-top:6px;font-size:12px}.settings-source-item span{min-width:0;overflow-wrap:anywhere}.settings-source-item strong{font-size:11px;font-weight:600}.settings-preset-row,.settings-chip-row,.settings-actionbar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-bottom:8px}.settings-preset-row button,.settings-actionbar button{padding:5px 8px}.settings-actionbar{justify-content:flex-end;margin:9px 0 0}.settings-chip-row{margin-bottom:0}.settings-defaults-grid{display:grid;grid-template-columns:minmax(220px,1fr) minmax(220px,1fr) minmax(300px,1.3fr);gap:16px;align-items:start}.settings-defaults-grid .settings-field{margin-bottom:10px}.settings-default-metrics{border-left:1px solid var(--border);padding-left:12px}.settings-adapter-stats{grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:color-mix(in srgb,var(--bg-elevated) 82%,transparent)}.settings-adapter-stats .settings-meta-row{display:grid;grid-template-columns:minmax(0,1fr);gap:2px;border-top:0;border-left:1px solid var(--border-soft);padding:7px 9px}.settings-adapter-stats .settings-meta-row:first-child{border-left:0}.settings-card-toolbar{display:flex;justify-content:flex-end;align-items:center;gap:10px;border-bottom:1px solid var(--border-soft);padding-bottom:8px;margin-top:-2px;margin-bottom:8px;font-size:12px}.settings-title-with-icon{display:flex;align-items:center;gap:8px;min-width:0}.settings-title-with-icon .button-icon{color:var(--accent);width:17px;height:17px}.settings-adapter-workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,240px);gap:12px;align-items:start;margin-top:10px}.settings-validation-column{border-left:1px solid var(--border);padding-left:12px}.pricing-editor{display:grid;grid-template-columns:repeat(5,minmax(92px,1fr));gap:8px;margin-bottom:8px}.settings-field{display:grid;gap:4px;min-width:0;color:var(--muted);font-size:12px}.settings-field input{min-width:0;width:100%;background:var(--bg-elevated);color:var(--input-fg);border:1px solid var(--border);border-radius:var(--radius);padding:5px 7px;font:inherit}.workbench-form-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}.dependency-panel{margin-bottom:10px}.dependency-tree,.dependency-tree ul{list-style:none;margin:0;padding-left:18px}.dependency-tree{padding-left:0}.dependency-tree li{position:relative;margin:4px 0;padding-left:14px}.dependency-tree li::before{content:"";position:absolute;left:0;top:13px;width:9px;border-top:1px solid var(--border)}.dependency-tree ul{border-left:1px solid var(--border);margin-left:8px}.dependency-branch>summary{list-style:none;cursor:pointer}.dependency-branch>summary::-webkit-details-marker{display:none}.dependency-branch>summary::before{content:"+";display:inline-flex;width:16px;color:var(--muted)}.dependency-branch[open]>summary::before{content:"-"}.dependency-leaf{margin-left:16px}.dependency-node{display:inline-flex;align-items:center;gap:7px;min-height:26px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-elevated);color:var(--fg);padding:4px 7px}.dependency-node button{padding:2px 6px}.dependency-node.missing{color:var(--warn)}.dependency-node .muted{font-size:11px}
    .feature-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,34vw);gap:10px}.feature-board{display:flex;flex-direction:column;gap:10px;min-width:0}.feature-panel{border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);min-width:0;overflow:hidden;box-shadow:var(--shadow)}.feature-panel summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;cursor:pointer;background:linear-gradient(90deg,var(--accent-soft),transparent 74%);user-select:none;list-style:none}.feature-panel summary::-webkit-details-marker{display:none}.feature-panel summary::before{content:"+";display:inline-flex;width:16px;color:var(--muted);font-weight:650}.feature-panel[open] summary::before{content:"-"}.feature-panel summary h2{display:flex;gap:8px;align-items:center;margin-right:auto}.feature-panel summary span{color:var(--muted);font-size:12px}.feature-panel-items{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));justify-content:stretch;gap:8px;align-items:stretch;padding:9px;overflow:visible}.feature-panel-items .muted{padding:2px}.feature-card{width:100%;min-width:0;min-height:154px;text-align:left;background:linear-gradient(180deg,var(--bg-elevated),var(--panel-strong));color:var(--fg);border:1px solid var(--border-soft);border-radius:var(--radius);padding:9px;position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}.feature-card.current{background:linear-gradient(180deg,color-mix(in srgb,var(--vscode-list-activeSelectionBackground,#123846) 72%,var(--accent-soft)),var(--panel-strong));box-shadow:inset 4px 0 0 var(--accent),0 0 0 1px color-mix(in srgb,var(--accent) 22%,transparent)}.feature-card.selected{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 65%,transparent)}.feature-card.current.selected{box-shadow:inset 4px 0 0 var(--accent),0 0 0 2px color-mix(in srgb,var(--accent) 65%,transparent)}.feature-card header{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px}.feature-card-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}.feature-select{display:inline-flex;align-items:center;gap:6px;color:var(--muted);font-size:12px}.feature-select input{margin:0}.metric{display:grid;grid-template-columns:1fr auto;gap:6px;font-size:12px;color:var(--muted)}.bar{grid-column:1/-1;height:5px;background:color-mix(in srgb,var(--vscode-progressBar-background,#334155) 76%,#000);border-radius:999px;overflow:hidden}.bar span{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--ok))}.detail-panel{position:sticky;top:12px;height:auto;overflow:visible}.feature-state-flow-compact{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;border-top:0;padding-top:0}.feature-state-item{border:1px solid var(--border-soft);border-radius:var(--radius);background:var(--bg-elevated);padding:6px;min-width:0}.feature-state-item span{display:block;color:var(--muted);font-size:10px;font-weight:650;text-transform:uppercase;overflow-wrap:anywhere}.feature-state-item strong{display:block;min-width:0;overflow-wrap:anywhere;font-size:12px;font-weight:600}.feature-state-row{display:grid;grid-template-columns:minmax(0,1fr);gap:3px;padding:7px 8px;border-top:1px solid var(--border-soft);font-size:12px;min-width:0}.feature-state-row span{min-width:0;overflow-wrap:anywhere}.feature-state-row span:first-child{color:var(--muted);font-size:11px;font-weight:650;text-transform:uppercase}.feature-artifacts{display:grid;gap:5px}.artifact-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(72px,max-content) auto;align-items:center;gap:8px;border:1px solid var(--border-soft);border-radius:var(--radius);padding:5px 6px;font-size:12px;background:var(--bg-elevated)}.artifact-row strong{min-width:0;overflow-wrap:anywhere}.artifact-row button{padding:3px 7px}.task-chip-row{display:flex;flex-wrap:wrap;gap:6px}.task-chip{display:inline-flex;align-items:center;gap:6px;min-width:0;border:1px solid var(--border);border-radius:999px;padding:3px 7px;font-size:12px;background:var(--bg-elevated)}.task-chip strong{min-width:0;overflow-wrap:anywhere}.token-mini-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.token-mini-grid div{border:1px solid var(--border-soft);border-radius:var(--radius);padding:6px;min-width:0;background:var(--bg-elevated)}.token-mini-grid span{display:block;color:var(--muted);font-size:11px}.token-mini-grid strong{display:block;min-width:0;overflow-wrap:anywhere;font-size:12px}
    @media (max-width:1300px){.settings-adapter-matrix{grid-template-columns:minmax(0,1fr)}.settings-adapter-workspace{grid-template-columns:minmax(0,1fr)}.settings-validation-column{border-left:0;padding-left:0}.pricing-editor{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media (max-width:1100px){.feature-layout{grid-template-columns:minmax(0,1fr) minmax(360px,36vw)}.feature-panel-items{grid-template-columns:repeat(2,minmax(0,1fr))}.concept-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.state-flow-compact,.feature-state-flow-compact{grid-template-columns:repeat(3,minmax(0,1fr))}.settings-shell{grid-template-columns:minmax(190px,220px) minmax(0,1fr)}.settings-defaults-grid{grid-template-columns:minmax(0,1fr)}.settings-default-metrics{border-left:0;padding-left:0}}
    @media (max-width:980px){.workbench-header{display:grid;gap:8px}.grid,.feature-layout,.execution-layout,.execution-command-bar{display:block}.panel,.feature-panel{margin-bottom:10px}.current-selected-column{max-height:none;overflow:visible}.execution-context-strip{grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:8px}.execution-toolbar{justify-content:flex-start}.execution-detail-grid{grid-template-columns:minmax(0,1fr)}.execution-detail-card-wide{grid-column:auto}.detail-panel{position:static;height:auto}.stage-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.feature-panel-items{grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr))}.concept-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.settings-shell{display:block}.settings-rail{position:static;margin-bottom:10px}.settings-panel{margin-bottom:10px}.settings-hero{display:grid;align-items:start}.settings-health-strip{justify-content:flex-start}.settings-toolbar .status-text{margin-left:0}.pricing-editor,.appearance-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.settings-adapter-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.settings-adapter-stats .settings-meta-row{border-top:1px solid var(--border-soft)}}
    @media (max-width:560px){.pricing-editor,.appearance-grid,.settings-summary-row,.settings-meta-row,.settings-adapter-stats,.state-flow-compact,.feature-state-flow-compact,.execution-context-strip,.execution-selected-summary ul,.execution-feature-meta{grid-template-columns:minmax(0,1fr)}.execution-queue-header{display:none}.queue-item{grid-template-columns:minmax(0,1fr);gap:5px}.settings-actionbar{justify-content:flex-start}.settings-editor{min-height:180px}.theme-segmented{grid-template-columns:repeat(2,minmax(0,1fr))}}
  </style></head><body><div id="workbench-app-shell" class="workbench-app-shell">${renderWorkbenchSidebar(title)}<div class="workbench-page-content"><header class="workbench-header"><h1>${escapeHtml(title)}</h1></header>${body}</div></div><div id="concept-modal" class="concept-modal" hidden><div class="concept-dialog" role="dialog" aria-modal="true" aria-labelledby="concept-modal-title"><header><strong id="concept-modal-title">UI Concept</strong><button class="workbench-button button-secondary" data-command="closeConceptImage" aria-label="Close">${buttonContent("Close", "x")}</button></header><img id="concept-modal-image" alt=""></div></div><script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const LOCALE_STORAGE_KEY = "specdrive.ide.locale";
    const THEME_STORAGE_KEY = "specdrive.ide.theme";
    const SIDEBAR_STORAGE_KEY = "specdrive.ide.sidebarCollapsed";
    const WORKBENCH_LOADED_LOCALE = ${JSON.stringify(workbenchLocale)};
    const WORKBENCH_LOADED_THEME = ${JSON.stringify(workbenchTheme)};
    const WORKBENCH_TRANSLATIONS = ${JSON.stringify(workbenchTranslations)};
    const workbenchState = () => vscode.getState() || {};
    const supportedLocale = (value) => ["en", "zh-CN", "ja"].includes(value) ? value : undefined;
    const supportedTheme = (value) => ["vscode", "light", "dark", "highContrast"].includes(value) ? value : undefined;
    const browserLocale = () => {
      const language = String(navigator.language || "").toLowerCase();
      if (language.startsWith("zh")) return "zh-CN";
      if (language.startsWith("ja")) return "ja";
      return "en";
    };
    const currentWorkbenchLocale = () => {
      const stateLocale = supportedLocale(workbenchState().locale);
      const storedLocale = supportedLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
      return WORKBENCH_LOADED_LOCALE || stateLocale || storedLocale || browserLocale();
    };
    const currentWorkbenchTheme = () => {
      const stateTheme = supportedTheme(workbenchState().theme);
      const storedTheme = supportedTheme(localStorage.getItem(THEME_STORAGE_KEY));
      return WORKBENCH_LOADED_THEME || stateTheme || storedTheme || "vscode";
    };
    const sidebarCollapsed = () => {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    };
    const applySidebarState = (collapsed) => {
      const selected = Boolean(collapsed);
      localStorage.setItem(SIDEBAR_STORAGE_KEY, selected ? "true" : "false");
      document.getElementById("workbench-app-shell")?.classList.toggle("sidebar-collapsed", selected);
      const toggle = document.querySelector("[data-command='toggleWorkbenchSidebar']");
      if (toggle) {
        toggle.setAttribute("aria-expanded", selected ? "false" : "true");
        toggle.setAttribute("title", selected ? localize("Expand navigation") : localize("Collapse navigation"));
      }
    };
    const applyTheme = (theme, notify = true) => {
      const selected = supportedTheme(theme) || "vscode";
      localStorage.setItem(THEME_STORAGE_KEY, selected);
      vscode.setState({...workbenchState(), theme: selected});
      document.documentElement.dataset.workbenchTheme = selected;
      document.querySelectorAll("[data-theme-option]").forEach((button) => {
        button.setAttribute("aria-pressed", button.dataset.themeOption === selected ? "true" : "false");
      });
      if (notify) vscode.postMessage({command:"setWorkbenchTheme", theme:selected});
    };
    const localize = (source, locale = currentWorkbenchLocale()) => {
      const text = String(source || "");
      if (locale === "en") return text;
      return locale === WORKBENCH_LOADED_LOCALE ? WORKBENCH_TRANSLATIONS?.[text] || text : text;
    };
    const localizeDynamic = (message) => {
      const text = localize(message);
      if (text !== message) return text;
      const locale = currentWorkbenchLocale();
      const translations = locale === WORKBENCH_LOADED_LOCALE ? WORKBENCH_TRANSLATIONS || {} : {};
      const selectedTask = String(message || "").match(/^Selected task (.+)\.$/);
      if (selectedTask) return (translations["Selected task {id}."] || message).replace("{id}", selectedTask[1]);
      const selectedJob = String(message || "").match(/^Selected job: (.+)$/);
      if (selectedJob) return (translations["Selected job: {id}"] || message).replace("{id}", selectedJob[1]);
      const scheduling = String(message || "").match(/^Scheduling (\\d+) Feature Specs?\\.\\.\\.$/);
      if (scheduling) return (translations["Scheduling {count} Feature Specs..."] || message).replace("{count}", scheduling[1]);
      return message;
    };
    const setLocalizedText = (element, source) => {
      if (!element) return;
      element.dataset.i18nTextSource = source;
      element.textContent = localize(source);
    };
    const shouldSkipLocaleNode = (node) => {
      const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      return Boolean(element?.closest("script,style,code,pre,textarea,input,select,[data-i18n-skip]"));
    };
    const applyLocale = (locale) => {
      const selected = supportedLocale(locale) || "en";
      localStorage.setItem(LOCALE_STORAGE_KEY, selected);
      vscode.setState({...workbenchState(), locale: selected});
      document.documentElement.lang = selected;
      const languageSelect = document.getElementById("workbench-language");
      if (languageSelect) languageSelect.value = selected;
      if (selected !== WORKBENCH_LOADED_LOCALE) {
        vscode.postMessage({command:"setWorkbenchLocale", locale:selected});
        return;
      }
      document.querySelectorAll("[data-i18n-text-source]").forEach((element) => {
        element.textContent = localizeDynamic(element.dataset.i18nTextSource);
      });
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const node of textNodes) {
        if (shouldSkipLocaleNode(node)) continue;
        const raw = node.nodeValue || "";
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const source = node.__i18nSource || trimmed;
        node.__i18nSource = source;
        node.nodeValue = raw.replace(trimmed, localize(source, selected));
      }
      for (const element of document.querySelectorAll("[title],[aria-label],[placeholder],[alt]")) {
        for (const attr of ["title", "aria-label", "placeholder", "alt"]) {
          const value = element.getAttribute(attr);
          if (!value || shouldSkipLocaleNode(element)) continue;
          const sourceAttr = "i18n" + attr.replace(/(^|-)(\\w)/g, (_, __, letter) => letter.toUpperCase()) + "Source";
          const source = element.dataset[sourceAttr] || value;
          element.dataset[sourceAttr] = source;
          element.setAttribute(attr, localize(source, selected));
        }
      }
    };
    const setWorkbenchStatus = (message) => {
      const status = document.getElementById("workbench-status");
      if (status) {
        status.dataset.i18nTextSource = message;
        status.textContent = localizeDynamic(message);
      }
    };
    const workbenchFormState = () => {
      const source = workbenchState().workbenchForm;
      return source && typeof source === "object" ? source : {drafts: {}};
    };
    const writeWorkbenchFormState = (formState) => {
      vscode.setState({...workbenchState(), workbenchForm: formState});
    };
    const workbenchDraftKey = (mode, featureId, intent) => [mode || "newFeature", featureId || "", intent || ""].join("::");
    const workbenchDraftFor = (key) => {
      const drafts = workbenchFormState().drafts || {};
      const value = drafts[key];
      return typeof value === "string" ? value : "";
    };
    const saveWorkbenchFormState = () => {
      const form = document.getElementById("workbench-form");
      const input = document.getElementById("workbench-form-input");
      if (!form || !input) return;
      const key = form.dataset.draftKey || workbenchDraftKey(form.dataset.formMode, form.dataset.featureId, form.dataset.intent);
      const controlledPayload = form.dataset.controlledPayload
        ? {
          action: form.dataset.controlledAction,
          entityType: form.dataset.controlledEntityType,
          entityId: form.dataset.controlledEntityId,
          reason: form.dataset.controlledReason,
          payload: form.dataset.controlledPayload,
        }
        : undefined;
      const previous = workbenchFormState();
      writeWorkbenchFormState({
        ...previous,
        current: {
          open: !form.hidden,
          mode: form.dataset.formMode || "newFeature",
          featureId: form.dataset.featureId || "",
          intent: form.dataset.intent || "",
          controlledPayload,
        },
        drafts: {
          ...(previous.drafts || {}),
          [key]: input.value || "",
        },
      });
    };
    const clearWorkbenchFormDraft = (key) => {
      const previous = workbenchFormState();
      const drafts = {...(previous.drafts || {})};
      if (key) delete drafts[key];
      writeWorkbenchFormState({...previous, current: {...(previous.current || {}), open: false}, drafts});
    };
    const openWorkbenchForm = (mode, featureId, intent, options = {}) => {
      const form = document.getElementById("workbench-form");
      const title = document.getElementById("workbench-form-title");
      const subtitle = document.getElementById("workbench-form-subtitle");
      const prompt = document.getElementById("workbench-form-prompt");
      const input = document.getElementById("workbench-form-input");
      if (!form || !title || !subtitle || !input) return;
      form.hidden = false;
      form.dataset.formMode = mode;
      form.dataset.featureId = featureId || "";
      form.dataset.intent = intent || "";
      delete form.dataset.controlledAction;
      delete form.dataset.controlledEntityType;
      delete form.dataset.controlledEntityId;
      delete form.dataset.controlledReason;
      delete form.dataset.controlledPayload;
      const controlledPayload = options.controlledPayload && typeof options.controlledPayload === "object" ? options.controlledPayload : undefined;
      if (controlledPayload) {
        form.dataset.controlledAction = controlledPayload.action || "";
        form.dataset.controlledEntityType = controlledPayload.entityType || "";
        form.dataset.controlledEntityId = controlledPayload.entityId || "";
        form.dataset.controlledReason = controlledPayload.reason || "";
        form.dataset.controlledPayload = JSON.stringify(controlledPayload.payload || {});
      }
      const draftKey = workbenchDraftKey(mode, featureId, intent);
      form.dataset.draftKey = draftKey;
      const copy = {
        clarify: ["Clarify Feature", "Clarification", "Enter clarification content."],
        featureSpecChange: ["Feature Spec Change", "Feature request", "Enter the Feature-scoped requirement change."],
        specChange: ["Requirement Change", "Global Spec request", "Enter the requirement change."],
        specClarification: ["Clarification", "Global Spec request", "Enter the clarification question or decision."],
        newRequirement: ["New Requirement", "Global Spec request", "Enter the new requirement."],
        reviewDecision: ["Review Decision", "Approval opinion", "Enter the approval opinion before continuing."],
        newFeature: ["New Feature", "Add or change", "Enter add-or-change content."],
      }[mode] || ["New Feature", "Add or change", "Enter add-or-change content."];
      setLocalizedText(title, copy[0]);
      setLocalizedText(subtitle, copy[1]);
      if (prompt) setLocalizedText(prompt, copy[2]);
      input.value = typeof options.initialContent === "string" ? options.initialContent : workbenchDraftFor(draftKey);
      if (options.focus !== false) input.focus();
      saveWorkbenchFormState();
      setWorkbenchStatus(copy[2]);
    };
    const restoreWorkbenchFormState = () => {
      const current = workbenchFormState().current;
      if (current?.open) {
        const controlledPayload = current.controlledPayload && typeof current.controlledPayload === "object"
          ? {
            action: current.controlledPayload.action,
            entityType: current.controlledPayload.entityType,
            entityId: current.controlledPayload.entityId,
            reason: current.controlledPayload.reason,
            payload: (() => {
              try {
                return JSON.parse(current.controlledPayload.payload || "{}");
              } catch {
                return {};
              }
            })(),
          }
          : undefined;
        openWorkbenchForm(current.mode, current.featureId, current.intent, {focus: false, controlledPayload});
      }
    };
    const closeWorkbenchForm = () => {
      const form = document.getElementById("workbench-form");
      if (form) form.hidden = true;
      saveWorkbenchFormState();
    };
    const parseSettingsJson = (editor) => {
      if (!editor || typeof editor.value !== "string") return undefined;
      try {
        const parsed = JSON.parse(editor.value);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined;
      } catch {
        setWorkbenchStatus("Settings JSON must be valid before using form fields.");
        return undefined;
      }
    };
    const writeSettingsJson = (editor, config) => {
      if (editor) editor.value = JSON.stringify(config, null, 2);
    };
    const updateSettingsJson = (editorId, mutator) => {
      const editor = document.getElementById(editorId || "");
      const config = parseSettingsJson(editor);
      if (!config) return;
      writeSettingsJson(editor, mutator(config));
    };
    const rateValue = (value) => {
      const trimmed = String(value || "").trim();
      if (!trimmed) return 0;
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) && numeric >= 0 ? numeric : value;
    };
    const updateAdapterDefault = (target) => {
      updateSettingsJson(target.dataset.editorId, (config) => ({
        ...config,
        defaults: {
          ...(config.defaults && typeof config.defaults === "object" && !Array.isArray(config.defaults) ? config.defaults : {}),
          [target.dataset.settingsField]: target.value,
        },
      }));
      setWorkbenchStatus("Adapter JSON updated from form.");
    };
    const updatePricingRate = (target) => {
      const modelInput = document.getElementById(target.dataset.modelInputId || "");
      const model = String(modelInput?.value || "default");
      updateSettingsJson(target.dataset.editorId, (config) => {
        const defaults = config.defaults && typeof config.defaults === "object" && !Array.isArray(config.defaults) ? config.defaults : {};
        const costRates = defaults.costRates && typeof defaults.costRates === "object" && !Array.isArray(defaults.costRates) ? defaults.costRates : {};
        const currentRate = costRates[model] && typeof costRates[model] === "object" && !Array.isArray(costRates[model]) ? costRates[model] : {};
        return {
          ...config,
          defaults: {
            ...defaults,
            model,
            costRates: {
              ...costRates,
              [model]: {
                ...currentRate,
                [target.dataset.pricingField]: rateValue(target.value),
              },
            },
          },
        };
      });
      setWorkbenchStatus("Token pricing updated in adapter JSON.");
    };
    const selectedExecutionPreference = () => {
      const adapterSelect = document.getElementById("job-adapter-id");
      const selected = adapterSelect?.selectedOptions?.[0] || adapterSelect?.options?.[adapterSelect.selectedIndex];
      return selected ? {adapterId: selected.value, source: "job"} : undefined;
    };
    const scheduleRunPayload = (payload, executionPreference) => {
      if (payload.action !== "schedule_run") return executionPreference ? {executionPreference} : undefined;
      const result = {
        mode: "manual",
        operation: "feature_execution",
        requestedAction: "feature_execution",
      };
      if (payload.projectId) result.projectId = payload.projectId;
      if (payload.featureId || payload.entityType === "feature") result.featureId = payload.featureId || payload.entityId;
      if (payload.taskId || payload.entityType === "task") result.taskId = payload.taskId || payload.entityId;
      if (executionPreference) result.executionPreference = executionPreference;
      return result;
    };
    const selectedFeatureIds = () => {
      return Array.from(document.querySelectorAll("[data-feature-select]:checked"))
        .map((entry) => entry.dataset.featureSelect)
        .filter(Boolean);
    };
    const featurePanelOpenState = () => {
      return Object.fromEntries(Array.from(document.querySelectorAll("[data-panel]")).map((panel) => [panel.dataset.panel, Boolean(panel.open)]));
    };
    const setCurrentFeatureCard = (card) => {
      if (!card) return;
      document.querySelectorAll("[data-feature-card].current").forEach((entry) => {
        entry.classList.remove("current");
        entry.removeAttribute("aria-current");
      });
      card.classList.add("current");
      card.setAttribute("aria-current", "true");
    };
    document.addEventListener("change", (event) => {
      const languageSelect = event.target.closest("#workbench-language");
      if (languageSelect) {
        applyLocale(languageSelect.value);
        return;
      }
      const checkbox = event.target.closest("[data-feature-select]");
      if (!checkbox) return;
      const card = checkbox.closest("[data-feature-card]");
      const selected = Boolean(checkbox.checked);
      setCurrentFeatureCard(card);
      if (card) {
        card.classList.toggle("selected", selected);
        card.setAttribute("aria-selected", selected ? "true" : "false");
      }
    });
    document.addEventListener("input", (event) => {
      const settingsTarget = event.target.closest("[data-settings-field]");
      if (settingsTarget) {
        updateAdapterDefault(settingsTarget);
        return;
      }
      const pricingTarget = event.target.closest("[data-pricing-field]");
      if (pricingTarget) {
        updatePricingRate(pricingTarget);
        return;
      }
      const workbenchInput = event.target.closest("#workbench-form-input");
      if (workbenchInput) saveWorkbenchFormState();
    });
    document.addEventListener("click", (event) => {
      const featureCard = event.target.closest("[data-feature-card]");
      if (featureCard) setCurrentFeatureCard(featureCard);
      if (featureCard && !event.target.closest("[data-command]") && !event.target.closest("[data-feature-select]")) {
        vscode.postMessage({command:"selectFeature", featureId: featureCard.dataset.featureCard, panelOpenState: featurePanelOpenState()});
        return;
      }
      const target = event.target.closest("[data-command]");
      if (!target) return;
      if (target.closest(".dependency-branch > summary")) event.preventDefault();
      const payload = {...target.dataset};
      if (payload.command === "selectFeature") payload.featureId = target.dataset.featureId;
      if (payload.command === "selectQueueItem") {
        setWorkbenchStatus("Selected task " + (target.dataset.entityId || "unknown") + ".");
        vscode.postMessage(payload);
        return;
      }
      if (payload.command === "openWorkbenchForm") {
        openWorkbenchForm(payload.formMode || "newFeature", target.dataset.featureId, target.dataset.intent);
        return;
      }
      if (payload.command === "closeWorkbenchForm") {
        closeWorkbenchForm();
        setWorkbenchStatus("");
        return;
      }
      if (payload.command === "submitWorkbenchForm") {
        const form = document.getElementById("workbench-form");
        const input = document.getElementById("workbench-form-input");
        const content = input?.value?.trim() || "";
        const formMode = form?.dataset.formMode;
        if (!content && formMode !== "reviewDecision") {
          setWorkbenchStatus("Input content is required.");
          return;
        }
        if (formMode === "clarify") {
          setWorkbenchStatus("Submitting clarification...");
          vscode.postMessage({command:"reviewFeature", featureId: form.dataset.featureId, comment: content});
        } else if (formMode === "reviewDecision") {
          let controlledPayload = {};
          try {
            controlledPayload = JSON.parse(form.dataset.controlledPayload || "{}");
          } catch {
            controlledPayload = {};
          }
          const baseReason = form.dataset.controlledReason || "Run controlled command from VSCode Webview.";
          setWorkbenchStatus("Submitting review decision...");
          vscode.postMessage({
            command: "controlled",
            action: form.dataset.controlledAction,
            entityType: form.dataset.controlledEntityType,
            entityId: form.dataset.controlledEntityId,
            reason: content ? baseReason + " Note: " + content : baseReason,
            payload: {...controlledPayload, reviewNote: content, clarification: content},
          });
        } else if (formMode === "featureSpecChange") {
          setWorkbenchStatus("Submitting Feature Spec request...");
          vscode.postMessage({command:"featureSpecRequest", featureId: form.dataset.featureId, intent: form.dataset.intent, content});
        } else if (formMode === "specChange" || formMode === "specClarification") {
          setWorkbenchStatus("Submitting Spec Workspace request...");
          vscode.postMessage({command:"specWorkspaceRequest", intent: form.dataset.intent, content});
        } else if (formMode === "newRequirement") {
          setWorkbenchStatus("Submitting new requirement...");
          vscode.postMessage({command:"specWorkspaceRequest", intent: "requirement_intake", content});
        } else {
          setWorkbenchStatus("Submitting add-or-change request...");
          vscode.postMessage({command:"newFeature", content});
        }
        clearWorkbenchFormDraft(form?.dataset.draftKey);
        if (input) input.value = "";
        closeWorkbenchForm();
        return;
      }
      if (payload.command === "refresh") {
        setWorkbenchStatus("Refreshing...");
        vscode.postMessage(payload);
        return;
      }
      if (payload.command === "openConceptImage") {
        const modal = document.getElementById("concept-modal");
        const image = document.getElementById("concept-modal-image");
        const title = document.getElementById("concept-modal-title");
        if (modal && image && title) {
          image.src = target.dataset.imageSrc || "";
          image.alt = target.dataset.imageTitle || "UI Concept";
          title.textContent = target.dataset.imageTitle || "UI Concept";
          modal.hidden = false;
        }
        return;
      }
      if (payload.command === "closeConceptImage") {
        const modal = document.getElementById("concept-modal");
        if (modal) modal.hidden = true;
        return;
      }
      if (payload.command === "toggleWorkbenchSidebar") {
        applySidebarState(!document.getElementById("workbench-app-shell")?.classList.contains("sidebar-collapsed"));
        return;
      }
      if (payload.command === "openWorkbenchView") {
        setWorkbenchStatus("Opening page...");
        vscode.postMessage(payload);
        return;
      }
      const setButtonLabel = (button, label) => {
        const span = button?.querySelector?.(".button-label");
        if (span) setLocalizedText(span, label);
        else if (button) setLocalizedText(button, label);
      };
      if (payload.command === "toggleFeatureSpecView") {
        const mode = target.dataset.viewMode === "dependency" ? "dependency" : "list";
        document.querySelectorAll("[data-view-panel]").forEach((panel) => {
          panel.classList.toggle("hidden", panel.dataset.viewPanel !== mode);
        });
        target.dataset.viewMode = mode === "dependency" ? "list" : "dependency";
        setButtonLabel(target, mode === "dependency" ? "Feature List" : "Dependency Graph");
        target.setAttribute("aria-pressed", mode === "dependency" ? "true" : "false");
        return;
      }
      if (payload.command === "selectSpecStage") {
        const stageId = target.dataset.stageId;
        document.querySelectorAll("[data-workspace-panel]").forEach((entry) => entry.hidden = entry.dataset.stageDetail !== stageId);
        document.querySelectorAll(".stage").forEach((entry) => {
          const selected = entry.dataset.stageId === stageId;
          entry.classList.toggle("active", selected);
          entry.setAttribute("aria-pressed", selected ? "true" : "false");
        });
        return;
      }
      if (payload.command === "showDiagnostics") {
        document.querySelectorAll("[data-workspace-panel]").forEach((entry) => entry.hidden = entry.id !== "spec-diagnostics-panel");
        document.querySelectorAll(".stage").forEach((entry) => {
          const selected = entry === target;
          entry.classList.toggle("active", selected);
          entry.setAttribute("aria-pressed", selected ? "true" : "false");
        });
        setWorkbenchStatus("Showing diagnostics and blockers.");
        return;
      }
      if (payload.command === "toggleDependencyGraphBranches") {
        const expanded = target.dataset.expanded !== "true";
        document.querySelectorAll("#dependency-graph-panel .dependency-branch").forEach((branch) => {
          branch.open = expanded;
        });
        target.dataset.expanded = expanded ? "true" : "false";
        setButtonLabel(target, expanded ? "Collapse All" : "Expand All");
        return;
      }
      if (payload.command === "scheduleSelectedFeatures") {
        const featureIds = selectedFeatureIds();
        if (featureIds.length === 0) {
          setWorkbenchStatus("Select at least one Feature Spec.");
          return;
        }
        setWorkbenchStatus("Scheduling " + featureIds.length + " Feature Spec" + (featureIds.length === 1 ? "" : "s") + "...");
        vscode.postMessage({
          command: "scheduleFeatures",
          featureIds,
          projectId: payload.projectId,
          executionPreference: selectedExecutionPreference(),
        });
        return;
      }
      if (payload.command === "controlled") {
        const executionPreference = selectedExecutionPreference();
        if (payload.action === "schedule_run" || payload.action === "start_auto_run") payload.payload = scheduleRunPayload(payload, executionPreference);
        if (payload.reviewNoteRequired === "true") {
          openWorkbenchForm("reviewDecision", payload.entityId, payload.action, {controlledPayload: payload});
          return;
        }
        setWorkbenchStatus("Running command...");
        vscode.postMessage(payload);
        return;
      }
      if (payload.command === "settingsCommand") {
        const editor = document.getElementById(payload.editorId || "");
        setWorkbenchStatus("Applying settings command...");
        vscode.postMessage({...payload, configText: editor?.value || ""});
        return;
      }
      if (payload.command === "loadSettingsPreset") {
        const editor = document.getElementById(payload.editorId || "");
        if (editor) editor.value = target.dataset.presetJson || "";
        setWorkbenchStatus("Preset loaded into editor.");
        return;
      }
      if (payload.command === "setWorkbenchTheme") {
        applyTheme(target.dataset.themeOption);
        setWorkbenchStatus("Theme updated.");
        return;
      }
      if (payload.command === "queue") {
        const executionPreference = selectedExecutionPreference();
        if (executionPreference && (payload.action === "enqueue" || payload.action === "run_now")) {
          payload.payload = {executionPreference};
        }
      }
      vscode.postMessage(payload);
    });
    applyTheme(currentWorkbenchTheme(), false);
    applySidebarState(sidebarCollapsed());
    applyLocale(currentWorkbenchLocale());
    restoreWorkbenchFormState();
  </script></body></html>`;
}

function renderWorkbenchSidebar(activeTitle: string): string {
  const items: Array<{ title: string; label: string; view: string; icon: string }> = [
    { title: "Spec Workspace", label: "Spec Workspace", view: "specWorkspace", icon: "file" },
    { title: "Feature Spec", label: "Feature Spec", view: "featureSpec", icon: "branch" },
    { title: "Execution Workbench", label: "Execution Workbench", view: "executionWorkbench", icon: "play" },
    { title: "System Settings", label: "System Settings", view: "systemSettings", icon: "settings" },
  ];
  return `<aside class="workbench-sidebar" aria-label="Workbench navigation">
    <div class="workbench-brand"><span class="workbench-brand-mark">SD</span><span class="workbench-brand-text"><strong>SpecDrive</strong><span>Workbench</span></span></div>
    <nav class="workbench-nav">
      ${items.map((item) => `<button data-command="openWorkbenchView" data-view="${escapeAttr(item.view)}" aria-current="${item.title === activeTitle ? "page" : "false"}" title="${escapeAttr(item.label)}">${buttonIcon(item.icon)}<span class="workbench-nav-label">${escapeHtml(item.label)}</span></button>`).join("")}
    </nav>
    <div class="workbench-sidebar-footer">
      <button class="workbench-sidebar-toggle" data-command="toggleWorkbenchSidebar" aria-expanded="true" title="Collapse navigation">${buttonContent("Collapse navigation", "branch")}</button>
    </div>
  </aside>`;
}

export function commandButton(label: string, command: string, data: Record<string, string | undefined>, options: { icon?: string; variant?: string } = {}): string {
  const attrs = Object.entries({ command, ...data })
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `data-${kebab(key)}="${escapeAttr(String(value))}"`)
    .join(" ");
  const icon = options.icon ?? iconForButton(label, command, data);
  const variant = options.variant ?? variantForButton(label, command, data);
  return `<button class="workbench-button ${escapeAttr(variant)}" ${attrs}>${buttonContent(label, icon)}</button>`;
}

export function buttonContent(label: string, icon?: string): string {
  return `${buttonIcon(icon ?? "dot")}<span class="button-label">${escapeHtml(label)}</span>`;
}

export function buttonIcon(name: string): string {
  const path = ICON_PATHS[name] ?? ICON_PATHS.dot;
  return `<span class="button-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${path}</svg></span>`;
}

export function disabledButtonHtml(label: string, title?: string, icon?: string): string {
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
  return `<button class="workbench-button is-disabled" disabled${titleAttr}>${buttonContent(label, icon ?? iconForButton(label, "", {}))}</button>`;
}

function iconForButton(label: string, command: string, data: Record<string, string | undefined>): string {
  const action = (data.action ?? command ?? label).toLowerCase();
  const text = label.toLowerCase();
  if (action.includes("start_auto_run") || text.includes("start") || text.includes("run now") || text === "run") return "play";
  if (action.includes("pause") || text.includes("pause")) return "pause";
  if (action.includes("resume")) return "play";
  if (action.includes("retry") || text.includes("retry")) return "refresh";
  if (action.includes("cancel") || text.includes("cancel") || action.includes("decline") || text.includes("decline")) return "x";
  if (action.includes("reject")) return "x";
  if (action.includes("rollback")) return "undo";
  if (action.includes("update_spec")) return "file";
  if (action.includes("request_review_changes")) return "edit";
  if (action.includes("skip") || text.includes("skip")) return "skip";
  if (action.includes("reprioritize") || text.includes("priorit")) return "sort";
  if (action.includes("enqueue") || text.includes("enqueue")) return "plus";
  if (command === "refresh" || text.includes("refresh")) return "refresh";
  if (command === "openRawLogRef" || command === "openDocument" || text.includes("open")) return "external";
  if (command === "openWorkbenchForm" && (text.includes("new") || text.includes("change"))) return "plus";
  if (command === "openWorkbenchForm" || text.includes("clarif")) return "message";
  if (command === "submitWorkbenchForm" || text.includes("submit") || text.includes("save")) return "save";
  if (command === "loadSettingsPreset" || text.includes("preset")) return "copy";
  if (command === "settingsCommand" || text.includes("settings") || text.includes("adapter")) return "settings";
  if (action.includes("validate") || text.includes("validate") || text.includes("check")) return "check-circle";
  if (action.includes("activate") || text.includes("activate") || text.includes("accept") || text.includes("pass") || text === "ready") return "check";
  if (action.includes("disable")) return "power";
  if (action.includes("schedule") || text.includes("schedule")) return "calendar";
  if (text.includes("dependency") || text.includes("feature list")) return "branch";
  if (text.includes("diagnostic") || text.includes("blocker")) return "warning";
  if (text.includes("select")) return "select";
  if (text.includes("close")) return "x";
  return "dot";
}

function variantForButton(label: string, command: string, data: Record<string, string | undefined>): string {
  const action = (data.action ?? command ?? label).toLowerCase();
  const text = label.toLowerCase();
  if (action.includes("start_auto_run") || text.includes("start") || text.includes("run now") || text.includes("schedule") || text.includes("submit") || text.includes("accept") || text === "ready" || text === "pass") return "button-primary";
  if (action.includes("cancel") || action.includes("decline") || action.includes("reject") || action.includes("rollback") || action.includes("disable") || text.includes("cancel") || text.includes("decline") || text.includes("disable")) return "button-danger";
  if (action.includes("retry") || action.includes("skip") || action.includes("reprioritize") || text.includes("retry") || text.includes("skip") || text.includes("priorit") || text.includes("clarif")) return "button-warn";
  if (command === "refresh") return "button-refresh";
  if (command === "openRawLogRef" || command === "openDocument" || text.includes("open")) return "button-open";
  if (command === "selectQueueItem" || text.includes("select")) return "button-select";
  if (command === "settingsCommand" || command === "loadSettingsPreset") return "button-settings";
  return "button-secondary";
}

const ICON_PATHS: Record<string, string> = {
  branch: '<path d="M6 4v5a3 3 0 0 0 3 3h6"/><path d="M18 9l3 3-3 3"/><path d="M6 20v-5a3 3 0 0 1 3-3"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>',
  dot: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  external: '<path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="M7 5v14l11-7z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  power: '<path d="M12 2v10"/><path d="M18.4 6.6a8 8 0 1 1-12.8 0"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8"/><path d="M21 3v5h-5"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  select: '<path d="M8 12l3 3 5-6"/><path d="M4 4h16v16H4z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.63V21a2 2 0 1 1-4 0v-.08a1.8 1.8 0 0 0-1-1.63 1.8 1.8 0 0 0-2 .36l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.63-1H3a2 2 0 1 1 0-4h.08a1.8 1.8 0 0 0 1.63-1 1.8 1.8 0 0 0-.36-2l-.05-.05A2 2 0 1 1 7.13 3.9l.05.05a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 10.2 2.7V2a2 2 0 1 1 4 0v.08a1.8 1.8 0 0 0 1 1.63 1.8 1.8 0 0 0 2-.36l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.63 1H21a2 2 0 1 1 0 4h-.08a1.8 1.8 0 0 0-1.52 1z"/>',
  skip: '<path d="M5 5l8 7-8 7V5z"/><path d="M19 5v14"/>',
  sort: '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 4v16M17 4l-3 3M17 4l3 3"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  warning: '<path d="M10.3 4.5 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
};

export function autoRefreshSwitch(enabled: boolean): string {
  return `<button class="auto-refresh-switch" role="switch" aria-checked="${enabled ? "true" : "false"}" data-command="toggleAutoRefresh" data-enabled="${enabled ? "true" : "false"}" title="Refresh every 60 seconds">
    <span class="switch-track" aria-hidden="true"></span>
    ${buttonIcon("refresh")}
    <span>Auto Refresh</span>
  </button>`;
}

export function renderWorkbenchInputForm(): string {
  return `<section id="workbench-form" class="panel workbench-form" hidden data-form-mode="newFeature">
    <div class="panel-title"><h2 id="workbench-form-title">New Feature</h2><span id="workbench-form-subtitle">Add or change</span></div>
    <div class="workbench-chat">
      <label class="workbench-compose"><textarea id="workbench-form-input" aria-label="Feature input"></textarea></label>
    </div>
    <div class="workbench-form-actions">
      ${commandButton("Cancel", "closeWorkbenchForm", {})}
      ${commandButton("Submit", "submitWorkbenchForm", {})}
    </div>
  </section>`;
}

export function queueButton(label: string, item: SpecDriveIdeQueueItem | undefined, action: QueueAction): string {
  const entityId = item?.executionId ?? item?.schedulerJobId;
  if (!entityId) return disabledButtonHtml(label);
  return commandButton(label, "queue", {
    action,
    entityType: item?.executionId ? "run" : "job",
    entityId,
    reason: `${label} from Execution Workbench.`,
  });
}

export function renderQueueGroup(status: string, items: SpecDriveIdeQueueItem[], selectedKey?: string, open = false): string {
  return `<details class="queue-group"${open ? " open" : ""}><summary class="queue-head"><strong class="${statusClass(status)}">${escapeHtml(status)}</strong><span>${items.length}</span></summary>
    ${items.map((item) => {
      const key = queueItemKey(item);
      const selected = Boolean(selectedKey && key === selectedKey);
      const label = featureSpecLabel(item) ?? item.taskId ?? item.operation ?? "execution";
      return `<div class="queue-item${selected ? " selected" : ""}"><span data-i18n-skip>${escapeHtml(label)}</span><span data-i18n-skip><span class="badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span></span><span data-i18n-skip>${escapeHtml(item.adapter ?? item.runMode ?? "-")}</span><span data-i18n-skip>${escapeHtml(queueItemMetricLabel(item))}</span><span class="toolbar">${queueReviewButton(item)}${queueSelectButton(item, selected)}</span></div>`;
    }).join("") || `<div class="queue-item"><span class="muted">No items</span></div>`}
  </details>`;
}

function queueItemMetricLabel(item: SpecDriveIdeQueueItem): string {
  const duration = formatDurationMs(item.durationMs);
  const primary = item.startedAt ?? item.completedAt ?? item.adapter ?? item.status ?? "-";
  return duration ? `${primary} · ${duration}` : primary;
}

export function queueItemKey(item: SpecDriveIdeQueueItem | undefined): string | undefined {
  const entityId = item?.executionId ?? item?.schedulerJobId;
  if (!entityId) return undefined;
  return `${item?.executionId ? "run" : "job"}:${entityId}`;
}

function queueSelectButton(item: SpecDriveIdeQueueItem, selected?: boolean): string {
  const entityId = item.executionId ?? item.schedulerJobId;
  if (!entityId) return disabledButtonHtml("Select");
  return commandButton(selected ? "Selected" : "Select", "selectQueueItem", {
    entityType: item.executionId ? "run" : "job",
    entityId,
  }, { icon: selected ? "check" : "select", variant: selected ? "button-primary" : "button-select" });
}

function queueReviewButton(item: SpecDriveIdeQueueItem): string {
  if (item.status !== "review_needed") return "";
  const entityId = item.executionId ?? item.schedulerJobId;
  if (!entityId) return disabledButtonHtml("Review", "Select the queue item to inspect ReviewItem details.", "check");
  return commandButton("Review", "selectQueueItem", {
    entityType: item.executionId ? "run" : "job",
    entityId,
  }, { icon: "check" });
}

export function renderBlockerCard(item: SpecDriveIdeQueueItem): string {
  return `<div class="issue ${statusClass(item.status)}"><strong data-i18n-skip>${escapeHtml(item.featureId ?? item.executionId ?? item.schedulerJobId ?? "approval")}</strong><br>
    <span data-i18n-skip>${escapeHtml(item.summary ?? item.operation ?? item.status)}</span>
    <div class="toolbar">${queueButton("Accept", item, "approve").replace("data-action=\"approve\"", "data-action=\"approve\" data-approval-decision=\"accept\"")}${queueButton("Decline", item, "approve").replace("data-action=\"approve\"", "data-action=\"approve\" data-approval-decision=\"decline\"")}${queueButton("Retry", item, "retry")}</div>
  </div>`;
}

export function renderRawLogRefs(item: SpecDriveIdeExecutionDetail | SpecDriveIdeQueueItem | undefined): string {
  if (!item || !("rawLogs" in item)) return emptyState("No raw log references.");
  const refs = item.rawLogRefs ?? [];
  if (refs.length > 0) {
    return refs.map((ref, index) => {
      const label = rawLogRefLabel(ref, index);
      const open = isOpenableRawLogRef(ref)
        ? commandButton("Open", "openRawLogRef", { path: ref })
        : `<span class="muted">stored ref</span>`;
      return `<div class="row"><span><code>${escapeHtml(label)}</code></span>${open}</div>`;
    }).join("");
  }
  if (item.rawLogs.length === 0) return emptyState("No raw log references.");
  return item.rawLogs.map((log, index) => `<div class="row"><span>Log ${index + 1}</span><span>${escapeHtml(log.createdAt ?? "recorded")}</span></div>`).join("");
}

function isOpenableRawLogRef(ref: string): boolean {
  return ref.includes("/") || ref.includes("\\") || ref.startsWith(".");
}

function rawLogRefLabel(ref: string, index: number): string {
  const normalized = ref.replaceAll("\\", "/");
  const segments = normalized.split("/").filter(Boolean);
  return segments.length > 0 ? segments.slice(-3).join("/") : `Log ${index + 1}`;
}

export function statusClass(status: string | undefined): string {
  const value = (status ?? "").toLowerCase();
  if (["ready", "completed", "delivered", "passed", "available", "success"].some((token) => value.includes(token))) return "ok";
  if (["blocked", "failed", "error", "decline"].some((token) => value.includes(token))) return "bad";
  if (["approval", "review", "warning", "draft", "require"].some((token) => value.includes(token))) return "warn";
  return "info";
}

export function compactJsonBlock(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  return textBlock(json.length > 1200 ? `${json.slice(0, 1200)}\n...` : json);
}

export function emptyState(message: string): string {
  return `<p class="muted">${escapeHtml(message)}</p>`;
}

export function webviewNonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function kebab(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

export function executionFieldsHtml(item: SpecDriveIdeQueueItem): string {
  const fields = item.executionId
    ? [
      ["Status", item.status],
      ["Operation", item.operation],
      ["Execution", item.executionId],
      ["Feature Spec", featureSpecLabel(item)],
      ["Feature ID", item.featureId],
      ["Task", item.taskId],
      ["Adapter", item.adapter],
      ["Run Mode", item.runMode],
      ["Provider", item.adapterId],
      ["Preference", item.preferenceSource],
      ["Started", item.startedAt],
      ["Completed", item.completedAt],
      ["Duration", formatDurationMs(item.durationMs)],
      ["Updated", item.updatedAt],
    ]
    : [
      ["Status", item.status],
      ["Schedule job type", item.jobType],
      ["Schedule action", item.operation],
      ["Scheduler job", item.schedulerJobId],
      ["Feature Spec", featureSpecLabel(item)],
      ["Feature ID", item.featureId],
      ["Task", item.taskId],
      ["Adapter", item.adapter],
      ["Run Mode", item.runMode],
      ["Provider", item.adapterId],
      ["Preference", item.preferenceSource],
      ["Started", item.startedAt],
      ["Completed", item.completedAt],
      ["Duration", formatDurationMs(item.durationMs)],
      ["Updated", item.updatedAt],
    ];
  const featureDescription = item.featureDescription
    ? `<h2>Feature Spec Description</h2><p data-i18n-skip>${escapeHtml(item.featureDescription)}</p>`
    : "";
  return `${featureDescription}<ul>${fields
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([label, value]) => `<li><span>${escapeHtml(String(label))}</span>: <code>${escapeHtml(String(value))}</code></li>`)
    .join("")}</ul><h2>Summary</h2><p data-i18n-skip>${escapeHtml(item.summary ?? "No summary recorded yet.")}</p>`;
}

function featureSpecLabel(item: SpecDriveIdeQueueItem): string | undefined {
  if (item.featureTitle && item.featureId) return `${item.featureTitle} (${item.featureId})`;
  return item.featureTitle ?? item.featureId;
}

export function formatDurationMs(value: number | undefined): string | undefined {
  if (value === undefined || !Number.isFinite(value) || value < 0) return undefined;
  const totalSeconds = Math.round(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function jsonBlock(value: unknown): string {
  return textBlock(JSON.stringify(value, null, 2));
}

export function textBlock(value: string): string {
  return `<pre>${escapeHtml(value)}</pre>`;
}

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("\"", "&quot;");
}

export function documentList(documents: SpecDriveIdeDocument[]): string {
  if (documents.length === 0) return emptyState("No source documents discovered.");
  return documents.map((document) => `<div class="row"><span>${escapeHtml(document.label)}</span><button data-command="openDocument" data-path="${escapeAttr(document.path)}">${document.exists ? "Open" : "Missing"}</button></div>`).join("");
}
