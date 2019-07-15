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

      }
    });
  },

  /*map_load: function(req, res) {
    let params = req.body;
    let error = false;
    let file = null;
    let image = null;
    let configuration = null;

    if (params.name && params.file && params.file_extension && params.configuration && params.xml_extension && params.author && params.version && params.gamemode) {
      Map.findOne({name_lowercase: params.name.toLowerCase()}, async (err, found_map) => {
        if (err) return res.status(200).send({query_success: false, message: "Ha ocurrido un error al buscar el mapa en la base de datos."});
        if (!found_map) {
          let map = new Map();
          map.name = params.name;
          map.name_lowercase = params.name.toLowerCase();
          map.author = await User.findOne({username_lowercase: params.author.toLowerCase()}).exec().then((user) => {
            return user._id;
          }).catch((err) => {
            console.log(err);
            return null;
          });
          map.version = params.version;
          if (params.contributors) map.contributors = await Promise.map(params.contributors, async (raw_contributors) => {
            return await User.findOne({username_lowercase: raw_contributors.contributor}).exec().then((contributor) => {
              return {
                contributor: contributor,
                contribution: raw_contributors.contribution
              }
            }).catch((err) => {
              console.log(err);
            });
          });
          map.gamemode = params.gamemode;
          map.sub_type = params.sub_type;
          map.add_date = moment().unix();
          if (params.description) map.description = params.description;

          // --- Map file processing --- //

          let file_extension = params.file_extension;
          let file_name = map.name_lowercase.replace(/ /g, "_");
          let file_path = "./uploads/map/file/" + file_name + "." + file_extension;
          if (file_extension === "zip") {
            fs.writeFile(file_path, params.file.split(";base64,").pop(), {encoding: "base64"}, (err) => {
              if (err) error = true;
            });
            map.file = file_name + "." + file_extension;
            file = file_path;
          } else {
            return res.status(200).send({query_success: false, message: "La extensión de la archivo no es válida."});
          }

          // --- XML file processing --- //

          let xml_extension = params.xml_extension;
          let xml_name = map.name_lowercase.replace(/ /g, "_");
          let xml_path = "./uploads/map/configuration/" + xml_name + "." + xml_extension;
          if (xml_extension === "configuration") {
            fs.writeFile(xml_path, params.configuration.split(";base64,").pop(), {encoding: "base64"}, (err) => {
              if (err) error = true;
            });
            map.configuration = xml_name + "." + xml_extension;
            configuration = xml_path;
          } else {
            if (file) AF.file_unlink(file);
            return res.status(200).send({query_success: false, message: "La extensión del XML no es válida."});
          }

          // --- Image file processing --- //

          if (params.image && params.image_extension) {
            let image_extension = params.image_extension;
            let image_name = map.name_lowercase.replace(/ /g, "_");
            let image_path = "./uploads/map/image/" + image_name + "." + image_extension;
            if (image_extension === "jpeg" || image_extension === "jpg" || image_extension === "png") {
              fs.writeFile(image_path, params.image.split(";base64,").pop(), {encoding: "base64"}, (err) => {
                if (err) error = true;
              });
              map.image = image_name + "." + image_extension;
              image = image_path;
            } else {
              if (file) AF.file_unlink(file);
              if (configuration) AF.file_unlink(configuration);
              return res.status(200).send({query_success: false, message: "La extensión de la imágen no es válida."});
            }
          }

          if (map.author && map.gamemode && file && configuration && !error) {
            map.save((err, saved_map) => {
              if (err || !saved_map) {
                if (file) AF.file_unlink(file);
                if (configuration) AF.file_unlink(configuration);
                if (image) AF.file_unlink(image);
                return res.status(200).send({query_success: false, message: "Ha ocurrido un error al crear el mapa."});
              } else {
                return res.status(200).send({query_success: true, map_id: saved_map._id, new: true});
              }
            });
          } else {
            if (file) AF.file_unlink(file);
            if (configuration) AF.file_unlink(configuration);
            if (image) AF.file_unlink(image);
            return res.status(200).send({query_success: false, message: "Ha ocurrido un error al actualizar el archivo."});
          }
        } else {
          if (parseInt(params.version.replace(/\./g, ""), 10) > parseInt(found_map.version.replace(/\./g, ""), 10)) {
            found_map.version = params.version;
            if (params.contributors) found_map.contributors = await Promise.map(params.contributors, async (raw_contributors) => {
              return await User.findOne({username_lowercase: raw_contributors.contributor}).then((contributor) => {
                return {
                  contributor: contributor,
                  contribution: raw_contributors.contribution
                }
              }).catch((err) => {
                console.log(err);
              });
            });
            found_map.gamemode = params.gamemode;
            found_map.add_date = moment().unix();
            if (params.description) found_map.description = params.description;

            // --- Map file processing --- //
          
            if (params.file) {
              AF.file_unlink("./uploads/map/file/" + found_map.file);
              let file_extension = params.file_extension;
              let file_name = found_map.name_lowercase.replace(/ /g, "_");
              let file_path = "./uploads/map/file/" + file_name + "." + file_extension;
              if (file_extension === "zip") {
                fs.writeFile(file_path, params.file.split(";base64,").pop(), {encoding: "base64"}, (err) => {
                  if (err) return res.status(200).send({query_success: false, message: "Ha ocurrido un error al actualizar el archivo del mapa."});
                });
                found_map.file = file_name + "." + file_extension;
                file = file_path;
              } else {
                return res.status(200).send({query_success: false, message: "La extensión de la archivo no es válida."});
              }
            }

            // --- XML file processing --- //

            if (params.configuration) {
              AF.file_unlink("./uploads/map/configuration/" + found_map.file);
              let xml_extension = params.xml_extension;
              let xml_name = found_map.name_lowercase.replace(/ /g, "_");
              let xml_path = "./uploads/map/configuration/" + xml_name + "." + xml_extension;
              if (xml_extension === "configuration") {
                fs.writeFile(xml_path, params.configuration.split(";base64,").pop(), {encoding: "base64"}, (err) => {
                  if (err) return res.status(200).send({query_success: false, message: "Ha ocurrido un error al actualizar el XML del mapa."});
                });
                found_map.configuration = xml_name + "." + xml_extension;
                configuration = xml_path;
              } else {
                if (file) AF.file_unlink(file);
                return res.status(200).send({query_success: false, message: "La extensión del XML no es válida."});
              }
            }

            // --- Image file processing --- //

            if (params.image) {
              if (found_map.image) AF.file_unlink("./uploads/map/image/" + found_map.image);
              let image_extension = params.image_extension;
              let image_name = found_map.name_lowercase.replace(/ /g, "_");
              let image_path = "./uploads/map/image/" + image_name + "." + image_extension;
              if (image_extension === "jpeg" || image_extension === "jpg" || image_extension === "png") {
                fs.writeFile(image_path, params.image.split(";base64,").pop(), {encoding: "base64"}, (err) => {
                  if (err) return res.status(200).send({query_success: false, message: "Ha ocurrido un error al actualizar el XML del mapa."});
                });
                found_map.image = image_name + "." + image_extension;
                configuration = image_path;
              } else {
                if (file) AF.file_unlink(file);
                if (configuration) AF.file_unlink(configuration);
                return res.status(200).send({query_success: false, message: "La extensión de la imágen no es válida."});
              }
            }
            
            found_map.save(async (err, updated_map) => {
              if (err || !updated_map) {
                if (file) AF.file_unlink(file);
                if (configuration) AF.file_unlink(configuration);
                if (image) AF.file_unlink(image);
                return res.status(200).send({query_success: false, message: "Ha ocurrido un error al crear el mapa."});
              }
              return res.status(200).send({query_success: true, map_id: updated_map._id, new: false});
            });
          } else {
            return res.status(200).send({query_success: true, map_id: found_map._id, new: false});
          }
        }
      });
    } else {
      return res.status(200).send({query_success: false, message: "No se han puesto los campos necesarios para procesar el mapa."});
    }
  },*/

  map_vote: function(req, res) {
    if (req.body.vote && req.body.username && req.body.map) {
      User.findOne({username_lowercase: req.body.username.toLowerCase()}, (err, username) => {
        if (!username || err) return res.status(200).send({query_success: false, message: "reading_error"});
        Map.findOne({_id: req.body.map}, (err, map) => {
          if (!map || err) return res.status(200).send({query_success: false, message: "reading_error"});
          let updated;
          let already_voted;
          if (map.rating.one_star.includes(username._id.toString())) { if (req.body.vote === 1) already_voted = true; updated = true; map.rating.one_star = map.rating.one_star.filter(a => a !== username._id.toString()); }
          if (map.rating.two_stars.includes(username._id.toString())) { if (req.body.vote === 2) already_voted = true; updated = true; map.rating.two_stars = map.rating.two_stars.filter(a => a !== username._id.toString()); }
          if (map.rating.three_stars.includes(username._id.toString())) { if (req.body.vote === 3) already_voted = true; updated = true; map.rating.three_stars = map.rating.three_stars.filter(a => a !== username._id.toString()); }
          if (map.rating.four_stars.includes(username._id.toString())) { if (req.body.vote === 4) already_voted = true; updated = true; map.rating.four_stars = map.rating.four_stars.filter(a => a !== username._id.toString()); }
          if (map.rating.five_stars.includes(username._id.toString())) { if (req.body.vote === 5) already_voted = true; updated = true; map.rating.five_stars = map.rating.five_stars.filter(a => a !== username._id.toString()); }
          if (req.body.vote === 5) map.rating.five_stars.push(username._id.toString());
          if (req.body.vote === 4) map.rating.four_stars.push(username._id.toString());
          if (req.body.vote === 3) map.rating.three_stars.push(username._id.toString());
          if (req.body.vote === 2) map.rating.two_stars.push(username._id.toString());
          if (req.body.vote === 1) map.rating.one_star.push(username._id.toString());
          map.save((err, saved_map) => {
            if (!saved_map || err) return res.status(200).send({query_success: false, message: "reading_error"});
            return res.status(200).send({query_success: true, updated: updated, already_voted: already_voted});
          });
        });
      });
    } else {
      return res.status(200).send({query_success: false, message: "reading_error"});
    }
  }

};