const MongoDBClientRuta = require('../clients/MongoDBClientRuta');

class RutaRepository {
    async save(ruta) {
        console.info(`${new Date().toISOString()} [RutaRepository] [save] [START] Save [${JSON.stringify(ruta)}]`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        const rutaGuardada = await mongoDBClientRuta.save(ruta);
        console.info(`${new Date().toISOString()} [RutaRepository] [save] [END] Save`);
        return rutaGuardada;
    }

    async findAll() {
        console.info(`${new Date().toISOString()} [RutaRepository] [findAll] [START] Find All`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        const rutas = await mongoDBClientRuta.findAll();
        console.info(`${new Date().toISOString()} [RutaRepository] [findAll] [END] Find All [${Array.isArray(rutas) ? rutas.length : 0}]`);
        return rutas;
    }

    async findByCreator({ uid, page = 1, limit = 20, q } = {}) {
        console.info(`${new Date().toISOString()} [RutaRepository] [findByCreator] [START] uid=${uid} page=${page} limit=${limit} q=${q ?? ''}`);
        if (!uid) {
            console.error(`${new Date().toISOString()} [RutaRepository] [findByCreator] Falta uid`);
            throw new Error("uid es requerido para listar las rutas del usuario.");
        }

        const mongoDBClientRuta = new MongoDBClientRuta();
        const result = await mongoDBClientRuta.findByCreator({ uid, page, limit, q });

        const total = Array.isArray(result) ? result.length : (result?.total ?? 0);
        console.info(`${new Date().toISOString()} [RutaRepository] [findByCreator] [END] uid=${uid} total=${total}`);

        return result;
    }

    async calificarRuta({ rutaId, id_usuario, puntuacion, comentario }) {
        console.info(`${new Date().toISOString()} [RutaRepository] [calificarRuta] rutaId=${rutaId} user=${id_usuario} punt=${puntuacion}`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        const updated = await mongoDBClientRuta.addValoracion({ rutaId, id_usuario, puntuacion, comentario });
        return updated;
    }

    async listValoraciones({ rutaId, page = 1, limit = 20 }) {
        console.info(`${new Date().toISOString()} [RutaRepository] [listValoraciones] rutaId=${rutaId} page=${page} limit=${limit}`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        return await mongoDBClientRuta.listValoraciones({ rutaId, page, limit });
    }

    async deleteById({ rutaId, uid }) {
        console.info(`${new Date().toISOString()} [RutaRepository] [deleteById] rutaId=${rutaId} uid=${uid}`);
        const mongo = new MongoDBClientRuta();
        return await mongo.deleteById({ rutaId, uid });
    }

    async findPopular({ page = 1, limit = 20, minRatings = 1, top } = {}) {
        const mongo = new MongoDBClientRuta();
        return await mongo.findPopular({ page, limit, minRatings, top });
    }

    async updatePublico({ rutaId, publico }) {
        console.info(`${new Date().toISOString()} [RutaRepository] [updatePublico] rutaId=${rutaId} publico=${publico}`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        return await mongoDBClientRuta.updatePublico({ rutaId, publico });
    }
//filtraar 
    async findWithFilters({
  page = 1,
  limit = 20,
  tipo_deporte,
  nivel_dificultad,
  minDist,
  maxDist,
} = {}) {
  const MongoDBClientRuta = require('../clients/MongoDBClientRuta');
  const mongo = new MongoDBClientRuta();
  if (!mongo.collection) await mongo.connect();

  const p = Math.max(1, Number(page));
  const l = Math.max(1, Number(limit));
  const skip = (p - 1) * l;

  // Filtro base
  const filter = {};

  if (tipo_deporte && String(tipo_deporte).trim()) {
    filter.tipo_deporte = String(tipo_deporte).trim();
  }

  if (nivel_dificultad && String(nivel_dificultad).trim()) {
    filter.nivel_dificultad = String(nivel_dificultad).trim();
  }

  if (minDist != null || maxDist != null) {
    filter.distancia_km = {};
    if (minDist != null) filter.distancia_km.$gte = Number(minDist);
    if (maxDist != null) filter.distancia_km.$lte = Number(maxDist);
  }

  // Orden: MÁS RECIENTE PRIMERO
  const sortStage = { fecha_creacion: -1, _id: -1 };

  const cursor = mongo.collection
    .find(filter)
    .sort(sortStage)
    .skip(skip)
    .limit(l);

  const [items, total] = await Promise.all([
    cursor.toArray(),
    mongo.collection.countDocuments(filter),
  ]);

  return { items, total, page: p, limit: l };
}
}

module.exports = RutaRepository;
