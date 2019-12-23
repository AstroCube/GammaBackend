"use strict";

let redis_service = require('redis');
let redisClient = redis_service.createClient({
    port: 6379,
    host: '127.0.0.1',
    auth_pass: "&g4MErwHo#Yx6A(RLw*Ci3K&[hyn%9A@"
});

exports.redisClient = redisClient;
