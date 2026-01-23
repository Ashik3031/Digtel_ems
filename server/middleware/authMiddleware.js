const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        console.error('Auth Error: No token provided');
        console.error('Headers:', req.headers);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id);

        if (!req.user) {
            console.error('Auth Error: User not found with id:', decoded.id);
            return res.status(401).json({ success: false, message: 'No user found with this id' });
        }

        console.log('Auth Success: User role:', req.user.role);
        next();
    } catch (err) {
        console.error('Auth Error: Token verification failed:', err.message);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.error('Authorization Error: No user in request');
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        console.log('Authorization Check: User role:', req.user.role, 'Allowed roles:', roles);
        if (!roles.includes(req.user.role)) {
            console.error('Authorization Error: User role not in allowed roles');
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        console.log('Authorization Success: User authorized');
        next();
    };
};
