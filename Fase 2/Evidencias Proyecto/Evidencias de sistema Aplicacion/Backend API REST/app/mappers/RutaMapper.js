const Ruta = require('../domains/Ruta');
const RutaDTO = require('../dtos/RutaDTO');

class RutaMapper {
    toDomain(dto) {
        // Si no viene retornar nulo por defecto
        if (!dto) return null;

        return new Ruta(
            dto._id || undefined,
            dto.id_creador,
            dto.nombre_ruta,
            dto.recorrido,
            dto.descripcion,
            dto.nivel_dificultad,
            dto.distancia_km,
            dto.fecha_creacion || new Date(),
            dto.promedio_valoracion,
            dto.valoraciones,
            dto.tipo_deporte
        );
    }

    toDTO(domain) {
        // Si no viene retornar nulo por defecto
        if (!domain) return null;

        return new RutaDTO({
            _id: domain._id,
            id_creador: domain.id_creador,
            nombre_ruta: domain.nombre_ruta,
            recorrido: domain.recorrido,
            descripcion: domain.descripcion,
            nivel_dificultad: domain.nivel_dificultad,
            distancia_km: domain.distancia_km,
            fecha_creacion: domain.fecha_creacion,
            promedio_valoracion: domain.promedio_valoracion,
            valoraciones: domain.valoraciones,
            tipo_deporte: domain.tipo_deporte
        });
    }
}

module.exports = RutaMapper;

