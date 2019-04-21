"use strict";

const express = require("express");
const md_auth = require("@default_auth");
const appeal_controller = require("@appeal_controller");

let api = express.Router();

api.get("/appeal/main", md_auth.ensureAuth, appeal_controller.appeal_main);
api.get("/appeal/permissions/:id", md_auth.ensureAuth, appeal_controller.appeal_permissions);
api.get("/appeal/list-permissions", md_auth.ensureAuth, appeal_controller.appeal_permission_list);
api.get("/appeal/list/:page/:type", md_auth.ensureAuth, appeal_controller.appeal_list);
api.post("/appeal/create", md_auth.ensureAuth, appeal_controller.appeal_create);
api.post("/appeal/comment/:id", md_auth.ensureAuth, appeal_controller.appeal_comment);
api.post("/appeal/close/:id", md_auth.ensureAuth, appeal_controller.appeal_close);
api.post("/appeal/status/:id", md_auth.ensureAuth, appeal_controller.appeal_status);
api.get("/appeal/lock/:id", md_auth.ensureAuth, appeal_controller.appeal_lock);
api.post("/appeal/escalate/:id", md_auth.ensureAuth, appeal_controller.appeal_escalate);
api.get("/appeal/assign-escalated/:id", md_auth.ensureAuth, appeal_controller.appeal_assign);
api.get("/appeal/get/:id", md_auth.ensureAuth, appeal_controller.appeal_get);
api.get("/appeal/can", md_auth.ensureAuth, appeal_controller.appeal_can);

module.exports = api;