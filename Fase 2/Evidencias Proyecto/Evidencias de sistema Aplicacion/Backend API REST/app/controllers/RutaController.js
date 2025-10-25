const ParametersError = require('../errors/ParametersError');
const RutaDTO = require('../dtos/RutaDTO');
const RutaService = require('../services/RutaService');
const RutaMapper = require('../mappers/RutaMapper');
const { ObjectId } = require('mongodb');

class RutaController {
    // crear ruta
    async save(req, res, next) {
        try {
            console.info(`${new Date().toISOString()} [RutaController] [save] [START] Save`);

            const data = req.body;
            const rutaDTO = new RutaDTO({
                _id: undefined, // autogenerado
                id_creador: new ObjectId(data.id_creador), // <-- conversión para pasar de string a objectid para que lo aguante mongo segun el schema definido
                nombre_ruta: data.nombre_ruta,
                recorrido: data.recorrido,
                descripcion: data.descripcion,
                nivel_dificultad: data.nivel_dificultad,
                distancia_km: data.distancia_km,
                tipo_deporte: data.tipo_deporte,
                valoraciones: data.valoraciones || [],
                promedio_valoracion: data.promedio_valoracion || 0,
                fecha_creacion: data.fecha_creacion
            });

            const rutaService = new RutaService();
            const rutaMapper = new RutaMapper();

            const savedRuta = await rutaService.save(rutaMapper.toDomain(rutaDTO));

            console.info(`${new Date().toISOString()} [RutaController] [save] [END] Save`);
            res.status(201).json(rutaMapper.toDTO(savedRuta));
        } catch (error) {
            next(error);
        }
    }

    // listar todas las rutas
    async findAll(req, res, next) {
        try {
            const rutaService = new RutaService();
            const rutas = await rutaService.findAll();
            const rutaMapper = new RutaMapper();

            // dominio -> dto
            const rutasDTO = rutas.map(ruta => rutaMapper.toDTO(ruta));

            res.status(200).json(rutasDTO);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = RutaController;
