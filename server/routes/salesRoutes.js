const express = require('express');
const { createProspect, getSales, convertToSale, pushToBackend } = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Get All / Create (Sales + Admins)
router.route('/')
    .get(authorize('Sales Executive', 'Sales Manager', 'Admin', 'Super Admin'), getSales)
    .post(authorize('Sales Executive', 'Sales Manager', 'Super Admin'), createProspect);

// Actions
router.put('/:id/convert', authorize('Sales Executive', 'Sales Manager', 'Super Admin'), convertToSale);
router.put('/:id/push', authorize('Sales Executive', 'Sales Manager', 'Super Admin'), pushToBackend);

module.exports = router;
