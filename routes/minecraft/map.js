"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const mdAuth = require("@default_auth");
const MapController = require("@map_controller");

let api = express.Router();

// -- Cluster Related -- //
api.post("/map/load", cluster_auth.ensureAuth, MapController.mapLoad);
api.get("/map/get/:id", MapController.mapGet);
api.get("/map/get-query/:page", MapController.mapQueryPagination);
api.get("/map/get-user/:user", MapController.mapUserGet);
api.get("/map/get-website/:id", mdAuth.ensureAuth, MapController.mapGetWebsite);
api.post("/map/vote", cluster_auth.ensureAuth, MapController.mapVote);
api.get("/map/get-image/:file", MapController.mapImage);
api.get("/map/get-file/:file", cluster_auth.ensureAuth, MapController.mapFile);
api.get("/map/get-config/:file", cluster_auth.ensureAuth, MapController.mapConfiguration);

module.exports = api;
