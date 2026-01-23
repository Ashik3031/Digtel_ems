import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdExpandMore } from 'react-icons/md';

const AdReportsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedReportId, setExpandedReportId] = useState(null);
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/meta-ad/reports');
            if (res.data.success) {
                setReports(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const toggleExpand = (reportId) => {
        setExpandedReportId(expandedReportId === reportId ? null : reportId);
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    const backPaths = {
                                        'Admin': '/admin',
                                        'Super Admin': '/admin',
                                        'Account Manager': '/account-manager',
                                        'Backend Manager': '/backend-manager',
                                        'Performance Marketing': '/performance-marketing'
                                    };
                                    navigate(backPaths[user?.role] || '/dashboard');
                                }}
                                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                            >
                                ← Back to Dashboard
                            </button>
                            <h1 className="text-2xl font-black text-blue-600">Ad Reports</h1>
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
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900">Campaign Performance Reports</h2>
                    <p className="text-gray-600 mt-2">View detailed reports and performance metrics for all campaigns</p>
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-gray-500 text-lg">No reports available yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Report Header */}
                                <button
                                    onClick={() => toggleExpand(report._id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 text-left">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-600 font-bold uppercase">Campaign / Project</p>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-blue-600">{report.metaAdRequest?.campaignName || 'Unnamed Campaign'}</span>
                                                    <span className="text-xs text-gray-500">{report.metaAdRequest?.project?.clientName || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 font-bold uppercase">Ad Type</p>
                                                <p className="font-bold text-gray-900">{report.metaAdRequest?.adType || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 font-bold uppercase">Quality</p>
                                                <p className="font-bold text-gray-900">{renderStars(report.adQuality?.rating || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 font-bold uppercase">ROI</p>
                                                <p className="font-bold text-green-600">{report.adResults?.roi || 0}%</p>
                                            </div>
                                        </div>
                                    </div>
                                    <MdExpandMore className={`text-2xl text-gray-400 transition-transform ${expandedReportId === report._id ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Report Details */}
                                {expandedReportId === report._id && (
                                    <div className="border-t border-gray-200 px-6 py-6 space-y-8 bg-gray-50">
                                        {/* Request Info */}
                                        <div>
                                            <h4 className="font-black text-lg text-gray-900 mb-4">Campaign Details</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-gray-600 font-bold uppercase mb-1">Account Manager</p>
                                                    <p className="font-bold text-gray-900">{report.metaAdRequest?.accountManager?.name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-bold uppercase mb-1">Campaign Type</p>
                                                    <p className="font-bold text-gray-900">{report.metaAdRequest?.type || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-bold uppercase mb-1">Budget</p>
                                                    <p className="font-bold text-gray-900">${report.metaAdRequest?.budgetAllocated || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-bold uppercase mb-1">Duration</p>
                                                    <p className="font-bold text-gray-900 text-sm">
                                                        {new Date(report.metaAdRequest?.startDate).toLocaleDateString()} - {new Date(report.metaAdRequest?.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ad Quality */}
                                        <div>
                                            <h4 className="font-black text-lg text-gray-900 mb-4">Ad Quality Assessment</h4>
                                            <div className="bg-white p-4 rounded-lg space-y-3">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700">Rating: {renderStars(report.adQuality?.rating || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 font-bold uppercase mb-2">Comments</p>
                                                    <p className="text-gray-900">{report.adQuality?.comments || 'No comments'}</p>
                                                </div>
                                                {report.adQuality?.issues?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-gray-600 font-bold uppercase mb-2">Issues</p>
                                                        <ul className="list-disc list-inside text-gray-900 space-y-1">
                                                            {report.adQuality.issues.map((issue, idx) => (
                                                                <li key={idx}>{issue}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ad Results */}
                                        <div>
                                            <h4 className="font-black text-lg text-gray-900 mb-4">Ad Results</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg">
                                                <div className="border-l-4 border-blue-500 pl-4">
                                                    <p className="text-xs text-gray-600 font-bold uppercase">Impressions</p>
                                                    <p className="text-2xl font-black text-blue-600">{report.adResults?.impressions || 0}</p>
                                                </div>
                                                <div className="border-l-4 border-purple-500 pl-4">
                                                    <p className="text-xs text-gray-600 font-bold uppercase">Clicks</p>
                                                    <p className="text-2xl font-black text-purple-600">{report.adResults?.clicks || 0}</p>
                                                </div>
                                                <div className="border-l-4 border-green-500 pl-4">
                                                    <p className="text-xs text-gray-600 font-bold uppercase">Conversions</p>
                                                    <p className="text-2xl font-black text-green-600">{report.adResults?.conversions || 0}</p>
                                                </div>
                                                <div className="border-l-4 border-orange-500 pl-4">
                                                    <p className="text-xs text-gray-600 font-bold uppercase">CTR</p>
                                                    <p className="text-2xl font-black text-orange-600">{report.adResults?.ctr || 0}%</p>
                                                </div>
                                                <div className="border-l-4 border-pink-500 pl-4">
                                                    <p className="text-xs text-gray-600 font-bold uppercase">CPC</p>
                                                    <p className="text-2xl font-black text-pink-600">${report.adResults?.cpc || 0}</p>
                                                </div>
                                                <div className="border-l-4 border-red-500 pl-4">
                                                    <p className="text-xs text-gray-600 font-bold uppercase">Spend</p>
                                                    <p className="text-2xl font-black text-red-600">${report.adResults?.spend || 0}</p>
                                                </div>
                                                <div className="border-l-4 border-emerald-500 pl-4">
                                                    <p className="text-xs text-gray-600 font-bold uppercase">ROI</p>
                                                    <p className="text-2xl font-black text-emerald-600">{report.adResults?.roi || 0}%</p>
                                                </div>
                                                <div className="border-l-4 border-indigo-500 pl-4">
                                                    <p className="text-xs text-gray-600 font-bold uppercase">Leads</p>
                                                    <p className="text-2xl font-black text-indigo-600">{report.adResults?.leadGenerated || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Metrics */}
                                        <div>
                                            <h4 className="font-black text-lg text-gray-900 mb-4">Performance Metrics</h4>
                                            <div className="space-y-4 bg-white p-4 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700 mb-2">Engagement Rate: {report.performanceMetrics?.engagementRate || 0}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700 mb-2">Reach vs Target</p>
                                                    <p className="text-gray-900">{report.performanceMetrics?.reachVsTarget || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700 mb-2">Demographic Performance</p>
                                                    <p className="text-gray-900">{report.performanceMetrics?.demographicPerformance || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700 mb-2">Top Performing Content</p>
                                                    <p className="text-gray-900">{report.performanceMetrics?.topPerformingContent || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recommendations */}
                                        <div>
                                            <h4 className="font-black text-lg text-gray-900 mb-4">Recommendations</h4>
                                            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                                                <p className="text-gray-900">{report.recommendations || 'No recommendations provided'}</p>
                                            </div>
                                        </div>

                                        {/* Report Status */}
                                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                                            <div>
                                                <p className="text-xs text-gray-600 font-bold uppercase">Status</p>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${report.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                                                    report.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Submitted: {new Date(report.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdReportsPage;
