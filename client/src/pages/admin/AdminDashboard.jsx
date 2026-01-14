import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import {
    MdTrendingUp,
    MdShoppingCart,
    MdAssignment,
    MdWarning,
    MdCheckCircle,
    MdAccountBalanceWallet,
    MdClose,
    MdNotifications,
    MdPayment,
    MdSend,
    MdDeleteSweep
} from 'react-icons/md';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const socket = useSocket();

    // Add a notification
    const addNotification = (type, message, data) => {
        const id = Date.now();
        const newNotification = {
            id,
            type,
            message,
            data,
            timestamp: new Date()
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep max 20
    };

    // Remove a notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Clear all notifications
    const clearAllNotifications = () => {
        setNotifications([]);
    };

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

        // Notification handlers
        const handleSaleConverted = (data) => {
            handleStatsUpdate();
            addNotification(
                'sale',
                `New Sale Converted!`,
                { client: data.sale?.clientName, user: data.user, amount: data.sale?.payment?.collectedAmount }
            );
        };

        const handlePaymentAdded = (data) => {
            handleStatsUpdate();
            addNotification(
                'payment',
                `Payment Received!`,
                { client: data.sale?.clientName, user: data.user, amount: data.paymentAmount }
            );
        };

        const handleSaleHandover = (data) => {
            handleStatsUpdate();
            addNotification(
                'handover',
                `Sale Pushed to Backend!`,
                { client: data.sale?.clientName, user: data.user }
            );
        };

        const handleProspectCreated = (data) => {
            handleStatsUpdate();
            addNotification(
                'prospect',
                `New Prospect Added!`,
                { client: data.sale?.clientName, user: data.user }
            );
        };

        // Listen for all relevant events
        socket.on('prospect_created', handleProspectCreated);
        socket.on('sale_converted', handleSaleConverted);
        socket.on('sale_reverted', handleStatsUpdate);
        socket.on('sale_updated', handleStatsUpdate);
        socket.on('payment_added', handlePaymentAdded);
        socket.on('sale_handover', handleSaleHandover);
        socket.on('new_project', handleStatsUpdate);
        socket.on('project_updated', handleStatsUpdate);

        return () => {
            socket.off('prospect_created', handleProspectCreated);
            socket.off('sale_converted', handleSaleConverted);
            socket.off('sale_reverted', handleStatsUpdate);
            socket.off('sale_updated', handleStatsUpdate);
            socket.off('payment_added', handlePaymentAdded);
            socket.off('sale_handover', handleSaleHandover);
            socket.off('new_project', handleStatsUpdate);
            socket.off('project_updated', handleStatsUpdate);
        };
    }, [socket]);

    // Notification icon and color based on type
    const getNotificationStyle = (type) => {
        switch (type) {
            case 'sale':
                return { icon: <MdShoppingCart />, bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' };
            case 'payment':
                return { icon: <MdPayment />, bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' };
            case 'handover':
                return { icon: <MdSend />, bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' };
            case 'prospect':
                return { icon: <MdTrendingUp />, bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' };
            default:
                return { icon: <MdNotifications />, bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-50' };
        }
    };

    // Format time ago
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] bg-white dark:bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D8F60D]"></div>
        </div>
    );

    const StatCard = ({ title, value, icon, color, subtitle, neon }) => (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{title}</p>
                    <h3 className={`text-3xl font-black mt-1 ${neon ? 'text-[#D8F60D]' : 'text-black dark:text-white'}`}>{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${color} text-white text-2xl shadow-lg`}>
                    {icon}
                </div>
            </div>
            {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-4 font-medium">{subtitle}</p>}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative bg-white dark:bg-black min-h-screen p-8 transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-black dark:text-white">Master Dashboard</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">System-wide performance Overview</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button
                        onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                        className={`relative p-3 rounded-xl transition-all ${showNotificationPanel ? 'bg-[#D8F60D] text-black shadow-lg shadow-[#D8F60D]/20' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                        <MdNotifications className="text-xl" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {notifications.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification Panel Widget */}
            {showNotificationPanel && (
                <div className="absolute right-8 top-24 z-50 w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    {/* Panel Header */}
                    <div className="bg-black dark:bg-black px-6 py-4 flex items-center justify-between border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                                <MdNotifications className="text-[#D8F60D] text-xl" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Notifications</h3>
                                <p className="text-zinc-400 text-xs">{notifications.length} updates</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAllNotifications}
                                    className="text-zinc-400 hover:text-white text-xs font-medium flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-all"
                                >
                                    <MdDeleteSweep /> Clear All
                                </button>
                            )}
                            <button
                                onClick={() => setShowNotificationPanel(false)}
                                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-all"
                            >
                                <MdClose className="text-lg" />
                            </button>
                        </div>
                    </div>

                    {/* Panel Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MdCheckCircle className="text-3xl text-zinc-300 dark:text-zinc-600" />
                                </div>
                                <p className="text-zinc-400 font-medium">All caught up!</p>
                                <p className="text-zinc-300 dark:text-zinc-600 text-sm">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {notifications.map((notification) => {
                                    const style = getNotificationStyle(notification.type);
                                    return (
                                        <div
                                            key={notification.id}
                                            className="px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-start gap-4 group"
                                        >
                                            <div className={`${style.bg} p-2.5 rounded-xl text-white text-lg flex-shrink-0`}>
                                                {style.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{notification.message}</p>
                                                    <span className="text-[10px] text-zinc-400 whitespace-nowrap">{timeAgo(notification.timestamp)}</span>
                                                </div>
                                                {notification.data?.client && (
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                        {notification.data.client}
                                                        {notification.data?.amount && (
                                                            <span className={`ml-2 font-bold ${style.text}`}>
                                                                AED {notification.data.amount?.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                                <p className="text-xs text-zinc-400 mt-1">by {notification.data?.user || 'System'}</p>
                                            </div>
                                            <button
                                                onClick={() => removeNotification(notification.id)}
                                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-1"
                                            >
                                                <MdClose />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                    color="bg-[#D8F60D] text-black"
                    subtitle="Converted & Paid sales"
                    neon={true}
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
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center gap-2">
                        <MdAccountBalanceWallet className="text-[#D8F60D]" /> Payment Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total Collected</p>
                            <p className="text-4xl font-black text-emerald-800 dark:text-emerald-300 mt-2">AED {stats.payments.totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/30">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Total Pending</p>
                            <p className="text-4xl font-black text-red-800 dark:text-red-300 mt-2">AED {stats.payments.totalPending.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Project Status Breakdown */}
                <div className="bg-black dark:bg-zinc-900 p-8 rounded-3xl shadow-xl text-white border border-zinc-800">
                    <h3 className="text-xl font-bold mb-6 text-white">Workload Allocation</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Paused Projects</span>
                                <span className="font-bold text-amber-400">{stats.projects.paused}</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${(stats.projects.paused / stats.projects.total) * 100}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Completed Projects</span>
                                <span className="font-bold text-[#D8F60D]">{stats.projects.completed}</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                <div className="bg-[#D8F60D] h-1.5 rounded-full" style={{ width: `${(stats.projects.completed / stats.projects.total) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-zinc-800">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Total System Users</span>
                                <span className="text-2xl font-black text-white">{stats.users}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
