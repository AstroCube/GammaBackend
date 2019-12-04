"use strict";

const discord_service = require("@discord_service");
const express = require("express");
const cluster = require("@cluster_auth");
const md_auth = require("@default_auth");
const user_controller = require("@user_controller");

let api = express.Router();

api.get('/favicon.ico', (req, res) => res.status(204));
api.post("/user/login-website", user_controller.login_user);
api.get("/user/token-validation", md_auth.ensureAuth, user_controller.token_validation);
api.post("/user/password-update", md_auth.ensureAuth, user_controller.password_update);
api.put("/user/update-user/:id", md_auth.ensureAuth, user_controller.update_user);
api.get("/user/get-user/:user?", md_auth.ensureAuth, user_controller.getUser);
api.get("/user/get-users", md_auth.ensureAuth, user_controller.get_users);
api.get("/user/list-names/:own?", md_auth.ensureAuth, user_controller.user_list);
api.get("/user/get-placeholder/:id?", md_auth.ensureAuth, user_controller.getPlaceholder);
api.post("/user/permission-checker", md_auth.ensureAuth, user_controller.permission_checker);
api.get("/user/email-verification/:id", cluster.ensureAuth, user_controller.email_verification);
api.put("/user/email-update", md_auth.ensureAuth, user_controller.email_update);

// -- Discord sync routes -- //
api.get("/discord-sync", discord_service.discordRedirect);
api.get("/discord-sync/callback", discord_service.discordSync);
api.get("/discord-logout/:id", discord_service.discord_logout);
api.get("/discord-placeholder/:id?", md_auth.ensureAuth, discord_service.website_placeholder);

module.exports = api;
