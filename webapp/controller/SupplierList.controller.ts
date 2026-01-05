import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type Event from "sap/ui/base/Event";
import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";

export default class SupplierList extends Controller {
  private _supplierDialog?: sap.m.Dialog;

  public onInit(): void {}

  public onDetailsPressed(oEvent: Event): void {
    const oCtx = oEvent.getSource().getBindingContext();
    if (!oCtx) {
      return;
    }

    const iSupplierId = oCtx.getProperty("ID");

    UIComponent.getRouterFor(this).navTo("RouteSupplierDetails", {
      SupplierId: String(iSupplierId),
    });
  }

  public onOpenCreateSupplier(): void {
    if (!this.getOwnerComponent().getModel("SupplierFormModel")) {
      this.getOwnerComponent().setModel(new JSONModel(), "SupplierFormModel");
    }

    const oFormModel = this.getOwnerComponent().getModel("SupplierFormModel") as JSONModel;

    oFormModel.setData({
      mode: "create",
      title: "Create supplier",
      path: "",
      ID: null,
      Name: "",
      Street: "",
      City: "",
      State: "",
      ZipCode: "",
      Country: "",
      Concurrency: 0,
    });

    if (!this._supplierDialog) {
      this._supplierDialog = sap.ui.xmlfragment(
        "courseproject.view.fragments.SupplierDialog",
        this
      ) as sap.m.Dialog;

      this.getView().addDependent(this._supplierDialog);
    }

    this._supplierDialog.open();
  }

  public onSupplierDialogClose(oEvent: Event): void {
    const oButton = oEvent.getSource() as sap.m.Button;
    const oDialog = oButton.getParent() as sap.m.Dialog;
    oDialog.close();
  }

  public onSaveSupplier(oEvent: Event): void {
    const oFormModel = this.getOwnerComponent().getModel("SupplierFormModel") as JSONModel;
    const sMode = oFormModel.getProperty("/mode");

    if (sMode !== "create") {
      MessageBox.error("This dialog is not in create mode.");
      return;
    }

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

    const oModel: any = this.getView().getModel();

    oModel.create("/Suppliers", oPayload, {
      headers: {
        "Content-ID": 1,
      },
      success: () => {
        MessageToast.show("Supplier created");
        this.onSupplierDialogClose(oEvent);

        // update list
        oModel.refresh(true);
      },
      error: (err: any) => {
        console.log("CREATE Supplier error:", err);
        console.log("CREATE Supplier error.responseText:", err?.responseText);
        MessageBox.error("Create failed. Check console for details.");
      },
    });
  }
}
