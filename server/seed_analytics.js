const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Role = require('./models/Role');
const Sale = require('./models/Sale');
const connectDB = require('./config/db');

dotenv.config();

const seedAnalytics = async () => {
    try {
        await connectDB();

        console.log('Cleaning existing sales data...');
        await Sale.deleteMany();

        // 1. Get or Create Agent
        let agent = await User.findOne({ email: 'sales_exec@ems.com' });
        if (!agent) {
            console.log('Creating Sales Exec...');
            agent = await User.create({
                name: 'Sales Exec',
                email: 'sales_exec@ems.com',
                password: 'password123',
                role: 'Sales Executive'
            });
        }

        const admin = await User.findOne({ role: 'Super Admin' });

        console.log('Generating dummy sales data...');
        const salesData = [];
        const statuses = ['Prospect', 'Sale', 'Handover', 'Completed'];
        const companies = ['Tech Corp', 'Global Solutions', 'Innovate Ltd', 'Zenith Systems', 'Nexus Hub', 'Alpha Ware', 'Cloud Peak', 'Skyline Dynamics'];
        const clients = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Robert Brown', 'Emily Davis', 'Chris Evans', 'Jessica Alba'];

        // Generate data for the last 6 months
        for (let i = 0; i < 50; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const date = new Date();
            date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
            date.setDate(Math.floor(Math.random() * 28) + 1);

            const amount = Math.floor(Math.random() * 5000) + 500;
            const collected = status !== 'Prospect' ? Math.floor(amount * (Math.random() * 0.5 + 0.5)) : 0;

            salesData.push({
                clientName: clients[Math.floor(Math.random() * clients.length)],
                clientPhone: '1234567890',
                companyName: companies[Math.floor(Math.random() * companies.length)],
                status: status,
                price: amount,
                notes: `Dummy data entry #${i}`,
                requirements: 'Standard implementation of EMS features.',
                payment: {
                    amount: amount,
                    paymentType: Math.random() > 0.5 ? 'Full' : 'Partial',
                    collectedAmount: collected,
                    pendingAmount: amount - collected,
                    status: collected >= amount ? 'Received' : 'Pending'
                },
                assignedTo: agent._id,
                createdBy: admin ? admin._id : agent._id,
                createdAt: date
            });
        }

        await Sale.insertMany(salesData);
        console.log('✅ Success: 50 sales entries seeded for sales_exec@ems.com');
        process.exit();
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
};

seedAnalytics();
