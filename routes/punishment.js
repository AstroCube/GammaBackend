"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const md_auth = require("@default_auth");
const punishment_controller = require("@punishment_controller");

let api = express.Router();

api.post("/punishment/create/:report?", md_auth.ensureAuth, punishment_controller.punishment_create);
api.get("/punishment/get/:id", md_auth.ensureAuth, punishment_controller.punishment_get);
api.put("/punishment/update/:id", md_auth.ensureAuth, punishment_controller.punishment_update);
api.get("/punishment/user/:id", md_auth.ensureAuth, punishment_controller.listFriendsWebsite);
api.get("/punishment/list/:page?", punishment_controller.punishment_list);
// --- Minecraft Routes --- //
api.get("/punishment/get-model/:id", cluster_auth.ensureAuth, punishment_controller.punishment_get_model);
api.get("/punishment/list-model", cluster_auth.ensureAuth, punishment_controller.punishment_list_user);
api.get("/punishment/get-last", cluster_auth.ensureAuth, punishment_controller.punishment_last);

module.exports = api;
