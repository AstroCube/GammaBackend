"use strict";

const express = require("express");
const md_auth = require("@default_auth");
const ForumController = require("@forum_controller");

let api = express.Router();

api.get("/forum/tree", md_auth.ensureAuth, ForumController.forum_tree);
api.post("/forum/create", md_auth.ensureAuth, ForumController.forum_create);
api.get("/forum/get/:id", md_auth.ensureAuth, ForumController.forum_get);
api.get("/forum/pre-fetch/:id", md_auth.ensureAuth, ForumController.forum_pre_fetch);
api.get("/forum/admin-list", md_auth.ensureAuth, ForumController.forum_admin_list);
api.get("/forum/admin-get/:id", md_auth.ensureAuth, ForumController.forum_admin_get);
api.put("/forum/update/:id", md_auth.ensureAuth, ForumController.forum_update);
api.get("/forum/read-all/:id", md_auth.ensureAuth, ForumController.forum_clear);
api.get("/forum/main", md_auth.ensureAuth, ForumController.forum_main);

module.exports = api;