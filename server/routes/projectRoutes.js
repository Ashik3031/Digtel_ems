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
    addRemark,
    updateContentProduction,
    addShootSchedule,
    remindShootSchedule,
    deleteShootSchedule,
    completeShootSchedule,
    addEquipment,
    deleteEquipment,
    updateEquipmentStatus
} = require('../controllers/projectController');

// All routes are protected
router.use(protect);

router.get('/', authorize('Account Manager', 'Sales Manager', 'Backend Manager', 'Production', 'Admin', 'Super Admin'), getProjects);

router.put('/:id/checklist', authorize('Account Manager', 'Admin', 'Super Admin'), updateChecklist);

router.post('/:id/qc', authorize('Account Manager', 'Admin', 'Super Admin'), createQCRequest);

// QC endpoints
router.get('/qc-requests', authorize('QC', 'Admin', 'Super Admin'), getQCRequests);
router.put('/:id/qc/:qcId', authorize('QC', 'Admin', 'Super Admin'), updateQCRequest);

// Allow Account Manager to resubmit QC requests after Redo/Rejected
router.post('/:id/qc/:qcId/resubmit', authorize('Account Manager', 'Admin', 'Super Admin'), resubmitQCRequest);

router.put('/:id/status', authorize('Account Manager', 'Sales Manager', 'Backend Manager', 'Admin', 'Super Admin'), toggleStatus);

router.put('/:id/content-production', authorize('Production', 'Admin', 'Super Admin'), updateContentProduction);

router.post('/:id/shoot-schedules', authorize('Backend Manager', 'Admin', 'Super Admin'), addShootSchedule);

router.put('/:id/shoot-schedules/:shootId/remind', authorize('Backend Manager', 'Admin', 'Super Admin'), remindShootSchedule);

router.put('/:id/shoot-schedules/:shootId/complete', authorize('Production', 'Backend Manager', 'Admin', 'Super Admin'), completeShootSchedule);

router.delete('/:id/shoot-schedules/:shootId', authorize('Backend Manager', 'Admin', 'Super Admin'), deleteShootSchedule);

router.post('/:id/remarks', authorize('Backend Manager', 'Account Manager', 'Admin', 'Super Admin'), addRemark);

// Equipment endpoints
router.post('/:id/equipment', authorize('Production', 'Backend Manager', 'Admin', 'Super Admin'), addEquipment);
router.put('/:id/equipment/:equipmentId', authorize('Production', 'Backend Manager', 'Admin', 'Super Admin'), updateEquipmentStatus);
router.delete('/:id/equipment/:equipmentId', authorize('Production', 'Backend Manager', 'Admin', 'Super Admin'), deleteEquipment);

module.exports = router;
