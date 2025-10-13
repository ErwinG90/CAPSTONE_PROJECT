const config = require('../configs/config');
const { MongoClient } = require('mongodb');

class MongoDBClient {
    constructor() {
        this.client = null;
        this.db = null;
        this.collection = null;
        this.uri = `mongodb+srv://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.db}`;
        this.collectionName = 'locations';

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
            console.info(`${new Date().toISOString()} [MongoDBClient] Connected to MongoDB`);
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClient] MongoDB connection error:`, error);
            throw error;
        }
    }

    async save(location) {
        console.info(`${new Date().toISOString()} [MongoDBClient] [save] [START] Save [${JSON.stringify(location)}]`);
        try {
            if (!this.collection) await this.connect();
            const result = await this.collection.insertOne(location);
            console.info(`${new Date().toISOString()} [MongoDBClient] [save] [END] Save successful`);
            return result;
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClient] [save] Error:`, error);
            throw error;
        }
    }

    async findAll() {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.find({}).toArray();
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClient] [findAll] Error:`, error);
            throw error;
        }
    }

    async findById(id) {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.findOne({ _id: id });
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClient] [findById] Error:`, error);
            throw error;
        }
    }

    async update(id, location) {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.updateOne(
                { _id: id },
                { $set: location }
            );
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClient] [update] Error:`, error);
            throw error;
        }
    }

    async delete(id) {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.deleteOne({ _id: id });
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClient] [delete] Error:`, error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            this.collection = null;
        }
    }
}

module.exports = MongoDBClient;