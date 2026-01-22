const express = require('express');
const {
    getServices,
    createService,
    updateService,
    deleteService
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// All authenticated users can view services
router.get('/', getServices);

// Only admins can create, update, delete
router.post('/', authorize('Admin', 'Super Admin'), createService);
router.put('/:id', authorize('Admin', 'Super Admin'), updateService);
router.delete('/:id', authorize('Admin', 'Super Admin'), deleteService);

module.exports = router;
