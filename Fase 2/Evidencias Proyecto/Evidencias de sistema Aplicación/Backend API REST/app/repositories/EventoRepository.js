const MongoDBClientEvento = require('../clients/MongoDBClientEvento');

class EventoRepository {
  // guardar evento
  async save(evento) {
    console.info(`${new Date().toISOString()} [EventoRepository] [save] [START] Save [${JSON.stringify(evento)}]`);
    const mongoDBClientEvento = new MongoDBClientEvento();
    await mongoDBClientEvento.save(evento);
    console.info(`${new Date().toISOString()} [EventoRepository] [save] [END] Save`);
  }

  // listar todos (uso general)
  async findAll() {
    console.info(`${new Date().toISOString()} [EventoRepository] [findAll] [START] Find All`);
    const mongoDBClientEvento = new MongoDBClientEvento();
    const eventos = await mongoDBClientEvento.findAll();
    console.info(`${new Date().toISOString()} [EventoRepository] [findAll] [END] Find All [${eventos.length}]`);
    return eventos;
  }

  // buscar por id
  async findById(id) {
    console.info(`${new Date().toISOString()} [EventoRepository] [findById] [START] id=${id}`);
    const mongoDBClientEvento = new MongoDBClientEvento();
    const evento = await mongoDBClientEvento.findById(id);
    console.info(`${new Date().toISOString()} [EventoRepository] [findById] [END] ${evento ? 'FOUND' : 'NOT_FOUND'}`);
    return evento || null;
  }

  // lista unificada: eventos creados por el uid o donde participa
  async findByUser(uid, { page = 1, limit = 20, future = null } = {}) {
    console.info(`${new Date().toISOString()} [EventoRepository] [findByUser] [START] uid=${uid} page=${page} limit=${limit} future=${future}`);
    const mongoDBClientEvento = new MongoDBClientEvento();
    const result = await mongoDBClientEvento.findByUser(uid, { page, limit, future });
    console.info(`${new Date().toISOString()} [EventoRepository] [findByUser] [END] total=${result?.total ?? 0}`);
    return result;
  }

  // dos listas: creados y unidos (sin paginar)
  async findBucketsByUser(uid) {
    console.info(`${new Date().toISOString()} [EventoRepository] [findBucketsByUser] [START] uid=${uid}`);
    const mongoDBClientEvento = new MongoDBClientEvento();
    const result = await mongoDBClientEvento.findBucketsByUser(uid);
    const createdLen = result?.created?.length ?? 0;
    const joinedLen = result?.joined?.length ?? 0;
    console.info(`${new Date().toISOString()} [EventoRepository] [findBucketsByUser] [END] created=${createdLen} joined=${joinedLen}`);
    return result;
  }

  // participar en evento 
  async participate(eventId, uid) {
    const MongoDBClientEvento = require('../clients/MongoDBClientEvento');
    const MongoDBClientUser = require('../clients/MongoDBClientUser');

    const eventoClient = new MongoDBClientEvento();
    const userClient = new MongoDBClientUser();

    // 1) leer evento
    const ev = await eventoClient.findById(eventId);
    if (!ev) return { ok: false, code: 'NOT_FOUND', message: 'Evento no encontrado' };

    const participantes = Array.isArray(ev.participantes) ? ev.participantes : [];
    const yaParticipa = participantes.includes(uid);

    // 2) validación SIMPLE: if participantes >= max_participantes -> error
    const max = Number(ev.max_participantes || 0); // si no está definido, se toma 0 (sin límite)
    if (!yaParticipa && max > 0 && participantes.length >= max) {
      return { ok: false, code: 'EVENT_FULL', message: 'El evento alcanzó el máximo de participantes' };
    }

    // 3) agregar (idempotente)
    await eventoClient.addParticipant(eventId, uid);
    await userClient.pushEvent(uid, eventId);

    // 4) mensajes simples
    if (yaParticipa) {
      return { ok: true, code: 'ALREADY_JOINED', message: 'Ya estabas inscrito en el evento' };
    }
    return { ok: true, code: 'JOINED', message: 'Participación registrada' };
  }

}

module.exports = EventoRepository;
