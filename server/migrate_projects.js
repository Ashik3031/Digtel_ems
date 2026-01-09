const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Sale = require('./models/Sale');
const Project = require('./models/Project');

dotenv.config();

const migrateProjects = async () => {
    try {
        console.log(`Connecting to: ${process.env.MONGO_URI} ...`);
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to Database`);

        // Find all Sales in 'Handover' status
        const handedOverSales = await Sale.find({ status: 'Handover' });
        console.log(`Found ${handedOverSales.length} sales in 'Handover' status.`);

        let createdCount = 0;

        for (const sale of handedOverSales) {
            // Check if project already exists
            const existingProject = await Project.findOne({ saleId: sale._id });

            if (!existingProject) {
                console.log(`Creating Project for Sale: ${sale.clientName}`);

                await Project.create({
                    saleId: sale._id,
                    clientName: sale.clientName,
                    companyName: sale.companyName,
                    status: 'Active',
                    checklist: {
                        meetingScheduled: { done: false },
                        meetingMinutesSent: { done: false },
                        contentCalendarSent: { done: false },
                        clientApprovalReceived: { done: false },
                        workStarted: { done: false },
                        socialMediaLinks: { done: false },
                        spreadsheetLinkAdded: { done: false },
                        qcRequestsCreated: { done: false },
                        redoLoopsCompleted: { done: false },
                        allWorkCompleted: { done: false },
                        monthlyReviewSent: { done: false }
                    },
                    // Try to preserve original push date if possible, otherwise now
                    createdAt: sale.updatedAt
                });
                createdCount++;
            } else {
                console.log(`Project already exists for: ${sale.clientName}`);
            }
        }

        console.log(`Migration Complete. Created ${createdCount} new Projects.`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

migrateProjects();
