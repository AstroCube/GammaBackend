"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let MapSchema = Schema({
  name: String,
  name_lowercase: String,
  file: String,
  xml: String,
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
  sub_type: String,
  description: String,
  rating: {
    one_star: [
      String
    ],
    two_stars: [
      String
    ],
    three_stars: [
      String
    ],
    four_stars: [
      String
    ],
    five_stars: [
      String
    ]
  },
  add_date: String
});

module.exports = mongoose.model('Map', MapSchema);