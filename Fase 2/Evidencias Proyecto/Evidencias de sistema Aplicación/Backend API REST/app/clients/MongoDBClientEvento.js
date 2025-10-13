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

    async findAll() {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.find({}).toArray();
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientEvento] [findAll] Error:`, error);
            throw error;
        }
    }

    async findById(id) {
        const client = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await client.connect();
            console.info(`${new Date().toISOString()} [MongoDBClientEvento] Connected to MongoDB`);
            const db = client.db(config.mongodb.db);
            const collection = db.collection(this.collectionName);

            // Buscar por _id de MongoDB
            const { ObjectId } = require('mongodb');
            const evento = await collection.findOne({ _id: new ObjectId(id) });

            return evento;
        } finally {
            await client.close();
        }
    }
}
module.exports = MongoDBClientEvento;
