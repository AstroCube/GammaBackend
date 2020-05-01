"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let MatchSchema = Schema(
    {
      map: {
        type: Schema.Types.ObjectId,
        ref: 'Map'
      },
      createdAt: String,
      teams: [{
        _id: false,
        name: String,
        members: [{
          _id: false,
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
          },
          joinedAt: String
        }],
        color: String
      }],
      winner: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      status: { type: String, enum: ['waiting', 'starting', 'ingame', 'finished', 'preparing', 'invalidated', 'forced']},
      gamemode: {
        type: Schema.Types.ObjectId,
        ref: 'Gamemode'
      },
      subGamemode: String
    },
    { timestamps: true }
);

module.exports = mongoose.model('Match', MatchSchema);
