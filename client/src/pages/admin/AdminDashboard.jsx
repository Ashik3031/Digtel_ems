import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import {
    MdTrendingUp,
    MdShoppingCart,
    MdAssignment,
    MdWarning,
    MdCheckCircle,
    MdAccountBalanceWallet
} from 'react-icons/md';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/admin/stats');
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Real-time socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleStatsUpdate = () => {
            fetchStats();
        };

        // Listen for all relevant events
        socket.on('prospect_created', handleStatsUpdate);
        socket.on('sale_converted', handleStatsUpdate);
        socket.on('sale_reverted', handleStatsUpdate);
        socket.on('sale_updated', handleStatsUpdate);
        socket.on('payment_added', handleStatsUpdate);
        socket.on('sale_handover', handleStatsUpdate);
        socket.on('new_project', handleStatsUpdate);

        return () => {
            socket.off('prospect_created', handleStatsUpdate);
            socket.off('sale_converted', handleStatsUpdate);
            socket.off('sale_reverted', handleStatsUpdate);
            socket.off('sale_updated', handleStatsUpdate);
            socket.off('payment_added', handleStatsUpdate);
            socket.off('sale_handover', handleStatsUpdate);
            socket.off('new_project', handleStatsUpdate);
        };
    }, [socket]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${color} text-white text-2xl`}>
                    {icon}
                </div>
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-4 font-medium">{subtitle}</p>}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800">Master Dashboard</h1>
                <p className="text-slate-500 font-medium">System-wide performance Overview</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Prospects"
                    value={stats.sales.prospects}
                    icon={<MdTrendingUp />}
                    color="bg-blue-600"
                    subtitle="Initial leads in pipeline"
                />
                <StatCard
                    title="Active Sales"
                    value={stats.sales.active}
                    icon={<MdShoppingCart />}
                    color="bg-emerald-600"
                    subtitle="Converted & Paid sales"
                />
                <StatCard
                    title="Active Projects"
                    value={stats.projects.active}
                    icon={<MdAssignment />}
                    color="bg-purple-600"
                    subtitle="Currently managed by AMs"
                />
                <StatCard
                    title="QC Pending"
                    value={stats.qc.pending}
                    icon={<MdWarning />}
                    color="bg-orange-600"
                    subtitle="Requiring quality check"
                />
            </div>

            {/* Financial & Status Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Payment Overview */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <MdAccountBalanceWallet className="text-blue-600" /> Payment Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Total Collected</p>
                            <p className="text-4xl font-black text-emerald-800 mt-2">₹{stats.payments.totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Total Pending</p>
                            <p className="text-4xl font-black text-red-800 mt-2">₹{stats.payments.totalPending.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Project Status Breakdown */}
                <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                    <h3 className="text-xl font-bold mb-6">Workload Allocation</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Paused Projects</span>
                                <span className="font-bold text-orange-400">{stats.projects.paused}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${(stats.projects.paused / stats.projects.total) * 100}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Completed Projects</span>
                                <span className="font-bold text-emerald-400">{stats.projects.completed}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${(stats.projects.completed / stats.projects.total) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-800">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Total System Users</span>
                                <span className="text-2xl font-black">{stats.users}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
