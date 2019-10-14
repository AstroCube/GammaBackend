"use strict";

const express = require("express");
const cluster = require("@cluster_auth");
const mdAuth = require("@default_auth");
const FriendController = require("@friend_controller");

let api = express.Router();

api.post("/friend/create", cluster.ensureAuth, FriendController.createFriendship);
api.get("/friend/check", cluster.ensureAuth, FriendController.checkFriendship);
api.delete("/friend/delete", cluster.ensureAuth, FriendController.removeFriendship);
api.get("/friend/list/:id", cluster.ensureAuth, FriendController.listFriends);
api.get("/friend/list-website/:id", mdAuth.ensureAuth, FriendController.listFriendsWebsite);
api.delete("/friend/remove-all/:id", cluster.ensureAuth, FriendController.clearFriends);

module.exports = api;
