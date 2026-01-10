const express = require('express');
const {
    getDashboardStats,
    getAuditLogs,
    getSalesHistory,
    getAgentStats,
    setTarget,
    getTargets,
    getPerformanceOverview,
    getActiveProjects
} = require('../controllers/adminController');
const { getUsers, createUser, updateUser, resetPassword } = require('../controllers/adminUserController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes protected and restricted to Admin/Super Admin/Sales Manager
router.use(protect);

// Dashboard Stats (Admin/Super Admin only)
router.get('/stats', authorize('Admin', 'Super Admin'), getDashboardStats);

// Sales Analytics (Admin/Super Admin only)
router.get('/sales-history', authorize('Admin', 'Super Admin'), getSalesHistory);
router.get('/agent-stats', authorize('Admin', 'Super Admin'), getAgentStats);

// Target Management (Admin/Super Admin only)
router.route('/targets')
    .get(authorize('Admin', 'Super Admin'), getTargets)
    .post(authorize('Admin', 'Super Admin'), setTarget);

// Performance Overview (Admin/Super Admin/Sales Manager)
router.get('/performance-overview', authorize('Admin', 'Super Admin', 'Sales Manager'), getPerformanceOverview);

// Active Projects (Admin/Super Admin)
router.get('/active-projects', authorize('Admin', 'Super Admin'), getActiveProjects);

// Audit Logs (Admin/Super Admin only)
router.get('/audit-logs', authorize('Admin', 'Super Admin'), getAuditLogs);

// User Management
router.route('/users')
    .get(getUsers)
    .post(createUser);

router.route('/users/:id')
    .put(updateUser);

router.put('/users/:id/reset-password', resetPassword);

module.exports = router;
