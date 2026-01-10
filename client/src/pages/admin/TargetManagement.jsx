import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTarget, FiUser, FiCalendar, FiCheck, FiEdit2 } from 'react-icons/fi';
import Swal from 'sweetalert2';

const TargetManagement = () => {
    const [agents, setAgents] = useState([]);
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [editTarget, setEditTarget] = useState({ userId: '', amount: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, targetsRes] = await Promise.all([
                axios.get('/api/admin/users'),
                axios.get('/api/admin/targets', { params: { month: selectedMonth, year: selectedYear } })
            ]);

            setAgents(usersRes.data.data.filter(u => u.role === 'Sales Executive'));
            setTargets(targetsRes.data.data);
        } catch (err) {
            Swal.fire('Error', 'Failed to fetch data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const handleSetTarget = async (userId, originalAmount) => {
        const { value: amount } = await Swal.fire({
            title: 'Set Monthly Target',
            input: 'number',
            inputLabel: 'Amount in USD',
            inputValue: originalAmount || 0,
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value || value < 0) return 'Please enter a valid amount';
            }
        });

        if (amount) {
            try {
                await axios.post('/api/admin/targets', {
                    userId,
                    month: selectedMonth,
                    year: selectedYear,
                    targetAmount: amount
                });
                Swal.fire('Success', 'Target updated successfully', 'success');
                fetchData();
            } catch (err) {
                Swal.fire('Error', 'Failed to update target', 'error');
            }
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <FiTarget className="text-indigo-600" /> Target Management
                    </h1>
                    <p className="text-slate-500 mt-1">Set and manage monthly sales goals for your team.</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map(agent => {
                    const target = targets.find(t => t.user._id === agent._id);
                    return (
                        <div key={agent._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                                        {agent.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{agent.name}</h4>
                                        <p className="text-xs text-slate-400">{agent.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSetTarget(agent._id, target?.targetAmount)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                    <FiEdit2 />
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Target</p>
                                        <div className="text-2xl font-black text-slate-800">
                                            ${target ? target.targetAmount.toLocaleString() : '0'}
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${target ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {target ? 'Set' : 'Not Set'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {agents.length === 0 && !loading && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 italic">No sales executives found in the system.</p>
                </div>
            )}
        </div>
    );
};

export default TargetManagement;
