"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let SectionSchema = Schema({
  name: String,
  discount: Number,
  order: Number,
  description: String
});

module.exports = mongoose.model('Section', SectionSchema);