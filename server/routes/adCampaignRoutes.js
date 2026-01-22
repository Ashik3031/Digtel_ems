const express = require('express');
const {
    getAdCampaigns,
    createAdCampaign,
    updateAdCampaign,
    updateCampaignMetrics,
    deleteAdCampaign,
    remindAdCampaign
} = require('../controllers/adCampaignController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Get campaigns (filtered by role)
router.get('/', getAdCampaigns);

// Create campaign (Account Manager, Backend Manager, Admin)
router.post('/', authorize('Account Manager', 'Backend Manager', 'Admin', 'Super Admin'), createAdCampaign);

// Update campaign
router.put('/:id', updateAdCampaign);

// Remind campaign (Backend Manager, Admin, Super Admin)
router.post('/:id/remind', authorize('Backend Manager', 'Admin', 'Super Admin'), remindAdCampaign);

// Update metrics (Performance Marketing Team)
router.put('/:id/metrics', authorize('Performance Marketing Team', 'Admin', 'Super Admin'), updateCampaignMetrics);

// Delete campaign (Admin only)
router.delete('/:id', authorize('Admin', 'Super Admin'), deleteAdCampaign);

module.exports = router;
