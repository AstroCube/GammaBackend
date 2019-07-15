"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let MapSchema = Schema({
  name: String,
  nameLowercase: String,
  file: String,
  configuration: String,
  image: String,
  author: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  version: String,
  contributors: [{
    _id: false,
    contributor: {
      type: Schema.ObjectId,
      ref: 'User'
    },
    contribution: String
  }],
  gamemode: {
    type: Schema.ObjectId,
    ref: 'Gamemode'
  },
  subGamemode: String,
  description: String,
  rating: [
    {
      _id: false,
      star: { type: String, enum: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] },
      user: {
        type: Schema.ObjectId,
        ref: 'User'
      }
    }
  ],
  registeredDate: String
});

module.exports = mongoose.model('Map', MapSchema);