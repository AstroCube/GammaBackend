"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const ingame_auth = require("@ingame_auth");
const PartyController = require("@party_controller");

let api = express.Router();

api.post("/party/main", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], PartyController.party_command);
api.post("/party/accept", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], PartyController.party_accept);
api.post("/party/invite", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], PartyController.party_invite);
api.post("/party/promote", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], PartyController.party_promote);
api.get("/party/leave", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], PartyController.party_leave);
api.get("/party/disband", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], PartyController.party_disband);
api.get("/party/kick-offline", [cluster_auth.ensureAuth, ingame_auth.ensureAuth], PartyController.party_kick_offline);

module.exports = api;