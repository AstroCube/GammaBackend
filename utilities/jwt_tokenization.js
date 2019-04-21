"use strict";

const jwt_tokenization = require("jwt-simple");
const moment = require("moment");
const secret = process.env.TOKENIZATION_SECRET;

exports.createToken = function(user, persistence) {
  let payload = {
    sub: user._id,
    expires: moment().add(3, 'hours').unix()
  };
  if (persistence) payload.expires = false;
  return jwt_tokenization.encode(payload, secret);
};
