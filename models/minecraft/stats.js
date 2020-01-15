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
        {
          enchantment: String,
          level: Number
        }
      ],
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    chestplate: {
      material: String,
      te: [
        {
          enchantment: String,
          level: Number
        }
      ],
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    leggings: {
      material: String,
      te: [
        {
          enchantment: String,
          level: Number
        }
      ],
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    boots: {
      material: String,
      te: [
        {
          enchantment: String,
          level: Number
        }
      ],
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    sword: {
      material: String,
      te: [
        {
          enchantment: String,
          level: Number
        }
      ],
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    bow: {
      material: String,
      te: [
        {
          enchantment: String,
          level: Number
        }
      ],
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
