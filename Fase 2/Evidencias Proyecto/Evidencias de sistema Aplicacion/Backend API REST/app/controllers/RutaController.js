// app/controllers/RutaController.js
const ParametersError = require('../errors/ParametersError');
const RutaDTO = require('../dtos/RutaDTO');
const RutaService = require('../services/RutaService');
const RutaMapper = require('../mappers/RutaMapper');

class RutaController {
  // crear ruta
  async save(req, res, next) {
    try {
      console.info(`${new Date().toISOString()} [RutaController] [save] [START] Save`);

      const data = req.body;
      const rutaDTO = new RutaDTO({
        _id: undefined, // autogenerado
        id_creador: data.id_creador, // UID Firebase
        nombre_ruta: data.nombre_ruta,
        recorrido: data.recorrido,
        descripcion: data.descripcion,
        nivel_dificultad: data.nivel_dificultad,
        distancia_km: data.distancia_km,
        tipo_deporte: data.tipo_deporte,
        valoraciones: data.valoraciones || [],
        promedio_valoracion: data.promedio_valoracion || 0,
        fecha_creacion: data.fecha_creacion,
        publico: Object.prototype.hasOwnProperty.call(data, 'publico') ? Boolean(data.publico) : undefined
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

  // listar todas las rutas (o con filtros si vienen query params)
async findAll(req, res, next) {
  try {
    const {
      tipo_deporte,
      nivel_dificultad,
      minDist,
      maxDist,
      page,
      limit,
    } = req.query;

    const hasFilters =
      (tipo_deporte && String(tipo_deporte).trim()) ||
      (nivel_dificultad && String(nivel_dificultad).trim()) ||
      (minDist != null && String(minDist).trim() !== "") ||
      (maxDist != null && String(maxDist).trim() !== "");

    const rutaService = new RutaService();
    const rutaMapper = new RutaMapper();

    if (!hasFilters) {
      // → SIN filtros: devolver TODAS, ordenadas por fecha desc
      const rutas = await rutaService.findAll();
      const rutasDTO = rutas
        .sort((a, b) => new Date(b.fecha_creacion ?? 0) - new Date(a.fecha_creacion ?? 0))
        .map((r) => rutaMapper.toDTO(r));
      return res.status(200).json(rutasDTO);
    }

    // → CON filtros: delegar a la versión con filtros/paginación
    const result = await rutaService.findAllWithFilters({
      page,
      limit,
      tipo_deporte,
      nivel_dificultad,
      minDist,
      maxDist,
    });

    // Normalizamos a { data, total, page, limit, totalPages }
    const dataDTO = (result.data || []).map(d => rutaMapper.toDTO(d));
    return res.status(200).json({
      data: dataDTO,
      total: result.total ?? dataDTO.length,
      page: result.page ?? 1,
      limit: result.limit ?? (dataDTO.length || 20),
      totalPages: result.totalPages ?? 1,
    });
  } catch (error) {
    next(error);
  }
}


  // listar SOLO las rutas del usuario (mías)
  // GET /rutas/mias?uid=...&page=1&limit=20&q=senderismo
  async findMine(req, res, next) {
    try {
      const uid = req.query.uid || req.headers['x-uid'] || req.user?.uid || null;
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const q = req.query.q;

      if (!uid) throw new ParametersError('Se requiere uid');

      const rutaService = new RutaService();
      const rutaMapper = new RutaMapper();

      const result = await rutaService.findMine({ uid, page, limit, q });
      const dataDTO = (result.data || []).map((d) => rutaMapper.toDTO(d));

      return res.status(200).json({ ...result, data: dataDTO });
    } catch (error) {
      next(error);
    }
  }

  // POST /rutas/:id/valoraciones
  async rate(req, res, next) {
    try {
      const rutaId = req.params.id;
      const { id_usuario, puntuacion, comentario } = req.body;

      const rutaService = new RutaService();
      const rutaMapper = new RutaMapper();

      const updated = await rutaService.calificarRuta({ rutaId, id_usuario, puntuacion, comentario });
      return res.status(200).json(rutaMapper.toDTO(updated));
    } catch (error) {
      next(error);
    }
  }

  // GET /rutas/:id/valoraciones
  async ratings(req, res, next) {
    try {
      const rutaId = req.params.id;
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);

      const rutaService = new RutaService();
      const result = await rutaService.obtenerValoraciones({ rutaId, page, limit });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  async destroy(req, res, next) {
    try {
      const rutaId = req.params.id;
      const uid = req.query.uid || req.headers['x-uid'] || req.user?.uid || null;

      const svc = new RutaService();
      await svc.delete({ rutaId, uid });

      return res.status(204).send(); // sin contenido
    } catch (error) {
      next(error);
    }
  }

  async popular(req, res, next) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const minRatings = Number(req.query.minRatings ?? 1);
      console.info(`[RutaController] /populares page=${page} limit=${limit} minRatings=${minRatings}`);

      const svc = new RutaService();
      const result = await svc.findPopular({ page, limit, minRatings });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }


  // PUT /rutas/:id/publico   { publico: true|false }
  async setPublico(req, res, next) {
    try {
      const rutaId = req.params.id;
      const { publico } = req.body;

      if (typeof publico !== 'boolean') {
        throw new ParametersError('publico debe ser boolean');
      }

      const rutaService = new RutaService();
      const rutaMapper = new RutaMapper();

      const updated = await rutaService.cambiarVisibilidad({ rutaId, publico });
      return res.status(200).json(rutaMapper.toDTO(updated));
    } catch (error) {
      next(error);
    }
  }



}

module.exports = RutaController;
