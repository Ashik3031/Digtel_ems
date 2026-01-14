const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getProjects,
    updateChecklist,
    createQCRequest,
    getQCRequests,
    updateQCRequest,
    resubmitQCRequest,
    toggleStatus,
    addRemark
} = require('../controllers/projectController');

// All routes are protected
router.use(protect);

router.get('/', authorize('Account Manager', 'Sales Manager', 'Backend Manager', 'Admin', 'Super Admin'), getProjects);

router.put('/:id/checklist', authorize('Account Manager', 'Admin', 'Super Admin'), updateChecklist);

router.post('/:id/qc', authorize('Account Manager', 'Admin', 'Super Admin'), createQCRequest);

// QC endpoints
router.get('/qc-requests', authorize('QC', 'Admin', 'Super Admin'), getQCRequests);
router.put('/:id/qc/:qcId', authorize('QC', 'Admin', 'Super Admin'), updateQCRequest);

// Allow Account Manager to resubmit QC requests after Redo/Rejected
router.post('/:id/qc/:qcId/resubmit', authorize('Account Manager', 'Admin', 'Super Admin'), resubmitQCRequest);

router.put('/:id/status', authorize('Account Manager', 'Sales Manager', 'Backend Manager', 'Admin', 'Super Admin'), toggleStatus);

router.post('/:id/remarks', authorize('Backend Manager', 'Account Manager', 'Admin', 'Super Admin'), addRemark);

module.exports = router;
