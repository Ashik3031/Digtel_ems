import React from 'react';

const SaleDetailModal = ({ sale, onClose }) => {
    if (!sale) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{sale.clientName}</h2>
                        <p className="text-sm text-gray-500">Created on {new Date(sale.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">Client Details</h3>
                        <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="font-medium">{sale.clientPhone}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Company</p>
                            <p className="font-medium">{sale.companyName || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Email (if captured)</p>
                            <p className="font-medium">{sale.clientEmail || 'N/A'}</p>
                        </div>
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
                        <div>
                            <p className="text-xs text-gray-500">Estimated Price</p>
                            <p className="font-medium">{sale.price || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Sales Executive</p>
                            <p className="font-medium">{sale.assignedTo?.name || sale.createdBy?.name || 'Unknown'}</p>
                        </div>
                    </div>

                    {/* Requirements & Notes - Full Width */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">Requirements & Notes</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Requirements</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{sale.requirements || 'No requirements specified.'}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                            <p className="text-xs text-gray-500 mb-1">Internal Notes</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{sale.notes || 'No notes added.'}</p>
                        </div>
                    </div>

                    {/* Payment Information (if converted) */}
                    {sale.payment && (
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="font-semibold text-gray-700 border-b pb-2">Payment Status</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                                <div>
                                    <p className="text-xs text-gray-500">Total Amount</p>
                                    <p className="font-bold text-green-700">{sale.payment.amount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Collected</p>
                                    <p className="font-bold text-green-700">{sale.payment.collectedAmount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Pending</p>
                                    <p className="font-bold text-red-600">{sale.payment.pendingAmount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Type</p>
                                    <p className="font-medium">{sale.payment.paymentType}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Handover Checklist (if available) */}
                    {sale.checklist && (
                        <div className="md:col-span-2">
                            <h3 className="font-semibold text-gray-700 border-b pb-2 mb-3">Handover Checklist</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={sale.checklist.emailSentToAccounts ? "text-green-500" : "text-gray-300"}>✔</span>
                                    <span className={sale.checklist.emailSentToAccounts ? "text-gray-700" : "text-gray-400"}>Email to Accounts</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={sale.checklist.emailSentToBackend ? "text-green-500" : "text-gray-300"}>✔</span>
                                    <span className={sale.checklist.emailSentToBackend ? "text-gray-700" : "text-gray-400"}>Email to Backend</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={sale.checklist.emailSentForPaymentConfirmation ? "text-green-500" : "text-gray-300"}>✔</span>
                                    <span className={sale.checklist.emailSentForPaymentConfirmation ? "text-gray-700" : "text-gray-400"}>Payment Confirmation Email</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={sale.checklist.whatsappGroupCreated ? "text-green-500" : "text-gray-300"}>✔</span>
                                    <span className={sale.checklist.whatsappGroupCreated ? "text-gray-700" : "text-gray-400"}>WhatsApp Group</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaleDetailModal;
