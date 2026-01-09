const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;

        // Attempt to connect to the provided URI first
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        } catch (err) {
            console.log('Could not connect to configured MongoDB. Switching to internal Persistent Database...');

            // Fallback to Persistent Embedded MongoDB
            const path = require('path');
            const fs = require('fs');

            const dbPath = path.join(__dirname, '..', 'data', 'db');
            if (!fs.existsSync(dbPath)) {
                fs.mkdirSync(dbPath, { recursive: true });
            }

            console.log(`Starting internal database at: ${dbPath}`);

            const mongod = await MongoMemoryServer.create({
                instance: {
                    dbPath: dbPath,
                    storageEngine: 'wiredTiger'
                }
            });
            uri = mongod.getUri();

            await mongoose.connect(uri);
            console.log(`Internal Database Connected: ${uri}`);
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
