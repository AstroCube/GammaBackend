"use strict";

require('dotenv').config();
require('module-alias/register');
const mongoose = require("mongoose");
const app = require("./app");

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("[SEOCRAFT API] Se ha hecho una conexión exitosa con la base de datos.");
    app.listen(5001, process.env.BACKEND_URL, () => {
      console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + process.env.BACKEND_URL + ":" + 5001);
    });
    app.listen(5002, process.env.BACKEND_URL, () => {
        console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + process.env.BACKEND_URL + ":" + 5002);
    });
    app.listen(5003, process.env.BACKEND_URL, () => {
        console.log("[SEOCRAFT API] La API actualmente se encuentra escuchando en http://" + process.env.BACKEND_URL + ":" + 5003);
    });
  })
  .catch( err => {
    console.log(err);
    console.log("[SEOCRAFT API] Ha ocurrido un error al iniciar el servidor.");
  });
