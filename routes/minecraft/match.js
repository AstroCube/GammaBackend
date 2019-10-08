"use strict";

const express = require("express");
const clusterAuth = require("@cluster_auth");
const mdAuth = require("@default_auth");
const MatchController = require("@match_controller");

let api = express.Router();

api.post("/match/create", clusterAuth.ensureAuth, MatchController.matchCreate);
api.post("/match/find", clusterAuth.ensureAuth, MatchController.matchFind);
api.get("/match/get/:id", clusterAuth.ensureAuth, MatchController.matchGet);
api.get("/match/get-website/:id", mdAuth.ensureAuth, MatchController.matchGetWebsite);
api.put("/match/update/:id", clusterAuth.ensureAuth, MatchController.matchUpdate);
api.get("/match/clean", clusterAuth.ensureAuth, MatchController.matchCleanup);

module.exports = api;
