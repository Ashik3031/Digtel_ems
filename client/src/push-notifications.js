const VAPID_PUBLIC_KEY = 'BNTua2Ig62zkDOwFvyt0pfycg9GJwIaIxgJnFFale-o3zUJGZ9SxZCDjmUXIPyrdR8b8v6Y-TeLEsTQay2YQn9E'; // Should ideally be in env

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeToPush = async () => {
    try {
        if (!('serviceWorker' in navigator)) return null;

        const registration = await navigator.serviceWorker.ready;

        // Check if subscription already exists
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        return subscription;
    } catch (err) {
        console.error('Error subscribing to push notifications:', err);
        return null;
    }
};

export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered');
        } catch (err) {
            console.error('Service Worker registration failed:', err);
        }
    }
};
