"use strict";

const Gamemode = require("@gamemode");

module.exports = {

    getGamemode: function(req, res) {
        Gamemode.findOne({_id: req.params.id}, (err, gamemode) => {
           if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el modo de juego."});
           if (!gamemode) return res.status(404).send({message: "El modo de juego indicado no existe."});
           return res.status(200).send(gamemode);
        });
    },

    listGamemodes: function(req, res) {
        Gamemode.find((err, gamemodeList) => {
            if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el modo de juego."});
            return res.status(200).send(gamemodeList);
        });
    }

};