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
            // Need a purely verify endpoint or just rely on handling 401s in an interceptor
            // For now, let's try to get 'me' which relies on the cookie
            const { data } = await axios.get('/api/auth/me');
            if (data.success) {
                setUser(data.data);
            }
        } catch (err) {
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
                // Token is in cookie, but if we also got it in body (optional), we can use it.
                // We relied on cookies in backend.
                return data.user; // Return user object instead of true
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            return false;
        }
    };

    // Logout Function
    const logout = async () => {
        try {
            await axios.get('/api/auth/logout');
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
