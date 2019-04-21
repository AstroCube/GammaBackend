"use strict";

const jwt = require("jwt-simple");
const moment = require("moment");

exports.ensureAuth = function(req, res, next) {

  if (!req.headers.authorization) {
    return res.status(403).send({message: 'No se ha dado ningun Token de autenticación.'});
  }

  let token = req.headers.authorization.replace (/['"]+/g, '');

  try {
    var payload = jwt.decode(token, process.env.TOKENIZATION_SECRET);

    if(payload.exp <= moment().unix()) {
      return res.status(401).send({
        message: 'El token de autenticación ha expirado.'
      });
    }
  } catch(ex){
    return res.status(404).send({
      message: 'El token de autenticación no es valido.'
    });
  }

  req.server = payload;
  next();

};