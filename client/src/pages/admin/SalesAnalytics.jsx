import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiDollarSign, FiTrendingUp, FiCalendar, FiFilter, FiSearch } from 'react-icons/fi';
import { useSocket } from '../../context/SocketContext';
import Swal from 'sweetalert2';

const SalesAnalytics = () => {
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();
    const [filters, setFilters] = useState({
        agentId: '',
        status: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({ current: 1, pages: 1 });

    const fetchAgents = async () => {
        try {
            const { data } = await axios.get('/api/admin/users');
            setAgents(data.data.filter(u => ['Sales Executive', 'Sales Manager'].includes(u.role)));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch History
            const historyRes = await axios.get('/api/admin/sales-history', {
                params: { ...filters, page: pagination.current }
            });
            setHistory(historyRes.data.data);
            setPagination(historyRes.data.pagination);

            // Fetch Stats (Trends)
            const statsRes = await axios.get('/api/admin/agent-stats', {
                params: { agentId: filters.agentId }
            });
            setStats(statsRes.data.data);
        } catch (err) {
            Swal.fire('Error', 'Failed to fetch analytics data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [filters, pagination.current]);

    // Real-time socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleAnalyticsUpdate = () => {
            fetchAnalytics();
        };

        // Listen for all sales-related events
        socket.on('prospect_created', handleAnalyticsUpdate);
        socket.on('sale_converted', handleAnalyticsUpdate);
        socket.on('sale_reverted', handleAnalyticsUpdate);
        socket.on('sale_updated', handleAnalyticsUpdate);
        socket.on('payment_added', handleAnalyticsUpdate);
        socket.on('sale_handover', handleAnalyticsUpdate);

        return () => {
            socket.off('prospect_created', handleAnalyticsUpdate);
            socket.off('sale_converted', handleAnalyticsUpdate);
            socket.off('sale_reverted', handleAnalyticsUpdate);
            socket.off('sale_updated', handleAnalyticsUpdate);
            socket.off('payment_added', handleAnalyticsUpdate);
            socket.off('sale_handover', handleAnalyticsUpdate);
        };
    }, [socket, filters, pagination.current]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPagination({ ...pagination, current: 1 });
    };

    // Simple SVG Sparkline for Trend
    const renderTrendChart = () => {
        if (stats.length < 2) return <div className="h-48 flex items-center justify-center text-slate-400">Not enough data for trend</div>;

        const maxCount = Math.max(...stats.map(s => s.count), 1);
        const points = stats.map((s, i) => `${(i / (stats.length - 1)) * 100},${100 - (s.count / maxCount) * 80}`).join(' ');

        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
                <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                    <FiTrendingUp className="text-indigo-400" /> Sales Trend (6 Months)
                </h3>
                <div className="relative h-48 w-full group">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <polyline
                            fill="url(#gradient)"
                            stroke="none"
                            points={`0,100 ${points} 100,100`}
                        />
                        <polyline
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="2"
                            points={points}
                            className="drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                        />
                    </svg>
                    <div className="flex justify-between mt-4">
                        {stats.map((s, i) => (
                            <span key={i} className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                {new Date(s._id.year, s._id.month - 1).toLocaleString('default', { month: 'short' })}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const overviewStats = {
        totalSales: history.length, // This is just the page count, but in a real app we'd use aggregate
        totalRevenue: stats.reduce((acc, curr) => acc + curr.revenue, 0),
        avgPerMonth: stats.length ? (stats.reduce((acc, curr) => acc + curr.count, 0) / stats.length).toFixed(1) : 0
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Analytics</h1>
                    <p className="text-slate-500 mt-1">Deep dive into agent performance and sales metrics.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative group">
                        <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <select
                            name="agentId"
                            value={filters.agentId}
                            onChange={handleFilterChange}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All Agents</option>
                            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                    </div>

                    <div className="relative group">
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="Prospect">Prospect</option>
                            <option value="Sale">Sale</option>
                            <option value="Handover">Handover</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-indigo-200 transition-colors">
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <FiTrendingUp className="text-2xl text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Avg Sales / Month</p>
                        <h4 className="text-2xl font-bold text-slate-900">{overviewStats.avgPerMonth}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-emerald-200 transition-colors">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <FiDollarSign className="text-2xl text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Monthly Revenue</p>
                        <h4 className="text-2xl font-bold text-slate-900">${overviewStats.totalRevenue.toLocaleString()}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-amber-200 transition-colors">
                    <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center">
                        <FiCalendar className="text-2xl text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Entries (Filtered)</p>
                        <h4 className="text-2xl font-bold text-slate-900">{pagination.total}</h4>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                {renderTrendChart()}
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Historical Sales Data</h3>
                    <div className="flex gap-2 text-[12px] text-slate-400 italic">
                        Showing {history.length} of {pagination.total} records
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client / Company</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Agent</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length > 0 ? history.map((sale) => (
                                <tr key={sale._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900">{sale.clientName}</div>
                                        <div className="text-xs text-slate-400">{sale.companyName || 'No Company'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
                                                {sale.assignedTo?.name?.[0] || 'A'}
                                            </div>
                                            <span className="text-sm text-slate-600">{sale.assignedTo?.name || 'Unassigned'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase ${sale.status === 'Sale' ? 'bg-emerald-100 text-emerald-700' :
                                            sale.status === 'Handover' ? 'bg-indigo-100 text-indigo-700' :
                                                sale.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-slate-700">${sale.payment?.collectedAmount || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                                        {new Date(sale.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic font-light tracking-wide">
                                        No sales records found for the selected criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center gap-1">
                        {[...Array(pagination.pages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPagination({ ...pagination, current: i + 1 })}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pagination.current === i + 1
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesAnalytics;
