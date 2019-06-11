"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let FriendSchema = Schema({
  sender: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  receiver: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Friend', FriendSchema);