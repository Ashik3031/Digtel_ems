import React, { useState } from 'react';
import Swal from 'sweetalert2';

const PaymentCollectionModal = ({ sale, onClose, onPaymentAdded }) => {
    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: 'Bank Transfer',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amount = parseFloat(formData.amount);

        if (amount <= 0) {
            Swal.fire('Invalid Amount', 'Please enter a valid payment amount', 'error');
            return;
        }

        if (amount > sale.payment.pendingAmount) {
            Swal.fire('Amount Exceeds Pending', `Payment amount cannot exceed pending amount of ₹${sale.payment.pendingAmount}`, 'error');
            return;
        }

        setIsSubmitting(true);

        if (onPaymentAdded) {
            await onPaymentAdded({
                amount,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes
            });
        }

        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Collect Payment</h2>
                        <p className="text-sm text-gray-500">{sale.clientName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl mb-6 border border-indigo-100">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                            <p className="text-lg font-black text-gray-800">₹{sale.payment.amount}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collected</p>
                            <p className="text-lg font-black text-green-600">₹{sale.payment.collectedAmount}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                            <p className="text-lg font-black text-red-600">₹{sale.payment.pendingAmount}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Amount Received *</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                            placeholder="Enter amount"
                            required
                            max={sale.payment.pendingAmount}
                            step="0.01"
                        />
                        <p className="text-xs text-gray-400 mt-1">Maximum: ₹{sale.payment.pendingAmount}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method *</label>
                        <select
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                            required
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-20 font-medium"
                            placeholder="Add any notes about this payment..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isSubmitting ? 'Processing...' : 'Collect Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentCollectionModal;
