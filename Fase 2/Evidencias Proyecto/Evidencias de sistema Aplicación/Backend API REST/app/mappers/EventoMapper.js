const Evento = require('../domains/Evento');
const EventoDTO = require('../dtos/EventoDTO');

class EventoMapper {

    toDomain(dto) {
        // Si no viene retornar nulo por defecto
        if (!dto) return null;

        return new Evento(
            undefined,
            dto.nombre_evento,
            dto.deporte_id,
            dto.lugar,
            dto.fecha_evento,
            dto.max_participantes,
            dto.descripcion,
            dto.createdBy,
            dto.participantes,
            dto.estado,
            dto.createdAt || new Date());
    }

    toDTO(domain) {
        // Si no viene retornar nulo por defecto
        if (!domain) return null;

        return new EventoDTO(
            domain._id,
            domain.nombre_evento,
            domain.deporte_id,
            domain.lugar,
            domain.fecha_evento,
            domain.max_participantes,
            domain.descripcion,
            domain.createdBy,
            domain.participantes,
            domain.estado,
            domain.createdAt
        );
    }
}
module.exports = EventoMapper;
