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
        enum: ['Active', 'Paused', 'Completed'],
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

    // QC Loop
    qcRequests: [{
        requestDate: { type: Date, default: Date.now },
        details: String, // e.g. "1 reel completed"
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Redo'],
            default: 'Pending'
        },
        feedback: String, // For Redo loops
        resolvedDate: Date
    }],

    timeline: [{
        action: String,
        timestamp: { type: Date, default: Date.now },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);
