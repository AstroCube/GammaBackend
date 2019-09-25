"use strict";

const express = require("express");
const clusterAuth = require("@cluster_auth");
const ingameAuth = require("@ingame_auth");
const MatchController = require("@match_controller");

let api = express.Router();

api.post("/match/create", clusterAuth.ensureAuth, MatchController.matchCreate);
api.post("/match/find", clusterAuth.ensureAuth, MatchController.matchFind);
api.get("/match/get/:id", clusterAuth.ensureAuth, MatchController.matchGet);
api.put("/match/update/:id", clusterAuth.ensureAuth, MatchController.matchUpdate);
api.get("/match/clean", clusterAuth.ensureAuth, MatchController.matchRemoveAll);

module.exports = api;