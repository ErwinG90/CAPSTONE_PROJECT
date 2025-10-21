const { MongoClient } = require('mongodb');
const config = require('../configs/config');

class MongoDBClientTipoDeporte {

    constructor() {
        this.collectionName = 'tipos_deporte';
        this.uri = `mongodb+srv://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.db}`;
        console.log(this.uri);
    }

    async findAll() {
        const client = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await client.connect();
            console.info(`${new Date().toISOString()} [MongoDBClientTipoDeporte] Connected to MongoDB`);
            const db = client.db(config.mongodb.db);
            const collection = db.collection(this.collectionName);
            const tirosDeporte = await collection.find({}).toArray();
            return tirosDeporte;
        } finally {
            await client.close();
        }
    }
}

module.exports = MongoDBClientTipoDeporte;