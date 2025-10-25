const config = require('../configs/config');
const { MongoClient, ObjectId } = require('mongodb');

class MongoDBClientRuta {
    constructor() {
        this.client = null;
        this.db = null;
        this.collection = null;
        this.uri = `mongodb+srv://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.db}`;
        this.collectionName = 'rutas';
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
            console.info(`${new Date().toISOString()} [MongoDBClientRuta] Connected to MongoDB`);
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] MongoDB connection error:`, error);
            throw error;
        }
    }

    // insertar ruta
    async save(ruta) {
        console.info(`${new Date().toISOString()} [MongoDBClientRuta] [save] [START] Save [${JSON.stringify(ruta)}]`);
        try {
            if (!this.collection) await this.connect();
            const result = await this.collection.insertOne(ruta);
            console.info(`${new Date().toISOString()} [MongoDBClientRuta] [save] [END] Save successful`);
            // Devolver la ruta con el _id generado
            return {
                ...ruta,
                _id: result.insertedId
            };
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] [save] Error:`, error);
            throw error;
        }
    }

    // listar todas las rutas
    async findAll() {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.find({}).toArray();
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] [findAll] Error:`, error);
            throw error;
        }
    }
}

module.exports = MongoDBClientRuta;
