class EventoDTO {
    constructor(_id, nombre_evento, deporte_id, lugar, fecha_evento, max_participantes, descripcion, createdBy, participantes, estado, createdAt) {
        this._id = _id;
        this.nombre_evento = nombre_evento;
        this.deporte_id = deporte_id;
        this.lugar = lugar;
        this.fecha_evento = fecha_evento;
        this.max_participantes = max_participantes;
        this.descripcion = descripcion;
        this.createdBy = createdBy;
        this.participantes = participantes;
        this.estado = estado;
        this.createdAt = createdAt || new Date();
    }
}

module.exports = EventoDTO;