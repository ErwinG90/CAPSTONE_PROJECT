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
}

module.exports = RutaService;
