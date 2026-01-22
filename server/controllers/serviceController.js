const Service = require('../models/Service');

// @desc    Get all services (active only for non-admins)
// @route   GET /api/services
// @access  Private
exports.getServices = async (req, res) => {
    try {
        const isAdmin = ['Admin', 'Super Admin'].includes(req.user.role);
        const query = isAdmin ? {} : { isActive: true };

        const services = await Service.find(query)
            .sort({ category: 1, name: 1 })
            .populate('createdBy', 'name role');

        res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Admin/Super Admin)
exports.createService = async (req, res) => {
    try {
        const { name, description, category } = req.body;

        const service = await Service.create({
            name,
            description,
            category,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: service
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin/Super Admin)
exports.updateService = async (req, res) => {
    try {
        const { name, description, category, isActive } = req.body;

        let service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        if (name !== undefined) service.name = name;
        if (description !== undefined) service.description = description;
        if (category !== undefined) service.category = category;
        if (isActive !== undefined) service.isActive = isActive;

        await service.save();

        res.status(200).json({
            success: true,
            data: service
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin/Super Admin)
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        await service.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
