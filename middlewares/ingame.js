"use strict";

const jwt = require("jwt-simple");

exports.ensureAuth = function(req, res, next) {

  if (!req.headers.game_authorization) {
    return res.status(403).send({message: "No se ha dado ningun Token de autenticación."});
  }

  let token = req.headers.game_authorization.replace(/['"]+/g, '');

  try {
    var payload = jwt.decode(token, process.env.TOKENIZATION_SECRET);
  } catch(ex){
    return res.status(404).send({message: "El token de autenticación no es valido."});
  }

  req.user = payload;
  next();

};
