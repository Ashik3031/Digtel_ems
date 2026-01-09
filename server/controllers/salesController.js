const Sale = require('../models/Sale');
const AuditLog = require('../models/AuditLog');

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

        res.status(201).json({ success: true, data: sale });
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

        // If not Manager/Admin, restrict to own sales
        if (!['Super Admin', 'Admin', 'Sales Manager'].includes(req.user.role)) {
            query = { assignedTo: req.user.id };
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

        await sale.save();

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
            // For backward compatibility, "emailSent" might be deprecated or mapped
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
                // Initialize checklist dates if implied by previous steps, otherwise empty
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
