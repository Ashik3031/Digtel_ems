const Sale = require('../models/Sale');
const AuditLog = require('../models/AuditLog');
const Target = require('../models/Target');

// @desc    Create new prospect
// @route   POST /api/sales
// @access  Private (Sales Only)
exports.createProspect = async (req, res) => {
    try {
        const { clientName, clientPhone, companyName, price, notes, requirements } = req.body;

        const sale = await Sale.create({
            clientName,
            clientPhone,
            companyName,
            price,
            notes,
            requirements, // New field
            createdBy: req.user.id,
            assignedTo: req.user.id
        });

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('prospect_created', {
                sale,
                user: req.user.name,
                timestamp: new Date()
            });
        }

        res.status(201).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update sale/prospect details
// @route   PUT /api/sales/:id
// @access  Private (Sales Only)
exports.updateSale = async (req, res) => {
    try {
        const { clientName, clientPhone, companyName, price, notes, requirements } = req.body;

        let sale = await Sale.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        // Prevent editing locked records
        if (sale.isLocked) {
            return res.status(403).json({ success: false, message: 'Cannot edit locked/handover records' });
        }

        // Update fields
        if (clientName !== undefined) sale.clientName = clientName;
        if (clientPhone !== undefined) sale.clientPhone = clientPhone;
        if (companyName !== undefined) sale.companyName = companyName;
        if (price !== undefined) sale.price = price;
        if (notes !== undefined) sale.notes = notes;
        if (requirements !== undefined) sale.requirements = requirements;

        await sale.save();

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('sale_updated', {
                sale,
                user: req.user.name,
                timestamp: new Date()
            });
        }

        res.status(200).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all sales (Manager gets all, Exec gets own)
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res) => {
    try {
        let query = {};
        const { year, month, week } = req.query;

        // Date Filtering Logic
        if (year) {
            let startDate, endDate;
            const y = parseInt(year);

            if (week) {
                // If week is provided, we calculate based on the month/year context
                // Week 1, 2, 3, 4, 5
                const m = parseInt(month) || 0;
                const w = parseInt(week);

                // Get the first day of the month
                startDate = new Date(y, m, (w - 1) * 7 + 1);
                endDate = new Date(y, m, w * 7);
                endDate.setHours(23, 59, 59, 999);
            } else if (month) {
                const m = parseInt(month);
                startDate = new Date(y, m, 1);
                endDate = new Date(y, m + 1, 0); // Last day of month
                endDate.setHours(23, 59, 59, 999);
            } else {
                startDate = new Date(y, 0, 1);
                endDate = new Date(y, 11, 31, 23, 59, 59, 999);
            }

            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        // Role-based restriction
        if (!['Super Admin', 'Admin', 'Sales Manager'].includes(req.user.role)) {
            query.assignedTo = req.user.id;
        }

        const sales = await Sale.find(query).sort({ createdAt: -1 }).populate('assignedTo createdBy', 'name email');
        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Convert Prospect to Sale (Add Payment)
// @route   PUT /api/sales/:id/convert
// @access  Private (Sales Only)
exports.convertToSale = async (req, res) => {
    try {
        const { payment } = req.body;

        if (!payment || !payment.amount || !payment.collectedAmount) {
            return res.status(400).json({ success: false, message: 'Payment details required for conversion' });
        }

        let sale = await Sale.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        if (sale.isLocked) {
            return res.status(403).json({ success: false, message: 'Record is locked' });
        }

        sale.status = 'Sale';
        sale.payment = payment;
        sale.payment.pendingAmount = payment.amount - payment.collectedAmount;

        // Initialize payment history with first payment
        sale.payment.paymentHistory = [{
            amount: payment.collectedAmount,
            date: new Date(),
            method: payment.paymentMethod || 'Not specified',
            notes: 'Initial payment during conversion',
            recordedBy: req.user.id
        }];

        await sale.save();

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('sale_converted', {
                sale,
                user: req.user.name,
                timestamp: new Date()
            });
        }

        res.status(200).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add Payment (Installment)
// @route   PUT /api/sales/:id/add-payment
// @access  Private (Sales Only)
exports.addPayment = async (req, res) => {
    try {
        const { amount, paymentMethod, notes } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
        }

        let sale = await Sale.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        if (!sale.payment || !sale.payment.amount) {
            return res.status(400).json({ success: false, message: 'Sale must be converted first' });
        }

        // Check if payment exceeds pending amount
        if (amount > sale.payment.pendingAmount) {
            return res.status(400).json({
                success: false,
                message: `Payment amount (${amount}) exceeds pending amount (${sale.payment.pendingAmount})`
            });
        }

        // Update collected and pending amounts
        sale.payment.collectedAmount += amount;
        sale.payment.pendingAmount -= amount;

        // Update payment status if fully paid
        if (sale.payment.pendingAmount === 0) {
            sale.payment.status = 'Received';
            sale.payment.paymentType = 'Full';
        }

        // Add to payment history
        if (!sale.payment.paymentHistory) {
            sale.payment.paymentHistory = [];
        }

        sale.payment.paymentHistory.push({
            amount,
            date: new Date(),
            method: paymentMethod || 'Not specified',
            notes: notes || '',
            recordedBy: req.user.id
        });

        await sale.save();

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('payment_added', {
                sale,
                paymentAmount: amount,
                user: req.user.name,
                timestamp: new Date()
            });
        }

        res.status(200).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Push to Backend (Final Handover)
// @route   PUT /api/sales/:id/push
// @access  Private (Sales Only)
exports.pushToBackend = async (req, res) => {
    try {
        const { checklist } = req.body;

        if (!checklist || !checklist.whatsappGroupCreated || !checklist.emailSentToAccounts || !checklist.emailSentToBackend || !checklist.emailSentForPaymentConfirmation) {
            return res.status(400).json({ success: false, message: 'Incomplete checklist. All emails and WhatsApp group must be confirmed.' });
        }

        let sale = await Sale.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        if (sale.status !== 'Sale') {
            return res.status(400).json({ success: false, message: 'Must be converted to Sale before pushing' });
        }

        if (sale.isLocked) {
            return res.status(403).json({ success: false, message: 'Already pushed to backend' });
        }

        sale.status = 'Handover';
        sale.checklist = checklist;
        sale.isLocked = true; // LOCK THE RECORD

        await sale.save();

        // --- NEW: Module 06 - Create Project for Account Manager ---
        const Project = require('../models/Project');
        const project = await Project.create({
            saleId: sale._id,
            clientName: sale.clientName,
            companyName: sale.companyName,
            checklist: {
                meetingScheduled: { done: false },
                meetingMinutesSent: { done: false },
                contentCalendarSent: { done: false },
                clientApprovalReceived: { done: false },
                workStarted: { done: false },
                socialMediaLinks: { done: false },
                spreadsheetLinkAdded: { done: false },
                qcRequestsCreated: { done: false },
                redoLoopsCompleted: { done: false },
                allWorkCompleted: { done: false },
                monthlyReviewSent: { done: false }
            }
        });

        // Real-time notification to AM Dashboard
        const io = req.app.get('io');
        if (io) {
            io.emit('new_project', project);
            io.emit('sale_handover', {
                sale,
                project,
                user: req.user.name,
                timestamp: new Date()
            });
        }
        // -----------------------------------------------------------

        // Log the push
        await AuditLog.create({
            action: 'PUSH_TO_BACKEND',
            performedBy: req.user.id,
            targetResource: `Sale: ${sale.clientName}`,
            details: { saleId: sale._id, projectId: project._id }
        });

        res.status(200).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Revert Active Sale to Prospect
// @route   PUT /api/sales/:id/revert
// @access  Private (Sales Only)
exports.revertToProspect = async (req, res) => {
    try {
        let sale = await Sale.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        if (sale.status !== 'Sale') {
            return res.status(400).json({ success: false, message: 'Only active sales can be reverted' });
        }

        if (sale.isLocked) {
            return res.status(403).json({ success: false, message: 'Cannot revert a locked/handover record' });
        }

        sale.status = 'Prospect';
        await sale.save();

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('sale_reverted', {
                sale,
                user: req.user.name,
                timestamp: new Date()
            });
        }

        await AuditLog.create({
            action: 'REVERT_TO_PROSPECT',
            performedBy: req.user.id,
            targetResource: `Sale: ${sale.clientName}`,
            details: { saleId: sale._id }
        });

        res.status(200).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update Checklist Progress (Save without Push)
// @route   PUT /api/sales/:id/checklist
// @access  Private (Sales Only)
exports.updateChecklistProgress = async (req, res) => {
    try {
        const { checklist } = req.body;

        let sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        if (sale.isLocked) return res.status(403).json({ success: false, message: 'Record is locked' });

        sale.checklist = checklist;
        await sale.save();

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('checklist_updated', {
                sale,
                user: req.user.name,
                timestamp: new Date()
            });
        }

        res.status(200).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get Current Agent Target Stats (For Progress Bar)
// @route   GET /api/sales/target-stats
// @access  Private (Sales Exec Only)
exports.getTargetStats = async (req, res) => {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Check if user is Admin/Super Admin
        const isAdmin = ['Admin', 'Super Admin'].includes(req.user.role);

        if (isAdmin) {
            // For Admin: Show aggregated team stats
            const User = require('../models/User');
            const salesExecs = await User.find({ role: 'Sales Executive' }).select('_id');
            const execIds = salesExecs.map(e => e._id);

            // Get all targets for sales executives
            const targets = await Target.find({
                user: { $in: execIds },
                month,
                year
            });

            // Get all sales for the month
            const sales = await Sale.aggregate([
                {
                    $match: {
                        assignedTo: { $in: execIds },
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: { $in: ['Sale', 'Handover', 'Completed'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCollected: { $sum: { $ifNull: ["$payment.collectedAmount", 0] } },
                        count: { $sum: 1 }
                    }
                }
            ]);

            const actualAmount = sales.length > 0 ? sales[0].totalCollected : 0;
            const targetAmount = targets.reduce((sum, t) => sum + t.targetAmount, 0);
            const percentage = targetAmount > 0 ? Math.round((actualAmount / targetAmount) * 100) : 0;

            return res.status(200).json({
                success: true,
                data: {
                    targetAmount,
                    actualAmount,
                    percentage,
                    month,
                    year
                }
            });
        }

        // For Sales Executive: Show personal stats
        const target = await Target.findOne({ user: req.user.id, month, year });

        const sales = await Sale.aggregate([
            {
                $match: {
                    assignedTo: req.user._id,
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $in: ['Sale', 'Handover', 'Completed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCollected: { $sum: { $ifNull: ["$payment.collectedAmount", 0] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const actualAmount = sales.length > 0 ? sales[0].totalCollected : 0;
        const targetAmount = target ? target.targetAmount : 0;
        const percentage = targetAmount > 0 ? Math.round((actualAmount / targetAmount) * 100) : 0;

        res.status(200).json({
            success: true,
            data: {
                targetAmount,
                actualAmount,
                percentage,
                month,
                year
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
