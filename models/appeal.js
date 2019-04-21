"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let AppealSchema = Schema({
  punishment: {
    type: Schema.ObjectId,
    ref: 'Punishment'
  },
  created_at: String,
  creator_ip: String,
  actions: [{
    type: Schema.ObjectId,
    ref: 'Action'
  }],
  escalated: Boolean,
  escalated_assigned: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  closed: Boolean,
  locked: Boolean
});

module.exports = mongoose.model('Appeal', AppealSchema);