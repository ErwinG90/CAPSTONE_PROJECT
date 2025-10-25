const RutaRepository = require('../repositories/RutaRepository');
const RutaMapper = require('../mappers/RutaMapper');

class RutaService {
    // crear ruta
    async save(rutaDTO) {
        console.info(`${new Date().toISOString()} [RutaService] [save] [START] Save [${JSON.stringify(rutaDTO)}]`);

        const rutaRepository = new RutaRepository();
        const rutaMapper = new RutaMapper();

        const rutaDomain = rutaMapper.toDomain(rutaDTO);
        const rutaGuardada = await rutaRepository.save(rutaDomain); // <-- Recibe la ruta con _id

        console.info(`${new Date().toISOString()} [RutaService] [save] [END] Save`);
        return rutaGuardada;
    }

    // listar todas las rutas
    async findAll() {
        console.info(`${new Date().toISOString()} [RutaService] [findAll] [START] Find All`);

        const rutaRepository = new RutaRepository();
        const rutaMapper = new RutaMapper();

        const rutasData = await rutaRepository.findAll();
        const rutasDomain = rutasData.map(data => rutaMapper.toDomain(data));

        console.info(`${new Date().toISOString()} [RutaService] [findAll] [END] Find All [${rutasDomain.length}]`);
        return rutasDomain;
    }
}

module.exports = RutaService;
