const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true,
        unique: true
    },
    clientName: { type: String, required: true }, // Denormalized for easier query
    companyName: { type: String },

    status: {
        type: String,
        enum: ['Active', 'Paused', 'Completed', 'Renewal'],
        default: 'Active'
    },

    // 11-Step Checklist Flow
    checklist: {
        meetingScheduled: {
            done: { type: Boolean, default: false },
            date: Date
        },
        meetingMinutesSent: {
            done: { type: Boolean, default: false },
            date: Date
        },
        contentCalendarSent: {
            done: { type: Boolean, default: false },
            date: Date
        },
        clientApprovalReceived: {
            done: { type: Boolean, default: false },
            date: Date
        },
        workStarted: {
            done: { type: Boolean, default: false },
            date: Date
        },
        socialMediaLinks: {
            done: { type: Boolean, default: false }, // links added OR created
            date: Date
        },
        spreadsheetLinkAdded: {
            done: { type: Boolean, default: false },
            date: Date
        },
        qcRequestsCreated: {
            done: { type: Boolean, default: false }, // At least one created
            date: Date
        },
        redoLoopsCompleted: {
            done: { type: Boolean, default: false },
            date: Date
        },
        allWorkCompleted: {
            done: { type: Boolean, default: false },
            date: Date
        },
        monthlyReviewSent: {
            done: { type: Boolean, default: false },
            date: Date
        }
    },

    // Specific Data Fields
    socialLinks: [{
        platform: String,
        url: String
    }],
    contentCalendarLink: { type: String },
    
    // Content Production Tracking
    contentProduction: {
        totalContent: { type: Number, default: 0 },
        contentShot: { type: Number, default: 0 },
        contentPending: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    },

    // Shoot Schedule - Multiple shoots
    shootSchedules: [{
        scheduledDate: Date,
        scheduledTime: String, // e.g., "10:30 AM"
        location: String,
        notes: String,
        reminderSent: { type: Boolean, default: false },
        reminderSentAt: Date,
        reminderCount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['Scheduled', 'Completed', 'Cancelled'],
            default: 'Scheduled'
        },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now }
    }],

    // Equipment Tracking for Shoots
    equipment: [{
        name: String,
        status: {
            type: String,
            enum: ['In Use', 'Available', 'Returned', 'Damaged'],
            default: 'Available'
        },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'shootSchedules' }, // Reference to shoot schedule
        takenDate: { type: Date, default: Date.now },
        returnedDate: Date
    }],

    // QC Loop
    qcRequests: [{
        requestDate: { type: Date, default: Date.now },
        details: String, // e.g. "1 reel completed"
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Redo', 'Rejected'],
            default: 'Pending'
        },
        feedback: String, // For Redo loops
        resolvedDate: Date,
        // user who created or resubmitted this QC request
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    timeline: [{
        action: String,
        timestamp: { type: Date, default: Date.now },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],

    // Remarks from Backend Manager (or others)
    remarks: [{
        text: String,
        date: { type: Date, default: Date.now },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);
