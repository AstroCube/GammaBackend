"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let MatchSchema = Schema({
  map: {
    type: Schema.ObjectId,
    ref: 'Map'
  },
  createdAt: String,
  teams: [{
    _id: false,
    name: String,
    members: [{
      _id: false,
      user: {
      type: Schema.ObjectId,
      ref: 'User'
      },
      joinedAt: String
    }],
    color: { type: String, enum: ['solo', 'black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray', 'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white'] }
  }],
  winner: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  status: { type: String, enum: ['waiting', 'starting', 'ingame', 'finished', 'invalidated', 'forced']},
  gamemode: {
    type: Schema.ObjectId,
    ref: 'Gamemode'
  },
  subGamemode: String
});

module.exports = mongoose.model('Match', MatchSchema);