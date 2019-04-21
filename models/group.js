"use strict";

const Promise = require("bluebird");
let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let GroupSchema = Schema({
  name: String,
  priority: Number,
  html_color: String,
  badge_color: String,
  badge_link: String,
  minecraft_flair: [
    {
      realm: String,
      color: String,
      symbol: String
    }
  ],
  minecraft_permissions: [{
      type: String
  }],
  staff: Boolean,
  discord_role: String,
  web_permissions: {
    user: {
      manage: Boolean
    },
    category: {
      manage: Boolean
    },
    view_ips: Boolean,
    punishments: {
      manage: Boolean,
      create: {
        warn: Boolean,
        kick: Boolean,
        temp_ban: Boolean,
        ban: Boolean,
        forum_ban: Boolean
      }
    },
    appeals: {
      manage: Boolean,
      transitional: {
        comment: { type: String, enum: ['all', 'involved'] },
        close: { type: String, enum: ['all', 'involved'] },
        lock: Boolean,
        escalate: { type: String, enum: ['all', 'involved'] },
        appeal: { type: String, enum: ['all', 'involved'] }
      },
      assign_escalated: Boolean,
      view: { type: String, enum: ['all', 'involved'] }
    },
    forum: Schema.Types.Mixed,
    reports: {
      manage: Boolean,
      assign: Boolean,
      view: { type: String, enum: ['all', 'involved'] }
    }
    /*
      manage: Boolean,
      official: Boolean,
      "forum_id": {
        manage: Boolean,
        create: Boolean,
        view: String ("own", "none", "all"),
        edit: String ("own", "none", "all"),
        comment: String ("own", "none", "all"),
        delete: Boolean,
        pin: Boolean,
        lock: Boolean
      }
    */
  }
});

module.exports = Promise.promisifyAll(mongoose.model('Group', GroupSchema));