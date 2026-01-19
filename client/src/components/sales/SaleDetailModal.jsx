import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSale, addPayment, addComment, addReply, markCommentsRead } from '../../services/salesService';
import { FiMessageSquare, FiChevronRight } from 'react-icons/fi';
import Swal from 'sweetalert2';
import PaymentCollectionModal from './PaymentCollectionModal';

const SaleDetailModal = ({ sale, onClose, onUpdate }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Mark as read when opened
    useEffect(() => {
        if (sale && sale.hasUnreadManagerComment) {
            markCommentsRead(sale._id).then(() => {
                if (onUpdate) onUpdate();
            });
        }
    }, [sale?._id]);
    const [formData, setFormData] = useState({
        clientName: sale?.clientName || '',
        clientPhone: sale?.clientPhone || '',
        companyName: sale?.companyName || '',
        price: sale?.price || '',
        requirements: sale?.requirements || '',
        notes: sale?.notes || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    if (!sale) return null;

    const canEdit = sale.status === 'Prospect' || sale.status === 'Sale';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSale(sale._id, formData);
            Swal.fire('Updated!', 'Sale details have been updated successfully.', 'success');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to update sale', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            clientName: sale.clientName || '',
            clientPhone: sale.clientPhone || '',
            companyName: sale.companyName || '',
            price: sale.price || '',
            requirements: sale.requirements || '',
            notes: sale.notes || ''
        });
        setIsEditing(false);
    };

    const handlePaymentCollection = async (paymentData) => {
        try {
            await addPayment(sale._id, paymentData);
            Swal.fire('Payment Collected!', 'Payment has been recorded successfully.', 'success');
            setShowPaymentModal(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to record payment', 'error');
        }
    };

    const handleAddComment = async (text) => {
        try {
            await addComment(sale._id, text);
            if (onUpdate) onUpdate();
        } catch (err) {
            Swal.fire('Error', 'Failed to add remark', 'error');
        }
    };

    const handleAddReply = async (commentId, text) => {
        try {
            await addReply(sale._id, commentId, text);
            if (onUpdate) onUpdate();
        } catch (err) {
            Swal.fire('Error', 'Failed to add reply', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{sale.clientName}</h2>
                        <p className="text-sm text-gray-500">Created on {new Date(sale.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                            >
                                Edit
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">Client Details</h3>
                        {isEditing ? (
                            <>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Client Name *</label>
                                    <input type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Phone *</label>
                                    <input type="text" name="clientPhone" value={formData.clientPhone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Company</label>
                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{sale.clientPhone}</p></div>
                                <div><p className="text-xs text-gray-500">Company</p><p className="font-medium">{sale.companyName || 'N/A'}</p></div>
                            </>
                        )}
                    </div>

                    {/* Sale Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">Sale Information</h3>
                        <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold 
                                ${sale.status === 'Prospect' ? 'bg-blue-100 text-blue-800' :
                                    sale.status === 'Sale' ? 'bg-green-100 text-green-800' :
                                        sale.status === 'Handover' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                {sale.status}
                            </span>
                        </div>
                        {isEditing ? (
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Estimated Price</label>
                                <input type="text" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        ) : (
                            <div><p className="text-xs text-gray-500">Estimated Price</p><p className="font-medium">AED {sale.price || 'N/A'}</p></div>
                        )}
                        <div>
                            <p className="text-xs text-gray-500">Sales Executive</p>
                            <p className="font-medium">{sale.assignedTo?.name || sale.createdBy?.name || 'Unknown'}</p>
                        </div>
                    </div>

                    {/* Requirements & Notes */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">Requirements & Notes</h3>
                        {isEditing ? (
                            <>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Requirements *</label>
                                    <textarea name="requirements" value={formData.requirements} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24" required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Internal Notes</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full px-3 py-2 border border-yellow-200 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Requirements</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{sale.requirements || 'No requirements specified.'}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <p className="text-xs text-gray-500 mb-1">Internal Notes</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{sale.notes || 'No notes added.'}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Payment Information */}
                    {sale.payment && (
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="font-semibold text-gray-700">Payment Status</h3>
                                {sale.payment.pendingAmount > 0 && (
                                    <button onClick={() => setShowPaymentModal(true)} className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-sm shadow-md">Collect Payment</button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                                <div><p className="text-xs text-gray-500">Total Amount</p><p className="font-bold text-green-700">AED {sale.payment.amount}</p></div>
                                <div><p className="text-xs text-gray-500">Collected</p><p className="font-bold text-green-700">AED {sale.payment.collectedAmount}</p></div>
                                <div><p className="text-xs text-gray-500">Pending</p><p className="font-bold text-red-600">AED {sale.payment.pendingAmount}</p></div>
                                <div><p className="text-xs text-gray-500">Type</p><p className="font-medium">{sale.payment.paymentType}</p></div>
                            </div>
                        </div>
                    )}

                    {/* Comments & Remarks Section */}
                    <div className="md:col-span-2 mt-6 border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recent Remarks</h3>
                            <button
                                onClick={() => navigate('/sales/discussions')}
                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                                Open Full Discussion <FiChevronRight />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {sale.comments && sale.comments.length > 0 ? (
                                [...sale.comments].reverse().slice(0, 2).map((comment) => (
                                    <div key={comment._id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{comment.user?.name}</span>
                                            <span className="text-[9px] text-zinc-400">{new Date(comment.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 italic">"{comment.text}"</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 italic text-xs">No remarks yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                    {isEditing ? (
                        <>
                            <button onClick={handleCancel} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors" disabled={isSaving}>Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2" disabled={isSaving}>
                                {isSaving && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Close</button>
                    )}
                </div>
            </div>

            {showPaymentModal && (
                <PaymentCollectionModal
                    sale={sale}
                    onClose={() => setShowPaymentModal(false)}
                    onPaymentAdded={handlePaymentCollection}
                />
            )}
        </div>
    );
};

export default SaleDetailModal;
