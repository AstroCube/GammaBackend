"use strict";

const Match = require("@match");
const moment = require("moment");
const Gamemode = require("@gamemode");
const Party = require("@party");
const Promise = require("bluebird");
const Server = require("@server");

module.exports = {

  matchCreate: function(req, res) {
    const params = req.body;
    if (params.map && params.teams && params.gamemode && params.subGamemode) {
      let match = new Match();
      match.map = params.map;
      match.createdAt = moment().unix();
      match.teams = params.teams;
      match.status = "waiting";
      match.gamemode = params.gamemode;
      match.subGamemode = params.subGamemode;
      match.save((err, savedMap) => {
        if (err || !savedMap) return res.status(500).send({message: "Ha ocurrido un error al crear la partida."});
        return res.status(200).send(savedMap);
      });
    } else {
      return res.status(400).send({message: "No se han indicado los parámetros correctamente."});
    }
  },

  matchFind: function(req, res) {
    Match.find(req.body).sort("createdAt").exec((err, maps) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al buscar los mapas."});
      return res.status(200).send(maps);
    });
  },

  matchGet: function(req, res) {
    Match.findOne(req.params.id, (err, match) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la partida."});
      if (!match) return res.status(404).send({message: "No se ha encontrado la partida."});
      return res.status(200).send(match);
    });
  },

  matchUpdate: function(req, res) {
    let params = req.body;
    delete params._id;
    delete params.map;
    delete params.createdAt;
    delete params.gamemode;
    delete params.subGamemode;
    Match.findOneAndUpdate(req.params.id, params, (err, updatedMatch) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la partida."});
      if (!updatedMatch) return res.status(404).send({message: "No se ha encontrado la partida a actualizar."});
      return res.status(200).send(updatedMatch);
    });
  },

  matchCleanup: function(req, res) {
    Server.findOne({_id: req.server.sub}, (err, server) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al remover los mapas."});
      if (!server) return res.status(404).send({message: "No se encuentra el servidor especificado."});

      if (server.type !== "game" || server.matches.length <= 0) return res.status(400).send({message: "El servidor no tiene partidas para cerrar."});

      server.matches.map((match) => {
        Match.findOne({_id: match}, (err, matchRecord) => {
          if (!err && matchRecord) {
            if (matchRecord.status === "waiting") {
              Match.findOneAndDelete({_id: matchRecord._id}, (err) => { if (err) console.log(err);});
            } else if (matchRecord.status === "ingame" || matchRecord.status === "starting") {
              Match.findOneAndUpdate({_id: matchRecord._id}, {status: "invalidated"}, (err) => { if (err) console.log(err); });
            }
          }
        });
      });

      return res.status(200);

    });
  },

  match_find: function(req, res) {
    let params = req.body;
    if (params.gamemode && params.sub_gamemode) {
      let query = {};
      if (params.map) {
        query = {gamemode: params.gamemode, sub_gamemode: params.sub_gamemode, map: params.map};
      } else {
        query = {gamemode: params.gamemode, sub_gamemode: params.sub_gamemode};
      }
      Match.find(query).sort("created_at").exec((err, found_match) => {
        if (err) return res.status(200).send({query_success: false, message: "gameapi_error"});
        if (found_match && found_match.length >= 1) {
          Server.findOne({matches: found_match[0]._id}, (err, server) => {
            if (err || !server) return res.status(200).send({query_success: false, message: "gameapi_error"});
            let gamemode_info = gamemode.sub_types.filter(sub => { return sub.name === params.sub_gamemode; })[0];
            if (joined_party && gamemode_info.max_players < joinable_members) return res.status(200).send({query_success: false, message: "gameapi_party_exceded"});
            if (joinable_members < (gamemode_info.max_players - server.players.length)) {
              return res.status(200).send({query_success: true, server_found: server.slug, match_found: found_match[0]._id});
            } else {
              Server.find({gamemode: params.gamemode, sub_gamemode: params.sub_gamemode}).sort("started_at").exec(async (err, available_servers) => {
                if (err) return res.status(200).send({query_success: false, message: "gameapi_error"});
                if (available_servers && available_servers.length >= 1) {
                  let final_available = await Promise.map(available_servers, (server) => {
                    if ((server.played_matches + 1 <= server.max_total) || (server.matches.length + 1 <= server.max_running)) return server._id;
                  });
                  return res.status(200).send({query_success: true, server_found: final_available[0].slug, new_match: true, new_map: params.map});
                } else {
                  return res.status(200).send({query_success: true, require_server: true, new_map: params.map});
                }
              });
            }
          });
        } else {
          Server.find({gamemode: params.gamemode, sub_gamemode: params.sub_gamemode}).sort("started_at").exec(async (err, available_servers) => {
            if (err) return res.status(200).send({query_success: false, message: "gameapi_error"});
            if (available_servers && available_servers.length >= 1) {
              let final_available = await Promise.map(available_servers, (server) => {
                if ((server.played_matches + 1 <= server.max_total) || (server.matches.length + 1 <= server.max_running)) return server._id;
              });
              return res.status(200).send({query_success: true, server_found: final_available[0].slug, new_match: true, new_map: params.map});
            } else {
              return res.status(200).send({query_success: true, require_server: true, new_map: params.map});
            }
          });
        }
      });
    } else {
      return res.status(200).send({query_success: false, message: "gameapi_error"});
    }
  }

};
