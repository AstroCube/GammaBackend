"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ProductSchema = Schema({
  name: String,
  image: String,
  price: Number,
  description: String,
  discount: Number,
  deductions: [{
    type: Schema.ObjectId,
    ref: 'Product'
  }],
  active: Boolean,
  subscription: Boolean,
  require_one: Boolean,
  required: [{
    type: Schema.ObjectId,
    ref: 'Product'
  }]
});

module.exports = mongoose.model('Product', ProductSchema);