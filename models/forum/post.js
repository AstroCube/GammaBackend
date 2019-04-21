"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let PostSchema = Schema({
  content: String,
  created_at: String,
  created_by: {type: Schema.ObjectId, ref: 'User'},
  quote: {type: Schema.ObjectId, ref: 'Post'},
  last_update: String,
  last_updater: {type: Schema.ObjectId, ref: 'User'},
  topic: {type: Schema.ObjectId, ref: 'Topic'},
  viewed_by: [
    {type: Schema.ObjectId, ref: 'User'}
  ],
  liked_by: [
    {type: Schema.ObjectId, ref: 'User'}
  ]
});

module.exports = mongoose.model('Post', PostSchema);