"use strict";

const express = require("express");
const md_auth = require("@default_auth");
const report_controller = require("@report_controller");

let api = express.Router();

api.post("/report/pre-create", md_auth.ensureAuth, report_controller.report_pre_create);
api.post("/report/create", md_auth.ensureAuth, report_controller.report_create);
api.post("/report/comment/:id", md_auth.ensureAuth, report_controller.report_comment);
api.post("/report/close/:id", md_auth.ensureAuth, report_controller.report_close);
api.get("/report/assign/:id", md_auth.ensureAuth, report_controller.report_assign);
api.get("/report/permissions/:id", md_auth.ensureAuth, report_controller.report_permissions);
api.get("/report/view/:id", md_auth.ensureAuth, report_controller.report_view);
api.get("/report/get-punish/:id", md_auth.ensureAuth, report_controller.report_punish_checker);
api.get("/report/list/:page/:type", md_auth.ensureAuth, report_controller.report_list);
api.get("/report/can-assign", md_auth.ensureAuth, report_controller.report_assignable);

module.exports = api;