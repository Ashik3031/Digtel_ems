const mongoose = require('mongoose');

const AdCampaignSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    campaignType: {
        type: String,
        enum: ['Reach', 'Lead'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    budgetAllocation: {
        type: Number,
        required: true,
        min: 0
    },
    platform: {
        type: String,
        default: 'Meta'
    },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String
    },
    campaignDetails: {
        type: String // Details provided by PM when accepting/starting the campaign
    },
    metrics: {
        reach: {
            type: Number,
            default: 0
        },
        leads: {
            type: Number,
            default: 0
        },
        conversions: {
            type: Number,
            default: 0
        },
        spent: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Validation: End date must be after start date
AdCampaignSchema.pre('save', function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

module.exports = mongoose.model('AdCampaign', AdCampaignSchema);
