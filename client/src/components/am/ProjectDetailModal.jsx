import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { SiInstagram, SiFacebook, SiWhatsapp, SiTiktok, SiLinkedin } from 'react-icons/si';
import { FiLink, FiEye, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const ProjectDetailModal = ({ project, onClose }) => {
    const isPaused = project.status === 'Paused';
    const [loading, setLoading] = useState(false);
    const [qcText, setQcText] = useState('');
    const { user } = useAuth();

    // Toast helper
    const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true });

    // Platform icons
    const platformIcons = {
        Instagram: <SiInstagram className="inline-block mr-2" />,
        Facebook: <SiFacebook className="inline-block mr-2" />,
        WhatsApp: <SiWhatsapp className="inline-block mr-2" />,
        TikTok: <SiTiktok className="inline-block mr-2" />,
        LinkedIn: <SiLinkedin className="inline-block mr-2" />,
        Other: <FiLink className="inline-block mr-2" />
    };

    // Saving counter to track concurrent save operations
    const [savingCount, setSavingCount] = useState(0);
    const isSaving = savingCount > 0;
    const startSave = () => setSavingCount(c => c + 1);
    const endSave = () => setSavingCount(c => Math.max(0, c - 1));

    // QC view modal state
    const [qcModalOpen, setQcModalOpen] = useState(false);
    const [qcToView, setQcToView] = useState(null);
    const openQCModal = (qc) => { setQcToView(qc); setQcModalOpen(true); };
    const closeQCModal = () => { setQcToView(null); setQcModalOpen(false); };

    // Warn on page unload if saves are pending
    useEffect(() => {
        const handler = (e) => {
            if (isSaving) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isSaving]);

    // Checklist Items Definition
    const checklistItems = [
        { key: 'meetingScheduled', label: '1. Meeting Scheduled' },
        { key: 'meetingMinutesSent', label: '2. Meeting Minutes Sent' },
        { key: 'contentCalendarSent', label: '3. Content + Calendar Sent' },
        { key: 'clientApprovalReceived', label: '4. Client Approval Received' },
        { key: 'workStarted', label: '5. Work Started' },
        { key: 'socialMediaLinks', label: '6. Social Media Links Created/Added' },
        { key: 'qcRequestsCreated', label: '7. Work in Progress' },
        { key: 'allWorkCompleted', label: '8. Mark All Work Completed' },
        { key: 'monthlyReviewSent', label: '9. Monthly Review Sent' }
    ];

    // Keys used to compute completion for the AM UI (keeps parity with ProjectCard)
    const visibleChecklistKeys = ['meetingScheduled', 'meetingMinutesSent', 'contentCalendarSent', 'clientApprovalReceived', 'workStarted', 'socialMediaLinks', 'qcRequestsCreated', 'allWorkCompleted', 'monthlyReviewSent'];

    const allVisibleDone = visibleChecklistKeys.every(key => project.checklist && project.checklist[key]?.done);

    const markFinalStatus = async (status) => {
        if (isPaused) { toast.fire({ icon: 'warning', title: 'Resume project to update status.' }); return; }

        const confirm = await Swal.fire({
            title: status === 'Completed' ? 'Mark project as Completed?' : 'Mark project as Needs Renewal?',
            text: status === 'Completed' ? 'This will move the project to Completed Projects.' : 'This will move the project to the Renewal list. You can restore it to Active later.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel'
        });

        if (!confirm.isConfirmed) return;

        startSave();
        try {
            setLoading(true);
            const res = await axios.put(`/api/projects/${project._id}/status`, { status });
            toast.fire({ icon: 'success', title: `Project moved to ${status}` });
            // Close modal to reflect the list change; dashboard will update via socket
            onClose();
        } catch (err) {
            toast.fire({ icon: 'error', title: err.response?.data?.message || 'Status update failed' });
        } finally {
            setLoading(false);
            endSave();
        }
    };

    // Helper function to check if all QC requests are approved
    const allQCApproved = project.qcRequests.length > 0 && project.qcRequests.every(qc => qc.status === 'Approved');

    // Helper function to check if all work completed is marked
    const isAllWorkCompleted = project.checklist.allWorkCompleted?.done;

    const handleChecklistToggle = async (key, currentValue, meta = null) => {
        if (isPaused) {
            toast.fire({ icon: 'warning', title: 'Resume project to edit.' });
            return Promise.reject(new Error('Project paused'));
        }

        startSave();
        try {
            setLoading(true);
            const payload = { step: key, done: !currentValue };
            if (meta) payload.meta = meta;
            const res = await axios.put(`/api/projects/${project._id}/checklist`, payload);
            // return the updated project object
            return res.data.data;
        } catch (err) {
            toast.fire({ icon: 'error', title: err.response?.data?.message || 'Update failed' });
            throw err;
        } finally {
            setLoading(false);
            endSave();
        }
    };

    // Local states for assets
    const [localSocialLinks, setLocalSocialLinks] = useState(project.socialLinks || []);
    const [newPlatform, setNewPlatform] = useState('Instagram');
    const [newUrl, setNewUrl] = useState('');
    const [localSpreadsheetLink, setLocalSpreadsheetLink] = useState(project.contentCalendarLink || '');

    // Edit mode toggles
    const [editingSocialLinks, setEditingSocialLinks] = useState(false);
    const [editingSpreadsheet, setEditingSpreadsheet] = useState(false);

    // Sync local state when project prop changes (e.g. from socket update)
    useEffect(() => {
        if (!editingSocialLinks) {
            setLocalSocialLinks(project.socialLinks || []);
        }
        if (!editingSpreadsheet) {
            setLocalSpreadsheetLink(project.contentCalendarLink || '');
        }
    }, [project, editingSocialLinks, editingSpreadsheet]);

    const addLocalSocial = () => {
        if (!newUrl) return;
        setLocalSocialLinks(prev => [...prev, { platform: newPlatform, url: newUrl }]);
        setNewUrl('');
    };

    const removeLocalSocial = (idx) => {
        setLocalSocialLinks(prev => prev.filter((_, i) => i !== idx));
    };

    const saveSocialLinks = async () => {
        try {
            const updated = await handleChecklistToggle('socialMediaLinks', project.checklist.socialMediaLinks.done, { links: localSocialLinks });
            // update local state immediately
            setLocalSocialLinks(updated.socialLinks || localSocialLinks);
            setEditingSocialLinks(false);
            toast.fire({ icon: 'success', title: 'Social links saved' });
        } catch (err) {
            // error already shown in handleChecklistToggle
        }
    };

    const saveSocialLinksOnly = async () => {
        try {
            const updated = await handleChecklistToggle('socialMediaLinks', project.checklist.socialMediaLinks.done, { links: localSocialLinks });
            setLocalSocialLinks(updated.socialLinks || localSocialLinks);
            toast.fire({ icon: 'success', title: 'Social links saved' });
        } catch (err) {
            // ignore
        }
    };

    const saveSpreadsheetLink = async () => {
        try {
            const updated = await handleChecklistToggle('contentCalendarSent', project.checklist.contentCalendarSent.done, { link: localSpreadsheetLink });
            setLocalSpreadsheetLink(updated.contentCalendarLink || localSpreadsheetLink);
            setEditingSpreadsheet(false);
            toast.fire({ icon: 'success', title: 'Spreadsheet saved' });
        } catch (err) {
            // error handled above
        }
    };

    const saveSpreadsheetLinkOnly = async () => {
        try {
            const updated = await handleChecklistToggle('contentCalendarSent', project.checklist.contentCalendarSent.done, { link: localSpreadsheetLink });
            setLocalSpreadsheetLink(updated.contentCalendarLink || localSpreadsheetLink);
            toast.fire({ icon: 'success', title: 'Spreadsheet saved' });
        } catch (err) {
            // ignore
        }
    };

    const handleStatusToggle = async () => {
        const newStatus = isPaused ? 'Active' : 'Paused';
        try {
            setLoading(true);
            await axios.put(`/api/projects/${project._id}/status`, { status: newStatus });
        } catch (err) {
            toast.fire({ icon: 'error', title: 'Status update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleQCSubmit = async (e) => {
        e.preventDefault();
        if (isPaused) {
            toast.fire({ icon: 'warning', title: 'Resume project to submit QC.' });
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`/api/projects/${project._id}/qc`, { details: qcText });
            setQcText('');
            toast.fire({ icon: 'success', title: 'QC request submitted' });
        } catch (err) {
            toast.fire({ icon: 'error', title: 'QC request failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[95vw] max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-start bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{project.clientName}</h2>
                        <p className="text-gray-500">{project.companyName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleStatusToggle}
                            disabled={loading || isSaving}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isPaused ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'} ${loading || isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isPaused ? 'Resume Project' : 'Pause Project'}
                        </button>
                        <button onClick={() => {
                            if (isSaving) {
                                toast.fire({ icon: 'warning', title: 'Please wait — saving in progress' });
                                return;
                            }
                            onClose();
                        }} disabled={isSaving} className={`text-gray-400 hover:text-gray-600 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            Close
                        </button>
                        {isSaving && <span className="text-xs text-gray-500 ml-2">Saving...</span>}
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
                                            onChange={() => {
                                                // Validation for allWorkCompleted
                                                if (item.key === 'allWorkCompleted' && !stepData.done && !allQCApproved) {
                                                    toast.fire({ icon: 'warning', title: 'Complete all the QC requests before marking all work complete' });
                                                    return;
                                                }
                                                // Validation for monthlyReviewSent
                                                if (item.key === 'monthlyReviewSent' && !stepData.done && !isAllWorkCompleted) {
                                                    toast.fire({ icon: 'warning', title: 'Mark all work complete before sending monthly review' });
                                                    return;
                                                }
                                                handleChecklistToggle(item.key, stepData.done);
                                            }}
                                            disabled={isPaused || loading || isSaving}
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
                                            {/* Validation helper text */}
                                            {item.key === 'allWorkCompleted' && !stepData.done && project.qcRequests.length > 0 && !allQCApproved && (
                                                <p className="text-xs text-red-600 mt-1">Complete all the QC request before marking all work complete</p>
                                            )}
                                            {item.key === 'monthlyReviewSent' && !stepData.done && !isAllWorkCompleted && (
                                                <p className="text-xs text-red-600 mt-1">Mark all work complete before sending monthly review</p>
                                            )}

                                            {/* Additional UI for specific steps */}
                                            {item.key === 'socialMediaLinks' && (
                                                <div className="mt-2 space-y-2">
                                                    {editingSocialLinks ? (
                                                        <div className="flex flex-col md:flex-row gap-2 w-full items-stretch">
                                                            <select value={newPlatform} onChange={e => setNewPlatform(e.target.value)} className="border rounded px-2 py-1 w-36">
                                                                <option>Instagram</option>
                                                                <option>Facebook</option>
                                                                <option>WhatsApp</option>
                                                                <option>TikTok</option>
                                                                <option>LinkedIn</option>
                                                                <option>Other</option>
                                                            </select>
                                                            <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="flex-1 border rounded px-2 py-1" />
                                                            <button type="button" onClick={addLocalSocial} className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
                                                        </div>
                                                    ) : null}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                                        {localSocialLinks.map((s, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-white border rounded p-2">
                                                                <div className="text-sm overflow-hidden flex items-start gap-2">
                                                                    <span className="mt-0.5">
                                                                        {platformIcons[s.platform] || platformIcons.Other}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <div className="font-semibold text-gray-700 truncate">{s.platform}</div>
                                                                        <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 truncate block text-xs">{s.url}</a>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {editingSocialLinks && <button type="button" onClick={() => removeLocalSocial(idx)} className="text-red-500 text-sm">Remove</button>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-end gap-2 mt-1">
                                                        {editingSocialLinks ? (
                                                            <>
                                                                <button type="button" onClick={() => setEditingSocialLinks(false)} className="px-3 py-1 bg-gray-400 text-white rounded text-sm" disabled={loading || isSaving}>Cancel</button>
                                                                <button type="button" onClick={saveSocialLinks} className="px-3 py-1 bg-green-600 text-white rounded text-sm" disabled={loading || isSaving}>Save Links</button>
                                                            </>
                                                        ) : (
                                                            <button type="button" onClick={() => setEditingSocialLinks(true)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Edit Links</button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {item.key === 'contentCalendarSent' && (
                                                <div className="mt-2">
                                                    {editingSpreadsheet ? (
                                                        <>
                                                            <input value={localSpreadsheetLink} onChange={e => setLocalSpreadsheetLink(e.target.value)} placeholder="Spreadsheet link (Google Sheets)" className="w-full border rounded px-2 py-1 mb-2" />
                                                            <div className="flex justify-end gap-2">
                                                                <button type="button" onClick={() => setEditingSpreadsheet(false)} className="px-3 py-1 bg-gray-400 text-white rounded text-sm" disabled={loading || isSaving}>Cancel</button>
                                                                <button type="button" onClick={saveSpreadsheetLink} className="px-3 py-1 bg-green-600 text-white rounded text-sm" disabled={loading || isSaving}>Save Spreadsheet</button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex justify-end gap-2 items-center">
                                                            {localSpreadsheetLink && <a href={localSpreadsheetLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View Spreadsheet</a>}
                                                            <button type="button" onClick={() => setEditingSpreadsheet(true)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{localSpreadsheetLink ? 'Edit' : 'Add'} Spreadsheet</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action: Completed / Renewal (show only when all steps are done) */}
                        {allVisibleDone && !['completed', 'renewal'].includes((project.status || '').toLowerCase()) && (
                            <div className="mt-4 p-3 rounded-lg border bg-black text-white flex items-center justify-between">
                                <div className="text-sm">All checklist steps are completed. Is the project over or does it need renewal?</div>
                                <div className="flex gap-2">
                                    <button onClick={() => markFinalStatus('Completed')} className="px-3 py-1 bg-[#D8F60D] text-black rounded font-semibold">Mark Completed</button>
                                    <button onClick={() => markFinalStatus('Renewal')} className="px-3 py-1 bg-white text-black rounded border">Needs Renewal</button>
                                </div>
                            </div>
                        )}
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
                                        <div className="flex-1">
                                            <div className="truncate font-medium">{qc.details}</div>
                                            {qc.feedback && (
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs text-red-600 truncate max-w-[18rem]">Feedback: {qc.feedback}</div>
                                                    <button onClick={() => openQCModal(qc)} className="text-blue-600 text-xs">View</button>
                                                </div>
                                            )}
                                            {qc.createdBy && qc.createdBy.name && (
                                                <div className="text-xs text-gray-500 mt-1">Requested by: <strong>{qc.createdBy.name}</strong> {qc.createdBy.role && <span className="text-xs text-gray-400">({qc.createdBy.role})</span>}</div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${qc.status === 'Approved' ? 'bg-green-100 text-green-700' : qc.status === 'Redo' ? 'bg-red-100 text-red-700' : qc.status === 'Rejected' ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {qc.status}
                                            </span>
                                            <button onClick={() => openQCModal(qc)} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs ml-2 flex items-center gap-1"><FiEye className="text-sm" /> <span>View</span></button>

                                            {user && user.role === 'Account Manager' && qc.status === 'Redo' && (
                                                <button onClick={async () => {
                                                    const { value: note } = await Swal.fire({
                                                        title: 'Resubmit Request',
                                                        input: 'textarea',
                                                        inputLabel: 'Optional notes for QC',
                                                        inputPlaceholder: 'Describe changes made',
                                                        showCancelButton: true
                                                    });
                                                    if (note !== undefined) {
                                                        try {
                                                            setLoading(true);
                                                            const res = await axios.post(`/api/projects/${project._id}/qc/${qc._id}/resubmit`, { note });
                                                            // Update local qcRequests array
                                                            const updatedQc = res.data.data.qc;
                                                            // replace in place
                                                            const newQcs = project.qcRequests.map(q => q._id === updatedQc._id ? updatedQc : q);
                                                            // Mutate project object locally so UI updates (parent may re-fetch via sockets)
                                                            project.qcRequests = newQcs;
                                                            toast.fire({ icon: 'success', title: 'Request resubmitted' });
                                                        } catch (err) {
                                                            toast.fire({ icon: 'error', title: err.response?.data?.message || 'Resubmit failed' });
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }
                                                }} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Resubmit</button>
                                            )}
                                        </div>
                                    </div>
                                ))}                                {project.qcRequests.length === 0 && <p className="text-xs text-gray-400 italic">No QC requests yet.</p>}
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

                        {/* Project Links Section */}
                        <div>
                            <h3 className="font-bold text-gray-800 mb-3">Project Assets</h3>
                            <div className="space-y-2">
                                {localSpreadsheetLink && (
                                    <a href={localSpreadsheetLink} target="_blank" rel="noreferrer" className="block p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors text-center font-medium">
                                        📊 View Calendar
                                    </a>
                                )}
                                {localSocialLinks.length > 0 && (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">Social Media Links</p>
                                        <div className="space-y-1">
                                            {localSocialLinks.map((s, idx) => (
                                                <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-white rounded hover:bg-gray-100 transition-colors">
                                                    <span className="text-xs font-medium text-gray-700">{s.platform}:</span>
                                                    <span className="text-xs text-blue-600 truncate">{s.url}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {!localSpreadsheetLink && localSocialLinks.length === 0 && (
                                    <p className="text-xs text-gray-400 italic p-3">No project assets added yet. Add spreadsheet and social links from the checklist.</p>
                                )}
                            </div>
                        </div>

                        {/* Remarks Section */}
                        <div>
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <FiMessageSquare /> Remarks & Updates
                            </h3>
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 max-h-60 overflow-y-auto space-y-3">
                                {project.remarks && project.remarks.length > 0 ? (
                                    project.remarks.slice().reverse().map((remark, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-sm">
                                            <p className="text-gray-700 whitespace-pre-wrap">{remark.text}</p>
                                            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                                                <span className="font-medium text-gray-500">{remark.user?.name || 'Unknown User'}</span>
                                                <span>{new Date(remark.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-4">No remarks added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {
                qcModalOpen && qcToView && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-60">
                        <div className="bg-white rounded-lg max-w-2xl w-[90vw] p-6">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold break-words">{qcToView.details}</h3>
                                <button onClick={closeQCModal} className="text-gray-500 hover:text-gray-700">Close</button>
                            </div>
                            <div className="mt-3 text-sm text-gray-700">
                                <p><strong>Status:</strong> {qcToView.status}</p>
                                <p className="mt-2"><strong>Requested:</strong> {qcToView.requestDate ? new Date(qcToView.requestDate).toLocaleString() : ''}</p>
                                {qcToView.createdBy && qcToView.createdBy.name && (
                                    <p className="mt-1 text-sm text-gray-600">Requested by: <strong>{qcToView.createdBy.name}</strong> {qcToView.createdBy.role && <span className="text-xs text-gray-400">({qcToView.createdBy.role})</span>}</p>
                                )}
                                {qcToView.feedback && (
                                    <div className="mt-3">
                                        <h4 className="font-semibold">Feedback</h4>
                                        <p className="whitespace-pre-wrap text-sm text-red-600">{qcToView.feedback}</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 text-right">
                                <button onClick={closeQCModal} className="px-3 py-1 bg-gray-200 rounded mr-2">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProjectDetailModal;
