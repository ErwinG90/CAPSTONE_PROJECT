const ParametersError = require('../errors/ParametersError');
const EventoDTO = require('../dtos/EventoDTO');
const EventoService = require('../services/EventoService');
const EventoMapper = require('../mappers/EventoMapper');

class EventoController {

  // crear evento
  async save(req, res, next) {
    try {
      console.info(`${new Date().toISOString()} [EventoController] [save] [START] Save`);

      const data = req.body;

      const eventoDTO = new EventoDTO(
        undefined,                  // _id autogenerado
        data.nombre_evento,
        data.deporte_id,
        data.lugar,
        data.fecha_evento,
        data.max_participantes,
        data.descripcion,
        data.createdBy,
        data.participantes || [],   // por defecto []
        data.estado,
        data.createdAt
      );

      const eventoService = new EventoService();
      const eventoMapper = new EventoMapper();

      await eventoService.save(eventoMapper.toDomain(eventoDTO));

      console.info(`${new Date().toISOString()} [EventoController] [save] [END] Save`);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }

  // listar todos
  async findAll(req, res, next) {
    try {
      const eventoService = new EventoService();
      const eventos = await eventoService.findAll();
      const eventoMapper = new EventoMapper();

      // dominio -> dto
      const eventosDTO = eventos.map(evento => eventoMapper.toDTO(evento));

      res.status(200).json(eventosDTO);
    } catch (error) {
      next(error);
    }
  }

  // buscar por id
  async findById(req, res, next) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new ParametersError('El parámetro id es requerido.');
      }

      const eventoService = new EventoService();
      const evento = await eventoService.findById(id);

      if (!evento) {
        return res.status(404).json({ message: `Evento con id ${id} no encontrado` });
      }

      const eventoMapper = new EventoMapper();
      const dto = eventoMapper.toDTO(evento);
      return res.status(200).json(dto);
    } catch (error) {
      next(error);
    }
  }

  // === NUEVO ===
  async getMyEvents(req, res, next) {
    try {
      // si luego activas auth, usa solo req.user.uid
      const uid = req.user?.uid || req.query.uid || req.params.uid;
      if (!uid) return res.status(400).json({ message: 'uid requerido' });

      const page = Number(req.query.page || 1);
      const limit = Math.min(Number(req.query.limit || 20), 100);
      const futureParam = req.query.future;
      const future =
        futureParam === undefined ? null :
          futureParam === 'true' ? true :
            futureParam === 'false' ? false : null;

      const eventoService = new EventoService();
      const eventoMapper = new EventoMapper();

      // { total, page, limit, data:[raw + role] }
      const result = await eventoService.getUserEvents(uid, { page, limit, future });

      // mapear cada item a DTO y preservar role
      const data = (result.data || []).map(item => {
        const dto = eventoMapper.toDTO(item); // item trae campos del evento
        return { ...dto, role: item.role };   // agregamos role para el front
      });

      return res.status(200).json({
        total: result.total,
        page: result.page,
        limit: result.limit,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  // === NUEVO === dos listas (creados / unidos) sin paginación
  // GET /eventos/mios/buckets?uid=<uid>
  async getMyEventsBuckets(req, res, next) {
    try {
      const uid = req.user?.uid || req.query.uid || req.params.uid;
      if (!uid) return res.status(400).json({ message: 'uid requerido' });

      const eventoService = new EventoService();
      const eventoMapper = new EventoMapper();

      const buckets = await eventoService.getUserEventsBuckets(uid);

      const created = (buckets.created || []).map(item => {
        const dto = eventoMapper.toDTO(item);
        return { ...dto, role: item.role || 'CREATOR' };
      });

      const joined = (buckets.joined || []).map(item => {
        const dto = eventoMapper.toDTO(item);
        return { ...dto, role: item.role || 'PARTICIPANT' };
      });

      return res.status(200).json({ created, joined });
    } catch (error) {
      next(error);
    }
  }

  //  POST /eventos/:id/participar
  async participate(req, res, next) {
    try {
      const { id } = req.params;
      const uid = req.user?.uid || req.body?.uid || req.query?.uid;
      if (!id) return res.status(400).json({ message: 'id de evento requerido' });
      if (!uid) return res.status(400).json({ message: 'uid requerido' });

      const service = new (require('../services/EventoService'))();
      const { ok, code, message } = await service.participate(id, uid);

      if (!ok) {
        if (code === 'NOT_FOUND') return res.status(404).json({ message });
        if (code === 'EVENT_FULL') return res.status(409).json({ message }); // conflicto: sin cupos
        return res.status(400).json({ message });
      }

      // 200 si se unió o ya estaba
      return res.status(200).json({ message, code });
    } catch (e) { next(e); }
  }

  //  DELETE /eventos/:id/participar
  async cancelParticipation(req, res, next) {
    try {
      const { id } = req.params;
      const uid = req.user?.uid || req.body?.uid || req.query?.uid;
      if (!id) return res.status(400).json({ message: 'id de evento requerido' });
      if (!uid) return res.status(400).json({ message: 'uid requerido' });

      const service = new (require('../services/EventoService'))();
      const { ok, code, message } = await service.cancelParticipation(id, uid);

      if (!ok) {
        if (code === 'NOT_FOUND') return res.status(404).json({ message });
        return res.status(400).json({ message });
      }

      // 200 tanto si canceló como si no estaba inscrito
      return res.status(200).json({ message, code });
    } catch (e) { next(e); }
  }


}

module.exports = EventoController;