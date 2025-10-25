const MongoDBClientRuta = require('../clients/MongoDBClientRuta');

class RutaRepository {
    // guardar ruta
    async save(ruta) {
        console.info(`${new Date().toISOString()} [RutaRepository] [save] [START] Save [${JSON.stringify(ruta)}]`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        const rutaGuardada = await mongoDBClientRuta.save(ruta);
        console.info(`${new Date().toISOString()} [RutaRepository] [save] [END] Save`);
        return rutaGuardada;
    }

    // listar todas las rutas
    async findAll() {
        console.info(`${new Date().toISOString()} [RutaRepository] [findAll] [START] Find All`);
        const mongoDBClientRuta = new MongoDBClientRuta();
        const rutas = await mongoDBClientRuta.findAll();
        console.info(`${new Date().toISOString()} [RutaRepository] [findAll] [END] Find All [${rutas.length}]`);
        return rutas;
    }
}

module.exports = RutaRepository;
