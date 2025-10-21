const config = require('../configs/config');
const { MongoClient } = require('mongodb');

class MongoDBClientUser {
    constructor() {
        this.client = null;
        this.db = null;
        this.collection = null;
        this.uri = `mongodb+srv://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.db}`;
        this.collectionName = 'users';

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
            console.info(`${new Date().toISOString()} [MongoDBClientUser] Connected to MongoDB`);
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientUser] MongoDB connection error:`, error);
            throw error;
        }
    }

    async save(user) {
        console.info(`${new Date().toISOString()} [MongoDBClientUser] [save] [START] Save [${JSON.stringify(user)}]`);
        try {
            if (!this.collection) await this.connect();
            const result = await this.collection.insertOne(user);
            console.info(`${new Date().toISOString()} [MongoDBClientUser] [save] [END] Save successful`);
            return result;
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientUser] [save] Error:`, error);
            throw error;
        }
    }

    async findAll() {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.find({}).toArray();
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientUser] [findAll] Error:`, error);
            throw error;
        }
    }

    async findById(id) {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.findOne({ _id: id });
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientUser] [findById] Error:`, error);
            throw error;
        }
    }

    async update(id, user) {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.updateOne(
                { _id: id },
                { $set: user }
            );
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientUser] [update] Error:`, error);
            throw error;
        }
    }

    async delete(id) {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.deleteOne({ _id: id });
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientUser] [delete] Error:`, error);
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

    //  agregar id de evento al usuario
    async pushEvent(uid, eventId) {
        try {
            if (!this.collection) await this.connect();
            const { ObjectId } = require('mongodb');
            return await this.collection.updateOne(
                { _id: uid },                    // uid es string en _id
                { $addToSet: { eventos: new ObjectId(eventId) } }
            );
        } catch (e) {
            console.error(`[MongoDBClientUser] pushEvent error:`, e);
            throw e;
        }
    }

    // quitar id de evento del usuario
    async pullEvent(uid, eventId) {
        try {
            if (!this.collection) await this.connect();
            const { ObjectId } = require('mongodb');
            return await this.collection.updateOne(
                { _id: uid },
                { $pull: { eventos: new ObjectId(eventId) } }
            );
        } catch (e) {
            console.error(`[MongoDBClientUser] pullEvent error:`, e);
            throw e;
        }
    }
}

module.exports = MongoDBClientUser;