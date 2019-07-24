"use strict";

const AF = require("@auxiliar_functions");
const bcrypt = require("bcrypt-nodejs");
const Friend = require("@friend");
const geoip = require("geoip-lite");
const Group = require("@group");
const mailer = require("@smtp_service");
const moment = require("moment");
const Promise = require ("bluebird");
const Punishment = require("@punishment");
const redis = require("@redis_service");
const User = require("@user");
const user_tokenization = require("@user_tokenization");
const Validator = require('mongoose').Types.ObjectId;

module.exports = {

  user_get: function(req, res) {
    let query;
    if (Validator.isValid(req.params.username.toString())) {
      query = {_id: req.params.username};
    } else {
      query = {username_lowercase: req.params.username.toLowerCase()};
    }
    User.findOne(query).populate("disguise_group").exec().then(async (user) => {
      if (!user) return res.status(404).send({message: "No se ha encontrado al jugador."});
      let fixedUser = user;
      fixedUser.group = await Promise.map(user.group, async (group) => {
        return await Group.findOne({_id: group._id}).exec().then((g) => {
          return g;
        }).catch((err) => {
          console.log(err);
        });
      });
      return res.status(200).send(fixedUser);
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
    User.findOne({username_lowercase: params.username.toLowerCase()}, (err, user) => {
      if (err) return res.status(500).send({message: "Error when pairing user with the server."});
      if (user) {
        // Find if user already registered
        User.findByIdAndUpdate({_id: user._id}, {last_seen: 0}).populate("group._id disguise_group").exec((err, updated_login)  => {
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
            return res.status(200).send({multi: true, language: multi.language, account_details: {created_at: moment.unix(multi.member_since).format("MM/DD/YYYY"), username: multi.username}});
          } else {
            // Create new user
            let user = new User();
            user.username = params.username;
            user.username_lowercase = params.username.toLowerCase();
            user.skin = params.username;
            user.last_seen = 0;
            user.last_game = "registrandose";
            user.member_since = Date;
            user.logged = "authenticating";
            user.group.push({
              _id: process.env.DEFAULT_GROUP,
              add_date: Date
            });
            user.save((err, saved_user) => {
              if (err) return res.status(500).send({message: "Error when pairing user with the server."});
              if (saved_user) {
                // Re-querying user to get populated groups
                User.findOne({_id: saved_user}).populate("group._id disguise_group").exec((err, user) => {
                  if (err) return res.status(500).send({message: "Error when pairing user with the server."});
                  // Trick to prevent model creation callbacks
                  AF.friend_create(saved_user._id);
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
    let params = req.body;
    let ip;
    if (params.username && params.ip && params.password) {
      if (geoip.lookup(params.ip) != null) {
        ip = geoip.lookup(params.ip).country;
      } else {
        ip = "Unknown";
      }
      bcrypt.hash(params.password, null, null, (err, hash) => {
        if (err || !hash) res.status(500).send({message: "Error while registering user."});
        User.findOneAndUpdate({username_lowercase: params.username.toLowerCase()}, {$set: {password: hash, logged: "true"}, $push: {used_ips: {number: params.ip, country: ip.country, primary: true}}}, (err, user_updated) => {
          if (err || !user_updated) res.status(500).send({message: "Error while registering user."});
          return res.status(200).send({token: user_tokenization.createToken(user_updated)});
        });
      });
    } else {
      return res.status(400).send({message: "Request parameters are incorrect."});
    }
  },

  server_login: function(req, res) {
    let params = req.body;
    if (params.password && params.username) {
      User.findOne({username_lowercase: params.username.toLowerCase()}, (err, user) => {
        if (err) res.status(500).send({message: "Ha ocurrido un error al validar la contraseña del usuario."});
        bcrypt.compare(params.password, user.password, (err, check) => {
          if (check) {
            user.logged = "true";
            user.save((err, saved) => {
              if (err || !saved) return res.status(400).send({message: "Invalid password."});
              return res.status(200).send({last_game: user.last_game, token: user_tokenization.createToken(saved)});
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

  /*bungee_join: function(req, res) {
    User.findOne({username_lowercase: req.body.username.toLowerCase()}, (err, registered) => {
      if (err) return res.status(200).send({can_join: false, banned: false});
      if (!registered) return res.status(200).send({can_join: true, banned: false});
      Punishment.findOne({$or: [{type: "ban"}, {type: "temp-ban"}], active: true, punished: registered}, (err, banned) => {
        if (err) return res.status(200).send({can_join: false, banned: false});
        if (banned) {
          User.findOne({_id: banned.punisher}, (err, punisher) => {
            AF.real_player(punisher.username, null, req.body.realm).then((punisher_data) => {
              return res.status(200).send({
                can_join: false,
                banned: true,
                language: registered.language,
                punishment_info: {
                  punisher_name: punisher_data.real_name,
                  punisher_group: punisher_data.real_group,
                  reason: banned.reason
                }});
            }).catch((err) => {
              console.log(err);
              return res.status(200).send({can_join: false, banned: false});
            });
          });
        } else {
          registered.logged = "authenticating";
          registered.save((err, updated) => {
            if (err || !updated) return res.status(200).send({can_join: false, banned: false});
            if (updated) return res.status(200).send({can_join: true, banned: false});
          });
        }
      });
    });
  },

  server_record: function(req, res) {
    User.findOne({username_lowercase: req.body.username.toLowerCase()},(err, user) => {
      if (err) return res.status(200).send({pre_logged: false, message: "Ha ocurrido un error al realizar pre-join."});
      if (user) {
        User.findByIdAndUpdate(user._id, {last_seen: "conectado"}, ()  => {
          if (!user.password) {
            return res.status(200).send({pre_logged: true, new_user: true, multi_account: false, language: user.language});
          } else {
            return res.status(200).send({pre_logged: true, new_user: false, multi_account: false, language: user.language});
          }
        });
      } else {
        User.findOne({"used_ips.number" : req.body.ip, "used_ips.primary": true}, (err, multi_account) => {
          if (err) return res.status(500).send({pre_logged: false, message: "Ha ocurrido un error al relizar pre-join."});
          if (!multi_account) {
            let user = new User();
            user.username = req.body.username;
            user.username_lowercase = req.body.username.toLowerCase();
            user.group.push({"_id": "5b52b2048284865491b1f56a", add_date: moment().unix(), role_comment: "usuario"});
            user.skin = req.body.username;
            user.last_seen = "conectado";
            user.last_game = "registrandose";
            user.member_since = moment().unix();
            user.logged = "authenticating";
            user.save((err, user_stored) => {
              if (err) return res.status(500).send({pre_logged: false, message: "Ha ocurrido un error al realizar el pre-join."});
              if (user_stored) {
                AF.friend_create(user_stored._id);
                AF.stats_create(user_stored._id);
                return res.status(200).send({pre_logged: true, new_user: true, multi_account: false, language: user_stored.language});
              } else {
                return res.status(200).send({pre_logged: false, message: "Ha ocurrido un error al realizar el pre-join."});
              }
            });
          } else {
            return res.status(200).send({pre_logged: true, new_user: true, multi_account: true, language: multi_account.language, account_details: { created_at: moment.unix(multi_account.member_since).format("MM/DD/YYYY"), username: multi_account.username}});
          }
        });
      }
    });
  },*/

  server_left: function(req, res) {
    User.findOneAndUpdate({_id: req.user.sub}, {last_seen: moment().unix(), logged: "false"}, {new: true}, (err, user_updated)  => {
      if (!user_updated) return res.status(500).send({message: "Petición de desconexión incorrecta."});
      if (err) res.status(500).send({message: "Ha ocurrido un error desconectar al usuario de la base de datos."});
      return res.status(200).send({user: user_updated.username, disconnected: user_updated.last_seen});
    });
  },

  server_email_register: function(req, res) {
    User.find({email: req.body.email.toLowerCase(), verified: true}).exec((err, users) => {
      if (users && users.length >= 1) {
        return res.status(409).send({message: "already_registered"});
      } else {
        redis.redisClient.exists(req.body.email, (err, reply) => {
          if (err) return res.status(500).send({message: "redis_error"});
          if (reply) {
            return res.status(403).send({message: "already_sent"});
          } else {
            let rand = Math.floor((Math.random() * 100) + 54);
            let encodedMail = new Buffer(req.body.email).toString("base64");
            let encodedUser = new Buffer(req.body.username).toString("base64");
            let link = "http://" + req.get("host") + "/api/user/verify?mail=" + encodedMail + "&user=" + encodedUser + "&id=" + rand;
            User.findOneAndUpdate({username_lowercase: req.body.username.toLowerCase()}, {email: req.body.email.toLowerCase(), verified: false}, (err, user) => {
              if (!user) {
                return res.status(500).send({message: "not_found"});
              } else {
                mailer.sendMail(req.body.email, "Verifica tu cuenta - " + req.body.username,
                  "<!DOCTYPE html><html lang=\"en\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <head style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <meta charset=\"UTF-8\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <link href=\"https://fonts.googleapis.com/css?family=Montserrat:400,700,900\" rel=\"stylesheet\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <style style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> *, *::before, *::after { margin: 0; padding: 0; box-sizing: inherit; -webkit-font-smoothing: antialiased; } body { box-sizing: border-box; background-color: #050404; width: 700px; padding: 20px; margin: auto; } .header { padding-bottom: 10px; } .logo { display: inline-block; width: 100px; } .main { border-top: 3px solid #f68657; background-color: #1f2124; width: 100%; padding: 30px 0; } .heading { font-weight: 600; letter-spacing: -1px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #ffffff; } .avatar { display: inline-block; margin: 40px; } .info { margin: auto; width: 60%; font-family: \"Open Sans\", sans-serif; font-size: 15px; color: #ffffff; } .info span { font-weight: 600; letter-spacing: -1px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #f6b352; } .btn, .btn:link, .btn:visited { margin-top: 20px; font-weight: 600; letter-spacing: -1px; font-family: \"Montserrat\", sans-serif; text-transform: uppercase; color: #ffffff; text-decoration: none; background-color: #f6b352; padding: 1rem 2rem; display: inline-block; transition: all .3s; position: relative; user-select: none; border: none; cursor: pointer; outline: none; } .copyright { display: inline-block; margin: 20px; color: #ffffff; font-family: \"Open Sans\", sans-serif; font-size: 14px; } </style> </head> <body style=\"margin: auto;padding: 20px;box-sizing: border-box;-webkit-font-smoothing: antialiased;background-color: #050404;width: 700px;\"> <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <tr style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <td align=\"center\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <div class=\"header\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;padding-bottom: 10px;\"> <img src=\"https://i.imgur.com/yEF1fBd.png\" alt=\"Seocraft Logo\" class=\"logo\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;display: inline-block;width: 100px;\"> </div> <div class=\"main\" style=\"margin: 0;padding: 30px 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;border-top: 3px solid #f68657;background-color: #1f2124;width: 100%;\"> <h1 class=\"heading\" style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;font-weight: 600;letter-spacing: -1px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #ffffff;\">¡Estás a un paso de verificar tu cuenta!</h1> <img src=\"https://minotar.net/avatar/" + user.skin + "\" alt=\"" + user.username + "\" class=\"avatar\" style=\"margin: 40px;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;display: inline-block;\"> <p class=\"info\" style=\"margin: auto;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;width: 60%;font-family: &quot;Open Sans&quot;, sans-serif;font-size: 15px;color: #ffffff;\">Hola <span style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;font-weight: 600;letter-spacing: -1px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #f6b352;\">" + user.username + "</span>, estás a un paso de verificar tu cuenta en Seocraft Network, simplemente debes dar click en el botón de abajo.</p> <a href=\"" + link + "\" class=\"btn\" style=\"margin: 0;padding: 1rem 2rem;box-sizing: inherit;-webkit-font-smoothing: antialiased;margin-top: 20px;font-weight: 600;letter-spacing: -1px;font-family: &quot;Montserrat&quot;, sans-serif;text-transform: uppercase;color: #ffffff;text-decoration: none;background-color: #f6b352;display: inline-block;transition: all .3s;position: relative;user-select: none;border: none;cursor: pointer;outline: none;\">Verificar cuenta</a> </div> <div style=\"margin: 0;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;\"> <p class=\"copyright\" style=\"margin: 20px;padding: 0;box-sizing: inherit;-webkit-font-smoothing: antialiased;display: inline-block;color: #ffffff;font-family: &quot;Open Sans&quot;, sans-serif;font-size: 14px;\">&copy; Seocraft Network 2019. Todos los derechos reservados a Seocraft Network S.A</p> </div> </td> </tr> </table> </body></html>"
                ).then((email) => {
                  if (!email) return res.status(500).send({message: "mail_failed"});
                  redis.redisClient.set(req.body.email, rand);
                  redis.redisClient.expire(req.body.email, 600);
                  if (err) return res.status(500).send({message: "update_error"});
                  return res.status(200).send({message: "successfully_sent"});
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
        User.findOneAndUpdate({username_lowercase: decodedUser.toLowerCase(), email: decodedMail.toLowerCase()}, {verified: true}, (err, user) => {
          if (err || !user) {
            return res.status(500).send({message: "not_found"});
          } else {
            redis.redisClient.del(decodedMail, (err, remove) => {
              if (err) return res.status(500).send({message: "redis_error"});
              if (remove !== 1) return res.status(500).send({message: "redis_issue"});
              return res.redirect("http://" + process.env.BACKEND_URL + "/login?verified=true");
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
      User.findOne({username_lowercase: req.body.username.toLowerCase()}, async (err, user) => {
        if(!user || err) return res.status(500).send({message: "No se ha encontrado a este usuario en la base de datos."});
        await AF.user_groups_id(user._id).then(async (groups) => {
          let permissions = [];
          await Promise.map(groups[0].group, async (groups) => {
            return await Group.findOne({_id: groups._id}).select({minecraft_permissions: 1, _id: 0}).then((group_permissions) => {
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
      let user_data = await User.findOne({username_lowercase: params.username.toLowerCase()}).exec().then((user) => {
        if (user) {
          return user;
        } else {
          return null;
        }
      }).catch(() => {});
      if (!user_data) return res.status(404).send({message: "Ha ocurrido un error al encontrar el usuario en la base de datos."});
      let user_groups = await AF.user_groups_id(user_data._id).then(async (userGroups) => {
        return await Promise.map(userGroups[0].group, async (groups) => {
          return await AF.server_placeholder(params.realm.toLowerCase(), groups._id).then((group) => {
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
        member_since: user_data.member_since,
        logged: user_data.logged,
        last_seen: user_data.last_seen,
        experience: user_data.experience,
        level: user_data.level,
        max_experience: max_experience
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener los datos del usuario."});
    }
  },

  // -- Group related functions --//

  group_add: function(req, res) {
    let params = req.body; if(!params.username || !params.group) return res.status(500).send({message: "Ha ocurrido un error al obtener los datos del grupo."});
    Group.findOne({name: params.group}).select("_id", (err, group) => {
      if (err) return res.status(200).send({updated: false, message: "Ha ocurrido un error al obtener el grupo."});
      if (!group) {
        return res.status(200).send({updated: false, message: "No se ha encontrado un grupo con este nombre."});
      } else {
        User.findOne({username_lowercase: params.username.toLowerCase()}, (err, user) => {
          if (!user) {
            return res.status(200).send({updated: false, message: "No se ha encontrado a este usuario en la base de datos."});
          } else {
            if (user.group.includes({_id: group._id})) {
              return res.status(200).send({updated: false, message: "El usuario ya hace parte del grupo seleccionado."});
            } else {
              user.group.push({_id: group._id, add_date: moment().unix(), role_comment: params.group});
              user.save((err, user) => {
                if (err || !user) return res.status(500).send({updated: false, message: "Ha ocurrido un error al actualizar el usuario."});
                return res.status(200).send({updated: true});
              });
            }
          }
        });
      }
    });
  },

  group_remove: function(req, res) {
    let params = req.body; if (!params.username || !params.group) return res.status(500).send({message: "Ha ocurrido un error al obtener los datos del grupo."});
    Group.findOne({name: params.group}).select("_id", (err, group) => {
      if (err) return res.status(200).send({removed: false, message: "Ha ocurrido un error al obtener el grupo."});
      if (!group) {
        return res.status(200).send({removed: false, message: "No se ha encontrado un grupo con este nombre."});
      } else {
        User.findOne({username: params.username}, (err, user) => {
          if (!user) {
            return res.status(200).send({removed: false, message: "No se ha encontrado a este usuario en la base de datos."});
          } else {
            if (user.group.includes({"_id": group._id})) {
              return res.status(200).send({removed: false, message: "El usuario ya hace parte del grupo seleccionado."});
            } else {
              user.group.pull({"_id": group._id});
              user.save((err, user) => {
                if (err || !user) return res.status(500).send({removed: false, message: "Ha ocurrido un error al actualizar el usuario."});
                return res.status(200).send({removed: true});
              });
            }
          }
        });
      }
    });
  },

  disguise_user: function(req, res) {
    if (!req.body.disguise_nick || !req.body.disguise_group) {
      return res.status(200).send({can_use: "false", message: "command_disguise_error"});
    } else {
      let group;
      if (req.body.disguise_group === "usuario") group = "5b52b2048284865491b1f56a";
      if (req.body.disguise_group === "warlord") group = "5b5662c3a7d0508b8b153d8f";
      if (req.body.disguise_group === "ghost") group = "5b5662d0a7d0508b8b153da3";
      if (req.body.disguise_group === "shallow") group = "5b5662e7a7d0508b8b153dc7";
      if (req.body.disguise_group === "zeno") group = "5b5662d9a7d0508b8b153db2";
      User.findOneAndUpdate(
        {_id: req.user.sub},
        {disguised: true, disguise_actual: req.body.disguise_nick ,disguise_lowercase: req.body.disguise_nick.toLowerCase(), disguise_group: group, $push: {disguise_history: {nickname: req.body.disguise_nick.toLowerCase(), group: group, created_at: moment().unix()}}}, (err, disguised_user) => {
          if (err) return res.status(200).send({nicked: "false", message: "command_disguise_error"});
          if (!disguised_user) return res.status(200).send({nicked: "false", message: "command_disguise_notfound"});
          return res.status(200).send({nicked: "true", message: "command_disguise_success"});});
    }
  },

  disguise_namecheck: function(req, res) {
    if (!req.body.disguise_nick) {
      return res.status(200).send({can_use: "false", message: "command_disguise_error"});
    } else {
      User.findOne({username_lowercase: req.body.disguise_nick.toLowerCase()}, (err, user) => {
        if (err) return res.status(200).send({can_use: "false", message: "command_disguise_error"});
        if (!user) {
          User.findOne({disguise_lowercase: req.body.disguise_nick.toLowerCase()}, (err, used) => {
            if (err) return res.status(200).send({can_use: "false", message: "command_disguise_error"});
            if (!used) {
              return res.status(200).send({can_use: "true", message: "none"});
            } else {
              return res.status(200).send({can_use: "false", message: "command_disguise_used"});
            }
          });
        } else {
          return res.status(200).send({can_use: "false", message: "command_disguise_real"});
        }
      });
    }
  },

  disguise_remove: function(req, res) {
    User.findOneAndUpdate(
        {_id: req.user.sub},
        {disguised: false, disguise_actual: undefined, disguise_lowercase: undefined, disguise_group: undefined}, (err, undisguised) => {
          if(err || !undisguised) return res.status(200).send({removed: "false", message: "command_disguise_error"});
          return res.status(200).send({removed: "true", message: "command_disguise_undisguised"});
        }
    );
  },

  disguise_get_onjoin: async function(req, res) {
    try {
      if (!req.body.realm) {
        return res.status(200).send({message: "Ha ocurrido un error al obtener los datos del usuario."});
      } else {
        await User.findOne({_id: req.user.sub}).exec().then(async (user) => {
          if (!user) return res.status(200).send({message: "command_disguise_join_error"});
          await AF.server_placeholder(req.body.realm, user.disguise_group).then((group) => {
            return res.status(200).send({disguise: user.disguise_actual, group: group});
          }).catch(() => {});
        });
      }
    } catch(err) {
      return res.status(200).send({message: "command_disguise_join_error"});
    }
  },

  profile_command: async function(req, res) {
    try {
      console.log(req.user.sub);
      User.findOne({_id: req.user.sub}, async (err, query_user) => {

        // -- Base query request -- //

        if (err) return res.status(200).send({query_success: "false", message: "profile_query_error"});
        if (!query_user) {
          return res.status(200).send({query_success: "false", message: "profile_query_notfound"});
        } else {

          // -- Get query player info -- //

          let user_groups = await AF.user_groups_id(query_user._id).then(async (userGroups) => {
            return await Promise.map(userGroups[0].group, async (groups) => {
              return await AF.server_placeholder(req.body.realm.toLowerCase(), groups._id).then((group) => {
                return group;
              }).catch(() => {});
            });
          });

          let disguise_placeholder;
          if (query_user.disguise_group) {
            disguise_placeholder = await AF.server_placeholder(req.body.realm.toLowerCase(), query_user.disguise_group).then((group) => {
              return group;
            }).catch(() => {});
          }

          let max_experience = AF.arithmetic_max_xp(query_user.level+1);
          user_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

          if (!req.body.target) {

            // -- Command without target request -- //

            return res.status(200).send(
                {
                  query_success: "true",
                  queried_disguised: "false",
                  query_user: {
                    username: query_user.username,
                    language: query_user.language,
                    main_group: user_groups[0],
                    skin: query_user.skin,
                    disguised: query_user.disguised,
                    disguised_actual: query_user.disguise_actual,
                    disguise_group: disguise_placeholder,
                    member_since: query_user.member_since,
                    last_seen: query_user.last_seen,
                    experience: query_user.experience,
                    level: query_user.level,
                    max_experience: max_experience
                  }
                }
            );
          } else {

            // -- Find if target player is a disguise -- //

            User.findOne({disguise_lowercase: req.body.target.toLowerCase()}, async (err, query_disguised) => {
              if (err) return res.status(200).send({query_success: "false", message: "profile_query_error"});
              if (!query_disguised) {

                // -- Find real user with target name -- //

                User.findOne({username_lowercase: req.body.target.toLowerCase()}, async (err, query_target) => {
                  if (err) return res.status(200).send({query_success: "false", message: "profile_query_error"});
                  if(!query_target) return res.status(200).send({query_success: "false", message: "profile_query_notfound"});

                  let target_groups = await AF.user_groups_id(query_target._id).then(async (userGroups) => {
                    return await Promise.map(userGroups[0].group, async (groups) => {
                      return await AF.server_placeholder(req.body.realm.toLowerCase(), groups._id).then((group) => {
                        return group;
                      }).catch(() => {});
                    });
                  });

                  let disguise_placeholder_target;
                  if (query_target.disguise_group) {
                    disguise_placeholder_target = await AF.server_placeholder(req.body.realm.toLowerCase(), query_target.disguise_group).then((group) => {
                      return group;
                    }).catch(() => {});
                  }

                  let are_friends = await Friend.findOne({username: query_target._id, accepted: {$in: [query_user._id]}}).exec().then((are_friends) => {
                    if (!are_friends) return "false";
                    return "true";
                  }).catch(() => {
                    return "false";
                  });

                  let max_experience_target = AF.arithmetic_max_xp(query_target.level+1);
                  target_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

                  return res.status(200).send(
                      {
                        query_success: "true",
                        queried_disguised: "false",
                        are_friends: are_friends,
                        query_user: {
                          username: query_user.username,
                          language: query_user.language,
                          main_group: user_groups[0],
                          skin: query_user.skin,
                          disguised: query_user.disguised,
                          disguised_actual: query_user.disguise_actual,
                          disguise_group: disguise_placeholder,
                          member_since: query_user.member_since,
                          last_seen: query_user.last_seen,
                          experience: query_user.experience,
                          level: query_user.level,
                          max_experience: max_experience
                        },
                        query_target: {
                          username: query_target.username,
                          language: query_target.language,
                          main_group: target_groups[0],
                          skin: query_target.skin,
                          disguised: query_target.disguised,
                          disguised_actual: query_target.disguise_actual,
                          disguise_group: disguise_placeholder_target,
                          member_since: query_target.member_since,
                          last_seen: query_target.last_seen,
                          experience: query_target.experience,
                          level: query_target.level,
                          max_experience: max_experience_target
                        }
                      }
                  );
                });

              } else {

                // -- Send target disguised player with real name -- //

                let disguise_groups = await AF.user_groups_id(query_disguised._id).then(async (userGroups) => {
                  return await Promise.map(userGroups[0].group, async (groups) => {
                    return await AF.server_placeholder(req.body.realm.toLowerCase(), groups._id).then((group) => {
                      return group;
                    }).catch(() => {});
                  });
                });

                let disguise_placeholder_disguised;
                if (query_disguised.disguise_group) {
                  disguise_placeholder_disguised = await AF.server_placeholder(req.body.realm.toLowerCase(), query_disguised.disguise_group).then((group) => {
                    return group;
                  }).catch(() => {});
                }

                let are_friends = await Friend.findOne({username: query_disguised._id, accepted: {$in: [query_user._id]}}).exec().then((are_friends) => {
                  if (!are_friends) return "false";
                  return "true";
                }).catch(() => {
                  return "false";
                });

                let max_experience_disguised = AF.arithmetic_max_xp(query_disguised.level+1);
                disguise_groups.sort((a, b) => parseFloat(a.priority) - parseFloat(b.priority));

                return res.status(200).send(
                    {
                      query_success: "true",
                      queried_disguised: "true",
                      are_friends: are_friends,
                      query_user: {
                        username: query_user.username,
                        language: query_user.language,
                        main_group: user_groups[0],
                        skin: query_user.skin,
                        disguised: query_user.disguised,
                        disguised_actual: query_user.disguise_actual,
                        disguise_group: disguise_placeholder,
                        member_since: query_user.member_since,
                        last_seen: query_user.last_seen,
                        experience: query_user.experience,
                        level: query_user.level,
                        max_experience: max_experience
                      },
                      query_target: {
                        username: query_disguised.username,
                        language: query_disguised.language,
                        main_group: disguise_groups[0],
                        skin: query_disguised.skin,
                        disguised: query_disguised.disguised,
                        disguised_actual: query_disguised.disguise_actual,
                        disguise_group: disguise_placeholder_disguised,
                        member_since: query_disguised.member_since,
                        last_seen: query_disguised.last_seen,
                        experience: query_disguised.experience,
                        level: query_disguised.level,
                        max_experience: max_experience_disguised
                      }
                    }
                );
              }
            });

          }
        }
      });

    } catch (err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al obtener los datos del usuario."});
    }
  }

};

