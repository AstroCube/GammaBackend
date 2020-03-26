"use strict";

const AF = require("@auxiliar_functions");
const bcrypt = require("bcrypt-nodejs");
const geoip = require("geoip-lite");
const Group = require("@group");
const mailer = require("@smtp_service");
const moment = require("moment");
const Promise = require ("bluebird");
const redis = require("@redis_service");
const config = require("../../config");
const User = require("@user");
const user_tokenization = require("@user_tokenization");
const Validator = require('mongoose').Types.ObjectId;

module.exports = {

  user_get: function(req, res) {
    let query;
    if (Validator.isValid(req.params.username.toString())) {
      query = {_id: req.params.username};
    } else {
      query = {username: req.params.username.toLowerCase()};
    }
    User.findOne(query).populate("disguise_group").exec().then(async (user) => {
      if (!user) return res.status(404).send({message: "No se ha encontrado al jugador."});
      return res.status(200).send(user);
    }).catch((er) => {
      console.log(er);
      return res.status(500).send({message: "Error obtaining user record."});
    });
  },

  user_update: function(req, res) {
    delete req.body.groups;
    User.findOneAndUpdate({_id: req.params.id}, req.body).populate("group._id disguise_group").exec((err, updated) => {
      if (err || !updated) return res.status(500).send({message: "Error updating user record."});
      return res.status(200).send({updated: true});
    });
  },

  user_access: function(req, res) {
    const Date = moment().unix();
    let params = req.body;
    // Find registered username
    User.findOne({username: params.username.toLowerCase()}, (err, user) => {
      if (err) return res.status(500).send({message: "Error when pairing user with the server."});
      if (user) {
        // Find if user already registered
        User.findByIdAndUpdate({_id: user._id}, {sesion: {lastSeen: 0}}).populate("group._id disguise_group").exec((err, updated_login)  => {
          if (err) return res.status(500).send({message: "Error when pairing user with the server."});
          if (user.password) {
            delete user.password;
            return res.status(200).send({multi: false, registered: true, user: updated_login._id});
          } else {
            return res.status(200).send({multi: false, registered: false, user: updated_login._id});
          }
        });
      } else {
        // Find IP-related primary account
        User.findOne({"used_ips.number" : params.ip, "used_ips.primary": true}, (err, multi) => {
          if (err) return res.status(500).send({message: "Error when pairing user with the server."});
          if (multi) {
            // Return related account
            return res.status(200).send({multi: true, language: multi.language, account_details: {created_at: moment.unix(multi.createdAt).format("MM/DD/YYYY"), username: multi.username}});
          } else {
            // Create new user
            let user = new User();
            user.username = params.username;
            user.username = params.username.toLowerCase();
            user.skin = params.username;
            user.session.lastSeen = 0;
            user.session.lastGame = "registrandose";
            user.logged = "authenticating";
            user.groups.push({
              group: config.DEFAULT_GROUP,
              joined: Date
            });
            user.save((err, saved_user) => {
              if (err) return res.status(500).send({message: "Error when pairing user with the server."});
              if (saved_user) {
                // Re-querying user to get populated groups
                User.findOne({_id: saved_user}).populate("group._id disguise_group").exec((err, user) => {
                  if (err) return res.status(500).send({message: "Error when pairing user with the server."});
                  // Trick to prevent model creation callbacks
                  AF.stats_create(saved_user._id);
                  return res.status(200).send({multi: false, registered: false, user: user._id});
                });
              } else {
                return res.status(500).send({message: "Error when pairing user with the server."});
              }
            });
          }
        });
      }
    });
  },

  server_register: function(req, res) {
    const params = req.body;
    let ip = "Unknown";
    if (params.username && params.ip && params.password) {
      if (geoip.lookup(params.ip) != null) ip = geoip.lookup(params.ip).country;
      bcrypt.hash(params.password, null, null, (err, hash) => {
        if (err || !hash) res.status(500).send({message: "Error while registering user."});
        User.findOneAndUpdate({username: params.username.toLowerCase()}, {$set: {password: hash, logged: "true"}, $push: {address: {number: params.ip, country: ip.country, primary: true}}}, (err, userUpdated) => {
          if (err || !userUpdated) res.status(500).send({message: "Error while registering user."});
          return res.status(200).send({token: user_tokenization.createToken(userUpdated)});
        });
      });
    } else {
      return res.status(400).send({message: "Request parameters are incorrect."});
    }
  },

  server_login: function(req, res) {
    const params = req.body;
    if (params.password && params.username && params.ip) {
      User.findOne({username: params.username.toLowerCase()}, (err, user) => {
        if (err || !user) return res.status(500).send({message: "Ha ocurrido un error al validar la contraseña del usuario."});
        bcrypt.compare(params.password, user.password, (err, check) => {
          if (check) {
            user.logged = "true";
            user.save((err, saved) => {
              if (err || !saved) return res.status(400).send({message: "Invalid password."});
              if (!user.address.some(e => e.number === params.ip)) {
                User.findByIdAndUpdate(user._id, {$push: {address: {number: params.ip, country: params.ip.country, primary: false}}}, (err, updatedUser) => {
                  if (err || !updatedUser) return res.status(500).send({message: "Ha ocurrido un error al validar la contraseña del usuario."});
                  return res.status(200).send({logged: true});
                });
              } else {
                return res.status(200).send({logged: true});
              }
            });
          } else {
            return res.status(403).send({message: "Invalid password."});
          }
        });
      });
    } else {
      return res.status(400).send({message: "Request parameters are incorrect."});
    }
  },

  server_left: function(req, res) {
    User.findOneAndUpdate({_id: req.user.sub}, {session: {lastSeen: moment().unix()}}, {new: true}, (err, user_updated)  => {
      if (!user_updated) return res.status(500).send({message: "Petición de desconexión incorrecta."});
      if (err) res.status(500).send({message: "Ha ocurrido un error desconectar al usuario de la base de datos."});
      return res.status(200).send({user: user_updated.username, disconnected: user_updated.last_seen});
    });
  },

  server_email_register: function(req, res) {
    User.find({email: req.body.email.toLowerCase(), verified: true}).exec((err, users) => {
      if (users && users.length >= 1) {
        return res.status(400).send({message: "Ya te haz verificado anteriormente."});
      } else {
        redis.redisClient.exists(req.body.email, (err, reply) => {
          if (err) return res.status(500).send({message: "Ha ocurrido un error al verificar el correo electrónico."});
          if (reply) {
            return res.status(403).send({message: "already_sent"});
          } else {
            let rand = Math.floor((Math.random() * 100) + 54);
            let encodedMail = new Buffer(req.body.email).toString("base64");
            let encodedUser = new Buffer(req.body.username).toString("base64");
            let link = "http://" + req.get("host") + "/api/user/verify?mail=" + encodedMail + "&user=" + encodedUser + "&id=" + rand;
            User.findOneAndUpdate({username: req.body.username.toLowerCase()}, {email: req.body.email.toLowerCase(), verified: false}, (err, user) => {
              if (!user) {
                return res.status(404).send({message: "No se ha encontrado el usuario a verificar"});
              } else {
                mailer.sendMail(req.body.email, "Verifica tu cuenta - " + req.body.username,
                  "<!DOCTYPE html><html lang=\"en\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <head style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <meta charset=\"UTF-8\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <link href=\"https://fonts.googleapis.com/css?family=Montserrat:400,700,900\" rel=\"stylesheet\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <style style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> *, *::before, *::after { margin: 0; padding: 0; box-sizing: inherit; -webkit-font-smoothing: antialiased; } body { box-sizing: border-box; background-color: #050404; width: 700px; padding: 20px; margin: auto; } .header { padding-bottom: 10px; } .logo { display: inline-block; width: 100px; } .main { border-top: 3px solid #f68657; background-color: #1f2124; width: 100%; padding: 30px 0; } .heading { font-weight: 600; letter-spacing: -1px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #ffffff; } .avatar { display: inline-block; margin: 40px; } .info { margin: auto; width: 60%; font-family: \"Open Sans\", sans-serif; font-size: 15px; color: #ffffff; } .info span { font-weight: 600; letter-spacing: -1px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #f6b352; } .btn, .btn:link, .btn:visited { margin-top: 20px; font-weight: 600; letter-spacing: -1px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #ffffff; text-decoration: none; background-color: #f6b352; padding: 1rem 2rem; display: inline-block; transition: all .3s; position: relative; user-select: none; border: none; cursor: pointer; outline: none; } .copyright { display: inline-block; margin: 20px; color: #ffffff; font-family: \"Open Sans\", sans-serif; font-size: 14px; } </style> </head> <body style=\"margin: auto;padding: 20px;box-sizing: border-box;-webkit-font-smoothing: antialiased;background-color: #050404;width: 700px;\"> <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <tr style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <td align=\"center\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <div class=\"header\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;padding-bottom: 10px;\"> <img src=\"https://i.imgur.com/yEF1fBd.png\" alt=\"Seocraft Logo\" class=\"logo\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;display: inline-block;width: 100px;\"> </div> <div class=\"main\" style=\"margin: 0;padding: 30px 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;border-top: 3px solid #f68657;background-color: #1f2124;width: 100%;\"> <h1 class=\"heading\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;font-weight: 600;letter-spacing: -1px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #ffffff;\">¡Estás a un paso de verificar tu cuenta!</h1> <img src=\"https://minotar.net/avatar/" + user.skin + "\" alt=\"" + user.username + "\" class=\"avatar\" style=\"margin: 40px;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;display: inline-block;\"> <p class=\"info\" style=\"margin: auto;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;width: 60%;font-family: &quot;Open Sans&quot;, sans-serif;font-size: 15px;color: #ffffff;\">Hola <span style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;font-weight: 600;letter-spacing: -1px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #f6b352;\">" + user.username + "</span>, estás a un paso de verificar tu cuenta en Seocraft Network, simplemente debes dar click en el botón de abajo.</p> <a href=\"" + link + "\" class=\"btn\" style=\"margin: 0;padding: 1rem 2rem;box-sizing: inherit;-webkit-font-smoothing: antialiased;margin-top: 20px;font-weight: 600;letter-spacing: -1px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #ffffff;text-decoration: none;background-color: #f6b352;display: inline-block;transition: all .3s;position: relative;user-select: none;border: none;cursor: pointer;outline: none;\">Verificar cuenta</a> </div> <div style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <p class=\"copyright\" style=\"margin: 20px;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;display: inline-block;color: #ffffff;font-family: &quot;Open Sans&quot;, sans-serif;font-size: 14px;\">&copy; Seocraft Network 2019. Todos los derechos reservados a Seocraft Network S.A</p> </div> </td> </tr> </table> </body></html>"
                ).then((email) => {
                  if (!email) return res.status(500).send({message: "Ha ocurrido un error al verificar el correo electrónico."});
                  redis.redisClient.set(req.body.email, rand);
                  redis.redisClient.expire(req.body.email, 600);
                  if (err) return res.status(500).send({message: "Ha ocurrido un error al verificar el correo electrónico."});
                  return res.status(200).send({message: "Se ha enviado el correo electrónico exitosamente."});
                });
              }
            });
          }
        });
      }
    });
  },

  server_email_verify: function(req, res) {
    let decodedMail = new Buffer(req.query.mail, 'base64').toString('ascii');
    let decodedUser = new Buffer(req.query.user, 'base64').toString('ascii');
    redis.redisClient.get(decodedMail, (err, reply) => {
      if (err) return res.status(500).send({message: "redis_error"});
      if (reply === null) return res.status(500).send({message: "invalid_key"});
      if(reply === req.query.id) {
        User.findOneAndUpdate({username: decodedUser.toLowerCase(), email: decodedMail.toLowerCase()}, {verified: true}, (err, user) => {
          if (err || !user) {
            return res.redirect(config.FRONTEND_URL + "/login?verified=false");
          } else {
            redis.redisClient.del(decodedMail, (err, remove) => {
              if (err) return res.redirect(config.FRONTEND_URL + "/login?verified=false");
              if (remove !== 1) return res.redirect(config.FRONTEND_URL + "/login?verified=false");
              return res.redirect(config.FRONTEND_URL + "/login?verified=true");
            });
          }
        });
      } else {
        return res.status(500).send({message: "invalid_key"});
      }
    });
  },



  user_permissions: function(req, res) {
    try {
      User.findOne({username: req.body.username.toLowerCase()}, async (err, user) => {
        if(!user || err) return res.status(500).send({message: "No se ha encontrado a este usuario en la base de datos."});
        await AF.user_groups_id(user._id).then(async (groups) => {
          let permissions = [];
          await Promise.map(groups.groups, async (groups) => {
            return await Group.findOne({_id: groups.group._id}).select({minecraft_permissions: 1, _id: 0}).then((group_permissions) => {
              permissions.push.apply(permissions, group_permissions.minecraft_permissions);
            }).catch(() => {
              return res.status(500).send({message: "Ha ocurrido un error al obtener los permisos de este usuario."});
            });
          });
          let player_permissions = permissions.filter(function(elem, index, self) {return index === self.indexOf(elem);});
          return res.status(200).send({player_permissions});
        }).catch((err) => {
          console.log(err);
        });
      });
    } catch(err) {
      return res.status(500).send({message: "Ha ocurrido un error obtener los permisos."});
    }
  },

  production_join: async function(req, res) {
    try {
      let params = req.body; if(!params.username || !params.realm) return res.status(500).send({message: "Ha ocurrido un error al obtener los datos del usuario."});
      let user_data = await User.findOne({username: params.username.toLowerCase()}).exec().then((user) => {
        if (user) {
          return user;
        } else {
          return null;
        }
      }).catch(() => {});
      if (!user_data) return res.status(404).send({message: "Ha ocurrido un error al encontrar el usuario en la base de datos."});
      let user_groups = await AF.user_groups_id(user_data._id).then(async (userGroups) => {
        return await Promise.map(userGroups.groups, async (groups) => {
          return await AF.server_placeholder(params.realm.toLowerCase(), groups.group._id).then((group) => {
            return group;
          }).catch(() => {});
        });
      });
      let max_experience = AF.arithmetic_max_xp(user_data.level+1);
      user_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));
      let secondary_groups = user_groups.slice().splice(1, 2);
      return res.status(200).send({
        username: user_data.username,
        language: user_data.language,
        main_group: user_groups[0],
        secondary_groups: secondary_groups,
        skin: user_data.skin,
        disguised: user_data.disguised,
        member_since: user_data.createdAt,
        logged: user_data.logged,
        last_seen: user_data.session.lastSeen,
        experience: user_data.experience,
        level: user_data.level,
        max_experience: max_experience
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener los datos del usuario."});
    }
  }

};

