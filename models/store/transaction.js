"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let TransactionSchema = Schema({
  items: [{
    _id: false,
    product: {
      type: Schema.ObjectId,
      ref: 'Product'
    },
    quantity: Number
  }],
  created_at: Number,
  status: { type: String, enum: ['success', 'declined', 'refunded', 'pending', 'cancelled'] },
  gateway: String,
  total: Number
});

module.exports = mongoose.model('Cart', TransactionSchema);