import Localization from "sap/base/i18n/Localization";

export function companyName(name?: string): string {
  if (!name) return "";

  const lang = Localization.getLanguage();

  const suffix = lang.startsWith("hu") ? " Kft." : lang.startsWith("de") ? " GmbH" : " Ltd.";

  const trimmed = suffix.trim();
  if (name.endsWith(trimmed)) {
    return name;
  }

  return name + suffix;
}
