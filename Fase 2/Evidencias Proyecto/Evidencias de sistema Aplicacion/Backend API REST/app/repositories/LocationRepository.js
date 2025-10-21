class LocationRepository {
    constructor(mongoDBClient) {
        this.mongoDBClient = mongoDBClient;
    }

    async save(location) {
        console.info(`${new Date().toISOString()} [LocationRepository] [save] [START] Save [${JSON.stringify(location)}]`);
        await this.mongoDBClient.save(location);
        console.info(`${new Date().toISOString()} [LocationRepository] [save] [END] Save`);
    }

    async findAll() {
        console.info(`${new Date().toISOString()} [LocationRepository] [findAll] [START] Find All`);
        const locations = await this.mongoDBClient.findAll();
        console.info(`${new Date().toISOString()} [LocationRepository] [findAll] [END] Find All [${locations.length}]`);
        return locations;
    }
}

module.exports = LocationRepository;