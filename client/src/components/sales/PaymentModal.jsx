import { useState } from 'react';

const PaymentModal = ({ onClose, onSubmit }) => {
    const [amount, setAmount] = useState('');
    const [collected, setCollected] = useState('');
    const [type, setType] = useState('Partial');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            amount: Number(amount),
            collectedAmount: Number(collected),
            paymentType: type,
            status: Number(collected) >= Number(amount) ? 'Received' : 'Pending'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold mb-4">Convert to Sale</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Total Deal Price</label>
                        <input
                            type="number"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount Collected</label>
                        <input
                            type="number"
                            required
                            value={collected}
                            onChange={(e) => setCollected(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="input-field"
                        >
                            <option value="Partial">Partial</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="btn-primary w-auto">Confirm & Convert</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
