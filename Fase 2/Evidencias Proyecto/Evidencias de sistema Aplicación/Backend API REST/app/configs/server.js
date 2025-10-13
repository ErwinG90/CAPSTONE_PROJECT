const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config');
const server = express();

server.use(cors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders
})); // enable cors
server.use(bodyParser.json()) // for parsing application/json
server.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

module.exports = server;