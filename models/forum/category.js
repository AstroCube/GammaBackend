"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let CategorySchema = Schema({
  name: String,
  order: String
});

module.exports = mongoose.model('Category', CategorySchema);