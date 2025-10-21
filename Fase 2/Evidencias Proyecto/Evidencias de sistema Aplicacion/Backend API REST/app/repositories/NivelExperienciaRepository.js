const MongoDBClientNivelExperiencia = require('../clients/MongoDBClientNivelExperiencia')

class NivelExperienciaRepository {

    async findAll() {
        console.info(`${new Date().toISOString()} [NivelExperienciaRepository] [findAll] [START] Find All`);
        const mongoDBClientNivelExperiencia = new MongoDBClientNivelExperiencia();
        const nivelesExperiencia = await mongoDBClientNivelExperiencia.findAll();
        console.info(`${new Date().toISOString()} [NivelExperienciaRepository] [findAll] [END] Find All [${nivelesExperiencia.length}]`);
        return nivelesExperiencia;
    }
}

module.exports = NivelExperienciaRepository;