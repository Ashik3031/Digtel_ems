import React, { useState } from 'react';
import axios from 'axios';

const ProjectDetailModal = ({ project, onClose }) => {
    const isPaused = project.status === 'Paused';
    const [loading, setLoading] = useState(false);
    const [qcText, setQcText] = useState('');

    // Checklist Items Definition
    const checklistItems = [
        { key: 'meetingScheduled', label: '1. Meeting Scheduled' },
        { key: 'meetingMinutesSent', label: '2. Meeting Minutes Sent' },
        { key: 'contentCalendarSent', label: '3. Content + Calendar Sent' },
        { key: 'clientApprovalReceived', label: '4. Client Approval Received' },
        { key: 'workStarted', label: '5. Work Started' },
        { key: 'socialMediaLinks', label: '6. Social Media Links Created/Added' },
        { key: 'spreadsheetLinkAdded', label: '7. Content Calendar Link (Sheets)' },
        { key: 'qcRequestsCreated', label: '8. QC Request Loop Started' },
        { key: 'redoLoopsCompleted', label: '9. Redo Loops Completed' },
        { key: 'allWorkCompleted', label: '10. Mark All Work Completed' },
        { key: 'monthlyReviewSent', label: '11. Monthly Review Sent' }
    ];

    const handleChecklistToggle = async (key, currentValue) => {
        if (isPaused) return alert('Resume project to edit.');

        try {
            setLoading(true);
            await axios.put(`/api/projects/${project._id}/checklist`, {
                step: key,
                done: !currentValue
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        const newStatus = isPaused ? 'Active' : 'Paused';
        try {
            setLoading(true);
            await axios.put(`/api/projects/${project._id}/status`, { status: newStatus });
        } catch (err) {
            alert('Status update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleQCSubmit = async (e) => {
        e.preventDefault();
        if (isPaused) return alert('Resume project to submit QC.');

        try {
            setLoading(true);
            await axios.post(`/api/projects/${project._id}/qc`, { details: qcText });
            setQcText('');
        } catch (err) {
            alert('QC request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-start bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{project.clientName}</h2>
                        <p className="text-gray-500">{project.companyName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleStatusToggle}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isPaused ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                        >
                            {isPaused ? 'Resume Project' : 'Pause Project'}
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            Close
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Checklist */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Workflow Checklist</h3>
                        <div className="space-y-3">
                            {checklistItems.map((item) => {
                                const stepData = project.checklist[item.key];
                                return (
                                    <div
                                        key={item.key}
                                        className={`flex items-center p-3 rounded-lg border transition-all ${stepData.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={stepData.done}
                                            onChange={() => handleChecklistToggle(item.key, stepData.done)}
                                            disabled={isPaused || loading}
                                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer disabled:opacity-50"
                                        />
                                        <div className="ml-3">
                                            <span className={`font-medium ${stepData.done ? 'text-green-800' : 'text-gray-700'}`}>
                                                {item.label}
                                            </span>
                                            {stepData.done && stepData.date && (
                                                <p className="text-xs text-green-600">
                                                    {new Date(stepData.date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: QC & Tools */}
                    <div className="space-y-8">
                        {/* QC Section */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-3">QC Requests</h3>

                            {/* History List */}
                            <div className="max-h-40 overflow-y-auto space-y-2 mb-4 pr-1">
                                {project.qcRequests.map((qc, idx) => (
                                    <div key={idx} className="bg-white p-2 rounded border text-sm flex justify-between items-center">
                                        <span className="truncate flex-1 font-medium">{qc.details}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${qc.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                qc.status === 'Redo' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>{qc.status}</span>
                                    </div>
                                ))}
                                {project.qcRequests.length === 0 && <p className="text-xs text-gray-400 italic">No QC requests yet.</p>}
                            </div>

                            {/* New Request Form */}
                            <form onSubmit={handleQCSubmit} className="flex gap-2">
                                <input
                                    className="flex-1 input-field text-sm"
                                    placeholder="Enter item to review (e.g. 'Reel 1')"
                                    value={qcText}
                                    onChange={e => setQcText(e.target.value)}
                                    required
                                    disabled={isPaused}
                                />
                                <button
                                    type="submit"
                                    disabled={isPaused || loading}
                                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                    Add Request
                                </button>
                            </form>
                        </div>

                        {/* Project Links Section (Placeholder for now) */}
                        <div>
                            <h3 className="font-bold text-gray-800 mb-3">Project Assets</h3>
                            <div className="space-y-2">
                                <a href="#" className="block p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors text-center font-medium">
                                    📂 Open Content Calendar
                                </a>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-500">Instagram</div>
                                    <div className="p-3 bg-gray-100 rounded-lg text-center text-sm text-gray-500">Facebook</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailModal;
