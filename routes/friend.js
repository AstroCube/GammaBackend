"use strict";

const express = require("express");
const cluster = require("@cluster_auth");
const FriendController = require("@friend_controller");

let api = express.Router();

api.post("/friend/create", cluster.ensureAuth, FriendController.createFriendship);

module.exports = api;
