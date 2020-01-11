"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let StatsSchema = Schema({
  username: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  dungeon: {
    squamas: { type: Number, default: 0 },
    crowns: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    helmet: Schema.Types.Mixed,
    chestplate: Schema.Types.Mixed,
    leggings: Schema.Types.Mixed,
    boots: Schema.Types.Mixed,
    sword: Schema.Types.Mixed,
    bow: Schema.Types.Mixed
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
    runDoubleJump: {type: Number, default: 2},
    coins: {type: Number, default: 0}
  }
});

module.exports = mongoose.model('Stats', StatsSchema);
