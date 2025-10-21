const NivelExperienciaService = require('../services/NivelExperienciaService');
const NivelExperienciaMapper = require('../mappers/NivelExperienciaMapper');

class NivelExperienciaController {

    async findAll(_req, res) {
        console.info(`${new Date().toISOString()} [NivelExperienciaController] [findAll] [START] Find All`);

        try {
            const nivelExperienciaService = new NivelExperienciaService();
            const nivelExperienciaMapper = new NivelExperienciaMapper();

            const nivelesExperienciaDomain = await nivelExperienciaService.findAll();
            const nivelesExperienciaDTO = nivelesExperienciaDomain.map(domain => nivelExperienciaMapper.toDTO(domain));

            console.info(`${new Date().toISOString()} [NivelExperienciaController] [findAll] [END] Find All`);
            res.status(200).json(nivelesExperienciaDTO);

        } catch (error) {
            console.error(`${new Date().toISOString()} [NivelExperienciaController] [findAll] [ERROR] ${error.message}`);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = NivelExperienciaController;