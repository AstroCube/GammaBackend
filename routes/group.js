"use strict";

const express = require("express");
const cluster = require("@cluster_auth");
const md_auth = require("@default_auth");
const group_controller = require("@group_controller");

let api = express.Router();

api.post("/group/add", md_auth.ensureAuth, group_controller.group_add);
api.get("/group/info/:id", md_auth.ensureAuth, group_controller.group_get);
api.get("/group/list", md_auth.ensureAuth, group_controller.group_list);
api.put("/group/update/:id", md_auth.ensureAuth, group_controller.group_update);
api.get("/group/staff-list", md_auth.ensureAuth, group_controller.list_staff);
api.post("/group/get-server", cluster.ensureAuth, group_controller.minecraft_placeholder);

module.exports = api;
