"use strict";

require('dotenv').config();
require('module-alias/register');
const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config.json");


mongoose.Promise = global.Promise;
mongoose.connect(config.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("[SEOCRAFT API] Se ha hecho una conexión exitosa con la base de datos.");
    app.listen(5001, config.BACKEND_URL, () => {
      console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + config.BACKEND_URL + ":" + 5001);
    });
    app.listen(5002, config.BACKEND_URL, () => {
        console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + config.BACKEND_URL + ":" + 5002);
    });
    app.listen(5003, config.BACKEND_URL, () => {
        console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + config.BACKEND_URL + ":" + 5003);
    });
  })
  .catch( err => {
    console.log(err);
    console.log("[SEOCRAFT API] Ha ocurrido un error al iniciar el servidor.");
  });
