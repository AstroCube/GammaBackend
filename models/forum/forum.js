"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ForumSchema = Schema({
  name: String,
  order: Number,
  description: String,
  category: {type: Schema.ObjectId, ref: 'Category'},
  parent: {type: Schema.ObjectId, ref: 'Forum'}
});

module.exports = mongoose.model('Forum', ForumSchema);