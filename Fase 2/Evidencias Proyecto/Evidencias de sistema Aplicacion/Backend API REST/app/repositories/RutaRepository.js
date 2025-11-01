const MongoDBClientRuta = require('../clients/MongoDBClientRuta');

class RutaRepository {
    /**
     * Guarda una ruta
     */
    async save(ruta) {
        console.info(`${new Date().toISOString()} [RutaRepository] [save] [START] Save [${JSON.stringify(ruta)}]`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        const rutaGuardada = await mongoDBClientRuta.save(ruta);
        console.info(`${new Date().toISOString()} [RutaRepository] [save] [END] Save`);
        return rutaGuardada;
    }

    /**
     * Lista todas las rutas 
     */
    async findAll() {
        console.info(`${new Date().toISOString()} [RutaRepository] [findAll] [START] Find All`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        const rutas = await mongoDBClientRuta.findAll();
        console.info(`${new Date().toISOString()} [RutaRepository] [findAll] [END] Find All [${Array.isArray(rutas) ? rutas.length : 0}]`);
        return rutas;
    }

    /**
     * Lista todas las rutas del usuario
     */
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

}

module.exports = RutaRepository;
