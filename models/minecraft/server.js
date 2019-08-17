"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ServerSchema = Schema({
  slug: String,
  type: { type: String, enum: ['lobby', 'game', 'special', 'bungee'] },
  gamemode: {
    type: Schema.ObjectId,
    ref: 'Gamemode'
  },
  sub_gamemode: String,
  max_running: {type: Number, default: 1},
  max_total: {type: Number, default: 1},
  started_at: String,
  players: [{
    type: Schema.ObjectId,
    ref: 'User',
  }],
  maxPlayers: Number,
  cluster: {
    type: Schema.ObjectId,
    ref: 'Cluster'
  },
  matches: [{
    type: Schema.ObjectId,
    ref: 'Match'
  }]
});

module.exports = mongoose.model('Server', ServerSchema);