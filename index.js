"use strict";

require('module-alias/register');
const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config.json");
const backend = config.BACKEND_URL + "";


mongoose.Promise = global.Promise;
mongoose.connect(config.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("[SEOCRAFT API] Se ha hecho una conexión exitosa con la base de datos.");
    app.listen(5001, backend, () => {
      console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + config.BACKEND_URL + ":" + 5001);
    });
    app.listen(5002, backend, () => {
        console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + config.BACKEND_URL + ":" + 5002);
    });
    app.listen(5003, backend, () => {
        console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + config.BACKEND_URL + ":" + 5003);
    });
  })
  .catch( err => {
    console.log(err);
    console.log("[SEOCRAFT API] Ha ocurrido un error al iniciar el servidor.");
  });
