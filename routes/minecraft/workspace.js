"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const ingame_auth = require("@ingame_auth");
const workspace_controller = require("@workspace_controller");

let api = express.Router();

api.post("/workspace/create/:uuid", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], workspace_controller.workspace_create);
api.post("/workspace/save-map/:id", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], workspace_controller.workspace_save);
api.put("/workspace/settings/:id", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], workspace_controller.workspace_settings);
api.put("/workspace/warp-add/:id", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], workspace_controller.workspace_warp_add);
api.delete("/workspace/warp-remove/:id", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], workspace_controller.workspace_warp_delete);
api.post("/workspace/permissions-add/:id", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], workspace_controller.workspace_permissions_add);
api.put("/workspace/permissions-update/:id", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], workspace_controller.workspace_permissions_update);
api.post("/workspace/permissions-revoke/:id", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], workspace_controller.workspace_permissions_revoke);

module.exports = api;