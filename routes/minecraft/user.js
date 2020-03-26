"use strict";

const cluster_auth = require("@cluster_auth");
const ingame_auth = require("@ingame_auth");
const express = require("express");
const minecraft_user_controller = require("@minecraft_user_controller");

let api = express.Router();

//api.post("/user/pre-join", cluster_auth.ensureAuth, minecraft_user_controller.bungee_join);//
api.post("/user/access", cluster_auth.ensureAuth, minecraft_user_controller.user_access);
api.get("/user/get/:username", cluster_auth.ensureAuth, minecraft_user_controller.user_get);
api.post("/user/register", cluster_auth.ensureAuth, minecraft_user_controller.server_register);
api.post("/user/login-server", cluster_auth.ensureAuth, minecraft_user_controller.server_login);
api.put("/user/update-server/:id", cluster_auth.ensureAuth, minecraft_user_controller.user_update);
api.get("/user/left-record", ingame_auth.ensureAuth, minecraft_user_controller.server_left);
api.post("/user/email-register", cluster_auth.ensureAuth, minecraft_user_controller.server_email_register);
api.get("/user/verify", minecraft_user_controller.server_email_verify);
api.post("/user/user-login", cluster_auth.ensureAuth, minecraft_user_controller.production_join);
api.post("/user/get-permissions", cluster_auth.ensureAuth, minecraft_user_controller.user_permissions);

module.exports = api;
