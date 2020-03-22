"use strict";

const AF = require("@auxiliar_functions");
const bcrypt = require("bcrypt-nodejs");
const Group = require("@group");
const jwt = require("@jwt_tokenization");
const mailer = require("@smtp_service");
const moment = require("moment");
const mongoose = require("mongoose");
const Promise = require ("bluebird");
const config = require("../config");
const redis = require("@redis_service");
const User = require("@user");

module.exports = {

  token_validation: function(req, res) {
    if (moment().unix() > req.user.expires) return res.status(200).send({expired: true});
    return res.status(200).send({expired: false});
  },

  login_user: function(req, res) {
    User.findOne({email: req.body.email}, (err, user) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al iniciar sesión."});
      if(user) {
        bcrypt.compare(req.body.password, user.password, (err, check) => {
          if (check) {
            return res.status(200).send({token: jwt.createToken(user, req.body.persistence)});
          } else {
            return res.status(404).send({message: "Ha ocurrido un error al procesar tu contraseña."});
          }
        });
      } else {
        return res.status(404).send({message: "El correo electrónico o la contraseña son incorrectos."});
      }
    });
  },

  password_update: function(req, res) {
    User.findOne({"_id": req.user.sub}, (err, user) => {
      if (err || !user) return res.status(500).send({message: "Ha ocurrido un error al actualizar tu contraseña."});
      bcrypt.compare(req.body.actual_password, user.password, (err, check) => {
        if (err) return res.status(500).send({message: "Tu contraseña actual no coincide."});
        if (check) {
          bcrypt.hash(req.body.new_password, null, null, (err, hash) => {
            if (err || !hash) return res.status(500).send({message: "Ha ocurrido error al identificar tu contraseña."});
            user.password = hash;
            user.save((err) => {
              if (err) return res.status(500).send({message: 'Ha ocurrido un error al actualizar tu contraseña.'});
              return res.status(200).send({updated: true});
            });
          });
        } else {
          return res.status(403).send({message: "Tu contraseña actual no coincide."});
        }
      });
    });
  },

  getUser: function(req, res) {

    let query = {};
    let own = false;
    if (mongoose.Types.ObjectId.isValid(req.params.user)) {
      query = {_id: req.params.user};
    } else if (req.params.user) {
      query = {username_lowercase: req.params.user.toLowerCase()};
    } else {
      query = {_id: req.user.sub};
      own = true;
    }

    User.findOne(query).lean().exec((err, user) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al encontrar al usuario."});
      if (!user) return res.status(404).send({message: "No se ha encontrado al usuario."});
      if (user._id.toString() === process.env.GUEST_USER && !own) return res.status(400);

      delete user.password;
      delete user.discord.accessToken;
      delete user.discord.refreshToken;
      delete user.discord.tokenTimestamp;

      return res.status(200).send({user});
    });
  },

  getPlaceholder: function(req, res) {

    let query = "";
    if(!req.params.id) {
      if (!req.user) return res.status(500).send({message: "You must be logged to get a prefix."});
      query = req.user.sub;
    } else {
      query = req.params.id;
    }

    User.findOne({_id: query}, async (err, user) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener el prefix del usuario."});
      if (!user) return res.status(404).send({message: "No se ha encontrado el usuario solicitado."});

      let badges = [];
      try {
        badges =await Promise.map(user.group, async (groups) => {
          return await Group.findOne({_id : groups._id}).exec().then((group) => {
            return group;
          });
        });
      } catch (err) {

      }

      badges.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

      return res.status(200).send({
        id: user._id,
        username: user.username,
        userColor: badges[0].html_color,
        lastSeen: user.last_seen,
        skin: user.skin,
        badges: badges
      });
    });
  },

  get_users: function(req, res) {
    let page = 1;
    let itemsPerPage = 5;
    delete req.params.password;
    if (req.params.page) { page = req.params.page; }
    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
      if (err) return res.status(500).send({message: 'Ha ocurrido un error al buscar la lista de usuarios.'});
      if (!users) return res.status(404).send({message: 'No se ha encontrado ningún usuario.'});
      return res.status(200).send({
        users,
        total,
        pages: Math.ceil(total / itemsPerPage)
      });
    });
  },

  update_user: function(req, res) {
    let id;
    if(!req.params.id) {
      id = req.user.sub;
    } else {
      id = req.params.id;
    }
    User.findByIdAndUpdate({"_id": id}, req.body.user, {new: true}, (err, userUpdated) => {
      if (err) return res.status(500).send({message: 'Error en la peticion'});
      if (!userUpdated) return res.status(404).send({message: 'El usuario no existe'});
      delete userUpdated.password;
      return res.status(200).send({user: userUpdated});
    });
  },

  permission_checker: async function(req, res) {
    try {
      let can_activate = await AF.local_permission(req.user.sub, req.body.permission).then((permission) => { return permission; }).catch((err) => { console.log(err); return false; });
      return res.status(200).send({has_permission: can_activate});
    } catch(err) {
      return res.status(500).send({message: "Permission reading error."});
    }
  },

  email_verification: function(req, res) {
    User.findOne({_id: req.params.id}, (err, user) => {
      if (!user || err) return res.status(500).send({message: "Ha ocurrido un error al enviar el correo de verificación."});
      redis.redisClient.exists("verification_" + user.username_lowercase, (err, reply) => {
        if (reply) return res.status(400).send({message: "¡Ya se ha enviado anteriormente un correo de verificación!"});
        if (err) return res.status(500).send({message: "Ha ocurrido un error al enviar el correo de verificación."});
        let random = Math.floor(Math.pow(10, 6-1) + Math.random() * (Math.pow(6, 6) - Math.pow(6, 6-1) - 1));
        mailer.sendMail(user.email, "Actualiza tu mail - " + user.username,
          "<!DOCTYPE html><html lang=\"en\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"><head style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <meta charset=\"UTF-8\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <link href=\"https://fonts.googleapis.com/css?family=Montserrat:400,700,900\" rel=\"stylesheet\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <style style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> *, *::before, *::after { margin: 0; padding: 0; box-sizing: inherit; -webkit-font-smoothing: antialiased; } body { box-sizing: border-box; background-color: #050404; width: 700px; padding: 20px; margin: auto; } .header { padding-bottom: 10px; } .logo { display: inline-block; width: 100px; } .main { border-top: 3px solid #f68657; background-color: #1f2124; width: 100%; padding: 30px 20px; } .heading { font-weight: 600; letter-spacing: -1px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #ffffff; } .info { margin: 30px auto; width: 60%; font-family: \"Open Sans\", sans-serif; font-size: 15px; color: #ffffff; } .info span { font-weight: 600; letter-spacing: -1px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #f6b352; } .copyright { display: inline-block; margin: 20px; color: #ffffff; font-family: \"Open Sans\", sans-serif; font-size: 14px; } .verification { font-weight: 600; letter-spacing: 20px; font-size: 40px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #ffffff; } </style></head><body style=\"margin: auto;padding: 20px;box-sizing: border-box;-webkit-font-smoothing: antialiased;background-color: #050404;width: 700px;\"><table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <tr style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <td align=\"center\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <div class=\"header\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;padding-bottom: 10px;\"> <img src=\"https://i.imgur.com/yEF1fBd.png\" alt=\"Seocraft Logo\" class=\"logo\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;display: inline-block;width: 100px;\"> </div> <div class=\"main\" style=\"margin: 0;padding: 30px 20px;box-sizing: inherit;-webkit-font-smoothing: antialiased;border-top: 3px solid #f68657;background-color: #1f2124;width: 100%;\"> <h1 class=\"heading\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;font-weight: 600;letter-spacing: -1px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #ffffff;\">Actualiza tu correo</h1> <p class=\"info\" style=\"margin: 30px auto;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;width: 60%;font-family: &quot;Open Sans&quot;, sans-serif;font-size: 15px;color: #ffffff;\">Hola <span style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;font-weight: 600;letter-spacing: -1px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #f6b352;\">" + user.username + "</span>, haz recibido el código que solicitaste para actualizar el correo electrónico en tu sección <strong style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\">Ajústes de Cuenta</strong>. Simplemente ingresa tu nuevo correo electrónico y el código de abajo, si no pediste este código simplemente puedes hacer caso omiso a este correo electrónico.</p> <span class=\"verification\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;font-weight: 600;letter-spacing: 20px;font-size: 40px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #ffffff;\">" + random + "</span> </div> <div style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <p class=\"copyright\" style=\"margin: 20px;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;display: inline-block;color: #ffffff;font-family: &quot;Open Sans&quot;, sans-serif;font-size: 14px;\">&copy; Seocraft Network 2019. Todos los derechos reservados a Seocraft Network S.A</p> </div> </td> </tr></table></body></html>"
        ).then((email) => {
          if (!email) return res.status(500).send({message: "Ha ocurrido un error al enviar el correo de verificación."});
          redis.redisClient.set("verification_" + user.username_lowercase, random);
          redis.redisClient.expire("verification_" + user.username_lowercase, 600);
          if (err) return res.status(500).send({message: "Ha ocurrido un error al enviar el correo de verificación."});
          return res.status(200).send({email_sent: true});
        });
      });
    });
  },

  email_update: function(req, res) {
    User.findOne({_id: req.user.sub}, (err, user) => {
      if (!user || err) return res.status(500).send({message: "Ha ocurrido un error al actualizar tu correo electrónico."});
      redis.redisClient.get("verification_" + user.username_lowercase, (err, reply) => {
        if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar tu correo electrónico."});
        if (reply !== req.body.verification) {
          return res.status(404).send({message: "El código de verificación ingresado es inválido."});
        } else {
          user.email = req.body.email;
          user.save((err, save) => {
            if (err || !save) return res.status(500).send({message: "Ha ocurrido un error al actualizar tu correo electrónico."});
            redis.redisClient.del("verification_" + user.username_lowercase, (err, remove) => {
              if (err) return res.status(500).send({message: "Ha ocurrido un error al actualizar tu correo electrónico."});
              if (remove !== 1) return res.status(500).send({message: "Ha ocurrido un error al actualizar tu correo electrónico."});
              return res.status(200).send({updated: true});
            });
          });
        }
      });
    });
  },

  user_list: function(req, res) {
    User.find().select("_id username skin").exec((err, users) => {
      if (err) return res.status(500).send({message: "Ha ocurrido un error al obtener la lista de usuarios."});
      let fixedUsers = users.filter((username) => {
        if (req.params.own) return username._id.toString() !== config.GUEST_USER;
        return username._id.toString() !== config.GUEST_USER && username._id.toString() !== req.user.sub;
      });
      return res.status(200).send(fixedUsers);
    });
  }

};
