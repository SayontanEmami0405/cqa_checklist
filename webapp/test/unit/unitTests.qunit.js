/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/emami/cqachecklist/zcqachecklist/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
