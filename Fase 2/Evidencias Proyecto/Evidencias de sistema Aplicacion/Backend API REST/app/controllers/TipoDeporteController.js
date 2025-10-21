const TipoDeporteService = require('../services/TipoDeporteService');
const TipoDeporteMapper = require('../mappers/TipoDeporteMapper');

class TipoDeporteController {

    async findAll(_req, res) { // <-- usa _req para evitar el warning
        console.info(`${new Date().toISOString()} [TipoDeporteController] [findAll] [START] Find All`);

        try {
            const tipoDeporteService = new TipoDeporteService();
            const tipoDeporteMapper = new TipoDeporteMapper();

            const tiposDeporteDomain = await tipoDeporteService.findAll();
            const tiposDeporteDTO = tiposDeporteDomain.map(domain => tipoDeporteMapper.toDTO(domain));

            console.info(`${new Date().toISOString()} [TipoDeporteController] [findAll] [END] Find All`);
            res.status(200).json(tiposDeporteDTO);

        } catch (error) {
            console.error(`${new Date().toISOString()} [TipoDeporteController] [findAll] [ERROR] ${error.message}`);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TipoDeporteController;
