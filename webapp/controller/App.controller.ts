import Localization from "sap/base/i18n/Localization";
import type Event from "sap/ui/base/Event";
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";

export default class App extends Controller {
  private readonly storageKey = "courseproject_lang";

  async onInit(): Promise<void> {
    const saved = window.localStorage.getItem(this.storageKey);
    const lang = saved === "hu" || saved === "en" || saved === "de" ? saved : "hu";

    this.getView().setModel(new JSONModel({ lang }), "view");
    await Localization.setLanguage(lang);
  }

  async onLanguageChange(oEvent: Event): Promise<void> {
    const item = oEvent.getParameter("selectedItem") as sap.ui.core.Item;
    const lang = item.getKey(); // hu | en | de

    window.localStorage.setItem(this.storageKey, lang);
    (this.getView().getModel("view") as JSONModel).setProperty("/lang", lang);

    await Localization.setLanguage(lang);
  }
}
