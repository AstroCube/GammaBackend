"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const MapController = require("@map_controller");

let api = express.Router();

// -- Cluster Related -- //
api.post("/map/load", cluster_auth.ensureAuth, MapController.mapLoad);
api.post("/map/vote", cluster_auth.ensureAuth, MapController.mapVote);

module.exports = api;