"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const stats_controller = require("@stats_controller");

let api = express.Router();

// -- Cluster Related -- //

api.post("/stats/get-server", cluster_auth.ensureAuth, stats_controller.user_stats);
api.post("/stats/get-inventory/:page?", cluster_auth.ensureAuth, stats_controller.get_inventory);
api.post("/stats/update-server", cluster_auth.ensureAuth, stats_controller.update_stats);

module.exports = api;