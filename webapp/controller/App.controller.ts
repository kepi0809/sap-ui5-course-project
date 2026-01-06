import Localization from "sap/base/i18n/Localization";
import type Event from "sap/ui/base/Event";
import type Item from "sap/ui/core/Item";
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";

export default class App extends Controller {
  private readonly storageKey = "courseproject_lang";

  onInit() {
    const saved = window.localStorage.getItem(this.storageKey);
    const lang = saved === "hu" || saved === "en" || saved === "de" ? saved : "hu";

    this.getView()?.setModel(new JSONModel({ lang }), "view");
    Localization.setLanguage(lang);
  }

  async onLanguageChange(oEvent: Event): Promise<void> {
    const item = (oEvent as any).getParameter("selectedItem") as Item | null;
    const lang = item?.getKey() || "hu";

    window.localStorage.setItem(this.storageKey, lang);
    (this.getView()?.getModel("view") as JSONModel).setProperty("/lang", lang);

    await Localization.setLanguage(lang);
  }
}
