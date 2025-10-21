const Location = require('../domains/Location');
const LocationDTO = require('../dtos/LocationDTO');

class LocationMapper {
  constructor() {
    
  }

  toDomain(dto) {
    // Si no viene retornar nulo por defecto
    if (!dto) return null;

    return new Location(dto.id, dto.name, dto.latitude, dto.longitude);
  }

  toDTO(domain) {
    // Si no viene retornar nulo por defecto
    if (!domain) return null;

    return new LocationDTO(domain.id, domain.name, domain.latitude, domain.longitude);
  }

}

module.exports = LocationMapper;