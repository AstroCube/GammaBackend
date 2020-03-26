"use strict";

const express = require("express");
const cluster_auth = require("@cluster_auth");
const ingame_auth = require("@ingame_auth");
const PartyController = require("@party_controller");

let api = express.Router();

module.exports = api;
