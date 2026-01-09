const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Role = require('./models/Role');
const connectDB = require('./config/db');

dotenv.config();

const debugUsers = async () => {
    try {
        await connectDB();
        console.log('--- DEBUG USER DUMP ---');

        const roles = await Role.find({});
        console.log(`Roles Found: ${roles.length}`);
        roles.forEach(r => console.log(`- ${r.name}`));

        const users = await User.find({});
        console.log(`Users Found: ${users.length}`);
        users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));

        console.log('--- END DUMP ---');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugUsers();
