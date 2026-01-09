const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Create a new user (Admin/Super Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // RBAC Check: Only Super Admin can create Admins/Super Admins
        if (['Super Admin', 'Admin'].includes(role) && req.user.role !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Only Super Admin can create Admin users' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role
        });

        // Audit Log
        await AuditLog.create({
            action: 'CREATE_USER',
            performedBy: req.user.id,
            targetResource: `User: ${user.email}`,
            details: { role: user.role },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
