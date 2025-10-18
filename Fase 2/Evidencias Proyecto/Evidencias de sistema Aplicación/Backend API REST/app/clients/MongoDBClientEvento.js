const config = require('../configs/config');
const { MongoClient } = require('mongodb');

class MongoDBClientEvento {
    constructor() {
        this.client = null;
        this.db = null;
        this.collection = null;
        this.uri = `mongodb+srv://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.db}`;
        this.collectionName = 'eventos';

        console.log(this.uri);
    }

    // conectar y preparar colección
    async connect() {
        try {
            this.client = await MongoClient.connect(this.uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            this.db = this.client.db(config.mongodb.db);
            this.collection = this.db.collection(this.collectionName);
            console.info(`${new Date().toISOString()} [MongoDBClientEvento] Connected to MongoDB`);
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientEvento] MongoDB connection error:`, error);
            throw error;
        }
    }

    // insertar evento
    async save(evento) {
        console.info(`${new Date().toISOString()} [MongoDBClientEvento] [save] [START] Save [${JSON.stringify(evento)}]`);
        try {
            if (!this.collection) await this.connect();
            const result = await this.collection.insertOne(evento);
            console.info(`${new Date().toISOString()} [MongoDBClientEvento] [save] [END] Save successful`);
            return result;
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientEvento] [save] Error:`, error);
            throw error;
        }
    }

    // listar todos
    async findAll() {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.find({}).toArray();
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientEvento] [findAll] Error:`, error);
            throw error;
        }
    }

    // buscar por _id (usa cliente corto dedicado)
    async findById(id) {
        const client = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await client.connect();
            console.info(`${new Date().toISOString()} [MongoDBClientEvento] Connected to MongoDB`);
            const db = client.db(config.mongodb.db);
            const collection = db.collection(this.collectionName);

            const { ObjectId } = require('mongodb');
            const evento = await collection.findOne({ _id: new ObjectId(id) });

            return evento;
        } finally {
            await client.close();
        }
    }

    // LISTA UNIFICADA: creados por uid o donde participa (con role)
    async findByUser(uid, { page = 1, limit = 20, future = null } = {}) {
        try {
            if (!this.collection) await this.connect();

            // filtro base
            const match = { $or: [{ createdBy: uid }, { participantes: uid }] };
            // futuros/pasados
            if (future === true) match.fecha_evento = { $gte: new Date() };  // solo futuros
            if (future === false) match.fecha_evento = { $lt: new Date() };  // solo pasados

            const pipeline = [
                { $match: match },
                // etiqueta rol
                { $addFields: { role: { $cond: [{ $eq: ['$createdBy', uid] }, 'CREATOR', 'PARTICIPANT'] } } },
                // orden por fecha (y _id para desempate estable)
                { $sort: { fecha_evento: 1, _id: 1 } },
                // paginación + total
                {
                    $facet: {
                        total: [{ $count: 'count' }],
                        data: [
                            { $skip: (page - 1) * limit },
                            { $limit: limit },
                            {
                                $project: {
                                    nombre_evento: 1,
                                    deporte_id: 1,
                                    lugar: 1,
                                    fecha_evento: 1,
                                    max_participantes: 1,
                                    descripcion: 1,
                                    createdBy: 1,
                                    participantes: 1,
                                    estado: 1,
                                    role: 1
                                }
                            }
                        ]
                    }
                }
            ];

            const [res] = await this.collection.aggregate(pipeline).toArray();
            const total = res?.total?.[0]?.count ?? 0;
            return { total, page, limit, data: res?.data ?? [] };
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientEvento] [findByUser] Error:`, error);
            throw error;
        }
    }

    // DOS LISTAS: creados y unidos 
    async findBucketsByUser(uid) {
        try {
            if (!this.collection) await this.connect();

            const pipeline = [
                {
                    $facet: {
                        created: [
                            { $match: { createdBy: uid } },
                            { $sort: { fecha_evento: 1, _id: 1 } },
                            { $addFields: { role: 'CREATOR' } }
                        ],
                        joined: [
                            { $match: { participantes: uid } },
                            { $sort: { fecha_evento: 1, _id: 1 } },
                            { $addFields: { role: 'PARTICIPANT' } }
                        ]
                    }
                }
            ];

            const [res] = await this.collection.aggregate(pipeline).toArray();
            return { created: res?.created ?? [], joined: res?.joined ?? [] };
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientEvento] [findBucketsByUser] Error:`, error);
            throw error;
        }
    }

    //  agregar participante al evento
    async addParticipant(eventId, uid) {
        try {
            if (!this.collection) await this.connect();
            const { ObjectId } = require('mongodb');
            const res = await this.collection.updateOne(
                { _id: new ObjectId(eventId) },
                { $addToSet: { participantes: uid } }
            );
            return res;
        } catch (e) {
            console.error(`[MongoDBClientEvento] addParticipant error:`, e);
            throw e;
        }
    }

}

module.exports = MongoDBClientEvento;
