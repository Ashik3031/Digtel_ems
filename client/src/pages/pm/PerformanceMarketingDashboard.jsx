import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FiMessageSquare } from 'react-icons/fi';
import { MdAdd } from 'react-icons/md';

const PerformanceMarketingDashboard = () => {
    const { logout, user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalConversions: 0,
        totalSpend: 0,
        avgROI: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch accepted requests for this PM
            const reqRes = await axios.get('/api/meta-ad/accepted-requests');
            const reportRes = await axios.get('/api/meta-ad/reports');

            if (reqRes.data.success && reportRes.data.success) {
                const acceptedRequests = reqRes.data.data || [];
                const allReports = reportRes.data.data || [];

                // Create a map of request IDs to their reports
                const reportsByRequest = {};
                allReports.forEach(report => {
                    const requestId = report.metaAdRequest?._id;
                    if (!reportsByRequest[requestId]) {
                        reportsByRequest[requestId] = [];
                    }
                    reportsByRequest[requestId].push(report);
                });

                // Calculate stats from reports (most accurate data)
                let totalConversions = 0;
                let totalSpend = 0;
                let totalROI = 0;
                let reportCount = 0;

                allReports.forEach(report => {
                    totalConversions += report.adResults?.conversions || 0;
                    totalSpend += report.adResults?.spend || 0;
                    totalROI += report.adResults?.roi || 0;
                    reportCount++;
                });

                setStats({
                    totalCampaigns: acceptedRequests.length,
                    activeCampaigns: acceptedRequests.filter(r => r.status === 'Accepted').length,
                    totalConversions: totalConversions,
                    totalSpend: `$${Math.round(totalSpend).toLocaleString()}`,
                    avgROI: reportCount > 0 ? (totalROI / reportCount).toFixed(2) : 0
                });

                // Transform accepted requests into campaigns format with report data
                const campaignsData = acceptedRequests.map(req => {
                    const requestReports = reportsByRequest[req._id] || [];
                    const latestReport = requestReports[requestReports.length - 1]; // Get most recent report

                    return {
                        id: req._id,
                        name: req.campaignName || `${req.project?.clientName || 'Unnamed Project'}${req.project?.companyName ? ` - ${req.project.companyName}` : ''}`,
                        accountManager: req.accountManager?.name || 'N/A',
                        adType: req.adType,
                        type: req.type,
                        status: req.status === 'Accepted' ? 'active' : 'paused',
                        startDate: new Date(req.startDate).toLocaleDateString(),
                        endDate: new Date(req.endDate).toLocaleDateString(),
                        conversions: latestReport?.adResults?.conversions || 0,
                        spend: `$${latestReport?.adResults?.spend || req.budgetAllocated}`,
                        roi: latestReport?.adResults?.roi || 0,
                        impressions: latestReport?.adResults?.impressions || 0,
                        clicks: latestReport?.adResults?.clicks || 0,
                        reportCount: requestReports.length
                    };
                });

                setCampaigns(campaignsData);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            Swal.fire('Error', 'Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleGoToDiscussions = () => {
        navigate('/performance-marketing/discussions');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-black text-blue-600">Performance Marketing</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700 font-medium">Welcome, {user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">Campaign Dashboard</h2>
                        <p className="text-gray-600 mt-2">Track and manage your marketing campaigns</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleGoToDiscussions}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all"
                        >
                            <FiMessageSquare className="text-lg" />
                            Discussions
                        </button>

                        <button
                            onClick={() => navigate('/performance-marketing/requests')}
                            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg transition-all"
                        >
                            <MdAdd className="text-lg" />
                            Manage Requests
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <p className="text-gray-600 text-sm font-medium">Total Campaigns</p>
                        <p className="text-3xl font-black text-blue-600 mt-2">{stats.totalCampaigns}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <p className="text-gray-600 text-sm font-medium">Active</p>
                        <p className="text-3xl font-black text-green-600 mt-2">{stats.activeCampaigns}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <p className="text-gray-600 text-sm font-medium">Conversions</p>
                        <p className="text-3xl font-black text-purple-600 mt-2">{stats.totalConversions}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <p className="text-gray-600 text-sm font-medium">Total Spend</p>
                        <p className="text-3xl font-black text-orange-600 mt-2">{stats.totalSpend}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <p className="text-gray-600 text-sm font-medium">Avg ROI</p>
                        <p className="text-3xl font-black text-emerald-600 mt-2">{stats.avgROI}</p>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {campaigns.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 text-lg">No active campaigns. Check <span className="font-bold">Manage Requests</span> to accept new campaigns.</p>
                        </div>
                    ) : (
                        <div className="w-full">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase tracking-widest">Campaign</th>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase tracking-widest">Manager</th>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase tracking-widest">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase tracking-widest">Period</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-600 uppercase tracking-widest">Impr.</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-600 uppercase tracking-widest">Clicks</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-600 uppercase tracking-widest">Conv.</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-600 uppercase tracking-widest">Spend</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-600 uppercase tracking-widest">ROI</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-600 uppercase tracking-widest">Rep.</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-600 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900 text-sm">{campaign.name}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">{campaign.accountManager}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">{campaign.adType}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">{campaign.startDate}</td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-900 text-sm">{(campaign.impressions / 1000).toFixed(1)}K</td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-900 text-sm">{(campaign.clicks / 1000).toFixed(1)}K</td>
                                            <td className="px-4 py-3 text-center font-bold text-purple-600 text-sm">{campaign.conversions}</td>
                                            <td className="px-4 py-3 text-center font-bold text-orange-600 text-sm">{campaign.spend}</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600 text-sm">{campaign.roi}%</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{campaign.reportCount}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => navigate('/performance-marketing/requests')}
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                                >
                                                    Report
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PerformanceMarketingDashboard;
