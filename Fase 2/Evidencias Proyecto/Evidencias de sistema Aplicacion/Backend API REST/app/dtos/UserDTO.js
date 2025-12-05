class UserDTO {
    constructor(
        uid,
        nombre,
        apellido,
        email,
        fechaNacimiento,
        genero,
        deporteFavorito,
        nivelExperiencia,
        fechaRegistro,
        rutas = [],
        eventos = [],
        avatar = "",
        expoPushToken = "",
        notifications = null
    ) {
        this.uid = uid;
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.fechaNacimiento = fechaNacimiento;
        this.genero = genero;
        this.deporteFavorito = deporteFavorito;
        this.nivelExperiencia = nivelExperiencia;
        this.fechaRegistro = fechaRegistro;

        // NEW
        this.rutas = Array.isArray(rutas) ? rutas : [];
        this.eventos = Array.isArray(eventos) ? eventos : [];
        this.avatar = typeof avatar === 'string' ? avatar : "";
        
        // NOTIFICATION FIELDS
        this.expoPushToken = typeof expoPushToken === 'string' ? expoPushToken : "";
        this.notifications = notifications || {
            enabled: true,
            onEventJoin: true,
            onEventCancelled: true
        };
    }
}

module.exports = UserDTO;
