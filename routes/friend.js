"use strict";

const express = require("express");
const cluster = require("@cluster_auth");
const ingame_auth = require("@ingame_auth");
const FriendController = require("@friend_controller");

let api = express.Router();

api.post("/friend/send", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.ingame_request);
api.post("/friend/accept", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.accept_ingame);
api.post("/friend/remove", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.remove_ingame);
api.get("/friend/reject", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.reject_ingame);
api.get("/friend/toggle-requests", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.toggle_ingame);
api.get("/friend/toggle-sort/:sort", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.ingame_sort);
api.get("/friend/toggle-reverse", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.reverse_sort);
api.post("/friend/list/:page?", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.get_players);
api.get("/friend/get-sort", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.ingame_sort_get);
api.post("/friend/remove-all", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.remove_all);
api.post("/friend/requests/:page?", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.get_requests);
api.post("/friend/find/:page?", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.find_user);
api.post("/friend/are-friends", [cluster.ensureAuth, ingame_auth.ensureAuth], FriendController.are_friends);

module.exports = api;
