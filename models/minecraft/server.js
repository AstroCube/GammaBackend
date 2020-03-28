"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ServerSchema = Schema(
    {
      slug: {
        type: String,
        index: true,
        unique: true,
        lowercase: true
      },
      type: { type: String, enum: ['Lobby', 'Game', 'Special', 'Bungee'] },
      gamemode: {
        type: Schema.ObjectId,
        ref: 'Gamemode'
      },
      subGamemode: String,
      maxRunning: {type: Number, default: 1},
      maxTotal: {type: Number, default: 1},
      players: [{
        type: Schema.ObjectId,
        ref: 'User',
      }],
      cluster: {
        type: Schema.ObjectId,
        ref: 'Cluster'
      },
      matches: [{
        type: Schema.ObjectId,
        ref: 'Match'
      }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Server', ServerSchema);
