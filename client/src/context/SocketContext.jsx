import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { subscribeToPush, registerServiceWorker } from '../push-notifications';
import axios from 'axios';
import Swal from 'sweetalert2';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Register SW and Setup Push
            registerServiceWorker().then(() => {
                subscribeToPush().then(subscription => {
                    if (subscription) {
                        axios.put('/api/users/subscribe', subscription)
                            .catch(err => console.error('Failed to sync push subscription:', err));
                    }
                });
            });

            // Initialize socket connection
            const socketUrl = process.env.NODE_ENV === 'production'
                ? '/'
                : `http://${window.location.hostname}:5005`;

            const newSocket = io(socketUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            console.log('Socket connecting...');

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
