"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const GamemodeController = require("@gamemode_controller");

let api = express.Router();

// -- Cluster Related -- //
api.get("/gamemode/get/:id", cluster_auth.ensureAuth, GamemodeController.getGamemode);
api.get("/gamemode/list", cluster_auth.ensureAuth, GamemodeController.listGamemodes);

module.exports = api;