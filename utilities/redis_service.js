"use strict";

let redis_service = require('redis');
let redisClient = redis_service.createClient(6379, '127.0.0.1');

exports.redisClient = redisClient;
