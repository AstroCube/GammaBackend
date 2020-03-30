"use strict";

const AF = require("@auxiliar_functions");
const Server = require("@server");
const Cluster = require("@cluster");
const cluster_token = require("@cluster_service");
const moment = require("moment");

module.exports = {

  loadServer: function(req, res) {
    let params = req.body;
    if (params.slug && params.type && params.cluster) {
      Cluster.findOne({_id: params.cluster}, (err, cluster) => {
        if (!cluster) return res.status(403).send({message: "El cluster al que se intenta iniciar no es válido."});
        let server = new Server();
        server.slug = params.slug;
        server.type = params.type.toLowerCase();
        server.started_at = moment().unix();
        server.gamemode = params.gamemode;
        server.sub_gamemode = params.sub_gamemode;
        server.cluster = params.cluster;
        server.max_running = params.max_running;
        server.max_total = params.max_total;
        server.players = [];
        server.matches = [];
        server.save((err, server) => {
          if (err || !server) return res.status(500).send({message: "Ha ocurrido un error al iniciar el servidor."});
          console.log(err);
          return res.status(200).send({server: server, token: cluster_token.createToken(server)});
        });
      });
    } else {
      return res.status(404).send({message: "No se han indicado los parametros correctamente."});
    }
  },

  getServer: function(req, res) {
    Server.findOne({_id: req.params.id}, (err, server) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el servidor."});
      if (!server) return res.status(404).send({message: "No se ha encontrado el servidor que se busca."});
      return res.status(200).send(server);
    });
  },

  getServerByQuery: function(req, res) {
    Server.find(req.body, (err, servers) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el servidor."});
      return res.status(200).send(servers);
    });
  },

  updateServer: function(req, res) {
    Server.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}, (err,  server) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el servidor."});
      if (!server) return res.status(404).send({message: "No se ha encontrado el servidor que se busca."});
      return res.status(200).send(server);
    });
  },

  disconnectServer: function(req, res) {
    Server.findOneAndDelete({"_id": req.server.sub}, (err) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al desconectar el servidor"});
      return res.status(200).send({message: "Desconexión exitosa."});
    });
  }

};
