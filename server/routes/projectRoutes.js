const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getProjects,
    updateChecklist,
    createQCRequest,
    toggleStatus
} = require('../controllers/projectController');

// All routes are protected
router.use(protect);

router.get('/', authorize('Account Manager', 'Sales Manager', 'Backend Manager', 'Admin', 'Super Admin'), getProjects);

router.put('/:id/checklist', authorize('Account Manager', 'Admin', 'Super Admin'), updateChecklist);

router.post('/:id/qc', authorize('Account Manager', 'Admin', 'Super Admin'), createQCRequest);

router.put('/:id/status', authorize('Account Manager', 'Sales Manager', 'Backend Manager', 'Admin', 'Super Admin'), toggleStatus);

module.exports = router;
