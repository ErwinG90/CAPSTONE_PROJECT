const NivelExperienciaRepository = require('../repositories/NivelExperienciaRepository');
const NivelExperienciaMapper = require('../mappers/NivelExperienciaMapper');

class NivelExperienciaService {

    async findAll() {
        console.info(`${new Date().toISOString()} [NivelExperienciaService] [findAll] [START] Find All`);

        const nivelExperienciaRepository = new NivelExperienciaRepository();
        const nivelExperienciaMapper = new NivelExperienciaMapper();

        const nivelesExperienciaData = await nivelExperienciaRepository.findAll();
        const nivelesExperienciaDomain = nivelesExperienciaData.map(data => nivelExperienciaMapper.toDomain(data));

        console.info(`${new Date().toISOString()} [NivelExperienciaService] [findAll] [END] Find All [${nivelesExperienciaDomain.length}]`);
        return nivelesExperienciaDomain;
    }
}

module.exports = NivelExperienciaService;