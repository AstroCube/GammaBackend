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
      material: String,
      te: [
          Schema.Types.Mixed
      ],
      pe: [
          Schema.Types.Mixed
      ]
    },
    chestplate: {
      material: String,
      te: [
        Schema.Types.Mixed
      ],
      pe: [
        Schema.Types.Mixed
      ]
    },
    leggings: {
      material: String,
      te: [
        Schema.Types.Mixed
      ],
      pe: [
        Schema.Types.Mixed
      ]
    },
    boots: {
      material: String,
      te: [
        Schema.Types.Mixed
      ],
      pe: [
        Schema.Types.Mixed
      ]
    },
    sword: {
      material: String,
      te: [
        Schema.Types.Mixed
      ],
      pe: [
        Schema.Types.Mixed
      ]
    },
    bow: {
      material: String,
      te: [
        Schema.Types.Mixed
      ],
      pe: [
        Schema.Types.Mixed
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
