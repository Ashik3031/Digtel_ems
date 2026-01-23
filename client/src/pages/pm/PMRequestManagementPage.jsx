import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { MdCheck, MdClose } from 'react-icons/md';

const PMRequestManagementPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [pendingRequests, setPendingRequests] = useState([]);
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState({
        reportPeriodStart: '',
        reportPeriodEnd: '',
        adQuality: {
            rating: 5,
            comments: '',
            issues: []
        },
        adResults: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            spend: 0,
            roi: 0,
            leadGenerated: 0
        },
        performanceMetrics: {
            engagementRate: 0,
            reachVsTarget: '',
            demographicPerformance: '',
            topPerformingContent: ''
        },
        recommendations: ''
    });
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingRequestId, setRejectingRequestId] = useState(null);

    useEffect(() => {
        fetchPendingRequests();
        fetchAcceptedRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const res = await axios.get('/api/meta-ad/requests/pending');
            if (res.data.success) {
                setPendingRequests(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching pending requests:', err);
        }
    };

    const fetchAcceptedRequests = async () => {
        try {
            const res = await axios.get('/api/meta-ad/accepted-requests');
            if (res.data.success) {
                setAcceptedRequests(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching accepted requests:', err);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            const res = await axios.put(`/api/meta-ad/requests/${requestId}/accept`);
            if (res.data.success) {
                Swal.fire('Success', 'Request accepted successfully', 'success');
                fetchPendingRequests();
                fetchAcceptedRequests();
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to accept request', 'error');
        }
    };

    const handleRejectRequest = async () => {
        if (!rejectionReason.trim()) {
            Swal.fire('Error', 'Please provide a rejection reason', 'error');
            return;
        }

        try {
            const res = await axios.put(`/api/meta-ad/requests/${rejectingRequestId}/reject`, {
                rejectionReason
            });
            if (res.data.success) {
                Swal.fire('Success', 'Request rejected successfully', 'success');
                setShowRejectModal(false);
                setRejectionReason('');
                setRejectingRequestId(null);
                fetchPendingRequests();
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to reject request', 'error');
        }
    };

    const handleSubmitReport = async () => {
        if (!selectedRequest) return;

        try {
            const res = await axios.post('/api/meta-ad/report/submit', {
                metaAdRequest: selectedRequest._id,
                ...reportData
            });
            if (res.data.success) {
                Swal.fire('Success', 'Report submitted successfully', 'success');
                setShowReportModal(false);
                setSelectedRequest(null);
                fetchAcceptedRequests();
            }
        } catch (err) {
            console.error('Submit Report Error:', err.response?.data || err.message);
            Swal.fire('Error', err.response?.data?.message || 'Failed to submit report', 'error');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const openReportModal = (request) => {
        setSelectedRequest(request);
        setShowReportModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/performance-marketing')}
                                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                            >
                                ← Back to Dashboard
                            </button>
                            <h1 className="text-2xl font-black text-blue-600">Meta Ad Management</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700 font-medium">{user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'pending'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Pending Requests ({pendingRequests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('accepted')}
                        className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all ${activeTab === 'accepted'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Accepted Requests ({acceptedRequests.length})
                    </button>
                </div>

                {/* Pending Requests Tab */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingRequests.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                <p className="text-gray-500 text-lg">No pending requests</p>
                            </div>
                        ) : (
                            pendingRequests.map((request) => (
                                <div key={request._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Campaign</p>
                                            <p className="font-black text-blue-600">{request.campaignName || 'Unnamed Campaign'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Project</p>
                                            <p className="font-bold text-gray-900">
                                                {request.project?.clientName || 'N/A'}
                                                {request.project?.companyName && <span className="text-xs text-gray-500 block">{request.project.companyName}</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Ad Type</p>
                                            <p className="font-bold text-gray-900">{request.adType} / {request.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Budget</p>
                                            <p className="font-bold text-gray-900">${request.budgetAllocated}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Account Manager</p>
                                            <p className="font-bold text-gray-900">{request.accountManager?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Period</p>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Notes</p>
                                            <p className="font-bold text-gray-900 text-sm">{request.notes || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => {
                                                setRejectingRequestId(request._id);
                                                setShowRejectModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 font-bold transition-colors"
                                        >
                                            <MdClose className="text-lg" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAcceptRequest(request._id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors"
                                        >
                                            <MdCheck className="text-lg" />
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Accepted Requests Tab */}
                {activeTab === 'accepted' && (
                    <div className="space-y-4">
                        {acceptedRequests.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                <p className="text-gray-500 text-lg">No accepted requests</p>
                            </div>
                        ) : (
                            acceptedRequests.map((request) => (
                                <div key={request._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Campaign</p>
                                            <p className="font-black text-blue-600">{request.campaignName || 'Unnamed Campaign'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Project</p>
                                            <p className="font-bold text-gray-900">
                                                {request.project?.clientName || 'N/A'}
                                                {request.project?.companyName && <span className="text-xs text-gray-500 block">{request.project.companyName}</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Ad Type</p>
                                            <p className="font-bold text-gray-900">{request.adType} / {request.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Budget</p>
                                            <p className="font-bold text-gray-900">${request.budgetAllocated}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => openReportModal(request)}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
                                        >
                                            Submit Report
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-2xl font-black text-gray-900 mb-4">Reject Request</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please provide a reason for rejection..."
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                    setRejectingRequestId(null);
                                }}
                                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectRequest}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-gray-900">Submit Ad Report</h3>
                            <button
                                onClick={() => {
                                    setShowReportModal(false);
                                    setSelectedRequest(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MdClose className="text-2xl text-gray-600" />
                            </button>
                        </div>

                        <form className="flex-1 p-8 space-y-8 overflow-y-auto">
                            {/* Request Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-600 font-bold uppercase">Campaign</p>
                                    <p className="font-bold text-blue-600">{selectedRequest.campaignName || 'Unnamed Campaign'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-bold uppercase">Project</p>
                                    <p className="font-bold text-gray-900">
                                        {selectedRequest.project?.clientName}
                                        {selectedRequest.project?.companyName && ` (${selectedRequest.project.companyName})`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-bold uppercase">Ad Type</p>
                                    <p className="font-bold text-gray-900">{selectedRequest.adType} / {selectedRequest.type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-bold uppercase">Budget</p>
                                    <p className="font-bold text-gray-900">${selectedRequest.budgetAllocated}</p>
                                </div>
                            </div>

                            {/* Report Period */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Report Period Start</label>
                                    <input
                                        type="date"
                                        value={reportData.reportPeriodStart}
                                        onChange={(e) => setReportData({ ...reportData, reportPeriodStart: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Report Period End</label>
                                    <input
                                        type="date"
                                        value={reportData.reportPeriodEnd}
                                        onChange={(e) => setReportData({ ...reportData, reportPeriodEnd: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Ad Quality */}
                            <div>
                                <h4 className="font-black text-lg text-gray-900 mb-4">Ad Quality Assessment</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Quality Rating (1-5)</label>
                                        <select
                                            value={reportData.adQuality.rating}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adQuality: { ...reportData.adQuality, rating: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            {[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i} - {'⭐'.repeat(i)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Comments</label>
                                        <textarea
                                            value={reportData.adQuality.comments}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adQuality: { ...reportData.adQuality, comments: e.target.value }
                                            })}
                                            placeholder="Enter comments about ad quality..."
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Ad Results */}
                            <div>
                                <h4 className="font-black text-lg text-gray-900 mb-4">Ad Results</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Impressions</label>
                                        <input
                                            type="number"
                                            value={reportData.adResults.impressions}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adResults: { ...reportData.adResults, impressions: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Clicks</label>
                                        <input
                                            type="number"
                                            value={reportData.adResults.clicks}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adResults: { ...reportData.adResults, clicks: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Conversions</label>
                                        <input
                                            type="number"
                                            value={reportData.adResults.conversions}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adResults: { ...reportData.adResults, conversions: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">CTR (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={reportData.adResults.ctr}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adResults: { ...reportData.adResults, ctr: parseFloat(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">CPC ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={reportData.adResults.cpc}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adResults: { ...reportData.adResults, cpc: parseFloat(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Spend ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={reportData.adResults.spend}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adResults: { ...reportData.adResults, spend: parseFloat(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">ROI (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={reportData.adResults.roi}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adResults: { ...reportData.adResults, roi: parseFloat(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Leads Generated</label>
                                        <input
                                            type="number"
                                            value={reportData.adResults.leadGenerated}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                adResults: { ...reportData.adResults, leadGenerated: parseInt(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            <div>
                                <h4 className="font-black text-lg text-gray-900 mb-4">Performance Metrics</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Engagement Rate (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={reportData.performanceMetrics.engagementRate}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                performanceMetrics: { ...reportData.performanceMetrics, engagementRate: parseFloat(e.target.value) || 0 }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Reach vs Target</label>
                                        <textarea
                                            value={reportData.performanceMetrics.reachVsTarget}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                performanceMetrics: { ...reportData.performanceMetrics, reachVsTarget: e.target.value }
                                            })}
                                            placeholder="Compare actual reach vs target reach..."
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Demographic Performance</label>
                                        <textarea
                                            value={reportData.performanceMetrics.demographicPerformance}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                performanceMetrics: { ...reportData.performanceMetrics, demographicPerformance: e.target.value }
                                            })}
                                            placeholder="Details about which demographics performed best..."
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Top Performing Content</label>
                                        <textarea
                                            value={reportData.performanceMetrics.topPerformingContent}
                                            onChange={(e) => setReportData({
                                                ...reportData,
                                                performanceMetrics: { ...reportData.performanceMetrics, topPerformingContent: e.target.value }
                                            })}
                                            placeholder="Describe what content performed best..."
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Recommendations</label>
                                <textarea
                                    value={reportData.recommendations}
                                    onChange={(e) => setReportData({ ...reportData, recommendations: e.target.value })}
                                    placeholder="Provide recommendations for future campaigns..."
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 pb-2 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReportModal(false);
                                        setSelectedRequest(null);
                                    }}
                                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitReport}
                                    className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PMRequestManagementPage;
