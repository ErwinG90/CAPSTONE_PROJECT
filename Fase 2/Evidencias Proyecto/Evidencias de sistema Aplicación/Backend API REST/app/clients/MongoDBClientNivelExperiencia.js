const { MongoClient } = require('mongodb');
const config = require('../configs/config');

class MongoDBClientNivelExperiencia {

    constructor() {
        this.collectionName = 'nivel_experiencia'; // nombre real en la BD
        this.uri = `mongodb+srv://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.db}`;
        console.log(this.uri);
    }

    async findAll() {
        const client = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await client.connect();
            console.info(`${new Date().toISOString()} [MongoDBClientNivelExperiencia] Connected to MongoDB`);
            const db = client.db(config.mongodb.db);
            const collection = db.collection(this.collectionName);
            const nivelesExperiencia = await collection.find({}).toArray();
            return nivelesExperiencia;
        } finally {
            await client.close();
        }
    }
}

module.exports = MongoDBClientNivelExperiencia;