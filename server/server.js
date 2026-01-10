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
    try {
        const User = require('./models/User');
        const Role = require('./models/Role');

        console.log('Ensuring default data exists...');
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
            if (!roleExists) await Role.create(r);
        }

        const allUsers = [
            { name: 'Super Admin', email: 'admin@ems.com', role: 'Super Admin' },
            { name: 'Sales Exec', email: 'sales_exec@ems.com', role: 'Sales Executive' },
            { name: 'Acct Mgr', email: 'am@ems.com', role: 'Account Manager' }
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
            }
        }
        console.log('Seeding check complete.');
    } catch (error) {
        console.error('Auto-seed failed:', error);
    }
});

const app = express();

// 1. CORS FIRST (Before everything else)
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// 2. Logging
app.use(morgan('dev'));

// 3. Security Headers (Helmet can be strict, so we put it after CORS)
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

// 4. Body Parser & Cookie Parser
app.use(express.json());
app.use(cookieParser());

// 5. Rate Limiting
const { rateLimit } = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Increased for development
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => res.send('API is running...'));

app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            callback(null, true); // Permissive for debug
        },
        credentials: true
    }
});

app.set('io', io);
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => console.log('Socket disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
