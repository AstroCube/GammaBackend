"use strict";

const Promise = require("bluebird");
let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ClusterSchema = Schema({
  name: String,
  created_at: String
});

module.exports = Promise.promisifyAll(mongoose.model('Cluster', ClusterSchema));