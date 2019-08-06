"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const ingame_auth = require("@ingame_auth");
const MatchController = require("@match_controller");

let api = express.Router();

api.post("/match/create", cluster_auth.ensureAuth, MatchController.match_create);
api.post("/match/find", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], MatchController.match_find);

module.exports = api;