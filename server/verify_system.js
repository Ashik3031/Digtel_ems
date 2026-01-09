const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Sale = require('./models/Sale');

dotenv.config();

const verifySystem = async () => {
    try {
        console.log(`Connecting to: ${process.env.MONGO_URI} ...`);
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to Database: ${mongoose.connection.name}`);

        const userCount = await User.countDocuments();
        const saleCount = await Sale.countDocuments();

        console.log('--- SYSTEM STATUS ---');
        console.log(`Users in DB: ${userCount}`);
        console.log(`Sales in DB: ${saleCount}`);

        if (saleCount === 0) {
            console.log('NOTICE: "sales" collection/data might not appear in your viewer until you create the first Prospect via the Dashboard.');
        }

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections present:', collections.map(c => c.name).join(', '));

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

verifySystem();
