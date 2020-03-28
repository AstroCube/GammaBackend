"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let GamemodeSchema = Schema({
      name: String,
      lobby: String,
      navigator: String,
      slot: Number,
      subTypes: [{
        _id: false,
        name: String,
        selectableMap: String,
        minPlayers: Number,
        maxPlayers: Number,
        permission: String,
        group: String
      }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Gamemode', GamemodeSchema);
