"use strict";


require("./utilities/discord_service").load_bot();
require("./utilities/socket_service").socket_listen();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// -- Default routes -- //

let user_routes = require("./routes/user");
let group_routes = require("./routes/group");
let punishment_routes = require("./routes/punishment");
let alert_routes = require("./routes/alert");
let appeal_routes = require("./routes/appeal");
let report_routes = require("./routes/report");
let friend_routes = require("./routes/friend");

// -- Forum routes -- //

let category_routes = require("./routes/forum/category");
let forum_routes = require("./routes/forum/forum");
let topic_routes = require("./routes/forum/topic");

// -- Minecraft routes -- //

let server_routes = require("./routes/minecraft/server");
let gamemode_routes = require("./routes/minecraft/gamemode");
let stats_routes = require("./routes/minecraft/stats");
let map_routes = require("./routes/minecraft/map");
let match_routes = require("./routes/minecraft/match");
let party_routes = require("./routes/minecraft/party");
let minecraft_user_routes = require("./routes/minecraft/user");
let workspace_routes = require("./routes/minecraft/workspace");

app.use(bodyParser.urlencoded({limit: '100mb', extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

  next();
});


// -- Default routes -- //

app.use('/api', alert_routes);
app.use('/api', user_routes);
app.use('/api', group_routes);
app.use('/api', punishment_routes);
app.use('/api', report_routes);
app.use('/api', friend_routes);

// -- Forum routes -- //

app.use('/api', category_routes);
app.use('/api', forum_routes);
app.use('/api', topic_routes);

// -- Minecraft routes -- //

app.use('/api', appeal_routes);
app.use('/api', server_routes);
app.use('/api', gamemode_routes);
app.use('/api', stats_routes);
app.use('/api', map_routes);
app.use('/api', match_routes);
app.use('/api', party_routes);
app.use('/api', minecraft_user_routes);
app.use('/api', workspace_routes);

module.exports = app;
