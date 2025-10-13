const EventoRepository = require('../repositories/EventoRepository');
const EventoMapper = require('../mappers/EventoMapper');

class EventoService {

    async save(eventoDTO) {
        console.info(`${new Date().toISOString()} [EventoService] [save] [START] Save [${JSON.stringify(eventoDTO)}]`);

        const eventoRepository = new EventoRepository();
        const eventoMapper = new EventoMapper();

        const eventoDomain = eventoMapper.toDomain(eventoDTO);

        await eventoRepository.save(eventoDomain);

        console.info(`${new Date().toISOString()} [EventoService] [save] [END] Save`);
    }

    async findAll() {
        console.info(`${new Date().toISOString()} [EventoService] [findAll] [START] Find All`);

        const eventoRepository = new EventoRepository();
        const eventoMapper = new EventoMapper();

        const eventosData = await eventoRepository.findAll();
        const eventosDomain = eventosData.map(data => eventoMapper.toDomain(data)); // <-- AGREGAR ESTO

        console.info(`${new Date().toISOString()} [EventoService] [findAll] [END] Find All [${eventosDomain.length}]`);
        return eventosDomain; // <-- devolver dominio, no datos raw
    }

    async findById(id) {
        console.info(`${new Date().toISOString()} [EventoService] [findById] [START] id=${id}`);
        const eventoRepository = new EventoRepository();
        const eventoMapper = new EventoMapper();

        const eventoData = await eventoRepository.findById(id);
        const eventoDomain = eventoData ? eventoMapper.toDomain(eventoData) : null; // <-- usar mapper

        console.info(`${new Date().toISOString()} [EventoService] [findById] [END] ${eventoDomain ? 'FOUND' : 'NOT_FOUND'}`);
        return eventoDomain;
    }

}

module.exports = EventoService;