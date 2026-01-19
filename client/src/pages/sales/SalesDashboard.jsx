import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiMessageSquare } from 'react-icons/fi';
import { createProspect, getSales, convertToSale, pushToBackend, revertToProspect, getTargetStats, getManagerStats } from '../../services/salesService';
import PaymentModal from '../../components/sales/PaymentModal';
import PushModal from '../../components/sales/PushModal';
import SaleDetailModal from '../../components/sales/SaleDetailModal';
import SalesSidebar from '../../components/sales/SalesSidebar';
import ManagerAnalyticsModal from '../../components/sales/ManagerAnalyticsModal';

const SalesDashboard = ({ isEmbedded = false }) => {
    const { logout, user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [sales, setSales] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [targetStats, setTargetStats] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Calculate Current Date context
    const getInitialFilters = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();

        const firstDayOfMonth = new Date(year, month, 1);
        const dayOfWeek = firstDayOfMonth.getDay(); // 0(Sun) - 6(Sat)
        const daysToFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const firstSundayDate = 1 + daysToFirstSunday;

        let week = 1;
        if (date > firstSundayDate) {
            week = Math.ceil((date - firstSundayDate) / 7) + 1;
        }

        return {
            year,
            month,
            week,
            status: '',
            search: ''
        };
    };

    // Time Filtering State (Default to Current Week)
    const [filters, setFilters] = useState(getInitialFilters());

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const [newProspect, setNewProspect] = useState({ clientName: '', clientPhone: '', companyName: '', price: '', notes: '', requirements: '' });

    useEffect(() => {
        fetchSales();
        fetchTargetStats();
    }, [filters]);

    // Real-time socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleSalesUpdate = (data) => {
            fetchSales();
            fetchTargetStats();

            // Real-time update for Detail Modal if open
            if (data && data.sale) {
                setSelectedSale(prev => (prev && prev._id === data.sale._id) ? data.sale : prev);
            }
        };

        // Listen for all sales-related events
        socket.on('prospect_created', handleSalesUpdate);
        socket.on('sale_converted', handleSalesUpdate);
        socket.on('sale_reverted', handleSalesUpdate);
        socket.on('sale_updated', handleSalesUpdate);
        socket.on('payment_added', handleSalesUpdate);
        socket.on('sale_handover', handleSalesUpdate);
        socket.on('checklist_updated', handleSalesUpdate);

        return () => {
            socket.off('prospect_created', handleSalesUpdate);
            socket.off('sale_converted', handleSalesUpdate);
            socket.off('sale_reverted', handleSalesUpdate);
            socket.off('sale_updated', handleSalesUpdate);
            socket.off('payment_added', handleSalesUpdate);
            socket.off('sale_handover', handleSalesUpdate);
            socket.off('checklist_updated', handleSalesUpdate);
        };
    }, [socket, filters]);

    const fetchTargetStats = async () => {
        try {
            const res = await getTargetStats();
            if (res.success) setTargetStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSales = async () => {
        try {
            const res = await getSales(filters);
            if (res.success) setSales(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createProspect(newProspect);
            setShowCreate(false);
            setNewProspect({ clientName: '', clientPhone: '', companyName: '', price: '', notes: '', requirements: '' });
            fetchSales();
            Swal.fire('Success', 'Prospect created successfully', 'success');
        } catch (err) {
            Swal.fire('Error', 'Failed to create prospect', 'error');
        }
    };

    const openConvertModal = (sale, e) => {
        e.stopPropagation();
        setSelectedSale(sale);
        setModalType('payment');
    };

    const openPushModal = (sale, e) => {
        e.stopPropagation();
        setSelectedSale(sale);
        setModalType('push');
    };

    const openDetailModal = (sale) => {
        setSelectedSale(sale);
        setModalType('detail');
    };

    const handleRevert = async (sale, e) => {
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Revert to Prospect?',
            text: `Are you sure you want to revert "${sale.clientName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, revert it!'
        });

        if (result.isConfirmed) {
            try {
                await revertToProspect(sale._id);
                fetchSales();
                Swal.fire('Reverted!', 'Sale has been reverted to prospect.', 'success');
            } catch (err) {
                Swal.fire('Error', 'Revert failed', 'error');
            }
        }
    };

    const handlePaymentSubmit = async (paymentData) => {
        try {
            await convertToSale(selectedSale._id, paymentData);
            setModalType(null);
            fetchSales();
            Swal.fire('Converted!', 'Prospect converted to Sale.', 'success');
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Conversion failed', 'error');
        }
    };

    const handlePushSubmit = async (checklistData) => {
        try {
            await pushToBackend(selectedSale._id, checklistData);
            setModalType(null);
            fetchSales();
            Swal.fire('Pushed!', 'Project has been pushed to Account Manager.', 'success');
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Push failed', 'error');
        }
    };

    const handleCloseModal = () => {
        setModalType(null);
        fetchSales();
    };

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className={`flex bg-white dark:bg-black overflow-hidden transition-colors duration-300 ${isEmbedded ? 'h-full' : 'h-screen'}`}>
            {!isEmbedded && (
                <SalesSidebar
                    onFilterChange={handleFilterChange}
                    selectedYear={filters.year}
                    selectedMonth={filters.month}
                    selectedWeek={filters.week}
                />
            )}

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-full">
                    {/* Embedded horizontal filters */}
                    {isEmbedded && (
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Year:</span>
                                <div className="flex gap-1">
                                    {[2026, 2027].map(y => (
                                        <button
                                            key={y}
                                            onClick={() => handleFilterChange({ year: y, month: null, week: null })}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filters.year === y ? 'bg-[#D8F60D] text-black shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Month:</span>
                                <select
                                    className="bg-zinc-100 dark:bg-zinc-800 border-none text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-[#D8F60D]"
                                    value={filters.month === null ? '' : filters.month}
                                    onChange={(e) => handleFilterChange({ month: e.target.value === '' ? null : parseInt(e.target.value), week: null })}
                                >
                                    <option value="">Full Year</option>
                                    {months.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700"></div>
                            {filters.month !== null && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Week:</span>
                                    <div className="flex gap-1">
                                        {[null, 1, 2, 3, 4, 5].map(w => (
                                            <button
                                                key={w === null ? 'all' : w}
                                                onClick={() => handleFilterChange({ week: w })}
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${filters.week === w ? 'bg-[#D8F60D] text-black border-[#D8F60D] shadow-sm' : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-[#D8F60D]/50'}`}
                                            >
                                                {w === null ? 'ALL' : `W${w}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => handleFilterChange({ year: 2026, month: null, week: null })}
                                className="ml-auto text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-black dark:text-white">Sales Dashboard</h1>
                            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                <span>Active View:</span>
                                {filters.year ? (
                                    <span className="font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-md flex items-center gap-1 border border-zinc-200 dark:border-zinc-700">
                                        {filters.year}
                                        {filters.month !== null && ` › ${months[filters.month]}`}
                                        {filters.week !== null && ` › Week ${filters.week}`}
                                        {(filters.month === null && filters.week === null) && ' (Full Year)'}
                                    </span>
                                ) : (
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">All History</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {!isEmbedded && (
                                <button onClick={handleLogout} className="bg-white dark:bg-black text-red-600 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium text-sm">
                                    Logout
                                </button>
                            )}
                            {(user.role === 'Sales Manager' || user.role === 'Admin' || user.role === 'Super Admin') && (
                                <button onClick={() => navigate('/sales/manager-insights')} className="bg-white dark:bg-zinc-900 text-indigo-600 border border-indigo-200 dark:border-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors font-bold text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    Manager Insights
                                </button>
                            )}
                            <button onClick={() => navigate('/sales/discussions')} className="bg-white dark:bg-zinc-900 text-zinc-600 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors font-bold text-sm flex items-center gap-2 relative">
                                <FiMessageSquare className="w-4 h-4" />
                                Discussions
                                {sales.some(s => s.hasUnreadManagerComment) && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse"></span>
                                )}
                            </button>
                            <button onClick={() => setShowCreate(true)} className="bg-[#D8F60D] hover:bg-[#bce00b] text-black w-auto flex items-center gap-2 shadow-lg shadow-[#D8F60D]/20 font-bold px-6 py-2 rounded-xl transition-all">
                                + New Lead
                            </button>
                        </div>
                    </div>

                    {/* Target Progress Bar */}
                    {targetStats && (user.role === 'Sales Executive' || user.role === 'Admin' || user.role === 'Super Admin') && (
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#D8F60D] animate-pulse"></div>
                                        Monthly Sales Progress
                                    </h3>
                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                                        Target: ${targetStats.targetAmount.toLocaleString()} • Current: ${targetStats.actualAmount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-[#D8F60D]">{targetStats.percentage}%</span>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Achievement</p>
                                </div>
                            </div>
                            <div className="relative h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="absolute top-0 left-0 h-full bg-[#D8F60D] shadow-[0_0_10px_#D8F60D] transition-all duration-1000 ease-out flex items-center justify-end px-2"
                                    style={{ width: `${Math.min(targetStats.percentage, 100)}%` }}
                                >
                                    {targetStats.percentage > 10 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-black/40 animate-ping"></div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">
                                <span>Starting Area</span>
                                <span>Goal reached</span>
                            </div>
                        </div>
                    )}

                    {/* Boards / Pipeline */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Prospects Column */}
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 min-h-[75vh]">
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-lg flex items-center gap-2">
                                    Prospects
                                    <span className="text-xs font-normal text-zinc-500 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">LATEST</span>
                                </h3>
                                <span className="bg-[#D8F60D] text-black px-3 py-1 rounded-xl text-sm font-black shadow-sm">{sales.filter(s => s.status === 'Prospect').length}</span>
                            </div>
                            <div className="space-y-4">
                                {sales.filter(s => s.status === 'Prospect').map(sale => (
                                    <div key={sale._id} onClick={() => sale.hasUnreadManagerComment ? navigate('/sales/discussions') : openDetailModal(sale)} className="relative bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 ring-1 ring-transparent hover:ring-[#D8F60D]/50">
                                        {sale.hasUnreadManagerComment && (
                                            <div className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-black"></span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-black dark:text-white group-hover:text-[#D8F60D] transition-colors truncate pr-2">{sale.clientName}</h4>
                                            <span className="text-[9px] text-zinc-400 font-bold px-2 py-1 bg-zinc-50 dark:bg-black rounded-lg border border-zinc-100 dark:border-zinc-800 uppercase tracking-tighter whitespace-nowrap">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mb-3 truncate opacity-70 italic">@{sale.companyName || 'Lead'}</p>

                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex -space-x-2">
                                                <div title={sale.assignedTo?.name} className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-black flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                                                    {sale.assignedTo?.name?.charAt(0) || 'A'}
                                                </div>
                                            </div>
                                            <button onClick={(e) => openConvertModal(sale, e)} className="text-[11px] bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-xl hover:bg-[#D8F60D] hover:text-black font-black shadow-md transition-all transform active:scale-95 uppercase">
                                                Convert
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sales.filter(s => s.status === 'Prospect').length === 0 && (
                                    <div className="text-center py-20 text-zinc-300 dark:text-zinc-700 font-bold opacity-30 text-sm">Empty Queue</div>
                                )}
                            </div>
                        </div>

                        {/* Active Sales Column */}
                        <div className="bg-white dark:bg-zinc-900/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 min-h-[75vh]">
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-lg flex items-center gap-2">
                                    Active Sales
                                    <span className="text-xs font-normal text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">PAID</span>
                                </h3>
                                <span className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-xl text-sm font-black shadow-sm">{sales.filter(s => s.status === 'Sale').length}</span>
                            </div>
                            <div className="space-y-4">
                                {sales.filter(s => s.status === 'Sale').map(sale => (
                                    <div key={sale._id} onClick={() => sale.hasUnreadManagerComment ? navigate('/sales/discussions') : openDetailModal(sale)} className="relative bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border-l-4 border-l-[#D8F60D] border-y border-r border-y-zinc-200 dark:border-y-zinc-800 border-r-zinc-200 dark:border-r-zinc-800 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 ring-1 ring-transparent hover:ring-[#D8F60D]/50">
                                        {sale.hasUnreadManagerComment && (
                                            <div className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-black"></span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-black dark:text-white group-hover:text-[#D8F60D] transition-colors">{sale.clientName}</h4>
                                            <div className="text-center">
                                                <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">COLLECTED</div>
                                                <div className="text-sm font-black text-[#D8F60D]">AED {sale.payment?.collectedAmount}</div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mb-4">
                                            <div className="bg-[#D8F60D] h-1.5 rounded-full" style={{ width: `${(sale.payment?.collectedAmount / sale.payment?.amount) * 100}%` }}></div>
                                        </div>

                                        <div className="flex justify-between items-center mt-5 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                                            <button onClick={(e) => handleRevert(sale, e)} className="text-[10px] font-black text-zinc-400 hover:text-red-500 transition-colors uppercase tracking-wider">
                                                ↺ REVERT
                                            </button>
                                            <button onClick={(e) => openPushModal(sale, e)} className="text-[11px] bg-[#D8F60D] text-black px-5 py-2 rounded-xl hover:bg-[#bce00b] font-black shadow-md shadow-[#D8F60D]/20 transition-all uppercase">
                                                Push to AM
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sales.filter(s => s.status === 'Sale').length === 0 && (
                                    <div className="text-center py-20 text-zinc-300 dark:text-zinc-700 font-bold opacity-30 text-sm">No Active Sales</div>
                                )}
                            </div>
                        </div>

                        {/* Handover Column */}
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 min-h-[75vh]">
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-lg">Handed Over</h3>
                                <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-xl text-sm font-black shadow-sm">{sales.filter(s => s.status === 'Handover' || s.status === 'Completed').length}</span>
                            </div>
                            <div className="space-y-4">
                                {sales.filter(s => s.status === 'Handover' || s.status === 'Completed').map(sale => (
                                    <div key={sale._id} onClick={() => sale.hasUnreadManagerComment ? navigate('/sales/discussions') : openDetailModal(sale)} className="relative bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                                        {sale.hasUnreadManagerComment && (
                                            <div className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-black"></span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-zinc-700 dark:text-zinc-300">{sale.clientName}</h4>
                                            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded-lg font-black uppercase">{sale.status}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
                                            <span className="text-emerald-500">✓</span> Backend Managed
                                        </div>
                                    </div>
                                ))}
                                {sales.filter(s => s.status === 'Handover' || s.status === 'Completed').length === 0 && (
                                    <div className="text-center py-20 text-zinc-300 dark:text-zinc-700 font-bold opacity-30 text-sm">No History</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals remain the same - Backdrop updated for dark mode */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 w-full max-w-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 duration-300 border border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-3xl font-black mb-1 text-black dark:text-white">New Lead Discovery</h2>
                        <p className="text-zinc-400 text-sm mb-8 font-medium">Capture high-intent prospects and assign to pipeline.</p>

                        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-5">
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">PRIMARY CONTACT</label>
                                <input placeholder="Full Name *" required className="input-field h-14 bg-zinc-50 dark:bg-black border-transparent focus:bg-white dark:focus:bg-zinc-800 text-lg font-bold text-black dark:text-white" value={newProspect.clientName} onChange={e => setNewProspect({ ...newProspect, clientName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">PHONE</label>
                                <input placeholder="+91 ..." required className="input-field h-14 bg-zinc-50 dark:bg-black border-transparent focus:bg-white dark:focus:bg-zinc-800 font-bold text-black dark:text-white" value={newProspect.clientPhone} onChange={e => setNewProspect({ ...newProspect, clientPhone: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">COMPANY</label>
                                <input placeholder="Business Name" className="input-field h-14 bg-zinc-50 dark:bg-black border-transparent focus:bg-white dark:focus:bg-zinc-800 font-bold text-black dark:text-white" value={newProspect.companyName} onChange={e => setNewProspect({ ...newProspect, companyName: e.target.value })} />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">VALUE ESTIMATION (AED )</label>
                                <input placeholder="Target Amount" type="number" className="input-field h-14 bg-zinc-50 dark:bg-black border-transparent focus:bg-white dark:focus:bg-zinc-800 font-bold text-xl text-[#D8F60D]" value={newProspect.price} onChange={e => setNewProspect({ ...newProspect, price: e.target.value })} />
                            </div>
                            <textarea placeholder="Specific Requirements *" required className="col-span-1 input-field h-32 bg-zinc-50 dark:bg-black border-transparent focus:bg-white dark:focus:bg-zinc-800 resize-none font-medium p-4 text-black dark:text-white" value={newProspect.requirements} onChange={e => setNewProspect({ ...newProspect, requirements: e.target.value })} />
                            <textarea placeholder="Contextual Notes" className="col-span-1 input-field h-32 bg-zinc-50 dark:bg-black border-transparent focus:bg-white dark:focus:bg-zinc-800 resize-none font-medium p-4 text-black dark:text-white" value={newProspect.notes} onChange={e => setNewProspect({ ...newProspect, notes: e.target.value })} />

                            <div className="col-span-2 flex justify-end gap-4 mt-6">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-8 py-3 text-zinc-400 font-bold hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest text-xs">Discard</button>
                                <button type="submit" className="px-10 py-3 bg-[#D8F60D] text-black font-black rounded-2xl shadow-xl shadow-[#D8F60D]/20 hover:bg-[#bce00b] active:scale-95 transition-all uppercase tracking-widest text-xs">Launch Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalType === 'payment' && <PaymentModal onClose={handleCloseModal} onSubmit={handlePaymentSubmit} />}
            {modalType === 'push' && <PushModal sale={selectedSale} onClose={handleCloseModal} onSubmit={handlePushSubmit} />}
            {modalType === 'detail' && <SaleDetailModal sale={selectedSale} onClose={handleCloseModal} onUpdate={fetchSales} />}
            {showAnalytics && <ManagerAnalyticsModal onClose={() => setShowAnalytics(false)} filters={filters} />}
        </div>
    );
};

export default SalesDashboard;
