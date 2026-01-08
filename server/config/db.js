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
            console.log('Could not connect to configured MongoDB. Attempting to start embedded MongoDB...');
            console.log('Authentication: Database will be reset on every restart.');

            // Fallback to In-Memory MongoDB
            const mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();

            await mongoose.connect(uri);
            console.log(`Embedded MongoDB Connected: ${uri}`);
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
