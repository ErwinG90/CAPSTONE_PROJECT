const MongoDBClientEvento = require('../clients/MongoDBClientEvento')

class EventoRepository {

    async save(evento) {
        console.info(`${new Date().toISOString()} [EventoRepository] [save] [START] Save [${JSON.stringify(evento)}]`);

        const mongoDBClientEvento = new MongoDBClientEvento();
        await mongoDBClientEvento.save(evento);
        console.info(`${new Date().toISOString()} [EventoRepository] [save] [END] Save`);
    }

    async findAll() {
        console.info(`${new Date().toISOString()} [EventoRepository] [findAll] [START] Find All`);
        const mongoDBClientEvento = new MongoDBClientEvento();
        const eventos = await mongoDBClientEvento.findAll();
        console.info(`${new Date().toISOString()} [EventoRepository] [findAll] [END] Find All [${eventos.length}]`);
        return eventos;
    }

    async findById(id) {
        console.info(`${new Date().toISOString()} [EventoRepository] [findById] [START] id=${id}`);
        const mongoDBClientEvento = new MongoDBClientEvento();
        const evento = await mongoDBClientEvento.findById(id);
        console.info(`${new Date().toISOString()} [EventoRepository] [findById] [END] ${evento ? 'FOUND' : 'NOT_FOUND'}`);
        return evento || null;
    }

}
module.exports = EventoRepository;
