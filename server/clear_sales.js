const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Sale = require('./models/Sale');
const connectDB = require('./config/db');

dotenv.config();

const clearSales = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        const result = await Sale.deleteMany({});
        console.log(`Cleared ${result.deletedCount} sales records.`);

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

clearSales();
