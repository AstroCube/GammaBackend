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
    helmet: {
      material: Number,
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    chestplate: {
      material: Number,
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    leggings: {
      material: Number,
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    boots: {
      material: Number,
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    sword: {
      material: Number,
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    bow: {
      material: Number,
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    }
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
