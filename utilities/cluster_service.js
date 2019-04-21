"use strict";

const jwt = require("jwt-simple");
const moment = require("moment");

exports.createToken = function(server) {
  let payload = {
    sub: server._id,
    created_at: moment().unix()
  };
  return jwt.encode(payload, process.env.TOKENIZATION_SECRET);
};
