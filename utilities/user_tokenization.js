"use strict";

const jwt_tokenization = require("jwt-simple");
const config = require("../config");
const secret = config.TOKENIZATION_SECRET;
const moment = require("moment");

exports.createToken = function(user) {
  let payload = {
    sub: user._id,
    created_at: moment().unix()
  };
  return jwt_tokenization.encode(payload, secret);
};
