const MetaAdRequest = require('../models/MetaAdRequest');
const AdReport = require('../models/AdReport');

// Account Manager: Create Meta Ad Request
exports.createMetaAdRequest = async (req, res) => {
    try {
        const { project, adType, startDate, endDate, type, budgetAllocated, notes, campaignName } = req.body;

        const metaAdRequest = new MetaAdRequest({
            project,
            accountManager: req.user.id,
            campaignName,
            adType,
            startDate,
            endDate,
            type,
            budgetAllocated,
            notes
        });

        await metaAdRequest.save();
        await metaAdRequest.populate(['project', 'accountManager']);

        res.status(201).json({
            success: true,
            data: metaAdRequest,
            message: 'Meta Ad request created successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Account Manager: Get their own requests
exports.getAccountManagerRequests = async (req, res) => {
    try {
        const requests = await MetaAdRequest.find({ accountManager: req.user.id })
            .populate(['project', 'accountManager', 'performanceMarketing']);

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Performance Marketing: Get all pending requests
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await MetaAdRequest.find({ status: 'Pending' })
            .populate(['project', 'accountManager']);

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Performance Marketing: Accept request
exports.acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await MetaAdRequest.findByIdAndUpdate(
            id,
            {
                status: 'Accepted',
                performanceMarketing: req.user.id
            },
            { new: true }
        ).populate(['project', 'accountManager', 'performanceMarketing']);

        res.status(200).json({
            success: true,
            data: request,
            message: 'Request accepted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Performance Marketing: Reject request
exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const request = await MetaAdRequest.findByIdAndUpdate(
            id,
            {
                status: 'Rejected',
                rejectionReason
            },
            { new: true }
        ).populate(['project', 'accountManager']);

        res.status(200).json({
            success: true,
            data: request,
            message: 'Request rejected successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Performance Marketing: Get accepted requests
exports.getAcceptedRequests = async (req, res) => {
    try {
        const requests = await MetaAdRequest.find({
            status: 'Accepted',
            performanceMarketing: req.user.id
        }).populate(['project', 'accountManager']);

        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Performance Marketing: Submit ad report
exports.submitAdReport = async (req, res) => {
    try {
        const { metaAdRequest, adQuality, adResults, performanceMetrics, recommendations, reportPeriodStart, reportPeriodEnd } = req.body;

        const report = new AdReport({
            metaAdRequest,
            performanceMarketing: req.user.id,
            adQuality,
            adResults,
            performanceMetrics,
            recommendations,
            reportPeriodStart,
            reportPeriodEnd,
            status: 'Submitted'
        });

        await report.save();
        await report.populate(['metaAdRequest', 'performanceMarketing']);

        // Keep the request in Accepted status for recurring ad campaigns
        // Don't mark as Completed so multiple reports can be submitted
        // Status stays as 'Accepted' to allow ongoing report submissions

        res.status(201).json({
            success: true,
            data: report,
            message: 'Ad report submitted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Admin/Backend Manager/Account Manager: Get all reports
exports.getAllReports = async (req, res) => {
    try {
        const reports = await AdReport.find()
            .populate([
                { path: 'metaAdRequest', populate: ['project', 'accountManager'] },
                'performanceMarketing'
            ]);

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get single report
exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await AdReport.findById(id)
            .populate([
                { path: 'metaAdRequest', populate: ['project', 'accountManager'] },
                'performanceMarketing'
            ]);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Account Manager: Get reports for their projects
exports.getAccountManagerReports = async (req, res) => {
    try {
        const reports = await AdReport.find()
            .populate({
                path: 'metaAdRequest',
                match: { accountManager: req.user.id },
                populate: ['project', 'accountManager']
            })
            .populate('performanceMarketing');

        // Filter out reports where metaAdRequest is null (from the match)
        const filteredReports = reports.filter(r => r.metaAdRequest !== null);

        res.status(200).json({
            success: true,
            data: filteredReports
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
