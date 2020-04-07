"use strict";

const Match = require("@match");
const moment = require("moment");
const ObjectId = require("mongoose").Types.ObjectId;
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
    Match.findOne({_id: req.params.id}, (err, match) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la partida."});
      if (!match) return res.status(404).send({message: "No se ha encontrado la partida."});
      return res.status(200).send(match);
    });
  },

  matchGetWebsite: function(req, res) {
    Match.findOne({_id: req.params.id}).populate("map gamemode winner teams.members.user").lean().exec(async (err, match) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la partida."});
      if (!match) return res.status(404).send({message: "No se ha encontrado la partida."});
      match.winner = await Promise.map(match.winner, (winners) => {
        delete winners.password;
        if (winners.discord) delete winners.discord;
        return winners;
      });
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
    Match.findOneAndUpdate({_id: req.params.id}, params, {new: true}, (err, updatedMatch) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar la partida."});
      if (!updatedMatch) return res.status(404).send({message: "No se ha encontrado la partida a actualizar."});
     return res.status(200).send(updatedMatch);
    });
  },

  matchCleanup: function(req, res) {
    Server.findOne({_id: req.currentServer._id}, (err, server) => {
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

      return res.status(200).send({success: true});
    });
  },

  matchGetPlayer: function(req, res) {
    Match.find({"teams.members.user": req.params.user}).populate("gamemode").sort("createdAt").lean().exec((err, matches) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las partidas."});
      let wonMatches = 0;
      matches.forEach((match) => {
        match.winner.forEach((winner) => {
          if (winner.toString() === req.params.user) wonMatches++; 
        });
      });
      return res.status(200).send({
        wonMatches: wonMatches,
        playedMatches: matches.length,
        lastMatches: matches.slice(0, 10)
      });
    });
  },

  userWonMatches: function(req, res) {
    const params = req.body;
    if (params.gamemode && params.subGamemode && params.user) {
      Match.find({gamemde: params.gamemode, subGamemode: params.subGamemode, winner: params.user}, (err, matches) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las pertidas."});
        return res.status(200).send(matches);
      });
    } else {
      return res.status(400).send({message: "No se han enviado los valores correctamente."});
    }
  }


};
