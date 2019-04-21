"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let FriendSchema = Schema({
  username: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  accepted: [
    String
  ],
  pending: [
    String
  ],
  settings: {
    receive_requests: Boolean,
    friends_sorted: Number,
    reversed: Boolean
  }
});

module.exports = mongoose.model('Friend', FriendSchema);