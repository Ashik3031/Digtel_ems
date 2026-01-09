import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { updateChecklist } from '../../services/salesService';

const PushModal = ({ sale, onClose, onSubmit }) => {
    // Initialize with existing values or defaults
    const [checklist, setChecklist] = useState({
        emailSentToAccounts: sale.checklist?.emailSentToAccounts || false,
        emailSentToBackend: sale.checklist?.emailSentToBackend || false,
        emailSentForPaymentConfirmation: sale.checklist?.emailSentForPaymentConfirmation || false,
        whatsappGroupCreated: sale.checklist?.whatsappGroupCreated || false
    });

    // Calculate Progress
    const totalItems = 4;
    const checkedItems = Object.values(checklist).filter(Boolean).length;
    const progress = Math.round((checkedItems / totalItems) * 100);
    const isComplete = progress === 100;

    const handleChange = (e) => {
        setChecklist({ ...checklist, [e.target.name]: e.target.checked });
    };

    const handleSaveAndExit = async () => {
        try {
            await updateChecklist(sale._id, checklist);
            Swal.fire({
                icon: 'success',
                title: 'Progress Saved',
                text: 'Your checklist progress has been saved.',
                timer: 1500,
                showConfirmButton: false
            });
            onClose();
        } catch (err) {
            Swal.fire('Error', 'Failed to save progress', 'error');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(checklist);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold mb-4">Final Handover Checklist</h2>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                        <span>Completion</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-600' : 'bg-blue-600'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-3 mb-6">
                        <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                            <input
                                type="checkbox"
                                name="emailSentToAccounts"
                                checked={checklist.emailSentToAccounts}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-700">Email sent to Accounts Team</span>
                        </label>

                        <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                            <input
                                type="checkbox"
                                name="emailSentToBackend"
                                checked={checklist.emailSentToBackend}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-700">Email sent to Backend Team</span>
                        </label>

                        <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                            <input
                                type="checkbox"
                                name="emailSentForPaymentConfirmation"
                                checked={checklist.emailSentForPaymentConfirmation}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-700">Payment Confirmation Email Sent</span>
                        </label>

                        <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                            <input
                                type="checkbox"
                                name="whatsappGroupCreated"
                                checked={checklist.whatsappGroupCreated}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-700">Client WhatsApp Group Created</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleSaveAndExit}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg"
                        >
                            Save & Exit
                        </button>
                        <button
                            type="submit"
                            disabled={!isComplete}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${isComplete
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isComplete ? 'Confirm & Push' : 'Complete Checklist'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PushModal;
