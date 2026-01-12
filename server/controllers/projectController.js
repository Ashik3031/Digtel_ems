const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');

// @desc    Get all projects (AM Dashboard)
// @route   GET /api/projects
// @access  Private (AM, Admin, Backend Mgr)
exports.getProjects = async (req, res) => {
    try {
        // Populate sale info and nested user references (sales exec and assigned AM)
        const projects = await Project.find().sort({ createdAt: -1 }).populate({
            path: 'saleId',
            populate: [
                { path: 'createdBy', select: 'name email' },
                { path: 'assignedTo', select: 'name email' }
            ]
        }).populate('qcRequests.createdBy', 'name email role');
        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update Project Checklist Step
// @route   PUT /api/projects/:id/checklist
// @access  Private (AM Only)
exports.updateChecklist = async (req, res) => {
    try {
        const { step, done, date, meta } = req.body; // meta can hold links or extra data

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        if (project.status === 'Paused') {
            return res.status(403).json({ success: false, message: 'Project is paused. Resume to edit.' });
        }

        // Update the specific step
        if (project.checklist[step]) {
            project.checklist[step].done = done;
            project.checklist[step].date = date || new Date();
        } else {
            return res.status(400).json({ success: false, message: 'Invalid checklist step' });
        }

        // Handle specific field updates (e.g. adding links)
        if (step === 'socialMediaLinks' && meta && meta.links) {
            project.socialLinks = meta.links;
        }
        // Support both legacy 'spreadsheetLinkAdded' and current 'contentCalendarSent' step names
        if ((step === 'spreadsheetLinkAdded' || step === 'contentCalendarSent') && meta && meta.link) {
            project.contentCalendarLink = meta.link;
        }

        await project.save();

        // Emit update
        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create a QC Request
// @route   POST /api/projects/:id/qc
// @access  Private (AM Only)
exports.createQCRequest = async (req, res) => {
    try {
        const { details } = req.body;

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        if (project.status === 'Paused') {
            return res.status(403).json({ success: false, message: 'Project is paused.' });
        }

        project.qcRequests.push({
            details,
            status: 'Pending',
            requestDate: new Date(),
            createdBy: req.user.id
        });

        // Mark the checklist item as done if it's the first one
        if (!project.checklist.qcRequestsCreated.done) {
            project.checklist.qcRequestsCreated.done = true;
            project.checklist.qcRequestsCreated.date = new Date();
        }

        await project.save();

        const io = req.app.get('io');
        io.emit('project_updated', project); // Notify watchers

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get all QC Requests (for QC dashboard)
// @route   GET /api/projects/qc-requests
// @access  Private (QC, Admin, Super Admin)
exports.getQCRequests = async (req, res) => {
    try {
        // Unwind QC requests so each document is a single request with project info and related sale/AM
        const agg = await Project.aggregate([
            { $unwind: '$qcRequests' },
            // Lookup sale to find assigned Account Manager
            { $lookup: {
                from: 'sales',
                localField: 'saleId',
                foreignField: '_id',
                as: 'sale'
            }},
            { $unwind: { path: '$sale', preserveNullAndEmptyArrays: true } },
                // Lookup AM user (assignedTo)
            { $lookup: {
                from: 'users',
                localField: 'sale.assignedTo',
                foreignField: '_id',
                as: 'am'
            }},
            { $unwind: { path: '$am', preserveNullAndEmptyArrays: true } },
            // Lookup Sales Executive (createdBy)
            { $lookup: {
                from: 'users',
                localField: 'sale.createdBy',
                foreignField: '_id',
                as: 'salesExec'
            }},
            { $unwind: { path: '$salesExec', preserveNullAndEmptyArrays: true } },
            // Lookup QC request creator
            { $lookup: {
                from: 'users',
                localField: 'qcRequests.createdBy',
                foreignField: '_id',
                as: 'qcCreator'
            }},
            { $unwind: { path: '$qcCreator', preserveNullAndEmptyArrays: true } },
            { $project: {
                projectId: '$_id',
                clientName: 1,
                companyName: 1,
                checklist: 1,
                socialLinks: 1,
                contentCalendarLink: 1,
                am: { _id: '$am._id', name: '$am.name', email: '$am.email' },
                salesExec: { _id: '$salesExec._id', name: '$salesExec.name', email: '$salesExec.email' },
                qcCreator: { _id: '$qcCreator._id', name: '$qcCreator.name', email: '$qcCreator.email', role: '$qcCreator.role' },
                'qcRequest._id': '$qcRequests._id',
                'qcRequest.requestDate': '$qcRequests.requestDate',
                'qcRequest.details': '$qcRequests.details',
                'qcRequest.status': '$qcRequests.status',
                'qcRequest.feedback': '$qcRequests.feedback',
                'qcRequest.resolvedDate': '$qcRequests.resolvedDate'
            }},
            { $sort: { 'qcRequest.requestDate': -1 } }
        ]);

        res.status(200).json({ success: true, count: agg.length, data: agg });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a QC Request status (Approve / Redo / Reject)
// @route   PUT /api/projects/:id/qc/:qcId
// @access  Private (QC, Admin, Super Admin)
exports.updateQCRequest = async (req, res) => {
    try {
        const { status, feedback } = req.body; // status: 'Approved' | 'Redo' | 'Rejected'

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const qc = project.qcRequests.id(req.params.qcId);
        if (!qc) return res.status(404).json({ success: false, message: 'QC request not found' });

        // Update fields
        qc.status = status;
        qc.feedback = feedback || qc.feedback;
        qc.resolvedDate = (status === 'Approved' || status === 'Rejected') ? new Date() : null;

        await project.save();

        // Emit updates
        const io = req.app.get('io');
        io.emit('qc_updated', { projectId: project._id, qc });
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: { projectId: project._id, qc } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Resubmit a QC request (AM resubmits after Redo/Rejected)
// @route   POST /api/projects/:id/qc/:qcId/resubmit
// @access  Private (Account Manager, Admin, Super Admin)
exports.resubmitQCRequest = async (req, res) => {
    try {
        const { note } = req.body; // Optional note from AM

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const qc = project.qcRequests.id(req.params.qcId);
        if (!qc) return res.status(404).json({ success: false, message: 'QC request not found' });

        // Only allow resubmitting if current status is Redo or Rejected
        if (!['Redo', 'Rejected'].includes(qc.status)) {
            return res.status(400).json({ success: false, message: 'Only Redo or Rejected requests can be resubmitted' });
        }

        qc.status = 'Pending';
        qc.feedback = '';
        qc.requestDate = new Date();
        qc.resolvedDate = null;

        if (note) {
            qc.details = `${qc.details} (Resubmitted: ${note})`;
        }

        // Update creator to the AM who resubmitted
        qc.createdBy = req.user.id;

        await project.save();

        const io = req.app.get('io');
        io.emit('qc_updated', { projectId: project._id, qc });
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: { projectId: project._id, qc } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Toggle Project Status (Pause/Resume)
// @route   PUT /api/projects/:id/status
// @access  Private (AM, Managers)
exports.toggleStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Active', 'Paused', 'Completed'

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        project.status = status;
        await project.save();

        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
