sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/BusyIndicator",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
        "sap/m/Dialog",
        "sap/m/library",
        "sap/m/Button",
        "sap/m/Text",
        "sap/ui/export/Spreadsheet",
        "sap/m/MessageToast"
    ],
    function (
        Controller,
        BusyIndicator,
        Filter,
        FilterOperator,
        MessageBox,
        Dialog,
        mobileLibrary,
        Button,
        Text,
        Spreadsheet,
        MessageToast
    ) {
        "use strict";

        // shortcut for sap.m.ButtonType
        var ButtonType = mobileLibrary.ButtonType;

        // shortcut for sap.m.DialogType
        var DialogType = mobileLibrary.DialogType;

        return Controller.extend("com.emami.cqachecklist.zcqachecklist.controller.BaseController", {
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteHome").attachPatternMatched(this._onObjectMatched, this);
            },

            _onObjectMatched: function () {
                // Add your logic here that should run when the RouteHome is matched
                console.log("RouteHome matched");

            },
            fnGetReviewerApproverList: function () {
                let that = this;
                let oModel = this.getView().getModel();
                oModel.read("/ReviewerApproverListSet",
                    {
                        success: function (oSucess) {
                            if (oSucess.results) {
                                let aApprover = [];
                                let aReviewer = [];
                                oSucess?.results?.forEach((item) => {
                                    if (item?.Type == "R") {
                                        aReviewer.push(item);
                                    } else if (item?.Type == "A") {
                                        aApprover.push(item);
                                    }
                                });

                                let oRevAppJsonModel = new sap.ui.model.json.JSONModel();
                                oRevAppJsonModel.setData(oSucess.results);
                                that.getView().setModel(oRevAppJsonModel, "RevAppJsonModel");

                                let oApproverJsonModel = new sap.ui.model.json.JSONModel();
                                oApproverJsonModel.setData(aApprover);
                                that.getView().setModel(oApproverJsonModel, "ApproverJsonModel");

                                let oReviewerJsonModel = new sap.ui.model.json.JSONModel();
                                oReviewerJsonModel.setData(aReviewer);
                                that.getView().setModel(oReviewerJsonModel, "ReviewerJsonModel");
                            }
                        },
                        error: function (oError) {
                            console.log(oError);
                            sap.m.MessageToast.show("Something went wrong while getting approver/reviewer data.");
                        }
                    });
            },
            fnGetChecklistList: function () {
                let that = this;
                const oDataModel = that.getOwnerComponent().getModel();
                BusyIndicator.show();
                oDataModel.read("/CRUDSet", {
                    urlParameters: {
                        "$select": "ChecklistNumber"
                    },
                    success: function (oSucess) {
                        BusyIndicator.hide();
                        that.getView().getModel("jsonChecklistListModel").setData(null);
                        that.getView().getModel("jsonChecklistListModel").setData(oSucess?.results);
                    },
                    error: function (oError) {
                        console.log(oError);
                        BusyIndicator.hide();
                        sap.m.MessageToast.show("Failed to load Checklist.");
                    }
                });
            },
            onValuehelpChecklistNumber: function () {
                let that = this;
                if (!that.IncidentDialog) {
                    that.IncidentDialog = sap.ui.xmlfragment("com.emami.cqachecklist.zcqachecklist.view.fragments.ChecklistDialog", that);
                    that.getView().addDependent(that.IncidentDialog);
                }
                that.IncidentDialog.open();
            },
            onSearchChecklistNumber: function (oEvent) {
                const sValue = oEvent.getParameter("value");
                var oFilter = new Filter({
                    filters: [
                        new Filter("ChecklistNumber", FilterOperator.Contains, sValue)
                    ],
                    and: false
                });
                let oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([oFilter]);
            },
            onConfirmChecklistNumber: function (oEvent) {
                let oSelectedItem = oEvent.getParameter("selectedItem"),
                    oInput = this.byId("idChecklistNumber");
                if (!oInput) {
                    oInput = this.byId("idChecklistNumber1");
                }

                if (!oSelectedItem) {
                    oInput.resetProperty("value");
                    return;
                }
                oInput.setValue(oSelectedItem.getCells()[0].getText());
            },
            onLogout: function () {
                if (window.location.href.indexOf("localhost") > -1) {

                } else {
                    if (!this.oApproveDialog) {
                        this.oApproveDialog = new Dialog({
                            type: DialogType.Message,
                            title: "Sign Out",
                            content: new Text({
                                text: "Are you sure you want to sign out?"
                            }),
                            beginButton: new Button({
                                type: ButtonType.Emphasized,
                                text: "OK",
                                press: function () {
                                    this.oApproveDialog.close();
                                    this.fnLogOut();
                                }.bind(this)
                            }),
                            endButton: new Button({
                                text: "Cancel",
                                press: function () {
                                    this.oApproveDialog.close();
                                }.bind(this)
                            })
                        });
                    }

                    this.oApproveDialog.open();
                }
            },
            fnLogOut: function () {
                // window.location.href = "/sap/public/bc/icf/logoff";
                // window.location.href = "/sap/public/bc/icf/logoff?redirectURL=/sap/bc/ui5_ui5/sap/zrmpmchecklist/index.html";
                // window.location.href = "/sap/public/bc/icf/logoff?redirectURL=/sap/bc/ui2/flp";
                const origin = window.location.origin;

                sessionStorage.clear();
                localStorage.clear();

                // Logout trick
                // window.location.href = "https://logout:logout@emamidev.emami.local:4440/sap/public/bc/icf/logoff?redirectURL=/sap/bc/ui5_ui5/sap/zrmpmchecklist/index.html#";

                const logoffUrl = "https://logout:logout@" + origin.replace(/^https?:\/\//, "") +
                    "/sap/public/bc/icf/logoff?redirectURL=/sap/bc/ui5_ui5/sap/zcqachecklist/index.html";

                window.location.href = logoffUrl;

                // fetch("/sap/public/bc/icf/logoff", {
                //     method: "GET",
                //     credentials: "include"
                // }).then(() => {
                //     // Wait a bit to ensure logout completed on backend
                //     setTimeout(() => {
                //         // Redirect to app cleanly without credentials or session
                //         window.location.href = "/sap/bc/ui5_ui5/sap/zrmpmchecklist/index.html";
                //     }, 1000);
                // });
            },
            onPrepareExportModel: function () {
                // Get main central model
                var oCentralModel = this.getView().getModel("jsonCentralModel");

                // Extract data
                var oFormData = oCentralModel.getProperty("/Data/FormData") || {};
                var aChecklist = oCentralModel.getProperty("/CheckListInfo/Checklist") || [];

                // Prepare combined export data
                var aCombinedData = [];
                var nFinalScore = 0;

                aChecklist.forEach(function (oItem) {
                    nFinalScore += Number(oItem.Score) || 0;

                    aCombinedData.push({
                        // Header Info
                        FgCode: oFormData.FgCode || "",
                        FgDescription: oFormData.FgDescription || "",
                        Plant: oFormData.Plant || "",
                        ProjectType: oFormData.ProjectType || "",
                        BatchNumber: oFormData.BatchNumber || "",
                        InitiationDate: oFormData.InitiationDate || "",
                        Sku: oFormData.Sku || "",
                        ChecklistNumber: oFormData.ChecklistNumber || "",
                        TotalScore: oFormData.TotalScore || "",

                        // Checklist Info
                        SlNo: oItem.SLNO || "",
                        ChecklistText: oItem.ChecklistText || "",
                        SelectedOption: oItem.SelectedOption || "",
                        Score: oItem.Score || ""
                    });
                });

                // Final Score summary row
                if (aChecklist.length > 0) {
                    aCombinedData.push({
                        SlNo: "",
                        ChecklistText: "",
                        SelectedOption: "Final Score",
                        Score: nFinalScore
                    });
                }

                // Create new model for export
                var oExportModel = new sap.ui.model.json.JSONModel(aCombinedData);
                this.getView().setModel(oExportModel, "jsonExportModel");

                sap.m.MessageToast.show("Export model prepared successfully!");
            },
            onExportToExcel: function () {
                try {
                    this.onPrepareExportModel();
                    var oModel = this.getView().getModel("jsonExportModel");
                    var aData = oModel.getData();

                    if (!aData || aData.length === 0) {
                        sap.m.MessageToast.show("No data available to export.");
                        return;
                    }
                    // Build dynamic filename based on first row
                    var sFgCode = aData[0].FgCode || "FG";
                    var sDescription = aData[0].FgDescription || "Description";

                    // Remove spaces & special chars (optional clean)
                    var sSafeDesc = sDescription.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "_");

                    // Final filename
                    var sFileName = sFgCode + "_" + sSafeDesc + ".xlsx";

                    var oExport = new sap.ui.export.Spreadsheet({
                        workbook: {
                            columns: [
                                { label: "SL No", property: "SlNo" },
                                { label: "CQA Checklist", property: "ChecklistText" },
                                { label: "Option", property: "SelectedOption" },
                                { label: "Score", property: "Score" }
                            ]
                        },
                        dataSource: aData,
                        fileName: sFileName,
                        worker: false
                    });

                    oExport.build()
                        .then(function () {
                            sap.m.MessageToast.show("Export completed successfully!");
                        })
                        .catch(function (oError) {
                            sap.m.MessageBox.error("Export failed: " + oError.message);
                        })
                        .finally(function () {
                            oExport.destroy();
                        });

                } catch (e) {
                    sap.m.MessageBox.error("Error during export: " + e.message);
                }
            },
            fnLoadAttachementList: function (ChecklistNumber, sCallFrom) {

                var that = this;
                const oDataModel = that.getOwnerComponent().getModel();
                let oFilters = [];
                oFilters.push(new Filter("ChecklistNumber", FilterOperator.EQ, ChecklistNumber));
                if (sCallFrom == "I") {
                    BusyIndicator.show();
                }
                oDataModel.read("/ZfileuploadSet", {
                    filters: oFilters,
                    success: function (oSucess) {

                        if (sCallFrom == "DeletedFromDialog" || sCallFrom == "ReadForDialog") {
                            that.getView().getModel("jsonDialogAttachmentListModel").setData(null);
                            that.getView().getModel("jsonDialogAttachmentListModel").setData(oSucess?.results);
                            that.getView().getModel("jsonDialogAttachmentListModel").refresh();
                        } else {
                            that.getView().getModel("jsonAttachmentListModel").setData(null);
                            that.getView().getModel("jsonAttachmentListModel").setData(oSucess?.results);
                            that.getView().getModel("jsonAttachmentListModel").refresh();
                        }

                        if (sCallFrom == "I") {
                            BusyIndicator.hide();
                            // MessageBox.success("File Uploaded Successfuly");
                            sap.m.MessageToast.show("Attachement list loaded.");
                        } else if (sCallFrom == "R") {
                            sap.m.MessageToast.show("Attachement list loaded.");
                        } else if (sCallFrom == "A") {
                            sap.m.MessageToast.show("Attachement list loaded.");
                        } else if (sCallFrom == "DeletedByInitator") {
                            BusyIndicator.hide();
                            MessageBox.success("Deleted Succesfully");
                            sap.m.MessageToast.show("Attachement list loaded.");
                        } else if (sCallFrom == "DeletedFromDialog") {
                            BusyIndicator.hide();
                            MessageBox.success("Deleted Succesfully");
                            sap.m.MessageToast.show("Attachement list loaded.");
                        } else if (sCallFrom == "ReadForDialog") {
                            sap.m.MessageToast.show("Attachement list loaded.");
                        } else if (sCallFrom == "InitiatorGet") {
                            sap.m.MessageToast.show("Attachement list loaded.");
                        }
                    },
                    error: function (oError) {
                        console.log(oError);
                        if (sCallFrom == "I") {
                            BusyIndicator.hide();
                        }
                        sap.m.MessageToast.show("Something went wrong while getting attachement data.");
                    }
                });
            },
            onPrepareExportSummModel: function () {
                var that = this;

                // Get main central model
                var oModel = this.getView().getModel("jsonCQASummaryModel");
                var oData = oModel.getData();
                var aRows = Array.isArray(oData) ? oData : (oData && oData.results) || [];

                var oDataModel = this.getOwnerComponent().getModel();

                // Fetch FG Description per row from HeaderDataSet (auto-batched by ODataModel v2)
                var aPromises = aRows.map(function (oRow) {
                    return new Promise(function (resolve) {
                        if (!oRow.ChecklistNumber) {
                            resolve();
                            return;
                        }
                        oDataModel.read("/HeaderDataSet('" + oRow.ChecklistNumber + "')", {
                            success: function (oResult) {
                                oRow.FgDescription = oResult.FgDescription;
                                resolve();
                            },
                            error: function () {
                                oRow.FgDescription = "";
                                resolve();
                            }
                        });
                    });
                });

                return Promise.all(aPromises).then(function () {
                    // Create new model for export
                    var oExportSummModel = new sap.ui.model.json.JSONModel(aRows);
                    that.getView().setModel(oExportSummModel, "jsonExportSummModel");
                });
            },
            onPressDownloadFile: function (oEvent) {
                // Get the item context
                var oItemContext = oEvent.getSource().getBindingContext("jsonAttachmentListModel");
                var oFile = oItemContext.getObject();



                var base64String = oFile.Value;
                var base64WithoutPrefix = base64String.includes(",") ? base64String.split(",")[1] : base64String;

                var byteCharacters = atob(base64WithoutPrefix);
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                var blob = new Blob([byteArray], {
                    type: oFile.Filetype
                });

                // Create Blob URL
                var url = URL.createObjectURL(blob);
                console.log("Blob URL:", url);

                // Show Image in Browser
                // document.getElementById("previewImage").src = url;

                // Create Download Link
                var link = document.createElement("a");
                link.href = url;
                link.download = oFile.FileName; // Ensure correct extension
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            onExportToExcelSumm: function () {
                BusyIndicator.show();
                this.onPrepareExportSummModel().then(() => {
                    return this._buildSummaryExcelExport();
                }).catch((e) => {
                    sap.m.MessageBox.error("Error during export: " + e.message);
                }).finally(function () {
                    BusyIndicator.hide();
                });
            },
            _buildSummaryExcelExport: function () {
                var oModel = this.getView().getModel("jsonExportSummModel");
                var aData = oModel.getData();

                const formatDate = (dateObj) => {
                    if (!dateObj || !(dateObj instanceof Date)) return "";

                    let dd = String(dateObj.getDate()).padStart(2, "0");
                    let mm = String(dateObj.getMonth() + 1).padStart(2, "0");
                    let yyyy = dateObj.getFullYear();

                    return `${dd}-${mm}-${yyyy}`;
                };

                aData.forEach(item => {
                    if (item.CreatedOn) {
                        item.CreatedOn = formatDate(item.CreatedOn);
                    }
                });

                oModel.setData(aData);
                oModel.refresh(true);

                if (!aData || aData.length === 0) {
                    sap.m.MessageToast.show("No data available to export.");
                    return Promise.resolve();
                }
                // Build dynamic filename based on first row
                var sFgCode = aData.FgCode || "FG";
                var sDescription = aData.FgDescription || "Description";

                // Remove spaces & special chars (optional clean)
                var sSafeDesc = sDescription.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "_");

                // Final filename
                var sFileName = "Summary " + sFgCode + "_" + sSafeDesc + ".xlsx";

                var oExport = new sap.ui.export.Spreadsheet({
                    workbook: {
                        columns: [
                            { label: "Checklist Number", property: "ChecklistNumber" },
                            { label: "FG Code", property: "FgCode" },
                            { label: "FG Description", property: "FgDescription" },
                            { label: "Plant", property: "Plant" },
                            { label: "Division", property: "Plant" },
                            { label: "Project Type", property: "ProjectType" },
                            { label: "Batch Number", property: "BatchNumber" },
                            { label: "Created On", property: "CreatedOn" },
                            { label: "Created By", property: "CreatedBy" },
                            { label: "Paending With", property: "PendingWith" },
                        ]
                    },
                    dataSource: aData,
                    fileName: sFileName,
                    worker: false
                });

                return oExport.build()
                    .then(function () {
                        sap.m.MessageToast.show("Export completed successfully!");
                    })
                    .catch(function (oError) {
                        sap.m.MessageBox.error("Export failed: " + oError.message);
                    })
                    .finally(function () {
                        oExport.destroy();
                    });
            }


        });
    }
);
