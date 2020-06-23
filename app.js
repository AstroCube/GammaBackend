"use strict";
// Si me pones publico eres gai

require("./controllers/discord").load_bot();
require("./utilities/socket_service").socket_listen();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// -- Default routes -- //

let user_routes = require("./routes/user");
let group_routes = require("./routes/group");
let friend_routes = require("./routes/friend");

// -- Forum routes -- //

let category_routes = require("./routes/forum/category");
let forum_routes = require("./routes/forum/forum");
let topic_routes = require("./routes/forum/topic");

app.use(bodyParser.urlencoded({limit: '300mb', extended: false }));
app.use(bodyParser.json({limit: '300mb'}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

  next();
});


// -- Default routes -- //

app.use('/api', user_routes);
app.use('/api', group_routes);
app.use('/api', friend_routes);

// -- Forum routes -- //

app.use('/api', category_routes);
app.use('/api', forum_routes);
app.use('/api', topic_routes);

module.exports = app;
