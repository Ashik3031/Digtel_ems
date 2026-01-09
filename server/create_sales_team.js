const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Role = require('./models/Role');
const connectDB = require('./config/db');

dotenv.config();

const createSalesTeam = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        // Check if role exists
        let salesRole = await Role.findOne({ name: 'Sales Executive' });
        if (!salesRole) {
            console.log('Sales Executive role not found, creating it...');
            salesRole = await Role.create({ name: 'Sales Executive', description: 'Sales Agent' });
        }

        const teamMembers = [
            { name: 'Alice Sales', email: 'sales3@ems.com', password: 'password123' },
            { name: 'Bob Sales', email: 'sales4@ems.com', password: 'password123' },
            { name: 'Charlie Sales', email: 'sales5@ems.com', password: 'password123' }
        ];

        for (const member of teamMembers) {
            const userExists = await User.findOne({ email: member.email });
            if (!userExists) {
                await User.create({
                    ...member,
                    role: 'Sales Executive'
                });
                console.log(`Created: ${member.name} (${member.email})`);
            } else {
                console.log(`Exists: ${member.name} (${member.email})`);
            }
        }

        console.log('Sales Team Created Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

createSalesTeam();
