"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let AlertSchema = Schema({
  type: {
    type: String,
    enum: [
      'appeal_issued',
      'appeal_action',
      'report_action',
      'friend_request',
      'forum_quote',
      'forum_subscribed',
      'forum_subscribe_news'
    ],
  },
  user: {
      type: Schema.ObjectId,
      ref: 'User'
  },
  second_user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  related: String,
  created_at: String
});

module.exports = mongoose.model('Alert', AlertSchema);