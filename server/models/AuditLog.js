const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetResource: {
        type: String, // e.g., "User: 12345" or "Payment: 67890"
    },
    details: {
        type: Object // Flexible field for what changed
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
