import { Outlet, Navigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    // Strict Admin check
    if (!user || !['Admin', 'Super Admin', 'Sales Manager'].includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    const location = useLocation();
    const isFullScreenPage = ['/admin/discussions', '/admin/sales-view'].includes(location.pathname);

    return (
        <div className="flex bg-slate-50 min-h-screen overflow-hidden">
            <AdminSidebar />
            <div className={`flex-1 h-screen ${isFullScreenPage ? 'overflow-hidden p-0' : 'overflow-y-auto p-8 lg:p-12'}`}>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
