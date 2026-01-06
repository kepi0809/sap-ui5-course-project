import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type View from "sap/ui/core/mvc/View";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

export function t(view: View | undefined, key: string, args?: Array<string | number>): string {
  const oI18nModel = view?.getModel("i18n") as ResourceModel | undefined;
  if (!oI18nModel) return key;

  const oBundle = oI18nModel.getResourceBundle() as ResourceBundle | undefined;
  return oBundle?.getText(key, args) ?? key;
}
