const mongoose = require('mongoose');
const User = require('../models/User');
const Sale = require('../models/Sale');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const Target = require('../models/Target');

// @desc    Get Active Projects with Full Details
// @route   GET /api/admin/active-projects
// @access  Private (Admin/Super Admin)
exports.getActiveProjects = async (req, res) => {
    try {
        // Get projects that are Active or Paused (not completed)
        const projects = await Project.find({ status: { $in: ['Active', 'Paused'] } })
            .populate('saleId')
            .sort({ createdAt: -1 });

        // Format the response with all needed details
        const formattedProjects = projects.map(project => {
            const sale = project.saleId;

            // Calculate checklist progress
            const checklistItems = Object.values(project.checklist || {});
            const completedItems = checklistItems.filter(item => item?.done === true).length;
            const totalItems = checklistItems.length;
            const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            // Get QC stats
            const pendingQC = project.qcRequests?.filter(qc => qc.status === 'Pending').length || 0;
            const totalQC = project.qcRequests?.length || 0;

            return {
                _id: project._id,
                clientName: project.clientName,
                companyName: project.companyName,
                status: project.status,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                // Payment info from sale
                payment: {
                    totalAmount: sale?.payment?.amount || 0,
                    collectedAmount: sale?.payment?.collectedAmount || 0,
                    pendingAmount: sale?.payment?.pendingAmount || 0,
                    paymentStatus: sale?.payment?.status || 'N/A',
                    paymentType: sale?.payment?.paymentType || 'N/A'
                },
                // Checklist progress
                progress: {
                    percentage: progress,
                    completed: completedItems,
                    total: totalItems
                },
                checklist: project.checklist,
                // QC info
                qc: {
                    pending: pendingQC,
                    total: totalQC,
                    requests: project.qcRequests || []
                },
                // Other details
                socialLinks: project.socialLinks || [],
                contentCalendarLink: project.contentCalendarLink,
                timeline: project.timeline || [],
                // Original sale details
                saleDetails: {
                    requirements: sale?.requirements,
                    notes: sale?.notes,
                    clientPhone: sale?.clientPhone,
                    assignedTo: sale?.assignedTo,
                    createdBy: sale?.createdBy
                }
            };
        });

        res.status(200).json({
            success: true,
            count: formattedProjects.length,
            data: formattedProjects
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get Master Dashboard Statistics
// @route   GET /api/admin/stats
// @access  Private (Admin/Super Admin)
exports.getDashboardStats = async (req, res) => {
    try {
        // Basic Counts
        const totalUsers = await User.countDocuments();

        // Sales Metrics
        const totalSales = await Sale.countDocuments();
        const prospectsCount = await Sale.countDocuments({ status: 'Prospect' });
        const activeSalesCount = await Sale.countDocuments({ status: 'Sale' });
        const handoverCount = await Sale.countDocuments({ status: 'Handover' });

        // Project Metrics
        const totalProjects = await Project.countDocuments();
        const activeProjects = await Project.countDocuments({ status: 'Active' });
        const pausedProjects = await Project.countDocuments({ status: 'Paused' });
        const completedProjects = await Project.countDocuments({ status: 'Completed' });

        // Payment Metrics (View Only Sums)
        const paymentStats = await Sale.aggregate([
            { $match: { status: { $in: ['Sale', 'Handover', 'Completed'] } } },
            {
                $group: {
                    _id: null,
                    totalCollected: { $sum: "$payment.collectedAmount" },
                    totalPending: { $sum: "$payment.pendingAmount" }
                }
            }
        ]);

        // QC Pending Count (Simplified: Count Projects where at least one QC request is Pending)
        const qcPendingCount = await Project.countDocuments({
            'qcRequests.status': 'Pending'
        });

        res.status(200).json({
            success: true,
            data: {
                users: totalUsers,
                sales: {
                    total: totalSales,
                    prospects: prospectsCount,
                    active: activeSalesCount,
                    handover: handoverCount
                },
                projects: {
                    total: totalProjects,
                    active: activeProjects,
                    paused: pausedProjects,
                    completed: completedProjects
                },
                payments: paymentStats[0] || { totalCollected: 0, totalPending: 0 },
                qc: { pending: qcPendingCount }
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get Audit Logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin/Super Admin)
exports.getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('performedBy', 'name email role');

        const total = await AuditLog.countDocuments();

        res.status(200).json({
            success: true,
            count: logs.length,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page
            },
            data: logs
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get All Sales History (Filtered)
// @route   GET /api/admin/sales-history
// @access  Private (Admin/Super Admin)
exports.getSalesHistory = async (req, res) => {
    try {
        const { agentId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (agentId) query.assignedTo = agentId;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const sales = await Sale.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        const total = await Sale.countDocuments(query);

        res.status(200).json({
            success: true,
            count: sales.length,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: parseInt(page)
            },
            data: sales
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get Agent Performance Statistics
// @route   GET /api/admin/agent-stats
// @access  Private (Admin/Super Admin)
exports.getAgentStats = async (req, res) => {
    try {
        const { agentId, months = 6 } = req.query;

        const dateLimit = new Date();
        dateLimit.setMonth(dateLimit.getMonth() - parseInt(months));

        const matchQuery = {
            createdAt: { $gte: dateLimit }
        };
        if (agentId) matchQuery.assignedTo = new mongoose.Types.ObjectId(agentId);

        const stats = await Sale.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ["$payment.collectedAmount", 0] } }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Set or Update User Target
// @route   POST /api/admin/targets
// @access  Private (Admin/Super Admin)
exports.setTarget = async (req, res) => {
    try {
        const { userId, month, year, targetAmount } = req.body;

        const target = await Target.findOneAndUpdate(
            { user: userId, month, year },
            { targetAmount, setBy: req.user.id },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: target
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get All Targets for a period
// @route   GET /api/admin/targets
// @access  Private (Admin/Super Admin)
exports.getTargets = async (req, res) => {
    try {
        const { month, year } = req.query;
        const query = {};
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);

        const targets = await Target.find(query).populate('user', 'name role email');

        res.status(200).json({
            success: true,
            data: targets
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get Team/Company Performance Overview (Target vs Actual)
// @route   GET /api/admin/performance-overview
// @access  Private (Admin/Super Admin/Sales Manager)
exports.getPerformanceOverview = async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        // 1. Determine Scope (Manager's team or all for Admin)
        let userQuery = { role: 'Sales Executive' };
        if (req.user.role === 'Sales Manager') {
            userQuery.manager = req.user.id;
        }

        const agents = await User.find(userQuery).select('name role');
        const agentIds = agents.map(a => a._id);

        // 2. Fetch Targets
        const targets = await Target.find({
            user: { $in: agentIds },
            month: targetMonth,
            year: targetYear
        });

        // 3. Fetch Actual Sales for the period
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        const sales = await Sale.aggregate([
            {
                $match: {
                    assignedTo: { $in: agentIds },
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['Sale', 'Handover', 'Completed'] }
                }
            },
            {
                $group: {
                    _id: "$assignedTo",
                    actualAmount: { $sum: { $ifNull: ["$payment.collectedAmount", 0] } },
                    saleCount: { $sum: 1 }
                }
            }
        ]);

        // 4. Merge Data
        const performanceData = agents.map(agent => {
            const target = targets.find(t => t.user.toString() === agent._id.toString());
            const sale = sales.find(s => s._id.toString() === agent._id.toString());

            return {
                agentId: agent._id,
                name: agent.name,
                targetAmount: target ? target.targetAmount : 0,
                actualAmount: sale ? sale.actualAmount : 0,
                saleCount: sale ? sale.saleCount : 0,
                percentage: target && target.targetAmount > 0
                    ? Math.round((sale ? sale.actualAmount : 0) / target.targetAmount * 100)
                    : 0
            };
        });

        res.status(200).json({
            success: true,
            data: performanceData,
            month: targetMonth,
            year: targetYear
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
