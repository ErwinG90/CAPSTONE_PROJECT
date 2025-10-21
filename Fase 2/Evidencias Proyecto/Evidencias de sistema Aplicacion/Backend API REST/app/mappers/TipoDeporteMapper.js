const TipoDeporte = require('../domains/TipoDeporte');
const TipoDeporteDTO = require('../dtos/TipoDeporteDTO');

class TipoDeporteMapper {

    toDomain(data) {
        if (!data) return null;
        return new TipoDeporte(data._id, data.nombre, data.descripcion);
    }

    toDTO(domain) {
        if (!domain) return null;
        return new TipoDeporteDTO(domain._id, domain.nombre, domain.descripcion);
    }

}

module.exports = TipoDeporteMapper;