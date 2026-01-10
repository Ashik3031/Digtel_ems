const mongoose = require('mongoose');

const TargetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    targetAmount: {
        type: Number,
        required: true,
        default: 0
    },
    setBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure only one target per user per month/year
TargetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Target', TargetSchema);
