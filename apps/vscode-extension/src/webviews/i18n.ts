export type WorkbenchLocale = "en" | "zh-CN" | "ja";
export type WorkbenchTranslationMap = Record<string, string>;

declare const require: (id: string) => unknown;

export function isWorkbenchLocale(value: unknown): value is WorkbenchLocale {
  return value === "en" || value === "zh-CN" || value === "ja";
}

export function normalizeWorkbenchLocale(value: unknown): WorkbenchLocale {
  return isWorkbenchLocale(value) ? value : "en";
}

export function workbenchTranslationsForLocale(locale: WorkbenchLocale): WorkbenchTranslationMap {
  if (locale === "zh-CN") {
    return (require("./i18n.zh-CN") as { ZH_CN_TRANSLATIONS: WorkbenchTranslationMap }).ZH_CN_TRANSLATIONS;
  }
  if (locale === "ja") {
    return (require("./i18n.ja") as { JA_TRANSLATIONS: WorkbenchTranslationMap }).JA_TRANSLATIONS;
  }
  return {};
}
