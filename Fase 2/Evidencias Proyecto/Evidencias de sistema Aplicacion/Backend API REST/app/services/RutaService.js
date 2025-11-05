const RutaRepository = require('../repositories/RutaRepository');
const RutaMapper = require('../mappers/RutaMapper');
const UserRepository = require('../repositories/UserRepository');

class RutaService {
    // crear ruta
    async save(rutaDTO) {
        console.info(`${new Date().toISOString()} [RutaService] [save] [START] Save [${JSON.stringify(rutaDTO)}]`);

        const rutaRepository = new RutaRepository();
        const rutaMapper = new RutaMapper();

        const rutaDomain = rutaMapper.toDomain(rutaDTO);
        const rutaGuardada = await rutaRepository.save(rutaDomain); // <-- Recibe la ruta con _id

        // BLOQUE NUEVO
        try {
            const userRepository = new UserRepository();
            const uid = rutaGuardada.id_creador; // UID de Firebase del creador
            const rutaId = rutaGuardada._id; // ObjectId de la ruta recién guardada

            // Buscar el usuario
            const user = await userRepository.findByUid(uid);

            if (user) {
                // Agregar el ObjectId de la ruta al array de rutas del usuario
                const rutasActualizadas = [...(user.rutas || []), rutaId];

                // Actualizar el usuario
                await userRepository.update(uid, { rutas: rutasActualizadas });

                console.info(`${new Date().toISOString()} [RutaService] [save] Ruta agregada al usuario ${uid}`);
            } else {
                console.warn(`${new Date().toISOString()} [RutaService] [save] Usuario ${uid} no encontrado`);
            }
        } catch (error) {
            console.error(`${new Date().toISOString()} [RutaService] [save] Error al actualizar usuario:`, error);
            // No lanzamos error para que la ruta se guarde de todos modos
        }

        console.info(`${new Date().toISOString()} [RutaService] [save] [END] Save`);
        return rutaGuardada;
    }

    // listar todas las rutas
    async findAll() {
        console.info(`${new Date().toISOString()} [RutaService] [findAll] [START] Find All`);

        const rutaRepository = new RutaRepository();
        const rutaMapper = new RutaMapper();

        const rutasData = await rutaRepository.findAll();
        const rutasDomain = rutasData.map(data => rutaMapper.toDomain(data));

        console.info(`${new Date().toISOString()} [RutaService] [findAll] [END] Find All [${rutasDomain.length}]`);
        return rutasDomain;
    }


    // listar rutas del usuario (creadas por el)
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
        
     // eliminar (creador solamente)
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
        e.status = 404; // o 403 si distingues
        throw e;
        }

        console.info(`${new Date().toISOString()} [RutaService] [delete] [END] ok`);
        return { ok: true };
    }
    }

module.exports = RutaService;