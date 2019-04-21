"use strict";

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let WorkspaceSchema = Schema({
  owner: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  world: String,
  last_save: String,
  settings: {
    night: { type: Boolean, default: false },
    tnt: { type: Boolean, default: false },
    physics: { type: Boolean, default: true },
    we: { type: Boolean, default: true },
    public: { type: Boolean, default: false },
    voxel: { type: Boolean, default: true }
  },
  warps: [{
    name: String,
    x: Number,
    y: Number,
    z: Number
  }],
  permissions: [
    {
      _id: false,
      user: {
        type: Schema.ObjectId,
        ref: 'User'
      },
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false },
      config: { type: Boolean, default: false }
    }
  ]
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);