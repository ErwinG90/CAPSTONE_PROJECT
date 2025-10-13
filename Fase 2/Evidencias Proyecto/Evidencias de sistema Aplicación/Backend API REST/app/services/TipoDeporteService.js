const TipoDeporteRepository = require('../repositories/TipoDeporteRepository');
const TipoDeporteMapper = require('../mappers/TipoDeporteMapper');

class TipoDeporteService {

    async findAll() {
        console.info(`${new Date().toISOString()} [TipoDeporteService] [findAll] [START] Find All`);

        const tipoDeporteRepository = new TipoDeporteRepository();
        const tipoDeporteMapper = new TipoDeporteMapper();

        const tiposDeporteData = await tipoDeporteRepository.findAll();
        const tiposDeporteDomain = tiposDeporteData.map(data => tipoDeporteMapper.toDomain(data));

        console.info(`${new Date().toISOString()} [TipoDeporteService] [findAll] [END] Find All [${tiposDeporteDomain.length}]`);
        return tiposDeporteDomain;
    }
}

module.exports = TipoDeporteService;