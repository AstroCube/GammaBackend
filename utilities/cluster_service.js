"use strict";

const jwt = require("jwt-simple");
const moment = require("moment");

const config = require("../config");
const secret = config.TOKENIZATION_SECRET;

exports.createToken = function(server) {
  let payload = {
    _id: server._id
  };
  return jwt.encode(payload, secret);
};
