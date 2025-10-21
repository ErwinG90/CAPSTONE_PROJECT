const constants = require('../constants/constants');
const config = require('../configs/config');

class LocationService {
  constructor(locationRepository, locationMapper, cache) {
    this.locationRepository = locationRepository;
    this.locationMapper = locationMapper;
    this.cache = cache;
  }

  async save(locationDTO) {
    console.info(`${new Date().toISOString()} [LocationService] [save] [START] Save [${JSON.stringify(locationDTO)}]`);
    // Implementation to save locationDTO

    await this.locationRepository.save(locationDTO);

    console.info(`${new Date().toISOString()} [LocationService] [save] [END] Save`);
  }

  async findAll() {
    console.info(`${new Date().toISOString()} [LocationService] [findAll] [START] Find All`);
    const locations = await this.locationRepository.findAll();
    console.info(`${new Date().toISOString()} [LocationService] [findAll] [END] Find All [${locations.length}]`);
    return locations;
  }
}

module.exports = LocationService;