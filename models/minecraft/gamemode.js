"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let GamemodeSchema = Schema({
  name: String,
  scoreboard: String,
  lobby: String,
  navigator: String,
  slot: Number,
  sub_types: [{
    _id: false,
    name: String,
    scoreboard: String,
    selectable_map: String,
    min_players: Number,
    max_players: Number,
    permission: String,
    group: String
  }],
});

module.exports = mongoose.model('Gamemode', GamemodeSchema);