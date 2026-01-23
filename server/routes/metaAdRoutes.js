const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createMetaAdRequest,
    getAccountManagerRequests,
    getPendingRequests,
    acceptRequest,
    rejectRequest,
    getAcceptedRequests,
    submitAdReport,
    getAllReports,
    getReportById,
    getAccountManagerReports
} = require('../controllers/metaAdController');

// Account Manager routes
router.post('/request', protect, authorize('Account Manager'), createMetaAdRequest);
router.get('/my-requests', protect, authorize('Account Manager'), getAccountManagerRequests);
router.get('/my-reports', protect, authorize('Account Manager'), getAccountManagerReports);

// Performance Marketing routes
router.get('/requests/pending', protect, authorize('Performance Marketing'), getPendingRequests);
router.put('/requests/:id/accept', protect, authorize('Performance Marketing'), acceptRequest);
router.put('/requests/:id/reject', protect, authorize('Performance Marketing'), rejectRequest);
router.get('/accepted-requests', protect, authorize('Performance Marketing'), getAcceptedRequests);
router.post('/report/submit', protect, authorize('Performance Marketing'), submitAdReport);

// Reports - accessible to Admin, Super Admin, Backend Manager, Account Manager, Performance Marketing
router.get('/reports', protect, authorize('Admin', 'Super Admin', 'Backend Manager', 'Account Manager', 'Performance Marketing'), getAllReports);
router.get('/reports/:id', protect, authorize('Admin', 'Super Admin', 'Backend Manager', 'Account Manager', 'Performance Marketing'), getReportById);

module.exports = router;
