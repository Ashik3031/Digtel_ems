import { useAuth } from '../context/AuthContext';

const Dashboard = ({ title = "Dashboard" }) => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-primary-600">EMS Portal</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user?.name} ({user?.role})</span>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
                    <p className="text-gray-600">
                        This is the protected dashboard. You have role: <span className="font-semibold text-primary-600">{user?.role}</span>.
                    </p>
                    {/* We can add role-specific widgets here later */}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
