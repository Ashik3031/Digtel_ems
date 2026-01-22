const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const { sendWebPush } = require('../config/webPush');
const User = require('../models/User');

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
        }).populate('qcRequests.createdBy', 'name email role')
            .populate('remarks.user', 'name role');
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

        // Notify QC team
        User.find({ role: 'QC' }).select('_id').then(qcs => {
            const userIds = qcs.map(u => u._id);
            sendWebPush(userIds, {
                title: 'New QC Request',
                body: `New QC request for ${project.clientName}: ${details}`,
                data: { projectId: project._id.toString() }
            });
        });

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
            {
                $lookup: {
                    from: 'sales',
                    localField: 'saleId',
                    foreignField: '_id',
                    as: 'sale'
                }
            },
            { $unwind: { path: '$sale', preserveNullAndEmptyArrays: true } },
            // Lookup AM user (assignedTo)
            {
                $lookup: {
                    from: 'users',
                    localField: 'sale.assignedTo',
                    foreignField: '_id',
                    as: 'am'
                }
            },
            { $unwind: { path: '$am', preserveNullAndEmptyArrays: true } },
            // Lookup Sales Executive (createdBy)
            {
                $lookup: {
                    from: 'users',
                    localField: 'sale.createdBy',
                    foreignField: '_id',
                    as: 'salesExec'
                }
            },
            { $unwind: { path: '$salesExec', preserveNullAndEmptyArrays: true } },
            // Lookup QC request creator
            {
                $lookup: {
                    from: 'users',
                    localField: 'qcRequests.createdBy',
                    foreignField: '_id',
                    as: 'qcCreator'
                }
            },
            { $unwind: { path: '$qcCreator', preserveNullAndEmptyArrays: true } },
            {
                $project: {
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
                }
            },
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

        // Notify the AM/Creator of the QC request
        if (qc.createdBy) {
            sendWebPush([qc.createdBy], {
                title: `QC Request ${status}`,
                body: `Your QC request for ${project.clientName} has been ${status.toLowerCase()}.`,
                data: { projectId: project._id.toString() }
            });
        }

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

// @desc    Add a Remark to a Project
// @route   POST /api/projects/:id/remarks
// @access  Private (Backend Manager, Admin, AM)
exports.addRemark = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const remark = {
            text,
            date: new Date(),
            user: req.user.id
        };

        project.remarks.push(remark);
        await project.save();

        // Populate the user of the new remark for the socket event
        await project.populate('remarks.user', 'name role');

        const io = req.app.get('io');
        // We emit the whole updated project, or specifically the new remark if optimized
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project });
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

// @desc    Update Content Production Status (Production Team)
// @route   PUT /api/projects/:id/content-production
// @access  Private (Production, Admin, Super Admin)
exports.updateContentProduction = async (req, res) => {
    try {
        const { contentShot, contentPending } = req.body;

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Update content production tracking
        project.contentProduction = {
            totalContent: (contentShot || 0) + (contentPending || 0),
            contentShot: contentShot || 0,
            contentPending: contentPending || 0,
            lastUpdated: new Date()
        };

        await project.save();

        // Log action
        await AuditLog.create({
            action: 'CONTENT_PRODUCTION_UPDATED',
            performedBy: req.user.id,
            targetResource: `Project: ${project.clientName}`,
            details: { contentShot, contentPending }
        });

        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add/Update Shoot Schedule
// @route   POST /api/projects/:id/shoot-schedules
// @access  Private (Backend Manager, Admin, Super Admin)
exports.addShootSchedule = async (req, res) => {
    try {
        const { scheduledDate, scheduledTime, location, notes, shootId } = req.body;

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        if (shootId) {
            // Update existing shoot
            const shoot = project.shootSchedules.id(shootId);
            if (!shoot) return res.status(404).json({ success: false, message: 'Shoot not found' });
            shoot.scheduledDate = scheduledDate ? new Date(scheduledDate) : shoot.scheduledDate;
            shoot.scheduledTime = scheduledTime || shoot.scheduledTime;
            shoot.location = location || shoot.location;
            shoot.notes = notes || shoot.notes;
            shoot.updatedBy = req.user.id;
            shoot.updatedAt = new Date();
        } else {
            // Add new shoot
            project.shootSchedules.push({
                scheduledDate: new Date(scheduledDate),
                scheduledTime,
                location,
                notes,
                updatedBy: req.user.id
            });
        }

        await project.save();

        // Log action
        await AuditLog.create({
            action: 'SHOOT_SCHEDULE_ADDED',
            performedBy: req.user.id,
            targetResource: `Project: ${project.clientName}`,
            details: { scheduledDate, scheduledTime, location }
        });

        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Send Reminder for Shoot
// @route   PUT /api/projects/:id/shoot-schedules/:shootId/remind
// @access  Private (Backend Manager, Admin, Super Admin)
exports.remindShootSchedule = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const shoot = project.shootSchedules.id(req.params.shootId);
        if (!shoot) return res.status(404).json({ success: false, message: 'Shoot not found' });

        shoot.reminderSent = true;
        shoot.reminderSentAt = new Date();
        shoot.reminderCount = (shoot.reminderCount || 0) + 1;
        shoot.updatedAt = new Date();

        await project.save();

        // Log action
        await AuditLog.create({
            action: 'SHOOT_REMINDER_SENT',
            performedBy: req.user.id,
            targetResource: `Project: ${project.clientName}`,
            details: { scheduledDate: shoot.scheduledDate, scheduledTime: shoot.scheduledTime, reminderCount: shoot.reminderCount }
        });

        const io = req.app.get('io');
        io.emit('project_updated', project);
        io.emit('shoot_reminder', { 
            projectId: project._id, 
            clientName: project.clientName, 
            shootId: shoot._id,
            scheduledDate: shoot.scheduledDate, 
            scheduledTime: shoot.scheduledTime,
            location: shoot.location 
        });

        res.status(200).json({ success: true, data: project, message: 'Reminder sent to production team' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Mark Shoot as Completed and Return Equipment
// @route   PUT /api/projects/:id/shoot-schedules/:shootId/complete
// @access  Private (Backend Manager, Admin, Super Admin)
exports.completeShootSchedule = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const shoot = project.shootSchedules.id(req.params.shootId);
        if (!shoot) return res.status(404).json({ success: false, message: 'Shoot not found' });

        // Mark shoot as completed
        shoot.status = 'Completed';
        shoot.updatedAt = new Date();

        // Return all equipment that was marked as "In Use" for this shoot
        if (project.equipment) {
            for (let equip of project.equipment) {
                if (equip.status === 'In Use' && String(equip.assignedTo) === String(req.params.shootId)) {
                    equip.status = 'Returned';
                    equip.returnedDate = new Date();
                }
            }
        }

        await project.save();

        // Log action
        await AuditLog.create({
            action: 'SHOOT_COMPLETED',
            performedBy: req.user.id,
            targetResource: `Project: ${project.clientName}`,
            details: { scheduledDate: shoot.scheduledDate, scheduledTime: shoot.scheduledTime }
        });

        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project, message: 'Shoot marked as completed and equipment returned' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete Shoot Schedule
// @route   DELETE /api/projects/:id/shoot-schedules/:shootId
// @access  Private (Backend Manager, Admin, Super Admin)
exports.deleteShootSchedule = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const shoot = project.shootSchedules.id(req.params.shootId);
        if (!shoot) return res.status(404).json({ success: false, message: 'Shoot not found' });

        shoot.deleteOne();
        await project.save();

        // Log action
        await AuditLog.create({
            action: 'SHOOT_SCHEDULE_DELETED',
            performedBy: req.user.id,
            targetResource: `Project: ${project.clientName}`,
            details: { scheduledDate: shoot.scheduledDate }
        });

        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Add Equipment to Project
// @route   POST /api/projects/:id/equipment
// @access  Private (Production, Backend Manager, Admin)
exports.addEquipment = async (req, res) => {
    try {
        const { equipmentName, assignedTo } = req.body;

        if (!equipmentName || !assignedTo) {
            return res.status(400).json({ success: false, message: 'Equipment name and shoot ID are required' });
        }

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Check if shoot exists
        const shoot = project.shootSchedules.id(assignedTo);
        if (!shoot) return res.status(404).json({ success: false, message: 'Shoot schedule not found' });

        // Initialize equipment array if it doesn't exist
        if (!project.equipment) {
            project.equipment = [];
        }

        // Add new equipment
        project.equipment.push({
            name: equipmentName,
            status: 'In Use',
            assignedTo: assignedTo,
            takenDate: new Date()
        });

        await project.save();

        // Log action
        await AuditLog.create({
            action: 'EQUIPMENT_ADDED',
            performedBy: req.user.id,
            targetResource: `Project: ${project.clientName}`,
            details: { equipmentName, shootId: assignedTo }
        });

        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(201).json({ success: true, data: project, message: 'Equipment added successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update Equipment Status
// @route   PUT /api/projects/:id/equipment/:equipmentId
// @access  Private (Production, Backend Manager, Admin)
exports.updateEquipmentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const equipment = project.equipment.id(req.params.equipmentId);
        if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });

        equipment.status = status || 'Available';
        if (status === 'Returned') {
            equipment.returnedDate = new Date();
        }

        await project.save();

        // Log action
        await AuditLog.create({
            action: 'EQUIPMENT_STATUS_UPDATED',
            performedBy: req.user.id,
            targetResource: `Project: ${project.clientName}`,
            details: { equipmentName: equipment.name, status: equipment.status }
        });

        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project, message: 'Equipment status updated' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete Equipment
// @route   DELETE /api/projects/:id/equipment/:equipmentId
// @access  Private (Production, Backend Manager, Admin)
exports.deleteEquipment = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const equipment = project.equipment.id(req.params.equipmentId);
        if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });

        equipment.deleteOne();
        await project.save();

        // Log action
        await AuditLog.create({
            action: 'EQUIPMENT_DELETED',
            performedBy: req.user.id,
            targetResource: `Project: ${project.clientName}`,
            details: { equipmentName: equipment.name }
        });

        const io = req.app.get('io');
        io.emit('project_updated', project);

        res.status(200).json({ success: true, data: project, message: 'Equipment deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
