self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    console.log('Push received:', data);

    const title = data.notification ? data.notification.title : 'New Notification';
    const options = {
        body: data.notification ? data.notification.body : 'You have a new message',
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: data.notification ? data.notification.data : {}
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    // Example: Navigate to a specific page
    // event.waitUntil(clients.openWindow('/'));
});
