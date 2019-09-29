"use strict";

const express = require("express");
const ClusterAuth = require("@cluster_auth");
const StatsController = require("@stats_controller");

let api = express.Router();

api.post("/stats/get", ClusterAuth.ensureAuth, StatsController.getStats);
api.put("/stats/put", ClusterAuth.ensureAuth, StatsController.updateStats);

module.exports = api;