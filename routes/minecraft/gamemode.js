"use strict";

const express = require("express");
const GamemodeController = require("@gamemode_controller");

let api = express.Router();

// -- Cluster Related -- //
api.get("/gamemode/get/:id", GamemodeController.getGamemode);
api.get("/gamemode/list", GamemodeController.listGamemodes);

module.exports = api;