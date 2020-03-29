"use strict";

const jwt_e = require("express-jwt");

const config = require("../config");
const secret = config.TOKENIZATION_SECRET;

exports.createToken = function(server) {
  return jwt_e.sign(
      {
        _id: server
      },
      secret
  );
};
