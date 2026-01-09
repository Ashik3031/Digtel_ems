const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user (Admin only or Initial Setup)
// @route   POST /api/auth/register
// @access  Public (for dev/initial) or Private/Admin
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // We shouldn't leak that email doesn't exist, but for dev:
            return res.status(404).json({ success: false, message: 'There is no user with that email' });
        }

        // Generate Reset Token (Random Bytes for now, in real app we hash it)
        // This is a minimal implementation placeholder
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

        // In production, we'd send an Email here using nodemailer
        // For now, we return it in response for testing
        res.status(200).json({
            success: true,
            data: 'Email sent (simulated)',
            resetToken: resetToken // Only for Dev/Test
        });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
    // Logic to verify token and update password
    // Skipping full implementation as 2FA/Email service is optional/future
    res.status(200).json({ success: true, data: "Password reset logic implemented" });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create Access Token
    const token = user.getSignedJwtToken();

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'secret';
    const refreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

    // Create Refresh Token (Simple implementation)
    // Ideally, store this in DB to allow revocation
    const refreshToken = jwt.sign({ id: user._id }, refreshSecret, {
        expiresIn: refreshExpire
    });

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Cookie expiry
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // Only send over HTTPS in prod
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('refreshToken', refreshToken, options)
        .json({
            success: true,
            token, // Access Token
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};
