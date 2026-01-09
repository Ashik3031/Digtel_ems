const User = require('./models/User');
const Role = require('./models/Role');

const seedSalesTeam = async () => {
    try {
        console.log('Seeding default sales team...');

        // Ensure Role exists
        let salesRole = await Role.findOne({ name: 'Sales Executive' });
        if (!salesRole) {
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
                console.log(`Seeded: ${member.name}`);
            }
        }
        console.log('Sales team seeding complete.');
    } catch (error) {
        console.error('Seeding failed:', error.message);
    }
};

module.exports = seedSalesTeam;
