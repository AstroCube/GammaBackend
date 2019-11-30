"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let StatsSchema = Schema({
  username: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  skyWars: {
    kills: { type: Number, default: 0 },
    deaths: {type: Number, default: 0},
    coins: { type: Number, default: 0 },
    kits: [
        String
    ],
    cages: [
        String
    ],
    currentKit: String,
    currentCage: String
  },
  tntGames: {
    runDoubleJump: {types: Number, default: 2},
    coins: {types: Number, default: 0}
  }
});

module.exports = mongoose.model('Stats', StatsSchema);
