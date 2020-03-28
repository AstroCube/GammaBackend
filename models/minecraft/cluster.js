"use strict";

const Promise = require("bluebird");
let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ClusterSchema = Schema({
      name: {
        type: String,
        unique: true,
        lowercase: true
      }
    },
    { timestamps: true }
);

module.exports = Promise.promisifyAll(mongoose.model('Cluster', ClusterSchema));
