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
      material: {
        type: Number,
        default: 0
      },
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    chestplate: {
      material: {
        type: Number,
        default: 0
      },
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    leggings: {
      material: {
        type: Number,
        default: 0
      },
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    boots: {
      material: {
        type: Number,
        default: 0
      },
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    sword: {
      material: {
        type: Number,
        default: 0
      },
      pe: [
        {
          enchantment: String,
          level: Number
        }
      ]
    },
    bow: {
      material: {
        type: Number,
        default: 0
      },
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
      {
        type: String,
        default: ['glass']
      }
    ],
    cages: [
      {
        type: String,
        default: ['naturalist']
      }
    ],
    currentKit: {
      type: String,
      default: 'naturalist'
    },
    currentCage: {
      type: String,
      default: 'glass'
    }
  },
  tntGames: {
    runDoubleJump: {type: Number, default: 2},
    coins: {type: Number, default: 0}
  }
});

module.exports = mongoose.model('Stats', StatsSchema);
