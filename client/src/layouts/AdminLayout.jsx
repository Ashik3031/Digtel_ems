import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    // Strict Admin check
    if (!user || !['Admin', 'Super Admin'].includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex bg-slate-50 min-h-screen overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 h-screen overflow-y-auto p-8 lg:p-12">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
