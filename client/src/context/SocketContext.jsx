import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Initialize socket connection
            // Use window.location.hostname to auto-adapt to localhost or network IP
            const socketUrl = process.env.NODE_ENV === 'production'
                ? '/'
                : 'http://localhost:5005';

            const newSocket = io(socketUrl, {
                withCredentials: true // Important for CORS/Cookies if needed
            });

            console.log('Socket connecting...');

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            setSocket(newSocket);

            return () => newSocket.close();
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
