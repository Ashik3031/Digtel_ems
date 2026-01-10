import { NavLink } from 'react-router-dom';
import {
    MdDashboard,
    MdPeople,
    MdExitToApp,
    MdBarChart,
    MdTrendingUp,
    MdTrackChanges,
    MdHistory,
    MdRequestQuote,
    MdAssignment
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', icon: <MdDashboard />, path: '/admin' },
        { name: 'Active Projects', icon: <MdAssignment />, path: '/admin/projects' },
        { name: 'Sales Analytics', icon: <MdBarChart />, path: '/admin/analytics' },
        { name: 'Performance Overview', icon: <MdTrendingUp />, path: '/admin/performance' },
        { name: 'Target Management', icon: <MdTrackChanges />, path: '/admin/targets' },
        { name: 'Sales View', icon: <MdRequestQuote />, path: '/admin/sales-view' },
        { name: 'User Management', icon: <MdPeople />, path: '/admin/users' },
        { name: 'Audit Logs', icon: <MdHistory />, path: '/admin/logs' },
    ];

    return (
        <div className="w-64 bg-slate-900 h-screen flex flex-col shrink-0 text-slate-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-blue-500">EMS</span> ADMIN
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                            ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'hover:bg-slate-800 hover:text-white'}
                        `}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
                >
                    <MdExitToApp className="text-xl" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
