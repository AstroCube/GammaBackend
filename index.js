"use strict";

require('dotenv').config();
require('module-alias/register');
const mongoose = require("mongoose");
const app = require("./app");


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("[SEOCRAFT API] Se ha hecho una conexión exitosa con la base de datos.");
    app.listen(process.env.BACKEND_PORT ,process.env.BACKEND_URL, () => {
      console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + process.env.BACKEND_URL + ":" + process.env.BACKEND_PORT);
    });
  })
  .catch( err => {
    console.log (err);
    console.log ("[SEOCRAFT API] Ha ocurrido un error al iniciar el servidor.");
  });

//TODO: Fix MAP issues - reorder Forum functions