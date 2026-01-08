const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a role name'],
        unique: true,
        trim: true
    },
    permissions: [{
        type: String
        // Examples: 'view_dashboard', 'create_user', 'edit_payment', etc.
    }],
    description: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', RoleSchema);
