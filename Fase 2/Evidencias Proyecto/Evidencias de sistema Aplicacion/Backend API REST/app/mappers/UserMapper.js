const User = require('../domains/User');
const UserDTO = require('../dtos/UserDTO');

class UserMapper {

    toDomain(dto) {
        if (!dto) return null;

        return new User(
            dto.uid,
            dto.nombre,
            dto.apellido,
            dto.email,
            dto.fechaNacimiento,
            dto.genero,
            dto.deporteFavorito,
            dto.nivelExperiencia,
            dto.fechaRegistro || new Date(),
            dto.rutas || [],
            dto.eventos || [],
            dto.avatar || ""
        );
    }

    toDTO(domain) {
        if (!domain) return null;

        // Ajuste horario Chile (GMT-3) si procede
        let fechaRegistroChile = null;
        if (domain.fechaRegistro) {
            const fecha = new Date(domain.fechaRegistro);
            fecha.setHours(fecha.getHours() - 3);
            fechaRegistroChile = fecha.toISOString();
        }

        return new UserDTO(
            domain._id,
            domain.nombre,
            domain.apellido,
            domain.email,
            domain.fechaNacimiento,
            domain.genero,
            domain.deporteFavorito,
            domain.nivelExperiencia,
            fechaRegistroChile,
            domain.rutas || [],
            domain.eventos || [],
            domain.avatar || ""
        );
    }
}

module.exports = UserMapper;
