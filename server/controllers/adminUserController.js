const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private (Admin/Super Admin)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().populate('manager', 'name email role');
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create User
// @route   POST /api/admin/users
// @access  Private (Admin/Super Admin)
exports.createUser = async (req, res) => {
    try {
        let { name, email, password, role, manager } = req.body;

        // If no manager is provided, default to a Super Admin
        if (!manager) {
            const superAdmin = await User.findOne({ role: 'Super Admin' });
            if (superAdmin) {
                manager = superAdmin._id;
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            manager
        });

        // Log action
        await AuditLog.create({
            action: 'USER_CREATED',
            performedBy: req.user.id,
            targetResource: `User: ${user.email}`,
            details: { role: user.role }
        });

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update User (Role, Status, Manager)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin/Super Admin)
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, manager, isActive } = req.body;

        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const oldData = { role: user.role, isActive: user.isActive, manager: user.manager };

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        user.manager = manager || user.manager;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        // Log action if critical fields changed
        if (role !== oldData.role || isActive !== oldData.isActive) {
            await AuditLog.create({
                action: 'USER_UPDATED',
                performedBy: req.user.id,
                targetResource: `User: ${user.email}`,
                details: {
                    old: oldData,
                    new: { role: user.role, isActive: user.isActive, manager: user.manager }
                }
            });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Reset User Password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin/Super Admin)
exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.password = password; // Pre-save middleware will hash it
        await user.save();

        // Log action
        await AuditLog.create({
            action: 'USER_PASSWORD_RESET',
            performedBy: req.user.id,
            targetResource: `User: ${user.email}`
        });

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin/Super Admin)
exports.deleteUser = async (req, res) => {
    try {
        // prevent self-deletion
        if (String(req.user.id) === String(req.params.id)) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        // Load the user to validate existence and role
        const user = await User.findById(req.params.id).lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Disallow deleting Super Admin users to be safe
        if (user.role === 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Deleting Super Admins is not allowed' });
        }

        // Perform deletion using model method (avoids document.remove issues)
        const deleted = await User.findByIdAndDelete(req.params.id);

        // Log action
        await AuditLog.create({
            action: 'USER_DELETED',
            performedBy: req.user.id,
            targetResource: `User: ${user.email}`
        });

        res.status(200).json({ success: true, message: 'User deleted', data: { id: req.params.id, deleted: !!deleted } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
