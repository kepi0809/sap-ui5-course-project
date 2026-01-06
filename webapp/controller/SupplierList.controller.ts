import * as formatter from "courseproject/model/formatter";
import { t } from "courseproject/util/i18n";
import type Button from "sap/m/Button";
import type Dialog from "sap/m/Dialog";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";

export default class SupplierList extends Controller {
  public formatter = formatter;
  private _supplierDialog?: Dialog;

  public onDetailsPressed(oEvent: Event): void {
    const oSource = oEvent.getSource() as Control;
    const oCtx = oSource.getBindingContext();

    if (!oCtx) {
      return;
    }

    const iSupplierId = oCtx.getProperty("ID");

    UIComponent.getRouterFor(this).navTo("RouteSupplierDetails", {
      SupplierId: String(iSupplierId),
    });
  }

  public onOpenCreateSupplier(): void {
    if (!this.getOwnerComponent()?.getModel("SupplierFormModel")) {
      this.getOwnerComponent()?.setModel(new JSONModel(), "SupplierFormModel");
    }

    const oFormModel = this.getOwnerComponent()?.getModel("SupplierFormModel") as JSONModel;

    oFormModel.setData({
      mode: "create",
      title: t(this.getView(), "titleCreateSupplier"),
      path: "",
      ID: null,
      Name: "",
      Street: "",
      City: "",
      State: "",
      ZipCode: "",
      Country: "",
      Concurrency: 0,
      validation: {
        isValid: false,
        Name: { state: "None", text: "" },
        Street: { state: "None", text: "" },
        City: { state: "None", text: "" },
        State: { state: "None", text: "" },
        ZipCode: { state: "None", text: "" },
        Country: { state: "None", text: "" },
      },
    });

    this.onValidateSupplierForm();

    if (!this._supplierDialog) {
      this._supplierDialog = sap.ui.xmlfragment(
        "courseproject.view.fragments.SupplierDialog",
        this
      ) as Dialog;

      this.getView()?.addDependent(this._supplierDialog);
    }

    this._supplierDialog.open();
  }

  public onSupplierDialogClose(oEvent: Event): void {
    const oButton = oEvent.getSource() as Button;
    const oDialog = oButton.getParent() as Dialog;
    oDialog.close();
  }

  public onValidateSupplierForm(): void {
    const oFormModel = this.getOwnerComponent()?.getModel("SupplierFormModel") as
      | JSONModel
      | undefined;
    if (!oFormModel) return;

    const requiredFields = ["Name", "Street", "City", "State", "ZipCode", "Country"] as const;

    let isValid = true;

    for (const field of requiredFields) {
      const value = String(oFormModel.getProperty(`/${field}`) ?? "").trim();

      if (!value) {
        isValid = false;
        oFormModel.setProperty(`/validation/${field}/state`, "Error");
        oFormModel.setProperty(
          `/validation/${field}/text`,
          t(this.getView(), "validationRequired")
        );
      } else {
        oFormModel.setProperty(`/validation/${field}/state`, "None");
        oFormModel.setProperty(`/validation/${field}/text`, "");
      }
    }

    oFormModel.setProperty("/validation/isValid", isValid);
  }

  public onSaveSupplier(oEvent: Event): void {
    const oFormModel = this.getOwnerComponent()?.getModel("SupplierFormModel");

    if (!oFormModel) return;

    this.onValidateSupplierForm();

    const isValid = oFormModel.getProperty("/validation/isValid");
    if (!isValid) {
      MessageBox.error(t(this.getView(), "validationFixErrors"));
      return;
    }

    const sMode = oFormModel.getProperty("/mode");

    if (sMode !== "create") return MessageBox.error(t(this.getView(), "errorNotInCreateMode"));

    const oPayload: any = {
      __metadata: { type: "ODataDemo.Supplier" },
      ID: Math.floor(Math.random() * 1000000),
      Name: oFormModel.getProperty("/Name"),
      Address: {
        __metadata: { type: "ODataDemo.Address" },
        Street: oFormModel.getProperty("/Street"),
        City: oFormModel.getProperty("/City"),
        State: oFormModel.getProperty("/State"),
        ZipCode: oFormModel.getProperty("/ZipCode"),
        Country: oFormModel.getProperty("/Country"),
      },
      Concurrency: 0,
    };

    const oModel: any = this.getView()?.getModel();

    oModel.create("/Suppliers", oPayload, {
      headers: { "Content-ID": 1 },
      success: () => {
        MessageToast.show(t(this.getView(), "supplierCreated"));
        this.onSupplierDialogClose(oEvent);
        oModel.refresh(true);
      },
      error: () => MessageBox.error(t(this.getView(), "errorCreateFailed")),
    });
  }
}
