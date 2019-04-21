"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ActionsSchema = Schema({
  type: { type: String, enum: ['open', 'close', 'lock', 'unlock', 'comment', 'escalate', 'create', 'appeal', 'un-appeal', 'assign-escalate', 'punish'] },
  realm: { type: String, enum: ['appeal', 'report'] },
  username: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created_at: String,
  content: String
});

module.exports = mongoose.model('Actions', ActionsSchema);