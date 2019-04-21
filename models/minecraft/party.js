"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let PartySchema = Schema({
  leader: {
    type: Schema.ObjectId, ref: 'User'
  },
  match: {
    type: Schema.ObjectId, ref: 'Match'
  },
  members: [{
    _id: false,
    user: {
      type: Schema.ObjectId, ref: 'User'
    },
    joined_at: String
  }],
  pending: [{
    type: Schema.ObjectId, ref: 'User'
  }],
  poll: String,
  answers: [
    String
  ]
});

module.exports = mongoose.model('Party', PartySchema);