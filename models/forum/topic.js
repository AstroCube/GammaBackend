"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let TopicSchema = Schema({
  subject: String,
  created_at: String,
  created_by: {type: Schema.ObjectId, ref: 'User'},
  forum: {type: Schema.ObjectId, ref: 'Forum'},
  subscribers: [
    {type: Schema.ObjectId, ref: 'User'}
  ],
  pinned: Boolean,
  official: Boolean,
  locked: Boolean
});

module.exports = mongoose.model('Topic', TopicSchema);