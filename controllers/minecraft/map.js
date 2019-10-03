"use strict";

const AF = require("@auxiliar_functions");
const Gamemode = require("@gamemode");
const Map = require("@map");
const fs = require("fs");
const path = require("path");
const Paginate = require("mongoose-pagination");
const moment = require("moment");
const Promise = require("bluebird");
const User = require("@user");

module.exports = {

  mapLoad: function(req, res) {
    const params = req.body;

    if (params.name && params.author && params.version && params.image && params.file && params.configuration && params.contributors && params.gamemode && params.subGamemode && params.description && params.rating) {
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
          map.registeredDate = moment().unix();

          // --- Image creation --- //
          const serialization = Math.floor(Math.random() * 255);
          const fileName = "./uploads/map/file/" + serialization + ".zip";
          fs.writeFile(fileName, params.file.split(";base64,").pop(), {encoding: "base64"}, (err) => {
            if (err) return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
            const configurationName = "./uploads/map/configuration/" + serialization + ".json";
            fs.writeFile(configurationName, params.configuration.split(";base64,").pop(), {encoding: "base64"}, (err) => {
              if (err) {
                AF.file_unlink(fileName);
                return res.status(500).send({message: "Ha ocurrido un error al cargar el mapa."});
              }
              const imageName = "./uploads/map/image/" + serialization + ".png";
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
    } else {
      return res.status(400).send({message: "No se han enviado los parametros correctamente."});
    }
  },

  mapGet: function(req, res) {
    Map.findOne({_id: req.params.id}, (err, map) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el mapa."});
      if (!map) return res.status(404).send({message: "No se ha encontrado el mapa."});
      return res.status(200).send(map);
    });
  },

  mapGetWebsite: function(req, res) {
    Map.findOne({_id: req.params.id}).populate("author").exec((err, map) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el mapa."});
      if (!map) return res.status(404).send({message: "No se ha encontrado el mapa."});
      let fixedMap = map.toObject();
      if (!req.user.sub) {
        delete fixedMap.file;
        delete fixedMap.configuration;
      }
      return res.status(200).send(map);
    });
  },

  mapVote: function(req, res) {
    let params = req.body;
    if (params.map && params.user && params.rating) {
      User.findOne({_id: params.user}, (err, user) => {
        if (err || !user) return res.status(500).send({message: "Ha ocurrido un error al obtener el usuario."});
        Map.findOne({_id: params.map}, async (err, map) => {
          if (err || !map) return res.status(500).send({message: "Ha ocurrido un error al obtener el mapa."});
          let alreadyVoted = false;
          let rating = await Promise.map(map.rating, (rating) => {
            if (rating.user.toString() !== params.user.toString()) {
              return rating;
            } else {
              alreadyVoted = true;
            }
          });
          rating.push({star: params.rating, user: params.user});
          params.rating = rating;
          map.save((err, savedMap) => {
            if (!savedMap || err) return res.status(500).send({message: "Ha ocurrido un error al actualizar el voto."});
            return res.status(200).send(alreadyVoted);
          });
        });
      });
    } else {
      return res.status(400).send({message: "No se han enviado los parámetros correctamente."});
    }
  },

  mapImage: function(req, res) {
    const filePath = "./uploads/map/image/" + req.params.file;
    fs.exists(filePath, (file) => {
      if (file) {
        res.sendFile(path.resolve(filePath));
      } else {
        return res.status(200).send({message: "No se encontró una imágen."});
      }
    });
  },

  mapFile: function(req, res) {
    const filePath = "./uploads/map/file/" + req.params.file;
    fs.exists(filePath, (file) => {
      if (file) {
        res.sendFile(path.resolve(filePath));
      } else {
        return res.status(200).send({message: "No se encontró el archivo."});
      }
    });
  },

  mapConfiguration: function(req, res) {
    const filePath = "./uploads/map/configuration/" + req.params.file;
    fs.exists(filePath, (file) => {
      if (file) {
        res.sendFile(path.resolve(filePath));
      } else {
        return res.status(200).send({message: "No se encontró la configuración."});
      }
    });
  },

  mapQueryPagination: function(req, res) {
    let query = {};
    if (req.query.gamemode) query = {gamemode: req.query.gamemode};
    Map.find(query).populate("author").paginate(req.params.page, 27, (err, maps, total) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los mapas."});
      return res.status(200).send({
        maps: maps,
        page: req.params.page,
        pages: Math.ceil(total / 27)
      });
    });
  },

  mapGamemodeList: function(req, res) {
    Gamemode.find().select("_id").exec((err, gamemodes) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener los modos de juego."});
      return res.status(200).send(gamemodes);
    });
  }

};
