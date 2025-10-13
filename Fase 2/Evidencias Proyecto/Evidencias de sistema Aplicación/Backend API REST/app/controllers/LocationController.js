const ParametersError = require('../errors/ParametersError');
const LocationDTO = require('../dtos/LocationDTO');

class LocationController {
  constructor(locationService, locationMapper) {
    this.locationService = locationService;
    this.locationMapper = locationMapper;
  }

  async save(req, res, next) {
    try {
      console.info(`${new Date().toISOString()} [LocationController] [save] [START] Save`);

      const data = req.body;

      const locationDTO = new LocationDTO(data.id, data.name, data.latitude, data.longitude);

      await this.locationService.save(this.locationMapper.toDomain(locationDTO));

      console.info(`${new Date().toISOString()} [LocationController] [save] [END] Save`);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }

  async findAll(req, res, next) {
    try {
      const locations = await this.locationService.findAll();

      const locationsDTO = locations.map(location => this.locationMapper.toDTO(location));

      res.status(200).json(locationsDTO);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LocationController;