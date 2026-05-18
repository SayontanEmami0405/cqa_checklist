sap.ui.define([
  "com/emami/cqachecklist/zcqachecklist/controller/BaseController",
  "sap/ui/core/mvc/Controller",
  "../model/formatter",
  "sap/ui/core/BusyIndicator",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
],
  function (BaseController, Controller, formatter, BusyIndicator, MessageBox, Filter, FilterOperator, MessageToast) {
    "use strict";

    return BaseController.extend("com.emami.cqachecklist.zcqachecklist.controller.Approver", {
      formatter: formatter,
      onInit: function () {
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.getRoute("RouteApprover").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: function (oEvent) {
        this.fnGetChecklistList();
      },

      onPressDRSearch: function () {

        const createDateFromYYYYMMDD = (dateString) => {
          if (!/^\d{8}$/.test(dateString)) {
            throw new Error("Invalid date format. Please use YYYYMMDD.");
          }

          const year = parseInt(dateString.slice(0, 4), 10);
          const month = parseInt(dateString.slice(4, 6), 10) - 1; // Months are 0-indexed in JavaScript
          const day = parseInt(dateString.slice(6, 8), 10);

          return new Date(year, month, day);
        }
        let oDateRange = this.getView().byId("idDR");

        let dateRangeValue = oDateRange.getValue(); // Format: "dd.MM.yyyy - dd.MM.yyyy"

        let [startStr, , endStr] = dateRangeValue.split(' '); // extract both dates

        let StartDate = createDateFromYYYYMMDD(
          startStr.split('.')[2] + startStr.split('.')[1] + startStr.split('.')[0]
        );
        StartDate.setDate(StartDate.getDate() + 1);

        let EndDate = createDateFromYYYYMMDD(
          endStr.split('.')[2] + endStr.split('.')[1] + endStr.split('.')[0]
        );
        EndDate.setDate(EndDate.getDate() + 1);

        let oCheckBox = this.getView().byId("idPendingWithMe");

        let PendingWithMe = oCheckBox.getSelected() ? 'X' : '';

        // let oCheckAllCheckBox = this.getView().byId("idCheckAll");

        // let CheckAll = oCheckAllCheckBox.getSelected() ? 'X' : '';


        const formatDateForOData = (dateObj) => {
          return `/Date(${dateObj.getTime()})/`;
        };


        let that = this;
        const oDataModel = that.getOwnerComponent().getModel();
        var aFilters = [
          new sap.ui.model.Filter("CreatedOn", FilterOperator.BT, StartDate, EndDate),
          new sap.ui.model.Filter("Action", FilterOperator.EQ, "A"),
          new sap.ui.model.Filter("PendingCheck", FilterOperator.EQ, PendingWithMe)
          // new sap.ui.model.Filter("CheckAll", FilterOperator.EQ, CheckAll)
        ];
        BusyIndicator.show();

        oDataModel.read("/CRUDSet", {
          filters: aFilters,
          success: function (oSucess) {

            BusyIndicator.hide();

            that.getView().getModel("jsonCQASummaryModel").setData(null);
            that.getView().getModel("jsonCQASummaryModel").setData(oSucess.results);
          },
          error: function (oError) {
            console.log(oError);
            BusyIndicator.hide();
            sap.m.MessageToast.show("Failed to load Summary list.");
          }
        });
      },
      onPressClearCQASummary: function () {
        let oSearchField = this.getView().byId("idSearchInit");

        oSearchField.setValue("");

        let oTable = this.getView().byId("summarytableid");
        let oFilter = null;

        oTable.getBinding("items").filter(oFilter, "Application");

      },
      onItemPress: function (oEvent) {
        var that = this;
        let oSelecteditem = oEvent.getParameter("listItem");
        let oContext = oSelecteditem.getBindingContext("jsonCQASummaryModel");
        // let oData = oContext.getObject();
        let oData = this.getView().getModel("jsonCQASummaryModel").getProperty(oContext.sPath);


        const ChecklistNumber = oData?.ChecklistNumber;
        this.fnGetData(ChecklistNumber);
        this.fnLoadAttachementList(ChecklistNumber, "A");

        return;
      },
      fnGetData: function (sChecklistNumber) {
        let that = this;
        const oDataModel = that.getOwnerComponent().getModel();
        let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
        const url = "/HeaderDataSet('" + sChecklistNumber + "')";
        BusyIndicator.show();
        oDataModel.read(url, {
          success: function (oSucess) {

            BusyIndicator.hide();



            oJsonCentralModel.setProperty("/Data/FormData/ChecklistNumber", oSucess?.ChecklistNumber);
            oJsonCentralModel.setProperty("/Data/FormData/FgCode", oSucess?.FgCode);
            oJsonCentralModel.setProperty("/Data/FormData/FgDescription", oSucess?.FgDescription);
            oJsonCentralModel.setProperty("/Data/FormData/Plant", oSucess?.Plant);
            oJsonCentralModel.setProperty("/Data/FormData/ProjectType", oSucess?.ProjectType);
            oJsonCentralModel.setProperty("/Data/FormData/InitiationDate", oSucess?.InitiationDate);
            oJsonCentralModel.setProperty("/Data/FormData/BatchNumber", oSucess?.BatchNumber);
            oJsonCentralModel.setProperty("/Data/FormData/Option1", oSucess?.Option1);
            oJsonCentralModel.setProperty("/Data/FormData/Option2", oSucess?.Option2);
            oJsonCentralModel.setProperty("/Data/FormData/Option3", oSucess?.Option3);
            oJsonCentralModel.setProperty("/Data/FormData/Option4", oSucess?.Option4);
            oJsonCentralModel.setProperty("/Data/FormData/Option5", oSucess?.Option5);
            oJsonCentralModel.setProperty("/Data/FormData/Option6", oSucess?.Option6);
            oJsonCentralModel.setProperty("/Data/FormData/Option7", oSucess?.Option7);
            oJsonCentralModel.setProperty("/Data/FormData/Option8", oSucess?.Option8);
            oJsonCentralModel.setProperty("/Data/FormData/Option9", oSucess?.Option9);
            oJsonCentralModel.setProperty("/Data/FormData/Option10", oSucess?.Option10);
            oJsonCentralModel.setProperty("/Data/FormData/TotalScore", oSucess?.TotalScore);
            oJsonCentralModel.setProperty("/CheckListInfo/TotalScore", oSucess?.TotalScore);

            for (let i = 1; i <= 10; i++) {
              const optionValue = oSucess[`Option${i}`];
              if (optionValue) {
                let score = 0;
                if (optionValue === "Yes" || optionValue === "NA") {
                  score = 10;
                } else if (optionValue === "No") {
                  score = 0;
                }

                oJsonCentralModel.setProperty(`/CheckListInfo/Checklist/${i - 1}/SelectedOption`, optionValue);
                oJsonCentralModel.setProperty(`/CheckListInfo/Checklist/${i - 1}/Score`, score);
              }
            }

            oJsonCentralModel.setProperty("/Data/FormData/Sku", oSucess?.Sku);
            oJsonCentralModel.setProperty("/Visible/ShowChecklist", true);
            oJsonCentralModel.setProperty("/Visible/ShowAttachment", true);

            // that.getView().byId("revremark").setValue(oSucess?.RevRemark || "");

            oJsonCentralModel.refresh();

            oJsonCentralModel.setProperty("/Editable/WipUnitCode", false);
            oJsonCentralModel.setProperty("/Editable/WipBatchNo", false);
            oJsonCentralModel.setProperty("/Editable/WipBatchSize", false);
            oJsonCentralModel.setProperty("/Editable/WipDivision", false);

            //Status of the Workflow
            if (oSucess?.Status === "S20") {

              oJsonCentralModel.setProperty("/Visible/ApproverAcceptBtn", true);
              oJsonCentralModel.setProperty("/Visible/SendBackToReviewerBtn", true);
              // that.getView().byId("revremark").setEditable(true);

            }
            else {
              oJsonCentralModel.setProperty("/Visible/ApproverAcceptBtn", false);
              oJsonCentralModel.setProperty("/Visible/SendBackToReviewerBtn", false);
              sap.m.MessageBox.information("Checklist Approved");
            }
          },
          error: function (oError) {
            console.log(oError);
            BusyIndicator.hide();
            sap.m.MessageToast.show("Failed to load data.");
          }
        });
      },
      onPressAccept: function () {
        let that = this;
        let dialog = new sap.m.Dialog({
          title: "Confirm",
          type: "Message",
          content: [
            new sap.m.Label({
              text: "Please provide accept remarks.",
              labelFor: "acceptLabel",
            }),
            new sap.m.TextArea("acceptLabel", {
              liveChange: function (oEvent) {
                let sText = oEvent.getParameter("value");
                let parent = oEvent.getSource().getParent();
                parent.getBeginButton().setEnabled(sText.length > 0);
              },
              width: "100%",
              placeholder: "Add remarks (required)",
            }),
          ],
          beginButton: new sap.m.Button({
            type: sap.m.ButtonType.Emphasized,
            text: "Submit",
            enabled: false,
            press: function () {
              var sText = sap.ui.getCore().byId("acceptLabel").getValue();
              // sap.m.MessageToast.show("Note is: " + sText);
              that.fnAccept(sText);
              dialog.close();
            },
          }),
          endButton: new sap.m.Button({
            text: "Cancel",
            press: function () {
              dialog.close();
            },
          }),
          afterClose: function () {
            dialog.destroy();
          },
        });

        dialog.open();
      },
      fnAccept: function (sRemarks) {

        let that = this;
        let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
        // let rRemarks = this.getView().byId("appremark").getValue();
        const FormData = oJsonCentralModel?.oData?.Data?.FormData;
        const ChecklistNumber = FormData?.ChecklistNumber;


        let payload = {};
        payload['ChecklistNumber'] = ChecklistNumber;
        // payload['Action'] = "AA";
        payload['Action'] = "6";
        // payload['ZaddRemarks'] = sRemarks;
        // payload['RevRemark'] = rRemarks;
        payload['UserApp'] = 'A';
        payload['UserType'] = "A";

        const oDataModel = that.getOwnerComponent().getModel();
        BusyIndicator.show();
        oDataModel.create("/WorkflowSet", payload, {
          success: function (oSucess) {
            BusyIndicator.hide();
            MessageBox.success(
              "Accepted Successfully", {
              styleClass: !!that.getView().$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "",
              onClose: function () {
                that.onPressClear();
                that.onPressDRSearch();
                location.reload();
              }
            });
          },
          error: function (oError) {
            console.log(oError);
            BusyIndicator.hide();
            sap.m.MessageToast.show("Something went wrong while accepting.");
          }
        });
      },
      onFilterCQASummaryList: function (oEvent) {
        let sQuery = oEvent.getParameter("newValue");
        if (sQuery != "") {
          let oFilter = new sap.ui.model.Filter({
            filters: [
              new Filter("ChecklistNumber", sap.ui.model.FilterOperator.Contains, sQuery),
              new Filter("Status", sap.ui.model.FilterOperator.Contains, sQuery),
              new Filter("PendingWith", sap.ui.model.FilterOperator.Contains, sQuery),
              new Filter("FgCode", sap.ui.model.FilterOperator.Contains, sQuery),
              new Filter("Plant", sap.ui.model.FilterOperator.Contains, sQuery),
              new Filter("ProjectType", sap.ui.model.FilterOperator.Contains, sQuery),
              new Filter("BatchNumber", sap.ui.model.FilterOperator.Contains, sQuery),
              // new Filter("InitiationDate", sap.ui.model.FilterOperator.Contains, sQuery),
            ],
            and: false
          });
          var oTable = this.getView().byId("summarytableid");
          oTable.getBinding("items").filter(oFilter, "Application");
        }
      },
      onPressClear: function () {
        let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
        oJsonCentralModel.setProperty("/Visible/ShowChecklist", false);
        oJsonCentralModel.setProperty("/Visible/ShowAttachment", false);

        oJsonCentralModel.setProperty("/Data/FormData/ChecklistNumber", "");
        oJsonCentralModel.setProperty("/Data/FormData/FgCode", "");
        oJsonCentralModel.setProperty("/Data/FormData/FgDescription", "");
        oJsonCentralModel.setProperty("/Data/FormData/Plant", "");
        oJsonCentralModel.setProperty("/Data/FormData/ProjectType", "");
        oJsonCentralModel.setProperty("/Data/FormData/BatchNumber", "");

        oJsonCentralModel.setProperty("/Data/FormData/Sku", "");
        for (let i = 1; i <= 10; i++) {
          oJsonCentralModel.setProperty(`/CheckListInfo/Checklist/${i - 1}/SelectedOption`, "");
          oJsonCentralModel.setProperty(`/CheckListInfo/Checklist/${i - 1}/Score`, "");
        }
        oJsonCentralModel.setProperty("/CheckListInfo/TotalScore", 0);
        oJsonCentralModel.setProperty("/Data/FormData/TotalScore", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option1", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option2", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option3", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option4", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option5", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option6", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option7", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option8", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option9", "");
        oJsonCentralModel.setProperty("/Data/FormData/Option10", "");


        oJsonCentralModel.setProperty("/Editable/All", true);
        oJsonCentralModel.setProperty("/Editable/FgCode", false);
        oJsonCentralModel.setProperty("/Editable/FgDescription", false);
        oJsonCentralModel.setProperty("/Editable/ProjectType", false);
        oJsonCentralModel.setProperty("/Editable/BatchNumber", false);
        oJsonCentralModel.setProperty("/Editable/Sku", false);
        oJsonCentralModel.setProperty("/Editable/Plant", false);
        oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", false);
        oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", false);
        oJsonCentralModel.setProperty("/Visible/InitiatorSaveBtn", false);

        oJsonCentralModel.setProperty("/Visible/ApproverAcceptBtn", false);
        oJsonCentralModel.setProperty("/Visible/SendBackToReviewerBtn", false);

        //   var newDate = new Date();
        oJsonCentralModel.setProperty("/Data/FormData/InitiationDate", "");



        oJsonCentralModel.refresh();

        this.getView().getModel("jsonItemListModel").setData(null);
        this.getView().getModel("jsonItemListModel").refresh();

        // this.getView().getModel("jsonAttachmentListModel").setData(null);
        // this.getView().getModel("jsonAttachmentListModel").refresh();
      },
      onPressSearchApprover: function () {
        const ChecklistNumber = this.getView().byId("idChecklistNumber1").getValue();

        this.fnGetData(ChecklistNumber);
        this.fnLoadAttachementList(ChecklistNumber, "A");

      },
      onPressDRClear: function () {
        // Clear model data
        this.getView().getModel("jsonCQASummaryModel").setData(null);

        // Determine which DateRangeSelection to clear based on device
        const bIsPhone = sap.ui.Device.system.phone;
        const sDateRangeId = bIsPhone ? "idDRMobile" : "idDR";

        // Clear the DateRangeSelection value
        this.getView().byId(sDateRangeId).setValue("");

        // Optionally return
        return;

      },
      onPressSendBackToReviewer: function () {
        let that = this;
        let dialog = new sap.m.Dialog({
          title: "Confirm",
          type: "Message",
          content: [
            new sap.m.Label({
              text: "Please provide accept remarks.",
              labelFor: "sendBackToReviewer",
            }),
            new sap.m.TextArea("sendBackToReviewer", {
              liveChange: function (oEvent) {
                let sText = oEvent.getParameter("value");
                let parent = oEvent.getSource().getParent();
                parent.getBeginButton().setEnabled(sText.length > 0);
              },
              width: "100%",
              placeholder: "Add remarks (required)",
            }),
          ],
          beginButton: new sap.m.Button({
            type: sap.m.ButtonType.Emphasized,
            text: "Submit",
            enabled: false,
            press: function () {
              var sText = sap.ui.getCore().byId("sendBackToReviewer").getValue();
              // sap.m.MessageToast.show("Note is: " + sText);
              that.fnOnSendBackToReviewer(sText);
              dialog.close();
            },
          }),
          endButton: new sap.m.Button({
            text: "Cancel",
            press: function () {
              dialog.close();
            },
          }),
          afterClose: function () {
            dialog.destroy();
          },
        });

        dialog.open();
      },
      fnOnSendBackToReviewer: function (sRemarks) {

        let that = this;
        let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
        const FormData = oJsonCentralModel?.oData?.Data?.FormData;
        const ChecklistNumber = FormData?.ChecklistNumber;


        let payload = {};
        payload['ChecklistNumber'] = ChecklistNumber;
        // payload['Action'] = "AI";
        payload['Action'] = "7";
        // payload['Action'] = "8";
        // payload['ZaddRemarks'] = sRemarks;
        payload['UserType'] = "A"

        const oDataModel = that.getOwnerComponent().getModel();
        BusyIndicator.show();
        oDataModel.create("/WorkflowSet", payload, {
          success: function (oSucess) {
            BusyIndicator.hide();
            MessageBox.success(
              "Send Back To Reviewer Successfully", {
              styleClass: !!that.getView().$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "",
              onClose: function () {
                location.reload();
              }
            });
          },
          error: function (oError) {
            console.log(oError);
            BusyIndicator.hide();
            sap.m.MessageToast.show("Something went wrong while sending back to reviewer.");
          }
        });

      }

    });
  });
