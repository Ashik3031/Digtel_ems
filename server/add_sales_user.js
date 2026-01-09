const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Role = require('./models/Role');
const connectDB = require('./config/db');

dotenv.config();

const addSalesPerson = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        // Check if role exists
        let salesRole = await Role.findOne({ name: 'Sales Executive' });
        if (!salesRole) {
            console.log('Sales Executive role not found, creating it...');
            salesRole = await Role.create({ name: 'Sales Executive', description: 'Sales Agent' });
        }

        const newUser = {
            name: 'New Sales Person',
            email: 'sales2@ems.com',
            password: 'password123',
            role: 'Sales Executive'
        };

        const createdUser = await User.create(newUser);

        console.log(`User created successfully: ${createdUser.name} (${createdUser.email})`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

addSalesPerson();
