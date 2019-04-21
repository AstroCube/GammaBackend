"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ReportSchema = Schema({
  created_at: String,
  creator_ip: String,
  punishment: {
    type: Schema.ObjectId,
    ref: 'Report'
  },
  creator: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  involved: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  assigned: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  actions: [{
    type: Schema.ObjectId,
    ref: 'Action'
  }],
  rule: String,
  evidence: String,
  miscellaneous: String,
  closed: Boolean
});

module.exports = mongoose.model('Report', ReportSchema);