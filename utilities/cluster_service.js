"use strict";

const jwt = require("jwt-simple");
const moment = require("moment");

const config = require("../config");
const secret = config.TOKENIZATION_SECRET;

exports.createToken = function(server) {
  let payload = {
    sub: server._id,
    created_at: moment().unix()
  };
  return jwt.encode(payload, secret);
};
