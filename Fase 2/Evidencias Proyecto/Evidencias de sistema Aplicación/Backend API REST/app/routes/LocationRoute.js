const express = require('express');
const router = express.Router();

const LocationRepository = require('../repositories/LocationRepository');
const LocationService = require('../services/LocationService');
const LocationController = require('../controllers/LocationController');
const LocationMapper = require('../mappers/LocationMapper');
const Cache = require('../cache/Cache');
const MongoDBClient = require('../clients/MongoDBClient');

const cache = new Cache();
const locationMapper = new LocationMapper();
const mongoDBClient = new MongoDBClient();
const locationRepository = new LocationRepository(mongoDBClient);
const locationService = new LocationService(locationRepository, locationMapper, cache);
const locationController = new LocationController(locationService, locationMapper);

router.post('/', (req, res, next) => locationController.save(req, res, next));

router.get('/', (req, res, next) => locationController.findAll(req, res, next));

module.exports = router;