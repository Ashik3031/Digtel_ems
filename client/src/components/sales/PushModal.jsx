import { useState } from 'react';

const PushModal = ({ onClose, onSubmit }) => {
    const [emailDetails, setEmailDetails] = useState({
        accounts: false,
        backend: false,
        payment: false
    });
    const [whatsapp, setWhatsapp] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (emailDetails.accounts && emailDetails.backend && emailDetails.payment && whatsapp) {
            onSubmit({
                emailSentToAccounts: emailDetails.accounts,
                emailSentToBackend: emailDetails.backend,
                emailSentForPaymentConfirmation: emailDetails.payment,
                whatsappGroupCreated: whatsapp
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold mb-2">Handover Checklist</h2>
                <p className="text-gray-500 text-sm mb-4">Complete these tasks before pushing to backend.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="emailAcc"
                            checked={emailDetails.accounts}
                            onChange={(e) => setEmailDetails({ ...emailDetails, accounts: e.target.checked })}
                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="emailAcc" className="text-gray-700 font-medium">Email sent to Accounts Creation?</label>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="emailBack"
                            checked={emailDetails.backend}
                            onChange={(e) => setEmailDetails({ ...emailDetails, backend: e.target.checked })}
                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="emailBack" className="text-gray-700 font-medium">Email sent to Backend Team?</label>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="emailPay"
                            checked={emailDetails.payment}
                            onChange={(e) => setEmailDetails({ ...emailDetails, payment: e.target.checked })}
                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="emailPay" className="text-gray-700 font-medium">Email sent for Payment Confirmation?</label>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="whatsapp"
                            checked={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.checked)}
                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="whatsapp" className="text-gray-700 font-medium">WhatsApp Group Created?</label>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button
                            type="submit"
                            disabled={!emailDetails.accounts || !emailDetails.backend || !emailDetails.payment || !whatsapp}
                            className="btn-primary w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Push to Backend
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PushModal;
