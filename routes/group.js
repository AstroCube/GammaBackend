"use strict";

const express = require("express");
const mdAuth = require("@default_auth");
const GroupController = require("@group_controller");

let api = express.Router();

api.get("/group/staff", mdAuth.ensureAuth, GroupController.getStaffList);
api.get("/group/staff-members/:id", mdAuth.ensureAuth, GroupController.getStaffMembers);
api.put("/group/update/:id", mdAuth.ensureAuth, GroupController.updateGroup);
api.get("/group/get/:id", mdAuth.ensureAuth, GroupController.getGroup);
api.get("/group/list", mdAuth.ensureAuth, GroupController.getGroupList);
api.post("/group/add/:id", mdAuth.ensureAuth, GroupController.userGroupAdd);
api.post("/group/remove/:id", mdAuth.ensureAuth, GroupController.userGroupRemove);

module.exports = api;
