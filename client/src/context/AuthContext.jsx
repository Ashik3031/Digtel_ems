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
    axios.defaults.baseURL = 'http://localhost:5005';
    axios.defaults.withCredentials = true; // Important for cookies

    // Check if user is logged in
    const checkLoggedIn = async () => {
        try {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                if (savedUser) setUser(JSON.parse(savedUser));
            }

            if (!token) {
                setLoading(false);
                return;
            }

            const { data } = await axios.get('/api/auth/me');
            if (data.success) {
                const userWithId = { ...data.data, _id: data.data._id || data.data.id };
                setUser(userWithId);
                localStorage.setItem('user', JSON.stringify(userWithId));
            }
        } catch (err) {
            console.error('CheckLoggedIn Error:', err);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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
            const { data } = await axios.post('http://localhost:5005/api/auth/login', { email, password });

            if (data.success) {
                const userWithId = { ...data.user, _id: data.user.id };
                setUser(userWithId);

                // Save Token & User
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(userWithId));
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

                return userWithId;
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            console.error('Login error:', msg);
            setError(msg);
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
            localStorage.removeItem('user');
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
