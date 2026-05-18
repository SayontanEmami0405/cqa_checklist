sap.ui.define([], function () {
    "use strict";

    return {
        formatStatus: function (status) {
            // if (!status) return ""; // Return empty string if status is undefined

            const statusMap = {
                "": "Checklist Initiated",
                "S10": "Checklist under Unit Quality confirmation",
                "S20": "Checklist confirmed",
                "S30": "Checklist Approved",
                "S40": "Sent Back"
            };

            return statusMap[status] || status; // Return mapped text or default value
        },
        createCustomData: function(index) {
            return [{
                key: "index",
                value: index
            }];
        },
        formatODataDate: function (sOdataDate) {
            debugger;
            if (!sOdataDate) return "";

            try {
                // Extract timestamp from /Date(xxxxxxx)/
                var iTimestamp = parseInt(sOdataDate.replace(/\/Date\((\d+)\)\//, "$1"), 10);
                var oDate = new Date(iTimestamp);

                var oDateFormat = DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
                return oDateFormat.format(oDate);
            } catch (e) {
                return "";
            }
        }        
    };
});