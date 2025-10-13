const MongoDBClientTipoDeporte = require('../clients/MongoDBClientTipoDeporte')

class TipoDeporteRepository {

    async findAll() {
        console.info(`${new Date().toISOString()} [TipoDeporteRepository] [findAll] [START] Find All`);
        const mongoDBClientTipoDeporte = new MongoDBClientTipoDeporte();
        const tiposDeporte = await mongoDBClientTipoDeporte.findAll();
        console.info(`${new Date().toISOString()} [TipoDeporteRepository] [findAll] [END] Find All [${tiposDeporte.length}]`);
        return tiposDeporte;
    }
}

module.exports = TipoDeporteRepository;