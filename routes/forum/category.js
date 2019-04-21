"use strict";

const express = require("express");
const md_auth = require("@default_auth");
const CategoryController = require("@category_controller");

let api = express.Router();

api.post("/category/create", md_auth.ensureAuth, CategoryController.category_create);
api.get("/category/get/:id", md_auth.ensureAuth, CategoryController.category_get);
api.get("/category/list", md_auth.ensureAuth, CategoryController.category_list);
api.delete("/category/delete/:id", md_auth.ensureAuth, CategoryController.category_delete);
api.put("/category/update/:id", md_auth.ensureAuth, CategoryController.category_update);

module.exports = api;