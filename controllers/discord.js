"use strict";

const { URLSearchParams } = require('url');
const discord = require("discord.js");
const client = new discord.Client();
const User = require("@user");
const Group = require("@group");
const Promise = require("bluebird");
const fetch = require("node-fetch");
const moment = require("moment");
const config = require("../config.json");

async function syncRoles(id) {
  let removeRoles = [];
  await Group.find({discord_role: { $exists: true}}).exec().then((group) => {
    group.forEach((role) => {
      removeRoles.push(role.discord_role);
    });
  });

  let userGroups = await User.findOne({_id : id}).exec().then(async (groups) => {
    return await Promise.map(groups.groups, async (groups) => {
      return groups.group.discord_role;
    });
  });
  removeRoles = removeRoles.filter((f) => !userGroups.includes(f));

  await discordUserFetch(id).then(async (userData) => {

    const guild = client.guilds.get(config.DISCORD_GUILD);
    const guildUser = guild.member(userData.id);

    removeRoles.forEach((role) => {
      let guildRole = guild.roles.find("name", role);
      if (guildRole !== null && guildUser.roles.has(role)) guildUser.removeRole(guildRole);
    });

    userGroups.forEach((role) => {
      let guildRole = guild.roles.find("name", role);
      if (guildRole !== null && !guildUser.roles.has(role)) guildUser.addRole(guildRole);
    });
  });
}

async function discordUserFetch(id) {

  return await User.findOne({_id: id}).exec().then(async (user) => {

    if (moment().unix() > moment.unix(user.stamp).add(7, 'days').unix()) {
      let formData = new URLSearchParams();
      formData.append("client_id", config.DISCORD_CLIENT_ID);
      formData.append("client_secret", config.DISCORD_CLIENT_SECRET);
      formData.append("grant_type", "refresh_token");
      formData.append("refresh_token", user.discord.refreshToken);
      formData.append("redirect_uri", config.DISCORD_REDIRECT_URL);
      formData.append("scope", "identify");

      const response = await fetch("https://discordapp.com/api/oauth2/token",
          {
            method: 'POST',
            body: formData
          });

      const json = await response.json();

      user.discord.access = json.access_token;
      user.discord.stamp = moment().unix();

      // --- Will update user record and re-fetch information --- //
      return await user.save().then(async (updated) => {
        const response = await fetch("https://discordapp.com/api/users/@me",
            {
              method: 'GET',
              headers: {
                Authorization: "Bearer " + updated.discord.access,
              }
            });
        return await response.json();
      });

    } else {

      const response = await fetch("https://discordapp.com/api/users/@me",
          {
            method: 'GET',
            headers: {
              Authorization: "Bearer " + user.discord.access,
            }
          });
      return await response.json();

    }
  });

}

module.exports = {

  load_bot: function() {
    client.on('ready', () => {
      console.log('Conexión exitosa a discord.');
    });

    client.on('guildMemberAdd', member => {
      member.send(":arrow_up:  ¡ Bienvenido a Seocraft Network " + `${member}` + "! :arrow_up: \n" +
        "\n" +
        "Hemos visto que eres un jugador nuevo que no ha _sincronizado_ su cuenta de *Discord* en la website de *Seocraft Network*, recuerda que puedes obtener un premio extra *IN-GAME* por _verificar_ tu cuenta de *Discord*, ¿Quieres saber cómo?\n" +
        "\n" +
        ":arrow_forward: Ingresa a https://www.seocraft.net/cuenta e inicia sesión, si aún no tienes una cuenta debes _registrarte_ usando el link https://www.seocraft.net/registrate\n" +
        "\n" +
        ":arrow_forward: Ve a la sección _Redes sociales_ y haz click en el logo de *Discord*, luego de esto haz click en _Autorizar (Authorize)_\n" +
        "\n" +
        ":arrow_forward: ¡¡Listo!! Has sincronizado tu cuenta de Minecraft con Discord, ahora vuelve IN-GAME y recibirás tu recompensa");
    });

    // --- Private message commands --- //
    client.on('message', async (message) => {

      if (message.content === "¿Que opinas seobot?") {
        await message.channel.send("Jaja c mamo xdXdxDXD");
      }

      if (message.content === "¿Que opinas del seopet?") {
        await message.channel.send("Que es un pulmon nefasto");
      }

      if (message.channel.type === "dm") {
        if (message.content === '/sync') {
          await User.findOne({"discord.id": message.author.id}).exec().then(async (user) => {
            if (!user) message.author.send(":no_entry_sign: ¡Tu cuenta no se encuentra sincronizada con ninguna cuenta *Minecraft*! :no_entry_sign:");
            if (user) {
              await syncRoles(user._id).then(() => {
                return message.author.send(":arrows_counterclockwise: ¡" + message.author + ", ahora tus rangos de _Discord_ están nuevamente sincronizados con los de tu cuenta _Minecraft_ *" + user.display + "*! :arrows_counterclockwise:");
              }).catch(() => { message.author.send(":no_entry_sign: ¡Ha ocurrido un error al sincronizar tus rangos! :no_entry_sign:"); });
            }
          });
        } else {
          await message.author.send(":bangbang: Hola, soy el bot oficial de *Seocraft Network*, no soy un persona real, así que estoy diseñado para realizar acciones especificas, puedes usar el comando */ayuda* para conocer más cerca de mis funciones. Si deseas hablar con una persona real, puedes enviar un mensaje de texto en los canales de `#ayuda`, o ingresar a nuestro sitio web https://www.seocraft.net. ¡Buena suerte! :bangbang:").then().catch((err) => {});
        }
      }
    });

    client.login(config.DISCORD_BOT_KEY);
  },
  
  discordRedirect: function(req, res) {
    res.redirect("https://discordapp.com/oauth2/authorize?client_id=" + config.DISCORD_CLIENT_ID + "&scope=identify&response_type=code&redirect_uri=" + encodeURIComponent(config.DISCORD_REDIRECT_URL) + "&state=" + req.query.id);
  },
  
  discordSync: async function(req, res) {

    if (!req.query.code) return res.status(404).send({message: "No se ha recibido un codigo de autorización."});
    const code = req.query.code;

    let formData = new URLSearchParams();
    formData.append("client_id", config.DISCORD_CLIENT_ID);
    formData.append("client_secret", config.DISCORD_CLIENT_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", config.DISCORD_REDIRECT_URL);
    formData.append("scope", "identify");

    try {
      const response = await fetch("https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=" + code + "&redirect_uri=" + encodeURIComponent(config.DISCORD_REDIRECT_URL),
          {
            method: 'POST',
            body: formData
          });

      const json = await response.json();

      User.findOneAndUpdate({_id: req.query.state}, {
        discord: {
          access: json.access_token,
          refresh: json.refresh_token,
          stamp: moment().unix()
        }}, {new: true}, (err, updatedUser) => {

        if (err) return res.status(500).send({message: "Ha ocurrido un error al sincronizar tu cuenta de discord."});
        if (!updatedUser) return res.status(404).send({message: "No se ha encontrado el usuario a actualizar."});

        try {
          discordUserFetch(req.query.state).then(async (userData) => {
            let user = client.users.get(userData.id);

            User.findOneAndUpdate({_id: req.query.state},
                {
                  discord: {
                    id: userData.id,
                    access: updatedUser.discord.access,
                    refresh: updatedUser.discord.refresh,
                    stamp: updatedUser.discord.stamp
                  }
                }, {new: true}, async (err, updatedDiscord) => {

              if (err) return res.status(500).send({message: "Ha ocurrido un error al sincronizar tu cuenta de discord."});
              if (!updatedDiscord) return res.status(404).send({message: "No se ha encontrado el usuario a actualizar."});

              user.send(":white_check_mark:  ¡"+ user +", has sincronizado correctamente tu cuenta con el usuario *" + userData.display + "*! :white_check_mark:\n" +
                  "\n" +
                  "Recuerda que ahora obtendrás una recompensa IN-Game, en cualquiera de los lobbies puedes dar doble click sobre la sección *Mi Perfil* y luego la sección *Recompensas* para redimirla, recuerda que esto no funciona si ya has añadido anteriormente una cuenta de _Discord_.");

              syncRoles(req.query.state);
              res.redirect('http://localhost:4200/cuenta?verified=true');

            });
          });
        } catch (err) {
          return res.status(500).send({message: "Ha ocurrido un error al sincronizar tu cuenta de Discord."});
        }

      });

    } catch (err) {
      return res.status(500).send({message: "Ha ocurrido un error al sincronizar discord."});
    }

  },

  website_placeholder: async function(req, res) {
    try {
      let id;
      if(!req.params.id) { id = req.user.sub; } else { id = req.params.id; }
      await User.findOne({_id: id}).select("discord").exec().then(async (user) => {
        await discordUserFetch(user._id).then((user_data) => {
          return res.status(200).send({
            username: user_data.username,
            discriminator: user_data.discriminator,
            avatar: user_data.avatar
          });
        }).catch(() => {});
      }).catch(() => {});
    } catch(err) {
      return res.status(500).send({message: "Ha ocurrido un error al obtener los datos de discord"});
    }
  },

  discord_logout: async function(req, res) {
    try {
      await User.findOne({"_id": req.params.id}).exec().then(async (user_found) => {
        let remove_roles = [];
        await Group.find({discord_role: { $exists: true}}).select({"discord_role": 1, "_id": 0}).exec().then((group) => {
          group.forEach((role) => {
            remove_roles.push(role.discord_role);
          });
        }).catch(() => {});
        discordUserFetch(user_found._id).then(async (user_data) => {
          let guild = client.guilds.get(config.DISCORD_GUILD);
          let user = guild.member(user_data.id);
          await Promise.map(remove_roles, async (remove) => {
            let role = guild.roles.find("name", remove);
            /*if (role !== null && user.roles.has(role)) {
              user.removeRole(role).catch((err) => { console.log(err); });
            }*/
          });
          /*user.send(":x:  ¡"+ user +", tu cuenta ya no está sincronizada con el jugador de Minecraft  *" + user_data.username + "*! :x:\n" +
            "\n" +
            "Si deseas volver a sincronizarla, simplemente ingresa a https://www.seocraft.net/cuenta, pero esta vez ya no recibirás recompensa.");*/
          user_found.discord = undefined;
          await user_found.save().then((saved) => {
            return res.status(200).send({saved});
          }).catch((err) => { console.log(err); });
        }).catch((err) => { console.log(err); });
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al cerrar la sesión de Discord."});
    }
  }
  
};

