import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrendingUp, FiTarget, FiBarChart2, FiUsers, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';

const PerformanceOverview = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const fetchPerformance = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/performance-overview', {
                params: { month: selectedMonth, year: selectedYear }
            });
            setPerformance(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, [selectedMonth, selectedYear]);

    // Real-time socket listeners
    useEffect(() => {
        if (!socket) return;

        const handlePerformanceUpdate = () => {
            fetchPerformance();
        };

        // Listen for events that affect performance
        socket.on('sale_converted', handlePerformanceUpdate);
        socket.on('payment_added', handlePerformanceUpdate);
        socket.on('sale_handover', handlePerformanceUpdate);
        socket.on('sale_reverted', handlePerformanceUpdate);

        return () => {
            socket.off('sale_converted', handlePerformanceUpdate);
            socket.off('payment_added', handlePerformanceUpdate);
            socket.off('sale_handover', handlePerformanceUpdate);
            socket.off('sale_reverted', handlePerformanceUpdate);
        };
    }, [socket, selectedMonth, selectedYear]);

    const totals = performance.reduce((acc, curr) => ({
        target: acc.target + curr.targetAmount,
        actual: acc.actual + curr.actualAmount,
        sales: acc.sales + curr.saleCount
    }), { target: 0, actual: 0, sales: 0 });

    const totalPercentage = totals.target > 0 ? Math.round((totals.actual / totals.target) * 100) : 0;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <FiBarChart2 className="text-indigo-600" /> Performance Overview
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {user.role === 'Super Admin' || user.role === 'Admin'
                            ? 'Company-wide sales vs target performance.'
                            : 'Your team\'s sales vs target performance.'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                        {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                        {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Team Summary Card */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Monthly Team Aggregation</p>
                        <h2 className="text-4xl font-black">
                            ${totals.actual.toLocaleString()} <span className="text-slate-500 text-xl font-normal">/ ${totals.target.toLocaleString()}</span>
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {performance.slice(0, 5).map((p, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                                        {p.name[0]}
                                    </div>
                                ))}
                                {performance.length > 5 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                        +{performance.length - 5}
                                    </div>
                                )}
                            </div>
                            <span className="text-slate-400 text-sm">{performance.length} Agents active this month</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    className="text-slate-800"
                                    strokeWidth="8"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="58"
                                    cx="64"
                                    cy="64"
                                />
                                <circle
                                    className="text-indigo-500"
                                    strokeWidth="8"
                                    strokeDasharray={364}
                                    strokeDashoffset={364 - (totalPercentage / 100) * 364}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="58"
                                    cx="64"
                                    cy="64"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-black">{totalPercentage}%</span>
                                <span className="text-[8px] uppercase tracking-tighter text-slate-500">Achieved</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            </div>

            {/* Individual Performance List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {performance.map((agent) => (
                    <Link
                        key={agent.agentId}
                        to={`/admin/performance/${agent.agentId}`}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                    {agent.name[0]}
                                </div>
                                <h4 className="font-bold text-slate-900">{agent.name}</h4>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-black p-1 rounded ${agent.percentage >= 100 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                    {agent.percentage}%
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tight">
                                <span>${agent.actualAmount.toLocaleString()} Achieved</span>
                                <span>Goal: ${agent.targetAmount.toLocaleString()}</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${agent.percentage >= 100 ? 'bg-emerald-500' :
                                        agent.percentage >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                                        }`}
                                    style={{ width: `${Math.min(agent.percentage, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-4">
                                <div className="text-center bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Sale Count</p>
                                    <p className="text-lg font-black text-slate-700">{agent.saleCount}</p>
                                </div>
                                <div className="text-center bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Gap to Hit</p>
                                    <p className="text-lg font-black text-slate-700">
                                        ${Math.max(agent.targetAmount - agent.actualAmount, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <span className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:gap-3 transition-all">
                                    Full Analysis <FiArrowRight />
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {performance.length === 0 && !loading && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 italic">No team performance data available for this month.</p>
                </div>
            )}
        </div>
    );
};

export default PerformanceOverview;
