"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let CartSchema = Schema({
  items: [{
    _id: false,
    product: {
      type: Schema.ObjectId,
      ref: 'Product'
    },
    quantity: Number
  }],
  owner: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created_at: Number
});

module.exports = mongoose.model('Cart', CartSchema);