class RutaDTO {
    constructor({
        _id,
        id_creador,
        nombre_ruta,
        recorrido,
        descripcion,
        nivel_dificultad,
        distancia_km,
        tipo_deporte,
        valoraciones,
        promedio_valoracion,
        fecha_creacion
    }) {
        this._id = _id;
        this.id_creador = id_creador;
        this.nombre_ruta = nombre_ruta;
        this.recorrido = recorrido;
        this.descripcion = descripcion;
        this.nivel_dificultad = nivel_dificultad;
        this.distancia_km = distancia_km;
        this.tipo_deporte = tipo_deporte;
        this.valoraciones = valoraciones || [];
        this.promedio_valoracion = promedio_valoracion || 0;
        this.fecha_creacion = fecha_creacion || new Date();
    }
}

module.exports = RutaDTO;