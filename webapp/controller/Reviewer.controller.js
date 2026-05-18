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

        return BaseController.extend("com.emami.cqachecklist.zcqachecklist.controller.Reviewer", {
            formatter: formatter,
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteReviewer").attachPatternMatched(this._onObjectMatched, this);
            },

            _onObjectMatched: function (oEvent) {
                var that = this;
                this.fnGetReviewerApproverList();
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
                    new sap.ui.model.Filter("Action", FilterOperator.EQ, "R"),
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
                // 1. Clear the SearchField value dynamically
                var oSearchField = sap.ui.Device.system.phone
                    ? this.getView().byId("idSearchInitMobile")
                    : this.getView().byId("idSearchInit");
                oSearchField.setValue("");

                // 2. Clear any filters on your table binding
                var oTable = this.getView().byId("summarytableid");
                // Passing null or an empty array will remove all filters
                oTable.getBinding("items").filter(null, "Application");

            },
            onItemPress: function (oEvent) {
                var that = this;
                let oSelecteditem = oEvent.getParameter("listItem");
                let oContext = oSelecteditem.getBindingContext("jsonCQASummaryModel");
                // let oData = oContext.getObject();
                let oData = this.getView().getModel("jsonCQASummaryModel").getProperty(oContext.sPath);
                let oModel = this.getView().getModel("RevAppJsonModel");
                let aData = oModel.getData();

                if (!Array.isArray(aData)) {
                    aData = aData.results || [];
                }

                let sUname = ""; // variable to hold single username

                for (let i = 0; i < aData.length; i++) {
                    if (aData[i].Type === "I" && aData[i].Uname) {
                        sUname = aData[i].Uname;
                        break; // stop after first match
                    }
                }

                console.log("Reviewer username:", sUname);
                if (oData.PendingWith !== sUname) {
                    sUname = ""
                }


                const ChecklistNumber = oData?.ChecklistNumber;
                this.onPressClear();
                this.fnGetData(ChecklistNumber, sUname);

                this.fnLoadAttachementList(ChecklistNumber, "R");
                return;
            },
            fnGetData: function (sChecklistNumber, sUname) {
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
                        if (oSucess?.Status === "S10") {

                            oJsonCentralModel.setProperty("/Editable/Options", true);
                            oJsonCentralModel.setProperty("/Editable/BatchNumber", true);
                            oJsonCentralModel.setProperty("/Visible/SendBackToInitiatorBtn", true);
                            oJsonCentralModel.setProperty("/Visible/ReviewerInitiateBtn", true);
                            oJsonCentralModel.setProperty("/Visible/ReviewerSaveBtn", true);
                            oJsonCentralModel.setProperty("/Visible/FileUploaderControl", true);
                            oJsonCentralModel.setProperty("/Visible/UploadFileBtn", true);
                            oJsonCentralModel.setProperty("/Visible/FileUploaderControlDialog", true);
                            oJsonCentralModel.setProperty("/Visible/UploadFileDialogBtn", true);
                            oJsonCentralModel.setProperty("/Visible/AttachementDeleteBtn", true);

                        }
                        else if (oSucess?.Status === "S20") {
                            oJsonCentralModel.setProperty("/Editable/Options", false);
                            oJsonCentralModel.setProperty("/Visible/SendBackToInitiatorBtn", false);
                            oJsonCentralModel.setProperty("/Visible/ReviewerInitiateBtn", false);
                            oJsonCentralModel.setProperty("/Visible/ReviewerSaveBtn", false);
                            sap.m.MessageBox.information("Checklist Under Aprroval");
                        }
                        else if (oSucess?.Status === "S30") {
                            oJsonCentralModel.setProperty("/Editable/Options", false);
                            oJsonCentralModel.setProperty("/Visible/SendBackToInitiatorBtn", false);
                            oJsonCentralModel.setProperty("/Visible/ReviewerInitiateBtn", false);
                            oJsonCentralModel.setProperty("/Visible/ReviewerSaveBtn", false);
                            sap.m.MessageBox.information("Checklist Approved");
                        }
                        else {
                            // if (sUname !== "") {
                                oJsonCentralModel.setProperty("/Editable/Options", true);
                            oJsonCentralModel.setProperty("/Editable/BatchNumber", true);
                            oJsonCentralModel.setProperty("/Visible/SendBackToInitiatorBtn", true);
                            oJsonCentralModel.setProperty("/Visible/ReviewerInitiateBtn", true);
                            oJsonCentralModel.setProperty("/Visible/ReviewerSaveBtn", true);
                            oJsonCentralModel.setProperty("/Visible/FileUploaderControl", true);
                            oJsonCentralModel.setProperty("/Visible/UploadFileBtn", true);
                            oJsonCentralModel.setProperty("/Visible/FileUploaderControlDialog", true);
                            oJsonCentralModel.setProperty("/Visible/UploadFileDialogBtn", true);
                            oJsonCentralModel.setProperty("/Visible/AttachementDeleteBtn", true);

                            // }
                        }
                        oJsonCentralModel.refresh();
                    },
                    error: function (oError) {
                        console.log(oError);
                        BusyIndicator.hide();
                        sap.m.MessageToast.show("Failed to load data.");
                    }
                });
            },
            onOptionChange: function (oEvent) {

                const oSelectedItem = oEvent.getSource().getSelectedItem();
                const sKey = oSelectedItem.getKey();

                const oContext = oEvent.getSource().getBindingContext("jsonCentralModel");
                const oModel = oContext.getModel();
                const sItemPath = oContext.getPath(); // path to the current line item

                // Set score
                let score = 0;
                if (sKey === "Yes" || sKey === "NA") {
                    score = 10;
                }

                // Update score in checklist line item
                oModel.setProperty(sItemPath + "/Score", score);

                // Update corresponding Option in FormData
                const aChecklist = oModel.getProperty("/CheckListInfo/Checklist");

                // Get index or identifier for option
                const index = parseInt(sItemPath.split("/").pop(), 10); // index of line item
                const optionKey = "Option" + (index + 1); // Option1 to Option10

                oModel.setProperty("/Data/FormData/" + optionKey, sKey); // Set selected value in FormData

                // Recalculate total score
                const total = aChecklist.reduce((acc, item) => acc + (item.Score * 1 || 0), 0);
                oModel.setProperty("/CheckListInfo/TotalScore", total);
                oModel.setProperty("/Data/FormData/TotalScore", total);
                if (total <= 80) {
                    oModel.setProperty("/Visible/Remarks", true);
                } else {
                    oModel.setProperty("/Visible/Remarks", false);
                }


                oModel.refresh();
            }

            ,
            onPressSave: function () {
                var that = this;
                var oODataModel = this.getView().getModel(); // OData model
                var oFormData = this.getView().getModel("jsonCentralModel").getProperty("/Data/FormData");
                var oJsonCentralModel = this.getView().getModel("jsonCentralModel");


                // Format InitiationDate to OData format if not empty
                var sInitiationDate = oFormData.InitiationDate;
                var oFormattedDate = new Date();



                // Format current time as ISO 8601 Duration
                var currentDate = new Date();
                var day = currentDate.getDate().toString().padStart(2, '0');
                var month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
                var year = currentDate.getFullYear().toString();
                var hours = currentDate.getHours().toString().padStart(2, '0');
                var minutes = currentDate.getMinutes().toString().padStart(2, '0');
                var seconds = currentDate.getSeconds().toString().padStart(2, '0');
                var sTime = `PT${hours}H${minutes}M${seconds}S`;
                var oDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                var sDate = "/Date(" + oDate.getTime() + ")/";


                var oPayload = {
                    ChecklistNumber: oFormData.ChecklistNumber || "",
                    FgCode: oFormData.FgCode,
                    FgDescription: oFormData.FgDescription,
                    Plant: oFormData.Plant,
                    ProjectType: oFormData.ProjectType,
                    BatchNumber: oFormData.BatchNumber,
                    InitiationDate: sInitiationDate,
                    Sku: oFormData.Sku,
                    Option1: oFormData.Option1,
                    Option2: oFormData.Option2,
                    Option3: oFormData.Option3,
                    Option4: oFormData.Option4,
                    Option5: oFormData.Option5,
                    Option6: oFormData.Option6,
                    Option7: oFormData.Option7,
                    Option8: oFormData.Option8,
                    Option9: oFormData.Option9,
                    Option10: oFormData.Option10,
                    TotalScore: oFormData.TotalScore,
                };

                oODataModel.create("/HeaderDataSet", oPayload, {
                    success: function (oResponse) {
                        oJsonCentralModel.setProperty("/Data/FormData/ChecklistNumber", oResponse.ChecklistNumber);
                        oJsonCentralModel.refresh();
                        MessageToast.show("Checklist saved successfully.");
                    },
                    error: function (oError) {
                        MessageBox.error("Failed to save checklist.");
                        console.error(oError);
                    }
                });
            },
            onPressForwardToApprover: function () {

                // var oModel = this.getView().getModel("jsonItemListModel");
                // var aData = oModel.getData(); // Array of items
                // var isValid = true;
                // var errorList = [];

                // var aRequiredFields = [
                //   "RmVendorStatus",
                //   "RmBatchNo", "RmVendorName", "RmLotNo", "RmLotRevDate", "RmQcRelDate",
                //   "RmMfg", "RmExpDate", "TotalQuan", "UnderRect", "RelQuan",
                //   "SiteRemark"
                // ];

                // aData.forEach(function (oItem, index) {
                //   aRequiredFields.forEach(function (field) {
                //     var value = oItem[field];
                //     if (
                //       value === null ||
                //       value === undefined ||
                //       (typeof value === "string" && value.trim() === "")
                //     ) {
                //       isValid = false;
                //       errorList.push("Row " + (index + 1) + ": " + field);
                //     }
                //   });
                // });

                // if (!isValid) {
                //   MessageBox.error("Please fill all mandatory fields:\n\n" + errorList.join("\n"));
                //   return;
                // }

                var that = this;
                let oJsonCentralModel = that.getView().getModel("jsonCentralModel");
                oJsonCentralModel.setProperty("/Visible/ShowReviewer", false);

                if (!that.ChooseReviewerAndApproverDialog) {
                    that.ChooseReviewerAndApproverDialog = sap.ui.xmlfragment("com.emami.cqachecklist.zcqachecklist.view.fragments.ChooseReviewerAndApproverDialog", that);
                    that.getView().addDependent(that.ChooseReviewerAndApproverDialog);
                }
                that.ChooseReviewerAndApproverDialog.open();
            },
            onCancelChooseReviewerAndApproverDialog: function () {
                var that = this;
                that.ChooseReviewerAndApproverDialog.close();
                that.ChooseReviewerAndApproverDialog.destroy();
                that.ChooseReviewerAndApproverDialog = null;
            },
            onConfirmChooseReviewerAndApproverDialog: function () {
                let ApproverKey = sap.ui.getCore().byId("idApproverDialog").getSelectedKey();
                if (!ApproverKey) {
                    sap.m.MessageBox.error("Approver should not be blank.");
                    return;
                }
                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                let isReviewerHidden = !oJsonCentralModel.getProperty("/Visible/ShowReviewer"); // Check visibility flag

                let Remarks = sap.ui.getCore().byId("idInitRemarks").getValue();
                if (!Remarks) {
                    sap.m.MessageBox.error("Remarks should not be blank.");
                    return;
                }

                let ApproverJsonModel = this.getView().getModel("ApproverJsonModel");
                let ApproverJsonModelData = ApproverJsonModel.oData
                const ApproverUser = ApproverJsonModelData.find(item => item.Uname === ApproverKey);


                this.fnForwardToApprover(Remarks, ApproverUser.Name, ApproverKey)

                let that = this;
                that.ChooseReviewerAndApproverDialog.close();
                that.ChooseReviewerAndApproverDialog.destroy();
                that.ChooseReviewerAndApproverDialog = null;
            },
            fnForwardToApprover: function (sRemarks, approverName, approverKey) {


                let oJsonSpecificationListModel = this.getView().getModel("jsonSpecificationListModel");
                // let aItems = oJsonSpecificationListModel.getProperty("/");

                // Check if all items are accepted
                // let allAccepted = aItems.every(item => item.Accepted === "X");

                // if (!allAccepted) {
                //   MessageBox.error("All line items must be accepted before forwarding to the approver.");
                //   return; // Stop execution
                // }

                let that = this;
                // let rRemarks = this.getView().byId("revremark").getValue();
                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                const FormData = oJsonCentralModel?.oData?.Data?.FormData;
                const ChecklistNumber = FormData?.ChecklistNumber;


                let payload = {};
                payload['ChecklistNumber'] = ChecklistNumber;
                // payload['Action'] = "RA";
                payload['Action'] = "6";
                // payload['ZaddRemarks'] = sRemarks;
                // payload['RevRemark'] = rRemarks;
                payload['Approver'] = approverName;
                payload['ApproverU'] = approverKey;
                payload['UserType'] = "R"

                const oDataModel = that.getOwnerComponent().getModel();

                BusyIndicator.show();
                oDataModel.create("/WorkflowSet", payload, {
                    success: function (oSucess) {
                        BusyIndicator.hide();

                        MessageBox.success(
                            "Forward To Approver Successfully", {
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
                        sap.m.MessageToast.show("Something went wrong while forwarding to approver.");
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
                oJsonCentralModel.setProperty("/ChecklistInfo/TotalScore", 0);
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

                //   var newDate = new Date();
                oJsonCentralModel.setProperty("/Data/FormData/InitiationDate", "");



                oJsonCentralModel.refresh();

                // this.getView().getModel("jsonItemListModel").setData(null);
                // this.getView().getModel("jsonItemListModel").refresh();

                // this.getView().getModel("jsonAttachmentListModel").setData(null);
                // this.getView().getModel("jsonAttachmentListModel").refresh();
            },
            onPressSearchReviwer: function () {
                const ChecklistNumber = this.getView().byId("idChecklistNumber").getValue();

                this.fnGetData(ChecklistNumber);
                this.fnLoadAttachementList(ChecklistNumber, "R");

            },
            onPressSendBackToInitiator: function () {
                let that = this;
                let dialog = new sap.m.Dialog({
                    title: "Confirm",
                    type: "Message",
                    content: [
                        new sap.m.Label({
                            text: "Please provide send back remarks.",
                            labelFor: "sendBackInitiator",
                        }),
                        new sap.m.TextArea("sendBackInitiator", {
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
                            var sText = sap.ui.getCore().byId("sendBackInitiator").getValue();
                            // sap.m.MessageToast.show("Note is: " + sText);
                            that.fnSendBackToInitiator(sText);
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
            fnSendBackToInitiator: function (sRemarks) {

                let that = this;
                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                const FormData = oJsonCentralModel?.oData?.Data?.FormData;
                const ChecklistNumber = FormData?.ChecklistNumber;


                let payload = {};
                payload['ChecklistNumber'] = ChecklistNumber;
                // payload['Action'] = "RI";
                payload['Action'] = "7";
                // payload['ZaddRemarks'] = sRemarks;
                payload['UserType'] = "R";

                const oDataModel = that.getOwnerComponent().getModel();
                BusyIndicator.show();
                oDataModel.create("/WorkflowSet", payload, {
                    success: function (oSucess) {
                        BusyIndicator.hide();
                        MessageBox.success(
                            "Sent Back To Initiator Successfully", {
                            styleClass: !!that.getView().$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "",
                            onClose: function () {
                                location.reload();
                            }
                        });
                    },
                    error: function (oError) {
                        console.log(oError);
                        BusyIndicator.hide();
                        sap.m.MessageToast.show("Something went wrong while sending back to initiator.");
                    }
                });
            },

            OnFileUpload: function () {
                let that = this;
                const oModel = that.getOwnerComponent().getModel();

                var oFileUploader = that.getView().byId("fileupload");

                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                const TempData = JSON.parse(oJsonCentralModel.getJSON());
                const ChecklistNumber = TempData?.Data?.FormData?.ChecklistNumber;

                if (!ChecklistNumber) {
                    MessageBox.error("Checklist Number is missing!");
                    return;
                }

                var file = oFileUploader.oFileUpload.files[0];
                if (!file) {
                    sap.m.MessageToast.show("Please choose a file.");
                    return;
                }



                // Read file as Base64
                var reader = new FileReader();
                reader.onload = function (e) {
                    var fileContent = e.target.result.split(",")[1]; // Extract Base64 data
                    // var file = fileUploader.oFileUpload.files[0]; // Get file details
                    var fileName = file.name;
                    var fileExtension = file.name.split('.').pop().toUpperCase();

                    // Create payload for backend
                    // var fileExtension = file.name.split('.').pop().toUpperCase();
                    var oNewEntry = {
                        "ChecklistNumber": ChecklistNumber,
                        "FileName": fileName,
                        "Filetype": fileExtension,
                        "Value": fileContent // Sending Base64 encoded file data
                    };

                    // Call OData create method
                    oModel.create("/ZfileuploadSet", oNewEntry, {
                        success: function (oData) {
                            // MessageBox.success("File Uploaded Successfully!");

                            MessageBox.success(
                                "File Uploaded Successfully!", {
                                styleClass: !!that.getView().$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "",
                                onClose: function () {
                                    that.fnOnCloseFileUpload(ChecklistNumber);
                                }
                            });
                        },
                        error: function (oError) {
                            MessageBox.error("File Upload Failed");
                        }
                    });
                };

                // Read file
                reader.readAsDataURL(oFileUploader.oFileUpload.files[0]);
                // BusyIndicator.show();
                // setTimeout(() => {
                //     that.fnLoadAttachementList(ChecklistNumber, "I");
                // }, 3000);

            },
            fnOnCloseFileUpload: function (ChecklistNumber) {
                BusyIndicator.show();
                this.fnLoadAttachementList(ChecklistNumber, "I");
                // setTimeout(() => {
                //     this.fnLoadAttachementList(ChecklistNumber, "I");
                // }, 3000);
            },
            onPressDeleteFile: function (oEvent) {
                let that = this;
                const ChecklistNumber = oEvent.getSource().getBindingContext("jsonAttachmentListModel").getObject().ChecklistNumber;
                const SerialNum = oEvent.getSource().getBindingContext("jsonAttachmentListModel").getObject().SerialNum;
                const oDataModel = that.getOwnerComponent().getModel();
                BusyIndicator.show();
                let url = "/ZfileuploadSet(ChecklistNumber='" + ChecklistNumber + "',SerialNum=" + Number(SerialNum) + ")";
                oDataModel.remove(url, {
                    success: function (oSucess) {
                        that.getView().getModel("jsonAttachmentListModel").setData(null);
                        // BusyIndicator.hide();
                        that.fnLoadAttachementList(ChecklistNumber, "DeletedByInitator");
                    },
                    error: function (oError) {
                        console.log(oError);
                        BusyIndicator.hide();
                        sap.m.MessageToast.show("Something went wrong while deleting attachement.");
                    }
                });
            }

        });
    });
