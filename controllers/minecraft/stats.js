"use strict";

const Stats = require("@stats");

module.exports = {
  getStats: function(req, res) {
    Stats.findOne({username: req.params.id}, (err, stats) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las estadísticas."});
      if (!stats) return res.status(404).send({message: "No se han encontrado estadísticas del usuario."});
      return res.status(200).send(stats);
    });
  },

  updateStats: function (req, res) {
    Stats.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}, (err, updatedStats) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener las estadísticas."});
      if (!updatedStats) return res.status(404).send({message: "No se han encontrado estadísticas del usuario."});
      return res.status(200).send(updatedStats);
    });
  }
};