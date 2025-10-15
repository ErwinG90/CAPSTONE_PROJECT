const ParametersError = require('../errors/ParametersError');
const EventoDTO = require('../dtos/EventoDTO');
const EventoService = require('../services/EventoService')
const EventoMapper = require('../mappers/EventoMapper')

class EventoController {


    async save(req, res, next) {
        try {
            console.info(`${new Date().toISOString()} [EventoController] [save] [START] Save`);

            const data = req.body;

            const eventoDTO = new EventoDTO(
                undefined, // _id (se genera automáticamente)
                data.nombre_evento,
                data.deporte_id,
                data.lugar,
                data.fecha_evento,
                data.max_participantes,
                data.descripcion,
                data.createdBy,
                data.participantes || [], // array vacío por defecto
                data.estado,
                data.createdAt
            );
            const eventoService = new EventoService();
            const eventoMapper = new EventoMapper();

            await eventoService.save(eventoMapper.toDomain(eventoDTO));

            console.info(`${new Date().toISOString()} [EventoController] [save] [END] Save`);
            res.status(201).send();
        } catch (error) {
            next(error);
        }
    }

    async findAll(req, res, next) {
        try {
            const eventoService = new EventoService();
            const eventos = await eventoService.findAll();
            const eventoMapper = new EventoMapper();

            // esta linea transforma la lista de eventos de dominio a una lista de eventos dto
            const eventosDTO = eventos.map(evento => eventoMapper.toDTO(evento));

            res.status(200).json(eventosDTO);
        } catch (error) {
            next(error);
        }
    }

    async findById(req, res, next) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== 'string' || id.trim() === '') {
                throw new ParametersError('El parámetro id es requerido.');
            }

            const eventoService = new EventoService();
            const evento = await eventoService.findById(id);

            if (!evento) {
                return res.status(404).json({ message: `Evento con id ${id} no encontrado` });
            }

            const eventoMapper = new EventoMapper();
            const dto = eventoMapper.toDTO(evento);
            return res.status(200).json(dto);
        } catch (error) {
            next(error);
        }
    }
}
module.exports = EventoController;