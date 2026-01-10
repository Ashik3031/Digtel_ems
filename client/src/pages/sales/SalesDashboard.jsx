import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { createProspect, getSales, convertToSale, pushToBackend, revertToProspect, getTargetStats } from '../../services/salesService';
import PaymentModal from '../../components/sales/PaymentModal';
import PushModal from '../../components/sales/PushModal';
import SaleDetailModal from '../../components/sales/SaleDetailModal';
import SalesSidebar from '../../components/sales/SalesSidebar';

const SalesDashboard = ({ isEmbedded = false }) => {
    const { logout, user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [sales, setSales] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [targetStats, setTargetStats] = useState(null);

    // Calculate Current Date context
    const getInitialFilters = () => {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth(), // 0-indexed
            week: Math.ceil(now.getDate() / 7) // 1-5
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

        const handleSalesUpdate = () => {
            fetchSales();
            fetchTargetStats();
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
        <div className={`flex bg-gray-50 overflow-hidden ${isEmbedded ? 'h-full' : 'h-screen'}`}>
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
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Year:</span>
                                <div className="flex gap-1">
                                    {[2026, 2027].map(y => (
                                        <button
                                            key={y}
                                            onClick={() => handleFilterChange({ year: y, month: null, week: null })}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filters.year === y ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-6 w-px bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Month:</span>
                                <select
                                    className="bg-slate-50 border-none text-xs font-bold text-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.month === null ? '' : filters.month}
                                    onChange={(e) => handleFilterChange({ month: e.target.value === '' ? null : parseInt(e.target.value), week: null })}
                                >
                                    <option value="">Full Year</option>
                                    {months.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-6 w-px bg-slate-200"></div>
                            {filters.month !== null && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Week:</span>
                                    <div className="flex gap-1">
                                        {[null, 1, 2, 3, 4, 5].map(w => (
                                            <button
                                                key={w === null ? 'all' : w}
                                                onClick={() => handleFilterChange({ week: w })}
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${filters.week === w ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}
                                            >
                                                {w === null ? 'ALL' : `W${w}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => handleFilterChange({ year: 2026, month: null, week: null })}
                                className="ml-auto text-[10px] font-black text-blue-600 hover:underline uppercase"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Sales Dashboard</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span>Active View:</span>
                                {filters.year ? (
                                    <span className="font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md flex items-center gap-1">
                                        {filters.year}
                                        {filters.month !== null && ` › ${months[filters.month]}`}
                                        {filters.week !== null && ` › Week ${filters.week}`}
                                        {(filters.month === null && filters.week === null) && ' (Full Year)'}
                                    </span>
                                ) : (
                                    <span className="font-semibold text-gray-700">All History</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {!isEmbedded && (
                                <button onClick={handleLogout} className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium">
                                    Logout
                                </button>
                            )}
                            <button onClick={() => setShowCreate(true)} className="btn-primary w-auto flex items-center gap-2 shadow-lg shadow-blue-200 font-bold">
                                + New Lead
                            </button>
                        </div>
                    </div>

                    {/* Target Progress Bar */}
                    {targetStats && (user.role === 'Sales Executive' || user.role === 'Admin' || user.role === 'Super Admin') && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                        Monthly Sales Progress
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        Target: ${targetStats.targetAmount.toLocaleString()} • Current: ${targetStats.actualAmount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-indigo-600">{targetStats.percentage}%</span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Achievement</p>
                                </div>
                            </div>
                            <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000 ease-out flex items-center justify-end px-2"
                                    style={{ width: `${Math.min(targetStats.percentage, 100)}%` }}
                                >
                                    {targetStats.percentage > 10 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-ping"></div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                <span>Starting Area</span>
                                <span>Goal reached</span>
                            </div>
                        </div>
                    )}

                    {/* Boards / Pipeline */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Prospects Column */}
                        <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50 min-h-[75vh]">
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                                    Prospects
                                    <span className="text-xs font-normal text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">LATEST</span>
                                </h3>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-sm font-black shadow-sm">{sales.filter(s => s.status === 'Prospect').length}</span>
                            </div>
                            <div className="space-y-4">
                                {sales.filter(s => s.status === 'Prospect').map(sale => (
                                    <div key={sale._id} onClick={() => openDetailModal(sale)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 ring-1 ring-transparent hover:ring-blue-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-gray-800 group-hover:text-blue-600 transition-colors truncate pr-2">{sale.clientName}</h4>
                                            <span className="text-[9px] text-gray-400 font-bold px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 uppercase tracking-tighter whitespace-nowrap">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-bold mb-3 truncate opacity-70 italic">@{sale.companyName || 'Lead'}</p>

                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex -space-x-2">
                                                <div title={sale.assignedTo?.name} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                                                    {sale.assignedTo?.name?.charAt(0) || 'A'}
                                                </div>
                                            </div>
                                            <button onClick={(e) => openConvertModal(sale, e)} className="text-[11px] bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 font-black shadow-md shadow-blue-100 transition-all transform active:scale-95 uppercase">
                                                Convert
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sales.filter(s => s.status === 'Prospect').length === 0 && (
                                    <div className="text-center py-20 text-gray-400 font-bold opacity-30 text-sm">Empty Queue</div>
                                )}
                            </div>
                        </div>

                        {/* Active Sales Column */}
                        <div className="bg-green-50/40 p-5 rounded-2xl border border-green-100/50 min-h-[75vh]">
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="font-bold text-green-800 text-lg flex items-center gap-2">
                                    Active Sales
                                    <span className="text-xs font-normal text-green-400 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">PAID</span>
                                </h3>
                                <span className="bg-green-600 text-white px-3 py-1 rounded-xl text-sm font-black shadow-sm">{sales.filter(s => s.status === 'Sale').length}</span>
                            </div>
                            <div className="space-y-4">
                                {sales.filter(s => s.status === 'Sale').map(sale => (
                                    <div key={sale._id} onClick={() => openDetailModal(sale)} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-green-500 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 ring-1 ring-transparent hover:ring-green-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-gray-800 group-hover:text-green-600 transition-colors">{sale.clientName}</h4>
                                            <div className="text-center">
                                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">COLLECTED</div>
                                                <div className="text-sm font-black text-green-600">₹{sale.payment?.collectedAmount}</div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(sale.payment?.collectedAmount / sale.payment?.amount) * 100}%` }}></div>
                                        </div>

                                        <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-50">
                                            <button onClick={(e) => handleRevert(sale, e)} className="text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider">
                                                ↺ REVERT
                                            </button>
                                            <button onClick={(e) => openPushModal(sale, e)} className="text-[11px] bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 font-black shadow-md shadow-green-100 transition-all uppercase">
                                                Push to AM
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sales.filter(s => s.status === 'Sale').length === 0 && (
                                    <div className="text-center py-20 text-gray-400 font-bold opacity-30 text-sm">No Active Sales</div>
                                )}
                            </div>
                        </div>

                        {/* Handover Column */}
                        <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100/50 min-h-[75vh]">
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="font-bold text-purple-800 text-lg">Handed Over</h3>
                                <span className="bg-purple-600 text-white px-3 py-1 rounded-xl text-sm font-black shadow-sm">{sales.filter(s => s.status === 'Handover' || s.status === 'Completed').length}</span>
                            </div>
                            <div className="space-y-4">
                                {sales.filter(s => s.status === 'Handover' || s.status === 'Completed').map(sale => (
                                    <div key={sale._id} onClick={() => openDetailModal(sale)} className="bg-white p-4 rounded-2xl border border-gray-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-700">{sale.clientName}</h4>
                                            <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-black uppercase">{sale.status}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                            <span className="text-green-500">✓</span> Backend Managed
                                        </div>
                                    </div>
                                ))}
                                {sales.filter(s => s.status === 'Handover' || s.status === 'Completed').length === 0 && (
                                    <div className="text-center py-20 text-gray-400 font-bold opacity-30 text-sm">No History</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals remain the same */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl p-10 w-full max-w-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-5 duration-300">
                        <h2 className="text-3xl font-black mb-1 text-gray-800">New Lead Discovery</h2>
                        <p className="text-gray-400 text-sm mb-8 font-medium">Capture high-intent prospects and assign to pipeline.</p>

                        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-5">
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PRIMARY CONTACT</label>
                                <input placeholder="Full Name *" required className="input-field h-14 bg-gray-50 border-transparent focus:bg-white text-lg font-bold" value={newProspect.clientName} onChange={e => setNewProspect({ ...newProspect, clientName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PHONE</label>
                                <input placeholder="+91 ..." required className="input-field h-14 bg-gray-50 border-transparent focus:bg-white font-bold" value={newProspect.clientPhone} onChange={e => setNewProspect({ ...newProspect, clientPhone: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">COMPANY</label>
                                <input placeholder="Business Name" className="input-field h-14 bg-gray-50 border-transparent focus:bg-white font-bold" value={newProspect.companyName} onChange={e => setNewProspect({ ...newProspect, companyName: e.target.value })} />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">VALUE ESTIMATION (₹)</label>
                                <input placeholder="Target Amount" type="number" className="input-field h-14 bg-gray-50 border-transparent focus:bg-white font-bold text-xl text-blue-600" value={newProspect.price} onChange={e => setNewProspect({ ...newProspect, price: e.target.value })} />
                            </div>
                            <textarea placeholder="Specific Requirements *" required className="col-span-1 input-field h-32 bg-gray-50 border-transparent focus:bg-white resize-none font-medium p-4" value={newProspect.requirements} onChange={e => setNewProspect({ ...newProspect, requirements: e.target.value })} />
                            <textarea placeholder="Contextual Notes" className="col-span-1 input-field h-32 bg-gray-50 border-transparent focus:bg-white resize-none font-medium p-4" value={newProspect.notes} onChange={e => setNewProspect({ ...newProspect, notes: e.target.value })} />

                            <div className="col-span-2 flex justify-end gap-4 mt-6">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-8 py-3 text-gray-400 font-bold hover:text-gray-800 transition-colors uppercase tracking-widest text-xs">Discard</button>
                                <button type="submit" className="px-10 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest text-xs">Launch Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalType === 'payment' && <PaymentModal onClose={handleCloseModal} onSubmit={handlePaymentSubmit} />}
            {modalType === 'push' && <PushModal sale={selectedSale} onClose={handleCloseModal} onSubmit={handlePushSubmit} />}
            {modalType === 'detail' && <SaleDetailModal sale={selectedSale} onClose={handleCloseModal} onUpdate={fetchSales} />}
        </div>
    );
};

export default SalesDashboard;
