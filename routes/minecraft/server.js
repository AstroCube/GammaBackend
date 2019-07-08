"use strict";

const express = require("express");
const mdAuth = require("@default_auth");
const clusterAuth = require("@cluster_auth");
const serverController = require("@server_controller");
const clusterController = require("@cluster_controller");

let api = express.Router();

api.post("/clusters/create/:cluster", mdAuth.ensureAuth, clusterController.create_cluster);
api.get("/clusters/get/:id", mdAuth.ensureAuth, clusterController.get_cluster);
api.put("/clusters/update/:id", mdAuth.ensureAuth, clusterController.update_cluster);
api.delete("/clusters/delete/:id", mdAuth.ensureAuth, clusterController.delete_cluster);

api.post("/server/connect", serverController.loadServer);
api.post("/server/get-query", clusterAuth.ensureAuth, serverController.getServerByQuery);
api.put("/server/update/:id", clusterAuth.ensureAuth, serverController.updateServer);
api.get("/server/get/:id", clusterAuth.ensureAuth, serverController.getServer);
api.delete("/server/disconnect", clusterAuth.ensureAuth, serverController.disconnectServer);

module.exports = api;