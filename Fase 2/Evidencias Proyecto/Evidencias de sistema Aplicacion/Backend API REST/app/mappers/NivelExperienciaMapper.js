const NivelExperiencia = require('../domains/NivelExperiencia');
const NivelExperienciaDTO = require('../dtos/NivelExperienciaDTO');

class NivelExperienciaMapper {

    toDomain(data) {
        if (!data) return null;
        return new NivelExperiencia(data._id, data.nombre, data.descripcion);
    }

    toDTO(domain) {
        if (!domain) return null;
        return new NivelExperienciaDTO(domain._id, domain.nombre, domain.descripcion);
    }

}

module.exports = NivelExperienciaMapper;