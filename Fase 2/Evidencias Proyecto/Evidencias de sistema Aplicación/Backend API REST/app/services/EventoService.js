const EventoRepository = require('../repositories/EventoRepository');
const EventoMapper = require('../mappers/EventoMapper');

class EventoService {
  // crear evento
  async save(eventoDTO) {
    console.info(`${new Date().toISOString()} [EventoService] [save] [START] Save [${JSON.stringify(eventoDTO)}]`);

    const eventoRepository = new EventoRepository();
    const eventoMapper = new EventoMapper();

    const eventoDomain = eventoMapper.toDomain(eventoDTO);
    await eventoRepository.save(eventoDomain);

    console.info(`${new Date().toISOString()} [EventoService] [save] [END] Save`);
  }

  // listar todos (uso general)
  async findAll() {
    console.info(`${new Date().toISOString()} [EventoService] [findAll] [START] Find All`);

    const eventoRepository = new EventoRepository();
    const eventoMapper = new EventoMapper();

    const eventosData = await eventoRepository.findAll();
    const eventosDomain = eventosData.map(data => eventoMapper.toDomain(data));

    console.info(`${new Date().toISOString()} [EventoService] [findAll] [END] Find All [${eventosDomain.length}]`);
    return eventosDomain;
  }

  // buscar por id
  async findById(id) {
    console.info(`${new Date().toISOString()} [EventoService] [findById] [START] id=${id}`);

    const eventoRepository = new EventoRepository();
    const eventoMapper = new EventoMapper();

    const eventoData = await eventoRepository.findById(id);
    const eventoDomain = eventoData ? eventoMapper.toDomain(eventoData) : null;

    console.info(`${new Date().toISOString()} [EventoService] [findById] [END] ${eventoDomain ? 'FOUND' : 'NOT_FOUND'}`);
    return eventoDomain;
  }

  // === NUEVO === lista unificada (creador + participante) con paginación/filtro
  async getUserEvents(uid, { page = 1, limit = 20, future = null } = {}) {
    console.info(`${new Date().toISOString()} [EventoService] [getUserEvents] [START] uid=${uid} page=${page} limit=${limit} future=${future}`);

    const eventoRepository = new EventoRepository();
    const eventoMapper = new EventoMapper();

    // repo trae { total, page, limit, data: [ ...raw + role ] }
    const result = await eventoRepository.findByUser(uid, { page, limit, future });

    // mapear cada item y preservar role
    const dataMapped = (result.data || []).map(raw => {
      const mapped = eventoMapper.toDomain(raw);
      return { ...mapped, role: raw.role }; // role visible para el front
    });

    const response = {
      total: result.total || 0,
      page: result.page || page,
      limit: result.limit || limit,
      data: dataMapped
    };

    console.info(`${new Date().toISOString()} [EventoService] [getUserEvents] [END] total=${response.total}`);
    return response;
  }

  // === NUEVO === dos listas: creados y unidos (sin paginar)
  async getUserEventsBuckets(uid) {
    console.info(`${new Date().toISOString()} [EventoService] [getUserEventsBuckets] [START] uid=${uid}`);

    const eventoRepository = new EventoRepository();
    const eventoMapper = new EventoMapper();

    const buckets = await eventoRepository.findBucketsByUser(uid);

    const created = (buckets.created || []).map(raw => {
      const mapped = eventoMapper.toDomain(raw);
      return { ...mapped, role: raw.role || 'CREATOR' };
    });

    const joined = (buckets.joined || []).map(raw => {
      const mapped = eventoMapper.toDomain(raw);
      return { ...mapped, role: raw.role || 'PARTICIPANT' };
    });

    const response = { created, joined };

    console.info(`${new Date().toISOString()} [EventoService] [getUserEventsBuckets] [END] created=${created.length} joined=${joined.length}`);
    return response;
  }
}

module.exports = EventoService;
