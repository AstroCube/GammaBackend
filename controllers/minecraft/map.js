"use strict";

const AF = require("@auxiliar_functions");
const fs = require("fs");
const Gamemode = require("@gamemode");
const Map = require("@map");
const moment = require("moment");
const path = require("path");
const Promise = require("bluebird");
const User = require("@user");

module.exports = {

  mapLoad: function(req, res) {
    const params = req.body;

    Map.findOne({nameLowercase: params.name.toLowerCase()}, (err, mapRecord) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
      if (!mapRecord) {
        let map = new Map();
        map.name = params.name;
        map.nameLowercase = map.name.toLowerCase();
        map.author = params.author;
        map.version = params.version;
        map.contributors = params.contributors;
        map.gamemode = params.gamemode;
        map.subGamemode = params.subGamemode;
        map.description = params.description;
        map.rating = params.rating;

        // --- Image creation --- //
        const serialization = Math.floor(Math.random() * 255);
        const fileName = "./uploads/map/file/" + serialization + ".zip";
        fs.writeFile(fileName, params.image.split(";base64,").pop(), {encoding: "base64"}, (err) => {
          if (err) return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
          const configurationName = "./uploads/map/configuration/" + serialization + ".json";
          fs.writeFile(configurationName, params.image.split(";base64,").pop(), {encoding: "base64"}, (err) => {
            if (err) {
              AF.file_unlink(fileName);
              return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
            }
            const imageName = "./uploads/map/image/" + serialization + ".json";
            fs.writeFile(imageName, params.image.split(";base64,").pop(), {encoding: "base64"}, (err) => {
              if (err) {
                AF.file_unlink(fileName);
                AF.file_unlink(configurationName);
                return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
              }

              map.file = serialization + ".zip";
              map.configuration = serialization + ".json";
              map.image = serialization + ".png";

              map.save((err, savedMap) => {
                if (err) return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
                return res.status(200).send(savedMap);
              });
            });
          });
        });
      } else {
        if (parseInt(params.version.replace(/\./g, ""), 10) > parseInt(mapRecord.version.replace(/\./g, ""), 10)) {
          mapRecord.name = params.name;
          mapRecord.nameLowercase = map.name.toLowerCase();
          mapRecord.author = params.author;
          mapRecord.version = params.version;
          mapRecord.contributors = params.contributors;
          mapRecord.gamemode = params.gamemode;
          mapRecord.subGamemode = params.subGamemode;
          mapRecord.description = params.description;
          mapRecord.rating = params.rating;
          // --- Image creation --- //
          const serialization = Math.floor(Math.random() * 255);
          const fileName = "./uploads/map/file/" + serialization + ".zip";
          fs.writeFile(fileName, params.image.split(";base64,").pop(), {encoding: "base64"}, (err) => {
            if (err) return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
            const configurationName = "./uploads/map/configuration/" + serialization + ".json";
            fs.writeFile(configurationName, params.image.split(";base64,").pop(), {encoding: "base64"}, (err) => {
              if (err) {
                AF.file_unlink(fileName);
                return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
              }
              const imageName = "./uploads/map/image/" + serialization + ".json";
              fs.writeFile(imageName, params.image.split(";base64,").pop(), {encoding: "base64"}, (err) => {
                if (err) {
                  AF.file_unlink(fileName);
                  AF.file_unlink(configurationName);
                  return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
                }

                mapRecord.file = serialization + ".zip";
                mapRecord.configuration = serialization + ".json";
                mapRecord.image = serialization + ".png";
                mapRecord.save((err, savedMap) => {
                  if (err) {
                    AF.file_unlink(fileName);
                    AF.file_unlink(configurationName);
                    AF.file_unlink(imageName);
                    return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
                  }
                  AF.file_unlink("./uploads/map/file/" + mapRecord.file);
                  AF.file_unlink("./uploads/map/configuration/" + mapRecord.configuration);
                  AF.file_unlink("./uploads/map/image/" + mapRecord.image);
                  return res.status(200).send(savedMap);
                });
              });
            });
          });
        } else {
          return res.status(200).send(mapRecord);
        }
      }
    });
  }

};