"use strict";

const express = require("express");
const md_auth = require("@default_auth");
const TopicController = require("@topic_controller");

let api = express.Router();

api.post("/topic/create", md_auth.ensureAuth, TopicController.topic_create);
api.get("/topic/get/:id", md_auth.ensureAuth, TopicController.topic_get);
api.get("/topic/get-post/:id", md_auth.ensureAuth, TopicController.post_get);
api.get("/topic/like-status/:id", md_auth.ensureAuth, TopicController.post_like);
api.get("/topic/pin/:id", md_auth.ensureAuth, TopicController.topic_pin);
api.get("/topic/lock/:id", md_auth.ensureAuth, TopicController.topic_lock);
api.get("/topic/official/:id", md_auth.ensureAuth, TopicController.topic_official);
api.get("/topic/subscription-status/:id", md_auth.ensureAuth, TopicController.topic_subscribe);
api.post("/topic/reply", md_auth.ensureAuth, TopicController.topic_reply);
api.put("/topic/update/:id", md_auth.ensureAuth, TopicController.post_update);
api.delete("/topic/delete/:id", md_auth.ensureAuth, TopicController.topic_delete);
api.delete("/topic/delete-post/:id", md_auth.ensureAuth, TopicController.post_delete);

module.exports = api;