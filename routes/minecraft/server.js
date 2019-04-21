"use strict";

const express = require("express");
const md_auth = require("@default_auth");
const cluster_auth = require("@cluster_auth");
const server_controller = require("@server_controller");
const cluster_controller = require("@cluster_controller");

let api = express.Router();

api.post("/clusters/create", md_auth.ensureAuth, cluster_controller.create_cluster);
api.get("/clusters/get/:id", md_auth.ensureAuth, cluster_controller.get_cluster);
api.put("/clusters/update/:id", md_auth.ensureAuth, cluster_controller.update_cluster);
api.delete("/clusters/delete/:id", md_auth.ensureAuth, cluster_controller.delete_cluster);

api.post("/server/connect", server_controller.load_server);
api.delete("/server/disconnect", cluster_auth.ensureAuth, server_controller.disconnect_server);

module.exports = api;