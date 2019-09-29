"use strict";

const express = require("express");
const ClusterAuth = require("@cluster_auth");
const StatsController = require("@stats_controller");

let api = express.Router();

api.get("/stats/get/:id", ClusterAuth.ensureAuth, StatsController.getStats);
api.put("/stats/put/:id", ClusterAuth.ensureAuth, StatsController.updateStats);

module.exports = api;