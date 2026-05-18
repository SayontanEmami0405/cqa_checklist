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

        return BaseController.extend("com.emami.cqachecklist.zcqachecklist.controller.Initiator", {
            formatter: formatter,
            onInit: function () {



                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteInitiator").attachPatternMatched(this._onObjectMatched, this);
            },

            _onObjectMatched: function (oEvent) {
                var that = this;
                var oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                const TodayDate = new Date();
                oJsonCentralModel.setProperty("/Data/FormData/InitiationDate", TodayDate);
                oJsonCentralModel.setProperty("/Editable/FgCode", true);
                oJsonCentralModel.setProperty("/Editable/FgDescription", true);
                oJsonCentralModel.setProperty("/Editable/Plant", true);
                oJsonCentralModel.setProperty("/Editable/ProjectType", true);
                oJsonCentralModel.setProperty("/Editable/BatchNumber", true);
                oJsonCentralModel.setProperty("/Editable/InitiationDate", true);
                oJsonCentralModel.setProperty("/Editable/Sku", true);

                const oDataModel = that.getView().getModel();
                BusyIndicator.show();

                oDataModel.read("/FgCodeSet", {
                    success: function (oSuccess) {
                        BusyIndicator.hide();
                        var oJsonFgCodeListModel = that.getView().getModel("jsonFgCodeListModel");
                        oJsonFgCodeListModel.setData(oSuccess.results);


                    },

                    error: function (oError) {

                    }

                });

                oDataModel.read("/PlantCodeSet", {
                    success: function (oSuccess) {
                        BusyIndicator.hide();
                        var oJsonPlantListModel = that.getView().getModel("jsonPlantListModel");
                        oJsonPlantListModel.setData(oSuccess.results);


                    },

                    error: function (oError) {

                    }
                });
                that.fnGetReviewerApproverList();
            },
            onOptionChange: function (oEvent) {
                
                const oSelectedItem = oEvent.getSource().getSelectedItem();
                const oContext = oEvent.getSource().getBindingContext("jsonCentralModel");
                const sKey = oSelectedItem.getKey();

                let score = 0;
                if (sKey === "Yes" || sKey === "NA") {
                    score = 1;
                }

                // Update the score
                oContext.getModel().setProperty(oContext.getPath() + "/Score", score);
                

                // Recalculate total
                const aChecklist = oContext.getModel().getProperty("/CheckListInfo/Checklist");
                const total = aChecklist.reduce((acc, item) => acc + (item.Score * 10), 0);
                oContext.getModel().setProperty("/CheckListInfo/TotalScore", total);
                var oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                oJsonCentralModel.refresh();

            },
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
                if (
                    !oFormData.FgCode ||
                    !oFormData.FgDescription ||
                    !oFormData.Plant ||
                    !oFormData.ProjectType
                ) {
                    MessageBox.error("Please fill all the details marked as Important.");
                    return;
                }


                var oPayload = {
                    ChecklistNumber: oFormData.ChecklistNumber, // Set your own logic here if dynamic
                    FgCode: oFormData.FgCode,
                    FgDescription: oFormData.FgDescription,
                    Plant: oFormData.Plant,
                    ProjectType: oFormData.ProjectType,
                    BatchNumber: oFormData.BatchNumber,
                    InitiationDate: sDate,
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
                    CreatedAt: sTime,
                    CreatedOn: sDate
                };

                oODataModel.create("/HeaderDataSet", oPayload, {
                    success: function (oResponse) {
                        oJsonCentralModel.setProperty("/Data/FormData/ChecklistNumber", oResponse.ChecklistNumber);
                        oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", true);
                        oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", true);
                        oJsonCentralModel.setProperty("/Visible/ShowAttachment", true);
                        oJsonCentralModel.setProperty("/Visible/ShowChecklist", true);
                        oJsonCentralModel.setProperty("/Editable/Options", true);

                        oJsonCentralModel.refresh();
                        MessageToast.show("Checklist saved successfully.");
                    },
                    error: function (oError) {
                        MessageBox.error("Failed to save checklist.");
                        console.error(oError);
                    }
                });
            },
            onValueHelpReqFgCode: function () {
                var that = this;
                if (!that.FgCodeListDialog) {
                    that.FgCodeListDialog = sap.ui.xmlfragment("com.emami.cqachecklist.zcqachecklist.view.fragments.FgCodeListDialog", that);
                    that.getView().addDependent(that.FgCodeListDialog);
                }
                that.FgCodeListDialog.open();
            },
            onSearchFgCodeDialog: function (oEvent) {
                var sValue = oEvent.getParameter("value");

                var oFilter = new sap.ui.model.Filter({
                    filters: [
                        new Filter("FgCode", sap.ui.model.FilterOperator.Contains, sValue),
                        new Filter("FgDescription", sap.ui.model.FilterOperator.Contains, sValue),
                        new Filter("Sku", sap.ui.model.FilterOperator.Contains, sValue),

                    ],
                    and: false
                });
                var oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([oFilter]);
            },
            onPressFgCodeDialogLineItem: function (oEvent) {
                var FgCode = oEvent.getParameter("selectedItem").getCells()[0].getText();
                var FgDescription = oEvent.getParameter("selectedItem").getCells()[1].getText();
                var Sku = oEvent.getParameter("selectedItem").getCells()[2].getText();

                // this.byId('idInputWipCode').setValue(Matnr);
                // this.byId('idInputUnitCode').setValue(Werks);
                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                oJsonCentralModel.setProperty("/Data/FormData/FgCode", FgCode);
                oJsonCentralModel.setProperty("/Data/FormData/FgDescription", FgDescription);
                oJsonCentralModel.setProperty("/Data/FormData/Sku", Sku);
                oJsonCentralModel.refresh();

            },
            onValueHelpReqPlant: function () {
                var that = this;
                if (!that.PlantListDialog) {
                    that.PlantListDialog = sap.ui.xmlfragment("com.emami.cqachecklist.zcqachecklist.view.fragments.PlantDialog", that);
                    that.getView().addDependent(that.PlantListDialog);
                }
                that.PlantListDialog.open();
            },
            onSearchPlantDialog: function (oEvent) {
                var sValue = oEvent.getParameter("value");

                var oFilter = new sap.ui.model.Filter({
                    filters: [
                        new Filter("Plant", sap.ui.model.FilterOperator.Contains, sValue),
                        new Filter("Name", sap.ui.model.FilterOperator.Contains, sValue)
                    ],
                    and: false
                });
                var oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([oFilter]);
            },
            onPressPlantDialogLineItem: function (oEvent) {
                var Plant = oEvent.getParameter("selectedItem").getCells()[0].getText();

                // this.byId('idInputWipCode').setValue(Matnr);
                // this.byId('idInputUnitCode').setValue(Werks);
                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                oJsonCentralModel.setProperty("/Data/FormData/Plant", Plant);
                oJsonCentralModel.refresh();

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
                    new sap.ui.model.Filter("Action", FilterOperator.EQ, "I"),
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
                this.fnGetData(ChecklistNumber, sUname);
                this.fnLoadAttachementList(ChecklistNumber, "I");

                return;
            },
            fnGetData: function (sChecklistNumber, sUanme) {
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

                        if (oSucess?.IncidentNo) {
                            // oJsonCentralModel.setProperty("/Visible/FileUploaderControl", true);
                            // oJsonCentralModel.setProperty("/Visible/UploadFileBtn", true);
                            // oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", true);
                            oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", true);
                            

                            that.fnLoadAttachementList(oSucess?.IncidentNo, "InitiatorGet");
                        }

                        
                        //Status of the Workflow
                        if (oSucess?.Status === "") {

                            oJsonCentralModel.setProperty("/Visible/getDataBtn", false);
                            oJsonCentralModel.setProperty("/Visible/DeleteLineItem", true);
                            oJsonCentralModel.setProperty("/Visible/AddLineItem", true);
                            oJsonCentralModel.setProperty("/Visible/InitiatorSaveBtn", true);
                            oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", true);
                            oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", true);
                            // that.getView().byId("revremark").setEditable(true);
                            oJsonCentralModel.setProperty("/Editable/Options", true);

                        }
                        else if (oSucess?.Status === "S10") {
                            oJsonCentralModel.setProperty("/Editable/FgCode", false);
                            oJsonCentralModel.setProperty("/Editable/FgDescription", false);
                            oJsonCentralModel.setProperty("/Editable/ProjectType", false);
                            oJsonCentralModel.setProperty("/Editable/BatchNumber", false);
                            oJsonCentralModel.setProperty("/Editable/Sku", false);
                            oJsonCentralModel.setProperty("/Editable/ChecklistNumber", false);
                            oJsonCentralModel.setProperty("/Editable/Plant", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorSaveBtn", false);
                            sap.m.MessageBox.information("Checklist Initiated");
                        }
                        else if (oSucess?.Status === "S20") {
                            oJsonCentralModel.setProperty("/Editable/FgCode", false);
                            oJsonCentralModel.setProperty("/Editable/FgDescription", false);
                            oJsonCentralModel.setProperty("/Editable/ProjectType", false);
                            oJsonCentralModel.setProperty("/Editable/BatchNumber", false);
                            oJsonCentralModel.setProperty("/Editable/Sku", false);
                            oJsonCentralModel.setProperty("/Editable/ChecklistNumber", false);
                            oJsonCentralModel.setProperty("/Editable/Plant", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorSaveBtn", false);
                            sap.m.MessageBox.information("Checklist Under Aprroval");
                        }
                        else if (oSucess?.Status === "S30") {
                            oJsonCentralModel.setProperty("/Editable/FgCode", false);
                            oJsonCentralModel.setProperty("/Editable/FgDescription", false);
                            oJsonCentralModel.setProperty("/Editable/ProjectType", false);
                            oJsonCentralModel.setProperty("/Editable/BatchNumber", false);
                            oJsonCentralModel.setProperty("/Editable/Sku", false);
                            oJsonCentralModel.setProperty("/Editable/ChecklistNumber", false);
                            oJsonCentralModel.setProperty("/Editable/Plant", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", false);
                            oJsonCentralModel.setProperty("/Visible/InitiatorSaveBtn", false);
                            sap.m.MessageBox.information("Checklist Approved");
                        }
                        else {
                            if (sUname !== "") {
                                oJsonCentralModel.setProperty("/Visible/getDataBtn", false);
                                oJsonCentralModel.setProperty("/Visible/DeleteLineItem", true);
                                oJsonCentralModel.setProperty("/Visible/AddLineItem", true);
                                oJsonCentralModel.setProperty("/Visible/InitiatorSaveBtn", true);
                                oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", true);
                                oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", true);
                            }

                        }
                    },
                    error: function (oError) {
                        console.log(oError);
                        BusyIndicator.hide();
                        sap.m.MessageToast.show("Failed to load data.");
                    }
                });
            },
            onPressInitateApproval: function () {
                var that = this;
                let oJsonCentralModel = that.getView().getModel("jsonCentralModel");
                oJsonCentralModel.setProperty("/Visible/ShowApprover", false);

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
                let ReviewerKey = sap.ui.getCore().byId("idReviewerDialog").getSelectedKey();
                if (!ReviewerKey) {
                    sap.m.MessageBox.error("Reviewer should not be blank.");
                    return;
                }
                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                let isApproverHidden = !oJsonCentralModel.getProperty("/Visible/ShowApprover"); // Check visibility flag

                let ApproverKey, ApproverUser;

                if (isApproverHidden) {
                    // If Approver is hidden, set dummy values
                    ApproverKey = "dummy";
                    ApproverUser = { Name: "Dummy", Uname: "dummy" };
                } else {
                    ApproverKey = sap.ui.getCore().byId("idApproverDialog").getSelectedKey();
                    if (!ApproverKey) {
                        sap.m.MessageBox.error("Approver should not be blank.");
                        return;
                    }

                    let ApproverJsonModel = this.getView().getModel("ApproverJsonModel");
                    let ApproverJsonModelData = ApproverJsonModel.oData;
                    ApproverUser = ApproverJsonModelData.find(item => item.Uname === ApproverKey);
                }
                // let ApproverKey = sap.ui.getCore().byId("idApproverDialog").getSelectedKey();
                // if (!ApproverKey) {
                //     sap.m.MessageBox.error("Approver should not be blank.");
                //     return;
                // }

                let Remarks = sap.ui.getCore().byId("idInitRemarks").getValue();
                if (!Remarks) {
                    sap.m.MessageBox.error("Remarks should not be blank.");
                    return;
                }

                // let ApproverJsonModel = this.getView().getModel("ApproverJsonModel");
                // let ApproverJsonModelData = ApproverJsonModel.oData
                // const ApproverUser = ApproverJsonModelData.find(item => item.Uname === ApproverKey);

                let ReviewerJsonModel = this.getView().getModel("ReviewerJsonModel");
                let ReviewerJsonModelData = ReviewerJsonModel.oData
                const ReviewerUser = ReviewerJsonModelData.find(item => item.Uname === ReviewerKey);

                let payload = {
                    Approver: ApproverUser.Name,
                    ApproverU: ApproverKey,
                    Reviewer: ReviewerUser.Name,
                    ReviewerU: ReviewerKey
                    // ZaddRemarks: Remarks
                }
                

                this.fnInitiateApproval(payload)

                let that = this;
                that.ChooseReviewerAndApproverDialog.close();
                that.ChooseReviewerAndApproverDialog.destroy();
                that.ChooseReviewerAndApproverDialog = null;
            },

            fnInitiateApproval: function (payload) {
                let that = this;


                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                const FormData = JSON.parse(JSON.stringify(oJsonCentralModel?.oData?.Data?.FormData));
                const ChecklistNumber = FormData?.ChecklistNumber;
                payload['ChecklistNumber'] = ChecklistNumber;
                // payload['Action'] = "I";
                payload['Action'] = "4";
                payload['UserType'] = "I";

                const oDataModel = that.getOwnerComponent().getModel();
                BusyIndicator.show();
                oDataModel.create("/WorkflowSet", payload, {
                    success: function (oSucess) {
                        BusyIndicator.hide();
                        MessageBox.success(
                            "Approval flow initiated successfully", {
                            styleClass: !!that.getView().$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "",
                            onClose: function () {
                                that.onPressClear();
                                that.onPressDRSearch();
                            }
                        });
                    },
                    error: function (oError) {
                        console.log(oError);
                        BusyIndicator.hide();
                        sap.m.MessageToast.show("Something went wrong while initiating approval.");
                    }
                });
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
                oJsonCentralModel.setProperty("/Editable/FgCode", true);
                oJsonCentralModel.setProperty("/Editable/FgDescription", true);
                oJsonCentralModel.setProperty("/Editable/ProjectType", true);
                oJsonCentralModel.setProperty("/Editable/BatchNumber", true);
                oJsonCentralModel.setProperty("/Editable/Sku", true);
                oJsonCentralModel.setProperty("/Editable/Plant", true);
                oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", false);
                oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", false);
                oJsonCentralModel.setProperty("/Visible/InitiatorSaveBtn", true);

                var newDate = new Date();
                oJsonCentralModel.setProperty("/Data/FormData/InitiationDate", newDate);



                oJsonCentralModel.refresh();

                var oModel = this.getView().getModel("jsonItemListModel");
                if (oModel) {
                    oModel.setData(null);
                    oModel.refresh();
                }


                // this.getView().getModel("jsonAttachmentListModel").setData(null);
                // this.getView().getModel("jsonAttachmentListModel").refresh();
            },
            onPressDeleteItem: function (oEvent) {
                let oJsonCentralModel = this.getView().getModel("jsonCentralModel");
                const TempData = JSON.parse(oJsonCentralModel.getJSON());
                const ChecklistNumber = TempData?.Data?.FormData?.ChecklistNumber;

                var that = this;
                // const sPath = oEvent.oSource.oParent.oBindingContexts.jsonIncidentSummaryModel.sPath;
                // let oData = this.getView().getModel("jsonIncidentSummaryModel").getProperty(sPath);
                // const IncidentNo = oData?.IncidentNo;

                const oDataModel = that.getOwnerComponent().getModel();
                BusyIndicator.show();
                oDataModel.remove("/CRUDSet('" + ChecklistNumber + "')", {
                    success: function (oSucess) {
                        BusyIndicator.hide();
                        MessageBox.success(
                            "Deleted successfully", {
                            styleClass: !!that.getView().$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "",
                            onClose: function () {
                                that.onPressClear();
                                that.onPressDRSearch();
                                location.reload();
                            }
                        });
                        oJsonCentralModel.setProperty("/Visible/InitiatorDeleteBtn", false);
                        oJsonCentralModel.setProperty("/Visible/InitiatorInitiateBtn", false);
                        oJsonCentralModel.setProperty("/Visible/InitiatorSaveBtn", false);
                    },
                    error: function (oError) {
                        console.log(oError);
                        BusyIndicator.hide();
                        sap.m.MessageToast.show("Something went wrong while deleting.");
                    }
                });

            }

        });
    });
