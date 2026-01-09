const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(async () => {
    // Run seeder logic inline below instead of external file
    // to ensure consistency with in-memory DB lifecycle

    // Auto-seed: Always successful for In-Memory DB usage
    try {
        const User = require('./models/User');
        const Role = require('./models/Role');

        console.log('Ensuring default data exists...');

        // 1. Ensure Roles Exist
        const roleDefinitions = [
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

        for (const r of roleDefinitions) {
            const roleExists = await Role.findOne({ name: r.name });
            if (!roleExists) {
                await Role.create(r);
            }
        }

        // 2. Ensure Users Exist (Idempotent)
        const allUsers = [
            // Standard Team
            { name: 'Super Admin', email: 'admin@ems.com', role: 'Super Admin' },
            { name: 'Admin User', email: 'operations@ems.com', role: 'Admin' },
            { name: 'HR Manager', email: 'hr@ems.com', role: 'HR' },
            { name: 'Sales Mgr', email: 'sales_mgr@ems.com', role: 'Sales Manager' },
            { name: 'Sales Exec', email: 'sales_exec@ems.com', role: 'Sales Executive' },
            { name: 'Backend Mgr', email: 'backend_mgr@ems.com', role: 'Backend Manager' },
            { name: 'Acct Mgr', email: 'am@ems.com', role: 'Account Manager' },
            { name: 'Dev Team', email: 'dev@ems.com', role: 'Backend Team Member' },
            { name: 'QC Officer', email: 'qc@ems.com', role: 'QC' },
            { name: 'Client User', email: 'client@ems.com', role: 'Client' },
            // Additional Sales Team
            { name: 'Alice Sales', email: 'sales3@ems.com', role: 'Sales Executive' },
            { name: 'Bob Sales', email: 'sales4@ems.com', role: 'Sales Executive' },
            { name: 'Charlie Sales', email: 'sales5@ems.com', role: 'Sales Executive' }
        ];

        for (const u of allUsers) {
            const userExists = await User.findOne({ email: u.email });
            if (!userExists) {
                await User.create({
                    name: u.name,
                    email: u.email,
                    password: 'password123',
                    role: u.role
                });
                console.log(`Created user: ${u.email}`);
            }
        }
        console.log('Seeding check complete.');
    } catch (error) {
        console.error('Auto-seed failed:', error);
    }
});

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev')); // Logger

// Rate Limiting
const { rateLimit } = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies to be sent
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));

// Basic route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handler Middleware placeholder
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
