const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');

// @desc    Get all projects (AM Dashboard)
// @route   GET /api/projects
// @access  Private (AM, Admin, Backend Mgr)
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 }).populate('saleId');
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
        if (step === 'spreadsheetLinkAdded' && meta && meta.link) {
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

// @desc    Manage QC Requests
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
            requestDate: new Date()
        });

        // Mark the checklist item as done if it's the first one
        if (!project.checklist.qcRequestsCreated.done) {
            project.checklist.qcRequestsCreated.done = true;
            project.checklist.qcRequestsCreated.date = new Date();
        }

        await project.save();

        const io = req.app.get('io');
        io.emit('project_updated', project); // Notify QC team (future)

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
