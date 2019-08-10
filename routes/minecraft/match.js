"use strict";

const express = require("express");
const clusterAuth = require("@cluster_auth");
const ingameAuth = require("@ingame_auth");
const MatchController = require("@match_controller");

let api = express.Router();

api.post("/match/create", clusterAuth.ensureAuth, MatchController.matchCreate);
api.post("/match/find", clusterAuth.ensureAuth, MatchController.matchFind);
api.get("/match/get/:id", clusterAuth.ensureAuth, MatchController.matchGet);

module.exports = api;