"use strict";

const Promise = require("bluebird");
let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let CosmeticSchema = Schema({
  name: String,
  color: String,
  rarity: { type: String, enum: ['common', 'uncommon', 'rare', 'special', 'exotic', 'exclusive'] },
  image: String
});

module.exports = Promise.promisifyAll(mongoose.model('Cosmetic', CosmeticSchema));