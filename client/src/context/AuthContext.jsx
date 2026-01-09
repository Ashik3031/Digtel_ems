import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Configure axios defaults
    axios.defaults.baseURL = 'http://localhost:5000';
    axios.defaults.withCredentials = true; // Important for cookies

    // Check if user is logged in
    const checkLoggedIn = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            // Only fetch me if we have a token (or if we expected cookie-based auth, but middleware requires Bearer)
            if (!token) {
                setLoading(false);
                return;
            }

            const { data } = await axios.get('/api/auth/me');
            if (data.success) {
                setUser(data.data);
            }
        } catch (err) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkLoggedIn();
    }, []);

    // Login Function
    const login = async (email, password) => {
        setError(null);
        try {
            const { data } = await axios.post('/api/auth/login', { email, password });
            if (data.success) {
                setUser(data.user);

                // Save Token
                localStorage.setItem('token', data.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

                return data.user;
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            return false;
        }
    };

    // Logout Function
    const logout = async () => {
        try {
            // Optional: call backend to clear cookie (refreshToken)
            await axios.get('/api/auth/logout');

            // Clear Frontend State
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
