const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const testConnection = async () => {
    try {
        console.log(`Attempting to connect to: ${process.env.MONGO_URI}`);
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('SUCCESS: Connected to MongoDB!');

        // List collections to prove it's a real DB
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        process.exit();
    } catch (error) {
        console.error('FAILURE: Could not connect to MongoDB.');
        console.error('Error Details:', error.message);
        process.exit(1);
    }
};

testConnection();
