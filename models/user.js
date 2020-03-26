"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let UserSchema = Schema({
  // -- Mandatory fields -- //
  username: {
    type: String,
    index: true,
    unique: true,
    lowercase: true
  },
  display: String,
  email: {
    type: String,
    lowercase: true,
    unique: true,
    index: true
  },
  password: String,
  salt: String,
  groups: [{
    _id: false,
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      autopopulate: true
    },
    joined: Schema.Types.Date,
    comment: String
  }],
  // -- Automatic fields -- //
  skin: { type: String, default: "Steve" },
  session: {
    lastSeen: Number,
    lastGame: String,
    lastLobby: String,
    premium: Boolean
  },
  verified: { type: Boolean, default: false },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 1 },
  address: [{
    _id: false,
    number: String,
    country: String,
    primary: Boolean
  }],
  discord: {
    id: String,
    access: String,
    refresh: String,
    stamp: String
  },
  // -- Customizable fields -- //
  language: { type: String, enum: ['es', 'en', 'fr'], default: "es"},
  publicInfo: {
    gender: Number,
    occupation: String,
    interests: String,
    email: String,
    twitter: String,
    reddit: String,
    steam: String,
    twitch: String,
    about: String
  },
  settings: {
    adminChat: {
      active: Boolean,
      logs: Boolean,
      punishments: Boolean
    },
    general: {
      gifts: Boolean,
      friends: Boolean,
      parties: Boolean,
      status: Boolean,
      hiding: Boolean
    },
    forum: {
      subscribe: Boolean,
      quoteAlert: Boolean
    }
  }
});

module.exports = mongoose.model('User', UserSchema);
