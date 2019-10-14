"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let UserSchema = Schema({
  // -- Mandatory fields -- //
  username: String,
  username_lowercase: String,
  email: String,
  password: String,
  group: [{
    _id: {type: Schema.ObjectId, ref: 'Group'},
    add_date: String,
    role_comment: String
  }],
  // -- Automatic fields -- //
  skin: { type: String, default: "Steve" },
  last_seen: String,
  last_game: {type: String, default: "main_lobby"},
  main_lobby: {type: String, default: "main_lobby"},
  member_since: Number,
  verified: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 1 },
  used_ips: [{
    _id: false,
    number: String,
    country: String,
    primary: Boolean
  }],
  discord: {
    id: String,
    accessToken: String,
    refreshToken: String,
    tokenTimestamp: String
  },
  logged: String,
  // -- Disguise fields  -- //
  disguised: { type: Boolean, default: false },
  disguise_actual: String,
  disguise_lowercase: String,
  disguise_group: {
    type: Schema.ObjectId,
    ref: 'Group'
  },
  disguise_history: [{
    _id: false,
   nickname: String,
   group: {
     type: Schema.ObjectId,
     ref: 'Group'
   },
   created_at: String
  }],
  // -- Customizable fields -- //
  language: { type: String, enum: ['es', 'en', 'fr'], default: "es"},
  gender: String,
  occupation: String,
  location: String,
  interests: String,
  public_email: String,
  twitter: String,
  reddit: String,
  steam: String,
  twitch: String,
  about: String,
  // -- Settings fields -- //
  ac_active: {type: Boolean, default: false},
  subscribe_topics: { type: Boolean, default: false },
  alert_quoted: { type: Boolean, default: false },
  accept_gifts: { type: Boolean, default: false },
  accept_friends : { type: Boolean, default: false },
  accept_parties: { type: Boolean, default: false },
  show_status: { type: Boolean, default: false },
  receive_requests: { type: Boolean, default: true },
  hiding_players: { type: Boolean, default: false}
});

module.exports = mongoose.model('User', UserSchema);
