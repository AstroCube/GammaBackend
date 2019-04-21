"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let StatsSchema = Schema({
  username: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  achievements: [
    {
      type: String,
      default: []
    }
  ],
  cosmetics: [{
    _id: false,
    cosmetic: {
        type: Schema.ObjectId,
        ref: 'Cosmetic'
      },
    quantity: Number
    }],
  game_stats: {
    tnt_games: {
      coins: { type: Number, default: 0 },
      bow_spleef: {
        store: {
          "blast_protection": { type: Number, default: 1 },
          "speed_start": { type: Number, default: 1 },
          "speed_gain": { type: Number, default: 1 },
          "slow_throw": { type: Number, default: 1 }
        }
      },
      tnt_tag: {
        store: {
          "blast_protection": { type: Number, default: 1 },
          "speed_start": { type: Number, default: 1 },
          "speed_gain": { type: Number, default: 1 },
          "slow_throw": { type: Number, default: 1 }
        }
      },
      tnt_run: {
        store: {
          "blast_protection": { type: Number, default: 1 },
          "speed_start": { type: Number, default: 1 },
          "speed_gain": { type: Number, default: 1 },
          "slow_throw": { type: Number, default: 1 }
        }
      }
    },
    skywars: {
      coins: { type: Number, default: 0 },
      pearls: { type: Number, default: 0 },
      kills: { type: Number, default: 0 },
      cosmetics: [
        {
          type: String,
          default: []
        }
      ],
      kits: [
        {
          type: String,
          default: []
        }
      ]
    }
  }
});

module.exports = mongoose.model('Stats', StatsSchema);