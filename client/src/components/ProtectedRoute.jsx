import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to a 'not authorized' page or back to home/dashboard
        // For now, redirecting to login to be safe, or we could have a 403 page
        return <div className="p-8 text-center text-red-600">You are not authorized to view this page.</div>;
    }

    return <Outlet />;
};

export default ProtectedRoute;
