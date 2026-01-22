const AdCampaign = require('../models/AdCampaign');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get all ad campaigns
// @route   GET /api/ad-campaigns
// @access  Private
exports.getAdCampaigns = async (req, res) => {
    try {
        let query = {};

        // Filter by role
        if (req.user.role === 'Performance Marketing Team') {
            query.assignedTo = req.user.id;
        } else if (req.user.role === 'Backend Manager') {
            query.requestedBy = req.user.id;
        }
        // Admins see all campaigns

        const campaigns = await AdCampaign.find(query)
            .populate('project', 'projectName clientName')
            .populate('assignedTo', 'name email')
            .populate('requestedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: campaigns.length,
            data: campaigns
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create new ad campaign
// @route   POST /api/ad-campaigns
// @access  Private (Backend Manager, Admin)
exports.createAdCampaign = async (req, res) => {
    try {
        const { projectId, campaignType, startDate, endDate, budgetAllocation, assignedTo, notes } = req.body;

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Verify assigned user is Performance Marketing Team
        if (assignedTo) {
            const user = await User.findById(assignedTo);
            if (!user || user.role !== 'Performance Marketing Team') {
                return res.status(400).json({ success: false, message: 'Assigned user must be from Performance Marketing Team' });
            }
        }

        const campaign = await AdCampaign.create({
            project: projectId,
            campaignType,
            startDate,
            endDate,
            budgetAllocation,
            assignedTo,
            requestedBy: req.user.id,
            notes
        });

        // Add campaign to project
        project.adCampaigns = project.adCampaigns || [];
        project.adCampaigns.push(campaign._id);
        await project.save();

        // Real-time notification
        const io = req.app.get('io');
        if (io && assignedTo) {
            io.emit('ad_campaign_assigned', {
                campaign,
                assignedTo,
                timestamp: new Date()
            });
        }

        const populatedCampaign = await AdCampaign.findById(campaign._id)
            .populate('project', 'projectName clientName')
            .populate('assignedTo', 'name email')
            .populate('requestedBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedCampaign
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update ad campaign
// @route   PUT /api/ad-campaigns/:id
// @access  Private
exports.updateAdCampaign = async (req, res) => {
    try {
        const { campaignType, startDate, endDate, budgetAllocation, assignedTo, notes, status, campaignDetails } = req.body;

        let campaign = await AdCampaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        // Update fields
        if (campaignType !== undefined) campaign.campaignType = campaignType;
        if (startDate !== undefined) campaign.startDate = startDate;
        if (endDate !== undefined) campaign.endDate = endDate;
        if (budgetAllocation !== undefined) campaign.budgetAllocation = budgetAllocation;
        if (assignedTo !== undefined) campaign.assignedTo = assignedTo;
        if (notes !== undefined) campaign.notes = notes;
        if (status !== undefined) campaign.status = status;
        if (campaignDetails !== undefined) campaign.campaignDetails = campaignDetails;

        await campaign.save();

        const populatedCampaign = await AdCampaign.findById(campaign._id)
            .populate('project', 'projectName clientName')
            .populate('assignedTo', 'name email')
            .populate('requestedBy', 'name email');

        res.status(200).json({
            success: true,
            data: populatedCampaign
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update campaign metrics
// @route   PUT /api/ad-campaigns/:id/metrics
// @access  Private (Performance Marketing Team)
exports.updateCampaignMetrics = async (req, res) => {
    try {
        const { reach, leads, conversions, spent } = req.body;

        let campaign = await AdCampaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        // Update metrics
        if (reach !== undefined) campaign.metrics.reach = reach;
        if (leads !== undefined) campaign.metrics.leads = leads;
        if (conversions !== undefined) campaign.metrics.conversions = conversions;
        if (spent !== undefined) campaign.metrics.spent = spent;

        await campaign.save();

        const populatedCampaign = await AdCampaign.findById(campaign._id)
            .populate('project', 'projectName clientName')
            .populate('assignedTo', 'name email')
            .populate('requestedBy', 'name email');

        res.status(200).json({
            success: true,
            data: populatedCampaign
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete ad campaign
// @route   DELETE /api/ad-campaigns/:id
// @access  Private (Admin)
exports.deleteAdCampaign = async (req, res) => {
    try {
        const campaign = await AdCampaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        // Remove from project
        await Project.findByIdAndUpdate(campaign.project, {
            $pull: { adCampaigns: campaign._id }
        });

        await campaign.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Campaign deleted successfully'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Send reminder for ad campaign
// @route   POST /api/ad-campaigns/:id/remind
// @access  Private (BM, Admin, Super Admin)
exports.remindAdCampaign = async (req, res) => {
    try {
        const campaign = await AdCampaign.findById(req.params.id).populate('project');
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        // Emit notification to assigned PM
        if (campaign.assignedTo) {
            const io = req.app.get('socketio');
            if (io) {
                io.to(campaign.assignedTo.toString()).emit('new_ad_campaign', {
                    message: `REMINDER: Ad campaign for ${campaign.project?.companyName || 'Project'} needs attention.`,
                    type: 'ad_campaign'
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Reminder sent successfully'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
