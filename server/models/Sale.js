const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true
    },
    clientPhone: {
        type: String,
        required: [true, 'Client phone is required'],
        trim: true
    },
    companyName: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Prospect', 'Sale', 'Handover', 'Completed'],
        default: 'Prospect'
    },
    price: {
        type: Number
    },
    notes: {
        type: String
    },
    // New: Requirements Field
    requirements: {
        type: String
    },
    // Payment Details (Required for 'Sale' status)
    payment: {
        amount: Number,
        paymentType: {
            type: String,
            enum: ['Full', 'Partial']
        },
        collectedAmount: Number,
        pendingAmount: Number,
        status: {
            type: String,
            enum: ['Pending', 'Received'],
            default: 'Pending'
        }
    },
    // Handover Checklist (Required for 'Push to Backend')
    checklist: {
        emailSent: { type: Boolean, default: false },
        whatsappGroupCreated: { type: Boolean, default: false },
        emailSentToAccounts: { type: Boolean, default: false }, // Explicit split if requested
        emailSentToBackend: { type: Boolean, default: false }, // New
        emailSentForPaymentConfirmation: { type: Boolean, default: false } // New field
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isLocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Sale', SaleSchema);
