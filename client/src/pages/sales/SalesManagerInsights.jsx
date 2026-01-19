import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getManagerStats } from '../../services/salesService';

const SalesManagerInsights = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getManagerStats();
                if (res.success) setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch manager stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D8F60D]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 lg:p-10">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => navigate('/sales')} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <span className="text-[10px] font-black text-[#D8F60D] uppercase tracking-widest">Sales Management</span>
                    </div>
                    <h1 className="text-5xl font-black text-black dark:text-white uppercase tracking-tighter">Manager Insights</h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/sales/discussions')} className="px-6 py-3 bg-[#D8F60D] text-black rounded-2xl font-bold text-sm shadow-lg shadow-[#D8F60D]/20 hover:bg-[#bce00b] transition-all">Go to Discussions</button>
                    <button onClick={() => navigate('/sales')} className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">Back to Dashboard</button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Stats & Performance */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Total Conversions</p>
                            <h3 className="text-5xl font-black text-emerald-500">{stats?.summary.conversions}</h3>
                            <p className="text-xs text-zinc-500 mt-2 font-bold uppercase tracking-wider">from {stats?.summary.totalLeads} Total Leads</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Conversion Rate</p>
                            <h3 className="text-5xl font-black text-[#D8F60D]">{stats?.summary.conversionRate}%</h3>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-[#D8F60D]" style={{ width: `${stats?.summary.conversionRate}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Total Revenue</p>
                            <h3 className="text-3xl font-black text-black dark:text-white">AED {stats?.summary.totalRevenue.toLocaleString()}</h3>
                            <p className="text-[10px] text-emerald-500 mt-2 font-black uppercase tracking-widest">Collected: AED {stats?.summary.collectedRevenue.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Executive List */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Executive Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-bold">
                                <thead>
                                    <tr className="text-[10px] text-zinc-400 uppercase tracking-widest border-b border-zinc-50 dark:border-zinc-800">
                                        <th className="px-8 py-4">Executive</th>
                                        <th className="px-8 py-4">Leads</th>
                                        <th className="px-8 py-4">Closed</th>
                                        <th className="px-8 py-4">Revenue</th>
                                        <th className="px-8 py-4">Success</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.executives.map((exec) => (
                                        <tr key={exec._id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-8 py-6 text-black dark:text-white">{exec.name}</td>
                                            <td className="px-8 py-6 text-zinc-600 dark:text-zinc-500">{exec.totalLeads}</td>
                                            <td className="px-8 py-6 text-emerald-500">{exec.conversions}</td>
                                            <td className="px-8 py-6 text-black dark:text-white text-sm">AED {exec.revenue.toLocaleString()}</td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs px-2 py-1 bg-[#D8F60D]/10 text-black dark:text-[#D8F60D] rounded-lg">
                                                    {((exec.conversions / exec.totalLeads * 100) || 0).toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity Feed */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 flex flex-col h-[calc(100vh-250px)] sticky top-10 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-zinc-100 dark:border-zinc-800">
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Communication Feed</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Latest remarks & updates</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((activity, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate('/sales/discussions')}
                                    className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-[#D8F60D]/50 hover:bg-[#D8F60D]/5 dark:hover:bg-[#D8F60D]/5 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-black dark:text-white group-hover:text-[#D8F60D] transition-colors">{activity.userName}</span>
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">{activity.userRole}</span>
                                        </div>
                                        <span className="text-[9px] text-zinc-400 font-medium">{new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-[9px] font-black text-[#D8F60D] uppercase tracking-widest block mb-1">On: {activity.clientName}</span>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">"{activity.text}"</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-20 py-20 grayscale">
                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.855-1.246L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                <span className="text-xs font-black uppercase tracking-widest">No Recent Activity</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesManagerInsights;
