import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FiArrowLeft,
    FiDollarSign,
    FiActivity,
    FiTarget,
    FiCalendar,
    FiTrendingUp
} from 'react-icons/fi';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const AgentPerformanceDetail = () => {
    const { agentId } = useParams();
    const navigate = useNavigate();
    const [agentData, setAgentData] = useState(null);
    const [stats, setStats] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Agent Info & Stats (6 months)
                const statsRes = await axios.get(`/api/admin/agent-stats`, {
                    params: { agentId, months: 6 }
                });

                // Fetch Recent Sales History
                const historyRes = await axios.get(`/api/admin/sales-history`, {
                    params: { agentId, limit: 10 }
                });

                // Fetch Performance Summary (Actual vs Target for current month)
                const perfRes = await axios.get(`/api/admin/performance-overview`);
                const agentPerf = perfRes.data.data.find(a => a.agentId === agentId);

                // Format stats for chart
                const chartData = statsRes.data.data.map(item => ({
                    name: `${months[item._id.month - 1]} ${item._id.year}`,
                    revenue: item.revenue,
                    sales: item.count
                }));

                setStats(chartData);
                setAgentData(agentPerf);
                setSalesHistory(historyRes.data.data);
            } catch (err) {
                console.error('Error fetching agent detail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [agentId]);

    if (loading) return <div className="flex items-center justify-center h-screen text-indigo-600 font-bold">Loading Analysis...</div>;
    if (!agentData) return <div className="p-8 text-center text-red-500">Agent data not found.</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/performance')}
                    className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{agentData.name}</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sales Executive Performance Analysis</p>
                </div>
            </div>

            {/* Top Grid: High-Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                        <FiDollarSign size={20} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Current Revenue</p>
                    <h3 className="text-2xl font-black text-slate-900">${agentData.actualAmount.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                        <FiActivity size={20} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Sales</p>
                    <h3 className="text-2xl font-black text-slate-900">{agentData.saleCount}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                        <FiTarget size={20} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Achievement</p>
                    <h3 className="text-2xl font-black text-slate-900">{agentData.percentage}%</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
                        <FiTrendingUp size={20} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Gap to Target</p>
                    <h3 className="text-2xl font-black text-slate-900">${Math.max(agentData.targetAmount - agentData.actualAmount, 0).toLocaleString()}</h3>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <FiCalendar className="text-indigo-500" /> Revenue Trend
                        </h3>
                        <span className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Last 6 Months</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <FiActivity className="text-emerald-500" /> Sales Volume
                        </h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="stepAfter" dataKey="sales" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Sales table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-800">Recent Sales Activity</h3>
                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Leads</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client / Company</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {salesHistory.map((sale) => (
                                <tr key={sale._id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <p className="font-bold text-slate-800">{sale.clientName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{sale.companyName || 'Individual'}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sale.status === 'Sale' ? 'bg-emerald-50 text-emerald-600' :
                                                sale.status === 'Handover' ? 'bg-purple-50 text-purple-600' :
                                                    'bg-slate-100 text-slate-400'
                                            }`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="font-black text-slate-700">₹{sale.payment?.amount || 0}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-slate-400 text-xs">
                                        {new Date(sale.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {salesHistory.length === 0 && (
                        <div className="p-20 text-center text-slate-400 italic">No recent sales found for this agent.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentPerformanceDetail;
