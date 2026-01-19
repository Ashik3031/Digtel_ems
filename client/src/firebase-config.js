import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from "firebase/messaging";

// USER NEEDS TO REPLACE THIS WITH THEIR ACTUAL CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: "YOUR_VAPID_KEY" // USER NEEDS TO REPLACE THIS
        });
        if (currentToken) {
            console.log("Current token for client: ", currentToken);
            return currentToken;
        } else {
            console.log("No registration token available. Request permission to generate one.");
            return null;
        }
    } catch (err) {
        console.log("An error occurred while retrieving token. ", err);
        return null;
    }
};

export const onMessageListener = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log("Foreground message received: ", payload);
        callback(payload);
    });
};

export { messaging };
