class Ruta {
    constructor(
        _id,
        id_creador,
        nombre_ruta,
        recorrido, // GeoJSON LineString
        descripcion,
        nivel_dificultad,
        distancia_km,
        fecha_creacion,
        promedio_valoracion,
        valoraciones,
        tipo_deporte
    ) {
        this._id = _id;
        this.id_creador = id_creador;
        this.nombre_ruta = nombre_ruta;
        this.recorrido = recorrido;
        this.descripcion = descripcion;
        this.nivel_dificultad = nivel_dificultad;
        this.distancia_km = distancia_km;
        this.fecha_creacion = fecha_creacion || new Date();
        this.promedio_valoracion = promedio_valoracion || 0;
        this.valoraciones = valoraciones || [];
        this.tipo_deporte = tipo_deporte;
    }
}

module.exports = Ruta;