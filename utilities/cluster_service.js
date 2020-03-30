"use strict";

const jwt_e = require("jsonwebtoken");

const config = require("../config");
const secret = config.TOKENIZATION_SECRET;

exports.createToken = function(server) {
  return jwt_e.sign(
      {
        _id: server._id
      },
      secret
  );
};
