import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type Event from "sap/ui/base/Event";
import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";
import UIComponent from "sap/ui/core/UIComponent";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";

type RouteMatchedParams = {
  arguments: {
    SupplierId: string;
  };
};

export default class SupplierDetails extends Controller {
  private _supplierDialog?: sap.m.Dialog;

  public onInit(): void {
    this.getView().setModel(new JSONModel({ busy: true }), "view");
    this.getView().setModel(new JSONModel({ busy: false, items: [] }), "CategoriesModel");

    UIComponent.getRouterFor(this)
      .getRoute("RouteSupplierDetails")
      ?.attachPatternMatched(this.onRouteMatched, this);
  }

  private onRouteMatched(oEvent: Event<RouteMatchedParams>): void {
    const sSupplierId = oEvent.getParameter("arguments").SupplierId;
    if (!sSupplierId) return;

    const oViewModel = this.getView().getModel("view") as JSONModel;
    oViewModel.setProperty("/busy", true);

    const iSupplierId = Number(sSupplierId);

    this.getView().bindElement({
      path: `/Suppliers(${encodeURIComponent(String(sSupplierId))})`,
      events: {
        dataRequested: () => oViewModel.setProperty("/busy", true),
        dataReceived: () => oViewModel.setProperty("/busy", false),
      },
    });

    setTimeout(() => {
      const oCtx = this.getView().getBindingContext();
      if (oCtx && oCtx.getObject()) oViewModel.setProperty("/busy", false);
    }, 0);

    this.loadCategoriesForSupplier(iSupplierId);
  }

  public onNavBack(): void {
    const sPrevHash = History.getInstance().getPreviousHash();
    if (sPrevHash !== undefined) {
      window.history.go(-1);
      return;
    }
    UIComponent.getRouterFor(this).navTo("RouteSupplierList", {}, true);
  }

  public onOpenEditSupplier(): void {
    const oCtx = this.getView().getBindingContext();
    const oSupplier = oCtx?.getObject() as any;

    if (!oCtx || !oSupplier) {
      MessageBox.error("Supplier not loaded yet.");
      return;
    }

    if (!this.getOwnerComponent().getModel("SupplierFormModel")) {
      this.getOwnerComponent().setModel(new JSONModel(), "SupplierFormModel");
    }

    const oFormModel = this.getOwnerComponent().getModel("SupplierFormModel") as JSONModel;

    oFormModel.setData({
      mode: "edit",
      title: "Edit supplier",
      path: oCtx.getPath(),
      ID: oSupplier.ID ?? null,
      Name: oSupplier.Name ?? "",
      Street: oSupplier.Address?.Street ?? "",
      City: oSupplier.Address?.City ?? "",
      State: oSupplier.Address?.State ?? "",
      ZipCode: oSupplier.Address?.ZipCode ?? "",
      Country: oSupplier.Address?.Country ?? "",
      Concurrency: oSupplier.Concurrency ?? 0,
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

  public onSupplierDialogClose(oEvent: sap.ui.base.Event): void {
    const oButton = oEvent.getSource() as sap.m.Button;
    const oDialog = oButton.getParent() as sap.m.Dialog;
    oDialog.close();
  }

  public onSaveSupplier(oEvent: sap.ui.base.Event): void {
    const oFormModel = this.getOwnerComponent().getModel("SupplierFormModel") as JSONModel;
    const sMode = oFormModel.getProperty("/mode");
    const sPath = oFormModel.getProperty("/path");

    if (sMode !== "edit" || !sPath) {
      MessageBox.error("This dialog is not in edit mode.");
      return;
    }

    const oPayload: any = {
      Name: oFormModel.getProperty("/Name"),
      Address: {
        Street: oFormModel.getProperty("/Street"),
        City: oFormModel.getProperty("/City"),
        State: oFormModel.getProperty("/State"),
        ZipCode: oFormModel.getProperty("/ZipCode"),
        Country: oFormModel.getProperty("/Country"),
      },
      Concurrency: oFormModel.getProperty("/Concurrency"),
    };

    const oModel: any = this.getView().getModel();

    oModel.update(sPath, oPayload, {
      merge: true,
      headers: { "Content-ID": 1 },
      success: () => {
        MessageToast.show("Supplier updated");
        this.onSupplierDialogClose(oEvent);

        // refresh details binding
        oModel.refresh(true);
      },
      error: (err: any) => {
        console.log("UPDATE Supplier error:", err);
        console.log("UPDATE Supplier error.responseText:", err?.responseText);
        MessageBox.error("Update failed. Check console for details.");
      },
    });
  }

  public onDeleteSupplier(): void {
    const oCtx = this.getView().getBindingContext();
    const sPath = oCtx?.getPath();

    if (!sPath) {
      MessageBox.error("Supplier not loaded yet.");
      return;
    }

    MessageBox.confirm(
      this.getView().getModel("i18n")?.getResourceBundle().getText("supplierDeleteButton"),
      {
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.DELETE,
        onClose: (sAction) => {
          if (sAction !== MessageBox.Action.DELETE) {
            return;
          }

          const oModel: any = this.getView().getModel();
          oModel.remove(sPath, {
            headers: { "Content-ID": 1 },
            success: () => {
              MessageToast.show(
                this.getView().getModel("i18n")?.getResourceBundle().getText("supplier_deleted")
              );
              UIComponent.getRouterFor(this).navTo("RouteSupplierList", {}, true);
            },
            error: (err: any) => {
              console.log("DELETE Supplier error:", err);
              console.log(err?.responseText);
              MessageBox.error("Delete failed.");
            },
          });
        },
      }
    );
  }

  private loadCategoriesForSupplier(iSupplierId: number): void {
    const oCategoriesModel = this.getView().getModel("CategoriesModel") as JSONModel;
    oCategoriesModel.setProperty("/busy", true);
    oCategoriesModel.setProperty("/items", []);

    const oModel: any = this.getView().getModel();

    oModel.read("/Products", {
      headers: { "Content-ID": 1 },
      filters: [
        new Filter({
          path: "Supplier/ID",
          operator: FilterOperator.EQ,
          value1: iSupplierId,
        }),
      ],
      urlParameters: {
        $expand: "Category",
      },
      success: (oData: any) => {
        const aResults: any[] = oData?.results ?? [];

        const mById = new Map<number, any>();

        for (const oProduct of aResults) {
          const oCat = oProduct?.Category;
          if (!oCat) continue;

          const iCatId = Number(oCat.ID);
          if (!mById.has(iCatId)) {
            mById.set(iCatId, {
              ID: iCatId,
              Name: oCat.Name ?? "",
              Description: oCat.Description ?? "",
            });
          }
        }

        oCategoriesModel.setProperty("/items", Array.from(mById.values()));
        oCategoriesModel.setProperty("/busy", false);
      },
      error: (err: any) => {
        console.log("Categories load error:", err);
        console.log("Categories load error.responseText:", err?.responseText);
        oCategoriesModel.setProperty("/busy", false);
      },
    });
  }
}
