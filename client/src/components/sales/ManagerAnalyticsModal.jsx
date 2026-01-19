import React, { useState, useEffect } from 'react';
import { getManagerStats } from '../../services/salesService';

const ManagerAnalyticsModal = ({ onClose, filters }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getManagerStats(filters);
                if (res.success) setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch manager stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [filters]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D8F60D]"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-5xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 border border-zinc-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter">Manager Insights</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">Performance Overview & Executive Progress</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-black dark:hover:text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-zinc-50 dark:bg-black p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Leads</p>
                        <h3 className="text-3xl font-black text-black dark:text-white">{stats?.summary.totalLeads}</h3>
                    </div>
                    <div className="bg-zinc-50 dark:bg-black p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Conversions</p>
                        <h3 className="text-3xl font-black text-emerald-500">{stats?.summary.conversions}</h3>
                    </div>
                    <div className="bg-zinc-50 dark:bg-black p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Conversion Rate</p>
                        <h3 className="text-3xl font-black text-[#D8F60D]">{stats?.summary.conversionRate}%</h3>
                    </div>
                    <div className="bg-zinc-50 dark:bg-black p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Revenue</p>
                        <h3 className="text-2xl font-black text-black dark:text-white">AED {stats?.summary.totalRevenue.toLocaleString()}</h3>
                        <p className="text-[10px] text-zinc-500 mt-1 font-bold italic">Collected: AED {stats?.summary.collectedRevenue.toLocaleString()}</p>
                    </div>
                </div>

                {/* Executive Performance Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-tight">Sales Executive Progress</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-bold">
                            <thead>
                                <tr className="text-[10px] text-zinc-400 uppercase tracking-widest border-b border-zinc-50 dark:border-zinc-800">
                                    <th className="px-8 py-4">Name</th>
                                    <th className="px-8 py-4">Total Leads</th>
                                    <th className="px-8 py-4">Conversions</th>
                                    <th className="px-8 py-4">Conversion %</th>
                                    <th className="px-8 py-4 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.executives.map((exec) => (
                                    <tr key={exec._id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-8 py-5 text-black dark:text-white">{exec.name}</td>
                                        <td className="px-8 py-5 text-zinc-600 dark:text-zinc-400">{exec.totalLeads}</td>
                                        <td className="px-8 py-5 text-emerald-500">{exec.conversions}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#D8F60D]"
                                                        style={{ width: `${(exec.conversions / exec.totalLeads * 100) || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs">{((exec.conversions / exec.totalLeads * 100) || 0).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right text-black dark:text-white">AED {exec.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {stats?.executives.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-zinc-300 font-bold opacity-30 uppercase">No Data Available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-10 flex justify-center">
                    <button onClick={onClose} className="px-10 py-3 bg-black dark:bg-white text-white dark:text-black font-black rounded-2xl hover:bg-[#D8F60D] hover:text-black transition-all active:scale-95 uppercase tracking-widest text-xs">Close Insights</button>
                </div>
            </div>
        </div>
    );
};

export default ManagerAnalyticsModal;
