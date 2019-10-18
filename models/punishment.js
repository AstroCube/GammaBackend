"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let PunishmentSchema = Schema({
  type: { type: String, enum: ['warn', 'kick', 'ban', 'forum-ban'] },
  punisher: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  punished: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  server: String,
  match: {
    type: Schema.ObjectId,
    ref: 'Match'
  },
  last_ip: String,
  silent: Boolean,
  created_at: String,
  reason: String,
  evidence: String,
  expires: String,
  automatic: Boolean,
  appealed: Boolean,
  active: Boolean
});

module.exports = mongoose.model('Punishment', PunishmentSchema);
