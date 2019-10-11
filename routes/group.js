"use strict";

const express = require("express");
const mdAuth = require("@default_auth");
const GroupController = require("@group_controller");

let api = express.Router();

api.get("/group/staff", mdAuth.ensureAuth, GroupController.getStaffList);
api.get("/group/members/:id", mdAuth.ensureAuth, GroupController.getGroupMembers);

module.exports = api;
