const RutaRepository = require('../repositories/RutaRepository');
const RutaMapper = require('../mappers/RutaMapper');
const UserRepository = require('../repositories/UserRepository');

class RutaService {
    async save(rutaDTO) {
        console.info(`${new Date().toISOString()} [RutaService] [save] [START] Save [${JSON.stringify(rutaDTO)}]`);

        const rutaRepository = new RutaRepository();
        const rutaMapper = new RutaMapper();

        const rutaDomain = rutaMapper.toDomain(rutaDTO);
        const rutaGuardada = await rutaRepository.save(rutaDomain);

        try {
            const userRepository = new UserRepository();
            const uid = rutaGuardada.id_creador;
            const rutaId = rutaGuardada._id;

            const user = await userRepository.findByUid(uid);

            if (user) {
                const rutasActualizadas = [...(user.rutas || []), rutaId];
                await userRepository.update(uid, { rutas: rutasActualizadas });
                console.info(`${new Date().toISOString()} [RutaService] [save] Ruta agregada al usuario ${uid}`);
            } else {
                console.warn(`${new Date().toISOString()} [RutaService] [save] Usuario ${uid} no encontrado`);
            }
        } catch (error) {
            console.error(`${new Date().toISOString()} [RutaService] [save] Error al actualizar usuario:`, error);
        }

        console.info(`${new Date().toISOString()} [RutaService] [save] [END] Save`);
        return rutaGuardada;
    }

    async findAll() {
        console.info(`${new Date().toISOString()} [RutaService] [findAll] [START] Find All`);

        const rutaRepository = new RutaRepository();
        const rutaMapper = new RutaMapper();

        const rutasData = await rutaRepository.findAll();
        const rutasDomain = rutasData.map(data => rutaMapper.toDomain(data));

        console.info(`${new Date().toISOString()} [RutaService] [findAll] [END] Find All [${rutasDomain.length}]`);
        return rutasDomain;
    }

    async findMine({ uid, page = 1, limit = 20, q } = {}) {
        console.info(`${new Date().toISOString()} [RutaService] [findMine] [START] uid=${uid} page=${page} limit=${limit} q=${q ?? ''}`);

        if (!uid) {
            console.error(`${new Date().toISOString()} [RutaService] [findMine] Falta uid`);
            throw new Error('uid es requerido');
        }

        const rutaRepository = new RutaRepository();
        const rutaMapper = new RutaMapper();

        const result = await rutaRepository.findByCreator({ uid, page, limit, q });

        let items = [];
        let total = 0;
        let p = Number(page);
        let l = Number(limit);

        if (Array.isArray(result)) {
            items = result;
            total = result.length;
        } else {
            items = result?.items ?? [];
            total = result?.total ?? items.length;
            p = Number(result?.page ?? page);
            l = Number(result?.limit ?? limit);
        }

        const data = items.map(doc => rutaMapper.toDomain(doc));
        const totalPages = Math.max(1, Math.ceil(total / Math.max(1, l)));

        console.info(`${new Date().toISOString()} [RutaService] [findMine] [END] uid=${uid} items=${data.length} total=${total}`);

        return {
            data,
            page: p,
            limit: l,
            total,
            totalPages,
        };
    }

    async calificarRuta({ rutaId, id_usuario, puntuacion, comentario }) {
        console.info(`${new Date().toISOString()} [RutaService] [calificarRuta] [START] rutaId=${rutaId} user=${id_usuario} punt=${puntuacion}`);

        if (!rutaId) throw new Error("rutaId es requerido");
        if (!id_usuario) throw new Error("id_usuario es requerido");

        const p = Number(puntuacion);
        if (!Number.isFinite(p) || p < 1 || p > 5) {
            throw new Error("puntuacion debe estar entre 1 y 5");
        }

        const rutaRepository = new RutaRepository();
        const rutaMapper = new RutaMapper();

        const updatedDoc = await rutaRepository.calificarRuta({ rutaId, id_usuario, puntuacion: p, comentario });
        const updatedDomain = rutaMapper.toDomain(updatedDoc);

        console.info(`${new Date().toISOString()} [RutaService] [calificarRuta] [END] nuevo_promedio=${updatedDomain?.promedio_valoracion ?? "?"}`);
        return updatedDomain;
    }

    async obtenerValoraciones({ rutaId, page = 1, limit = 20 }) {
        console.info(`${new Date().toISOString()} [RutaService] [obtenerValoraciones] rutaId=${rutaId} page=${page} limit=${limit}`);
        if (!rutaId) throw new Error("rutaId es requerido");

        const repo = new RutaRepository();
        const result = await repo.listValoraciones({ rutaId, page, limit });

        const totalPages = Math.max(1, Math.ceil(result.total / Math.max(1, result.limit)));
        return { ...result, totalPages };
    }
    async delete({ rutaId, uid }) {
  console.info(`${new Date().toISOString()} [RutaService] [delete] [START] rutaId=${rutaId} uid=${uid}`);

  const cleanId = String(rutaId || '').trim();
  const cleanUid = String(uid || '').trim();
  if (!cleanId) throw new Error('rutaId es requerido');
  if (!cleanUid) throw new Error('uid es requerido');

  const repo = new RutaRepository();
  const res = await repo.deleteById({ rutaId: cleanId, uid: cleanUid });

  if (!res?.deletedCount) {
    const e = new Error('No encontrado o no autorizado');
    e.status = 404;
    throw e;
  }

  // --- NUEVO: quitar la referencia en users.rutas ---
  try {
    const userRepo = new UserRepository();
    await userRepo.pullRuta(cleanUid, cleanId);
  } catch (err) {
    console.warn('[RutaService][delete] No se pudo quitar ref de users.rutas:', err?.message || err);
    // no re-lanzamos: la ruta ya fue borrada
  }

  console.info(`${new Date().toISOString()} [RutaService] [delete] [END] ok`);
  return { ok: true };
}
        
     

    async findPopular({ page = 1, limit = 20, minRatings = 1, top } = {}) {
  const repo = new RutaRepository();
  return await repo.findPopular({ page, limit, minRatings, top });
}



    // cambiar visibilidad (PUT)
    async cambiarVisibilidad({ rutaId, publico }) {
        console.info(`${new Date().toISOString()} [RutaService] [cambiarVisibilidad] rutaId=${rutaId} publico=${publico}`);
        if (!rutaId) throw new Error("rutaId es requerido");
        if (typeof publico !== 'boolean') throw new Error("publico debe ser boolean");

        const repo = new RutaRepository();
        const mapper = new RutaMapper();

        const updated = await repo.updatePublico({ rutaId, publico });
        return mapper.toDomain(updated);
    }
    //añadir metodo y filtrar
    async findAllWithFilters(params) {
  const RutaRepository = require('../repositories/RutaRepository');
  const RutaMapper = require('../mappers/RutaMapper');

  const repo = new RutaRepository();
  const mapper = new RutaMapper();

  const { items, total, page, limit } = await repo.findWithFilters(params);

  return {
    data: items.map(d => mapper.toDomain(d)),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))),
  };
}

}

module.exports = RutaService;