const admin = require('firebase-admin');

// Service account placeholder - USER NEEDS TO REPLACE THIS
// Ideally, the JSON file should be downloaded from Firebase and referenced here
// or the environment variable GOOGLE_APPLICATION_CREDENTIALS should be set.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized');
} else {
    console.warn('Firebase Service Account not found. Push notifications will be disabled.');
}

/**
 * Send push notification to specific users
 * @param {Array} userIds - Array of MongoDB user IDs
 * @param {Object} payload - Notification payload { title, body, data }
 */
const sendPushNotification = async (userIds, payload) => {
    if (!admin.apps.length) return;

    try {
        const User = require('../models/User');
        const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens');

        const tokens = users.flatMap(user => user.fcmTokens).filter(token => !!token);

        if (tokens.length === 0) return;

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            tokens: tokens,
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log(`${response.successCount} messages were sent successfully`);

        // Handle failed tokens (optional: remove invalid tokens from DB)
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            console.log('Failed tokens:', failedTokens);
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

module.exports = { admin, sendPushNotification };
