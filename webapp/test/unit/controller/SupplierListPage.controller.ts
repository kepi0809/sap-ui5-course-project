/*global QUnit*/
import Controller from "courseproject/controller/SupplierList.controller";

QUnit.module("SupplierList Controller");

QUnit.test("I should test the SupplierList controller", function (assert: Assert) {
	const oAppController = new Controller("SupplierList");
	oAppController.onInit();
	assert.ok(oAppController);
});