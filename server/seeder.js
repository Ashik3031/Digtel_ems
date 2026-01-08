const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Role = require('./models/Role');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
    try {
        await User.deleteMany();
        await Role.deleteMany();

        // Create Roles
        const roles = [
            { name: 'Super Admin', description: 'Full System Access' },
            { name: 'Admin', description: 'Operational Admin' },
            { name: 'HR', description: 'Human Resources' },
            { name: 'Sales Manager', description: 'Sales Team Lead' },
            { name: 'Sales Executive', description: 'Sales Agent' },
            { name: 'Backend Manager', description: 'Technical Lead' },
            { name: 'Account Manager', description: 'Client Accounts' },
            { name: 'Backend Team Member', description: 'Developer' },
            { name: 'QC', description: 'Quality Control' },
            { name: 'Client', description: 'Customer Portal Access' }
        ];

        await Role.insertMany(roles);

        // Create Super Admin User
        await User.create({
            name: 'Super Admin',
            email: 'admin@ems.com',
            password: 'password123',
            role: 'Super Admin'
        });

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
