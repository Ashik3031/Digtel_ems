const express = require('express');
const {
    createProspect,
    getSales,
    convertToSale,
    pushToBackend,
    revertToProspect,
    getTargetStats,
    updateSale,
    addPayment
} = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Target Stats (Self/Admin)
router.get('/target-stats', authorize('Sales Executive', 'Admin', 'Super Admin'), getTargetStats);

// Get All / Create (Sales + Admins)
router.route('/')
    .get(authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), getSales)
    .post(authorize('Sales Executive', 'Sales Manager', 'Super Admin'), createProspect);

// Actions
router.put('/:id', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), updateSale);
router.put('/:id/convert', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), convertToSale);
router.put('/:id/add-payment', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), addPayment);
router.put('/:id/push', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), pushToBackend);
router.put('/:id/revert', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), revertToProspect);
router.put('/:id/checklist', authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), require('../controllers/salesController').updateChecklistProgress);

module.exports = router;
