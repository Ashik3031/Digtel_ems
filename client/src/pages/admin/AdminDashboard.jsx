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

        return () => {
            socket.off('prospect_created', handleProspectCreated);
            socket.off('sale_converted', handleSaleConverted);
            socket.off('sale_reverted', handleStatsUpdate);
            socket.off('sale_updated', handleStatsUpdate);
            socket.off('payment_added', handlePaymentAdded);
            socket.off('sale_handover', handleSaleHandover);
            socket.off('new_project', handleStatsUpdate);
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
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Master Dashboard</h1>
                    <p className="text-slate-500 font-medium">System-wide performance Overview</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button
                        onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                        className={`relative p-3 rounded-xl transition-all ${showNotificationPanel ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    {/* Panel Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <MdNotifications className="text-white text-xl" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Notifications</h3>
                                <p className="text-white/70 text-xs">{notifications.length} updates</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAllNotifications}
                                    className="text-white/80 hover:text-white text-xs font-medium flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all"
                                >
                                    <MdDeleteSweep /> Clear All
                                </button>
                            )}
                            <button
                                onClick={() => setShowNotificationPanel(false)}
                                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all"
                            >
                                <MdClose className="text-lg" />
                            </button>
                        </div>
                    </div>

                    {/* Panel Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MdCheckCircle className="text-3xl text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-medium">All caught up!</p>
                                <p className="text-slate-300 text-sm">No new notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => {
                                    const style = getNotificationStyle(notification.type);
                                    return (
                                        <div
                                            key={notification.id}
                                            className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-start gap-4 group"
                                        >
                                            <div className={`${style.bg} p-2.5 rounded-xl text-white text-lg flex-shrink-0`}>
                                                {style.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-semibold text-slate-800">{notification.message}</p>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{timeAgo(notification.timestamp)}</span>
                                                </div>
                                                {notification.data?.client && (
                                                    <p className="text-sm text-slate-500 mt-0.5">
                                                        {notification.data.client}
                                                        {notification.data?.amount && (
                                                            <span className={`ml-2 font-bold ${style.text}`}>
                                                                ₹{notification.data.amount?.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-400 mt-1">by {notification.data?.user || 'System'}</p>
                                            </div>
                                            <button
                                                onClick={() => removeNotification(notification.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
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
