const mongoose = require('mongoose');

const AdReportSchema = new mongoose.Schema({
    metaAdRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MetaAdRequest',
        required: true
    },
    performanceMarketing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adQuality: {
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        comments: String,
        issues: [String]
    },
    adResults: {
        impressions: Number,
        clicks: Number,
        conversions: Number,
        ctr: Number,
        cpc: Number,
        spend: Number,
        roi: Number,
        leadGenerated: Number
    },
    performanceMetrics: {
        engagementRate: Number,
        reachVsTarget: String,
        demographicPerformance: String,
        topPerformingContent: String
    },
    recommendations: String,
    reportPeriodStart: {
        type: Date,
        required: true
    },
    reportPeriodEnd: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Approved', 'Archived'],
        default: 'Draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AdReport', AdReportSchema);
