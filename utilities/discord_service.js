"use strict";

const AF = require("@auxiliar_functions");
const { URLSearchParams } = require('url');
const discord_service = require("discord.js");
const client = new discord_service.Client();
const User = require("@user");
const Group = require("@group");
const Promise = require("bluebird");
const fetch = require("node-fetch");
const moment = require("moment");

async function sync_roles(user_id) {
  try {
    let remove_roles = [];
    await Group.find({discord_role: { $exists: true}}).select({"discord_role": 1, "_id": 0}).exec().then((group) => {
      group.forEach((role) => {
        remove_roles.push(role.discord_role);
      });
    }).catch((err) => { console.log(err); });
    let user_groups = await AF.user_groups_id(user_id).then(async (groups) => {
      return await Promise.map(groups[0].group, async (groups) => {
        return await Group.findOne({"_id" : groups._id}).select({"discord_role": 1, "_id": 0}).then((group) => {
          return group.discord_role;
        }).catch((err) => { console.log(err); });
      });
    }).catch((err) => { console.log(err); });
    remove_roles = await remove_roles.filter((f) => !user_groups.includes(f));
    await AF.needed_update(user_id).then(async (user_data) => {
      let guild = client.guilds.get(process.env.DISCORD_GUILD);
      let user = guild.member(user_data.id);
      await Promise.map(remove_roles, (remove) => {
        let role = guild.roles.find("name", remove);
        if (user.roles.has(role)) {
          user.removeRole(role).catch((err) => { console.log(err); });
        }
      });
      await Promise.map(user_groups, (add) => {
        let role = guild.roles.find("name", add);
        if (!user.roles.has(role)) {
          user.addRole(role).catch((err) => { console.log(err); });
        }
      });
    }).catch((err) => { console.log(err); });
  } catch(err) {
    console.log(err);
  }
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
              await sync_roles(user._id).then(() => {
                return message.author.send(":arrows_counterclockwise: ¡" + message.author + ", ahora tus rangos de _Discord_ están nuevamente sincronizados con los de tu cuenta _Minecraft_ *" + user.username + "*! :arrows_counterclockwise:");
              }).catch(() => { message.author.send(":no_entry_sign: ¡Ha ocurrido un error al sincronizar tus rangos! :no_entry_sign:"); });
            }
          });
        } else {
          await message.author.send(":bangbang: Hola, soy el bot oficial de *Seocraft Network*, no soy un persona real, así que estoy diseñado para realizar acciones especificas, puedes usar el comando */ayuda* para conocer más cerca de mis funciones. Si deseas hablar con una persona real, puedes enviar un mensaje de texto en los canales de `#ayuda`, o ingresar a nuestro sitio web https://www.seocraft.net. ¡Buena suerte! :bangbang:").then().catch((err) => {});
        }
      }
    });

    client.login(process.env.DISCORD_BOT_KEY);
  },
  
  discord_redirect: function(req, res) {
    res.redirect("https://discordapp.com/oauth2/authorize?client_id=" + process.env.DISCORD_CLIENT_ID + "&scope=identify&response_type=code&redirect_uri=" + encodeURIComponent(process.env.DISCORD_REDIRECT_URL) + "&state=" + req.query.id);
  },
  
  discord_sync: async function(req, res) {
    try {
      if (!req.query.code) return res.status(404).send({message: "No se ha recibido un codigo de autorización."});
      const code = req.query.code;

      let formData = new URLSearchParams();
      formData.append("client_id", process.env.DISCORD_CLIENT_ID);
      formData.append("client_secret", process.env.DISCORD_CLIENT_SECRET);
      formData.append("grant_type", "authorization_code");
      formData.append("code", code);
      formData.append("redirect_uri", process.env.DISCORD_REDIRECT_URL);
      formData.append("scope", "identify");

      const response = await fetch("https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=" + code + "&redirect_uri=" + encodeURIComponent(process.env.DISCORD_REDIRECT_URL),
        {
          method: 'POST',
          body: formData
        });
      const json = await response.json();

      await User.findOneAndUpdate({"_id": req.query.state}, {"discord": {"access_token": json.access_token, "refresh_token": json.refresh_token, "token_timestamp": moment().unix(), "token_expires": moment().add(7, 'days').unix()}}).then(() => {

        AF.needed_update(req.query.state).then(async (user_data) => {
          let user = client.users.get(user_data.id);
          user.send(":white_check_mark:  ¡"+ user +", has sincronizado correctamente tu cuenta con el usuario *" + user_data.username + "*! :white_check_mark:\n" +
            "\n" +
            "Recuerda que ahora obtendrás una recompensa IN-Game, en cualquiera de los lobbies puedes dar doble click sobre la sección *Mi Perfil* y luego la sección *Recompensas* para redimirla, recuerda que esto no funciona si ya has añadido anteriormente una cuenta de _Discord_.");
          await AF.database_id(req.query.state).then((res)).catch((err) => { console.log(err); });
          await sync_roles(req.query.state).then().catch((err) => { console.log(err); });
          res.redirect('http://localhost:4200/cuenta?verified=true');
        }).catch((err) => {
          console.log(err);
        });

      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({message: "Ha ocurrido un error al recibir el token de autenticación."});
    }
  },

  website_placeholder: async function(req, res) {
    try {
      let id;
      if(!req.params.id) { id = req.user.sub; } else { id = req.params.id; }
      await User.findOne({"_id": id}).select("discord").exec().then(async (user) => {
        await AF.needed_update(user._id).then((user_data) => {
          return res.status(200).send({
            username: user_data.username,
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
        AF.needed_update(user_found._id).then(async (user_data) => {
          let guild = client.guilds.get(process.env.DISCORD_GUILD);
          let user = guild.member(user_data.id);
          await Promise.map(remove_roles, async (remove) => {
            let role = guild.roles.find("name", remove);
            if (user.roles.has(role)) {
              user.removeRole(role).catch((err) => { console.log(err); });
            }
          });
          user.send(":x:  ¡"+ user +", tu cuenta ya no está sincronizada con el jugador de Minecraft  *" + user_data.username + "*! :x:\n" +
            "\n" +
            "Si deseas volver a sincronizarla, simplemente ingresa a https://www.seocraft.net/cuenta, pero esta vez ya no recibirás recompensa.");
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

