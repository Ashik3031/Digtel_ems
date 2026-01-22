const express = require('express');
const {
    createProspect,
    getSales,
    convertToSale,
    pushToBackend,
    revertToProspect,
    getTargetStats,
    updateSale,
    addPayment,
    markSaleNoted,
    addComment,
    addReply,
    getManagerDashboardStats,
    markCommentsRead,
    requestDelete,
    rejectDelete,
    deleteSale
} = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/authMiddleware');
const performanceMarketingController = require('../controllers/performanceMarketingController');

const router = express.Router();

router.use(protect);

// Manager Dashboard Stats
router.get('/manager/stats', authorize('Sales Manager', 'Admin', 'Super Admin'), getManagerDashboardStats);

// Target Stats (Self/Admin)
router.get('/target-stats', authorize('Sales Executive', 'Admin', 'Super Admin'), getTargetStats);

// Performance Marketing Dashboard
router.get('/performance-marketing', authorize('Sales Manager', 'Admin', 'Super Admin'), performanceMarketingController.getDashboard);

// Get All / Create (Sales + Admins)
router.route('/')
    .get(authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin', 'Backend Manager'), getSales)
    .post(authorize('Sales Executive', 'Sales Manager', 'Super Admin'), createProspect);

// BM Actions
router.put('/:id/note', authorize('Backend Manager', 'Super Admin'), markSaleNoted);

// Comments
router.put('/:id/read-comments', markCommentsRead);
router.post('/:id/comments', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), addComment);
router.post('/:id/comments/:commentId/replies', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), addReply);

// Deletion Workflow
router.put('/:id/request-delete', authorize('Sales Executive', 'Sales Manager'), requestDelete);
router.put('/:id/reject-delete', authorize('Sales Manager', 'Admin', 'Super Admin'), rejectDelete);
router.delete('/:id', authorize('Sales Manager', 'Admin', 'Super Admin'), deleteSale);

// Actions
router.put('/:id', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), updateSale);
router.put('/:id/convert', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), convertToSale);
router.put('/:id/add-payment', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), addPayment);
router.put('/:id/push', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), pushToBackend);
router.put('/:id/revert', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), revertToProspect);
router.put('/:id/checklist', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), require('../controllers/salesController').updateChecklistProgress);

module.exports = router;
