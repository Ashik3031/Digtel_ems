const webpush = require('web-push');

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        'mailto:admin@telestation.online', // Replace with your email
        publicVapidKey,
        privateVapidKey
    );
    console.log('Web Push (VAPID) configured');
} else {
    console.warn('VAPID keys not found. Web Push notifications will be disabled.');
}

/**
 * Send web push notification to specific users
 * @param {Array} userIds - Array of MongoDB user IDs
 * @param {Object} payload - Notification payload { title, body, data }
 */
const sendWebPush = async (userIds, payload) => {
    if (!publicVapidKey || !privateVapidKey) return;

    try {
        const User = require('../models/User');
        const users = await User.find({ _id: { $in: userIds } }).select('pushSubscriptions');

        const subscriptions = users.flatMap(user => user.pushSubscriptions);

        if (subscriptions.length === 0) return;

        const notificationPayload = JSON.stringify({
            notification: {
                title: payload.title,
                body: payload.body,
                icon: '/logo192.png', // Default icon
                data: payload.data || {}
            }
        });

        const pushPromises = subscriptions.map(subscription =>
            webpush.sendNotification(subscription, notificationPayload)
                .catch(error => {
                    console.error('Error sending web push:', error.endpoint, error.statusCode);
                    // Optionally remove expired subscriptions (410 Gone or 404 Not Found)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        // Logic to remove stale subscription would go here
                    }
                })
        );

        await Promise.all(pushPromises);
        console.log(`Web push notifications sent to ${subscriptions.length} endpoints`);
    } catch (error) {
        console.error('Error in sendWebPush utility:', error);
    }
};

module.exports = { webpush, sendWebPush };
