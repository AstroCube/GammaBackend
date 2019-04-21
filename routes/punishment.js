"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const md_auth = require("@default_auth");
const punishment_controller = require("@punishment_controller");

let api = express.Router();

api.post("/punishment/create/:report?", md_auth.ensureAuth, punishment_controller.punishment_create);
api.get("/punishment/get/:id", md_auth.ensureAuth, punishment_controller.punishment_get);
api.put("/punishment/update/:id", md_auth.ensureAuth, punishment_controller.punishment_update);
api.get("/punishment/list/:page?", md_auth.ensureAuth, punishment_controller.punishment_list);
// --- Minecraft Routes --- //
api.post("/punishment/server-create", cluster_auth.ensureAuth, punishment_controller.ingame_create);
api.post("/punishment/server-list/:page?", cluster_auth.ensureAuth, punishment_controller.ingame_list);

module.exports = api;