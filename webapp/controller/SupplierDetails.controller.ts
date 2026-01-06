import * as formatter from "courseproject/model/formatter";
import { t } from "courseproject/util/i18n";
import type Button from "sap/m/Button";
import type Dialog from "sap/m/Dialog";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type Event from "sap/ui/base/Event";
import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";
import UIComponent from "sap/ui/core/UIComponent";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";

export default class SupplierDetails extends Controller {
  public formatter = formatter;
  private _supplierDialog?: Dialog;

  public onInit(): void {
    this.getView()?.setModel(new JSONModel({ busy: true }), "view");
    this.getView()?.setModel(new JSONModel({ busy: false, items: [] }), "CategoriesModel");

    UIComponent.getRouterFor(this)
      .getRoute("RouteSupplierDetails")
      ?.attachPatternMatched(this.onRouteMatched, this);
  }

  private onRouteMatched(oEvent: Event): void {
    // * couldn't fix it cleanly
    const oArgs = (oEvent as any).getParameter("arguments") as { SupplierId?: string } | undefined;
    const sSupplierId = oArgs?.SupplierId;

    if (!sSupplierId) {
      return;
    }

    const oViewModel = this.getView()?.getModel("view") as JSONModel;
    oViewModel.setProperty("/busy", true);

    const iSupplierId = Number(sSupplierId);

    this.getView()?.bindElement({
      path: `/Suppliers(${encodeURIComponent(String(sSupplierId))})`,
      events: {
        dataRequested: () => oViewModel.setProperty("/busy", true),
        dataReceived: () => oViewModel.setProperty("/busy", false),
      },
    });

    setTimeout(() => {
      const oCtx = this.getView()?.getBindingContext();
      if (oCtx && oCtx.getObject()) {
        oViewModel.setProperty("/busy", false);
      }
    }, 0);

    this.loadCategoriesForSupplier(iSupplierId);
  }

  public onNavBack(): void {
    const sPrevHash = History.getInstance().getPreviousHash();
    if (sPrevHash !== undefined) return window.history.go(-1);

    UIComponent.getRouterFor(this).navTo("RouteSupplierList", {}, true);
  }

  public onOpenEditSupplier(): void {
    const oCtx = this.getView()?.getBindingContext();
    const oSupplier = oCtx?.getObject() as any;

    if (!oCtx || !oSupplier) return MessageBox.error(t(this.getView(), "errorSupplierNotLoaded"));

    if (!this.getOwnerComponent()?.getModel("SupplierFormModel"))
      this.getOwnerComponent()?.setModel(new JSONModel(), "SupplierFormModel");

    const oFormModel = this.getOwnerComponent()?.getModel("SupplierFormModel") as JSONModel;

    oFormModel.setData({
      mode: "edit",
      title: t(this.getView(), "titleEditSupplier"),
      path: oCtx.getPath(),
      ID: oSupplier.ID ?? null,
      Name: oSupplier.Name ?? "",
      Street: oSupplier.Address?.Street ?? "",
      City: oSupplier.Address?.City ?? "",
      State: oSupplier.Address?.State ?? "",
      ZipCode: oSupplier.Address?.ZipCode ?? "",
      Country: oSupplier.Address?.Country ?? "",
      Concurrency: oSupplier.Concurrency ?? 0,
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
        this.getView()!.getId(),
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
    const oFormModel = this.getOwnerComponent()?.getModel("SupplierFormModel") as JSONModel;

    this.onValidateSupplierForm();

    const isValid = oFormModel.getProperty("/validation/isValid");
    if (!isValid) {
      MessageBox.error(t(this.getView(), "validationFixErrors"));
      return;
    }

    const sMode = oFormModel.getProperty("/mode");
    const sPath = oFormModel.getProperty("/path");

    if (sMode !== "edit" || !sPath)
      return MessageBox.error(t(this.getView(), "errorNotInEditMode"));

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

    const oModel: any = this.getView()?.getModel();

    oModel.update(sPath, oPayload, {
      merge: true,
      headers: { "Content-ID": 1 },
      success: () => {
        MessageToast.show(t(this.getView(), "supplierUpdated"));
        this.onSupplierDialogClose(oEvent);

        // refresh details binding
        oModel.refresh(true);
      },
      error: () => MessageBox.error(t(this.getView(), "errorUpdateFailed")),
    });
  }

  public onDeleteSupplier(): void {
    const oCtx = this.getView()?.getBindingContext();
    const sPath = oCtx?.getPath();

    if (!sPath) return MessageBox.error(t(this.getView(), "errorSupplierNotLoaded"));

    MessageBox.confirm(t(this.getView(), "supplierDeleteButton"), {
      actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.DELETE,
      onClose: (sAction) => {
        if (sAction !== MessageBox.Action.DELETE) return;

        const oModel: any = this.getView()?.getModel();
        oModel.remove(sPath, {
          headers: { "Content-ID": 1 },
          success: () => {
            MessageToast.show(t(this.getView(), "supplier_deleted"));
            UIComponent.getRouterFor(this).navTo("RouteSupplierList", {}, true);
          },
          error: () => MessageBox.error(t(this.getView(), "errorDeleteFailed")),
        });
      },
    });
  }

  private loadCategoriesForSupplier(iSupplierId: number): void {
    const oCategoriesModel = this.getView()?.getModel("CategoriesModel") as JSONModel;
    oCategoriesModel.setProperty("/busy", true);
    oCategoriesModel.setProperty("/items", []);

    const oModel: any = this.getView()?.getModel();

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
      error: () => oCategoriesModel.setProperty("/busy", false),
    });
  }
}
