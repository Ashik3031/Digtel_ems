import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createProspect, getSales, convertToSale, pushToBackend } from '../../services/salesService';
import PaymentModal from '../../components/sales/PaymentModal';
import PushModal from '../../components/sales/PushModal';
import SaleDetailModal from '../../components/sales/SaleDetailModal';

const SalesDashboard = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const [sales, setSales] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null); // For Payment/Push modal
    const [modalType, setModalType] = useState(null); // 'payment' or 'push'

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // New Prospect State
    // New Prospect State
    const [newProspect, setNewProspect] = useState({ clientName: '', clientPhone: '', companyName: '', price: '', notes: '', requirements: '' });

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const res = await getSales();
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
        } catch (err) {
            alert('Failed to create prospect');
        }
    };

    const openConvertModal = (sale, e) => {
        e.stopPropagation(); // Prevent opening detail modal
        setSelectedSale(sale);
        setModalType('payment');
    };

    const openPushModal = (sale, e) => {
        e.stopPropagation(); // Prevent opening detail modal
        setSelectedSale(sale);
        setModalType('push');
    };

    const openDetailModal = (sale) => {
        setSelectedSale(sale);
        setModalType('detail');
    };

    const handlePaymentSubmit = async (paymentData) => {
        try {
            await convertToSale(selectedSale._id, paymentData);
            setModalType(null);
            fetchSales();
        } catch (err) {
            alert(err.response?.data?.message || 'Conversion failed');
        }
    };

    const handlePushSubmit = async (checklistData) => {
        try {
            await pushToBackend(selectedSale._id, checklistData);
            setModalType(null);
            fetchSales();
        } catch (err) {
            alert(err.response?.data?.message || 'Push failed');
        }
    };

    // Status Badge Helper
    const getStatusColor = (status) => {
        switch (status) {
            case 'Prospect': return 'bg-blue-100 text-blue-800';
            case 'Sale': return 'bg-green-100 text-green-800';
            case 'Handover': return 'bg-purple-100 text-purple-800';
            case 'Completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Sales Pipeline</h1>
                        <p className="text-gray-500">Welcome back, <span className="font-semibold text-primary-600">{user?.name}</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleLogout}
                            className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
                        >
                            Logout
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="btn-primary w-auto flex items-center gap-2"
                        >
                            + New Prospect
                        </button>
                    </div>
                </div>

                {/* Create Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold mb-4">New Prospect</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <input placeholder="Client Name *" required className="input-field" value={newProspect.clientName} onChange={e => setNewProspect({ ...newProspect, clientName: e.target.value })} />
                                <input placeholder="Phone Number *" required className="input-field" value={newProspect.clientPhone} onChange={e => setNewProspect({ ...newProspect, clientPhone: e.target.value })} />
                                <input placeholder="Company Name" className="input-field" value={newProspect.companyName} onChange={e => setNewProspect({ ...newProspect, companyName: e.target.value })} />
                                <input placeholder="Estimated Price" type="number" className="input-field" value={newProspect.price} onChange={e => setNewProspect({ ...newProspect, price: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <textarea placeholder="Requirements *" className="input-field h-24" value={newProspect.requirements} onChange={e => setNewProspect({ ...newProspect, requirements: e.target.value })} />
                                    <textarea placeholder="Notes" className="input-field h-24" value={newProspect.notes} onChange={e => setNewProspect({ ...newProspect, notes: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                    <button type="submit" className="btn-primary w-auto">Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Pipeline Board */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Prospects Column */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-800">Prospects</h3>
                            <span className="bg-white px-2 py-0.5 rounded text-sm shadow-sm">{sales.filter(s => s.status === 'Prospect').length}</span>
                        </div>
                        {sales.filter(s => s.status === 'Prospect').map(sale => (
                            <div
                                key={sale._id}
                                onClick={() => openDetailModal(sale)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800">{sale.clientName}</h4>
                                    <span className="text-xs text-gray-400">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{sale.companyName || 'No Company'}</p>
                                <p className="text-sm text-gray-500 mb-3">{sale.clientPhone}</p>

                                {['Sales Manager', 'Admin', 'Super Admin'].includes(user?.role) && (
                                    <div className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500 space-y-1">
                                        <p><span className="font-semibold">Agent:</span> {sale.assignedTo?.name || 'Unassigned'}</p>
                                        <p><span className="font-semibold">Price:</span> {sale.price || 'N/A'}</p>
                                        <p><span className="font-semibold">Req:</span> {sale.requirements || 'None'}</p>
                                    </div>
                                )}

                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={(e) => openConvertModal(sale, e)}
                                        className="text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium"
                                    >
                                        Move to Sale →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Active Sales Column */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                            <h3 className="font-semibold text-green-800">Active Sales</h3>
                            <span className="bg-white px-2 py-0.5 rounded text-sm shadow-sm">{sales.filter(s => s.status === 'Sale').length}</span>
                        </div>
                        {sales.filter(s => s.status === 'Sale').map(sale => (
                            <div
                                key={sale._id}
                                onClick={() => openDetailModal(sale)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800">{sale.clientName}</h4>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Paid: {sale.payment?.collectedAmount}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">Pending: {sale.payment?.pendingAmount}</p>

                                {['Sales Manager', 'Admin', 'Super Admin'].includes(user?.role) && (
                                    <div className="mb-3 text-xs text-gray-500 space-y-1">
                                        <p><span className="font-semibold">Agent:</span> {sale.assignedTo?.name || 'Unknown'}</p>
                                        <p><span className="font-semibold">Price:</span> {sale.price || 'N/A'}</p>
                                        <p><span className="font-semibold">Req:</span> {sale.requirements || 'None'}</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                                    <span className="text-xs text-gray-400">{sale.payment?.paymentType}</span>
                                    <button
                                        onClick={(e) => openPushModal(sale, e)}
                                        className="text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 font-medium"
                                    >
                                        Push to Backend →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Handover / Hstory Column */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                            <h3 className="font-semibold text-purple-800">Handed Over</h3>
                            <span className="bg-white px-2 py-0.5 rounded text-sm shadow-sm">{sales.filter(s => s.status === 'Handover' || s.status === 'Completed').length}</span>
                        </div>
                        {sales.filter(s => s.status === 'Handover' || s.status === 'Completed').map(sale => (
                            <div
                                key={sale._id}
                                onClick={() => openDetailModal(sale)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 opacity-75 cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800">{sale.clientName}</h4>
                                    {sale.isLocked && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Locked</span>}
                                </div>
                                <p className="text-sm text-gray-500 mb-2">Handed over to Backend</p>
                                {['Sales Manager', 'Admin', 'Super Admin'].includes(user?.role) && (
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p><span className="font-semibold">Agent:</span> {sale.assignedTo?.name || 'Unknown'}</p>
                                        <p><span className="font-semibold">Price:</span> {sale.price || 'N/A'}</p>
                                        <p><span className="font-semibold">Req:</span> {sale.requirements || 'None'}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Modals */}
                {modalType === 'payment' && (
                    <PaymentModal
                        onClose={() => setModalType(null)}
                        onSubmit={handlePaymentSubmit}
                    />
                )}
                {modalType === 'push' && (
                    <PushModal
                        onClose={() => setModalType(null)}
                        onSubmit={handlePushSubmit}
                    />
                )}
                {modalType === 'detail' && (
                    <SaleDetailModal
                        sale={selectedSale}
                        onClose={() => setModalType(null)}
                    />
                )}

            </div>
        </div>
    );
};

export default SalesDashboard;
