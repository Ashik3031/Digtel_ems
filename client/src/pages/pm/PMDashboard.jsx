import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getAdCampaigns, updateAdCampaign, updateCampaignMetrics } from '../../services/adCampaignService';
import {
    MdDashboard,
    MdCampaign,
    MdLogout,
    MdMenu,
    MdHistory,
    MdSettings
} from 'react-icons/md';

const PMDashboard = () => {
    const { logout, user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [metricsData, setMetricsData] = useState({ reach: 0, leads: 0, conversions: 0, spent: 0 });

    // Acceptance Modal State
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [acceptCampaignData, setAcceptCampaignData] = useState({ campaignDetails: '', budgetAllocation: '' });

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    // Real-time socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleCampaignAssigned = () => {
            fetchCampaigns();
        };

        socket.on('ad_campaign_assigned', handleCampaignAssigned);

        return () => {
            socket.off('ad_campaign_assigned', handleCampaignAssigned);
        };
    }, [socket]);

    const fetchCampaigns = async () => {
        try {
            const res = await getAdCampaigns();
            if (res.success) setCampaigns(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleStatusChange = async (campaign, newStatus) => {
        try {
            await updateAdCampaign(campaign._id, { status: newStatus });
            Swal.fire('Updated!', `Campaign status changed to ${newStatus}`, 'success');
            fetchCampaigns();
        } catch (err) {
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const initiateStartCampaign = (campaign) => {
        setSelectedCampaign(campaign);
        setAcceptCampaignData({
            campaignDetails: '',
            budgetAllocation: campaign.budgetAllocation || ''
        });
        setShowAcceptModal(true);
    };

    const handleAcceptSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateAdCampaign(selectedCampaign._id, {
                status: 'Active',
                campaignDetails: acceptCampaignData.campaignDetails,
                budgetAllocation: acceptCampaignData.budgetAllocation
            });
            Swal.fire('Success', 'Campaign started and details sent to Backend Manager', 'success');
            setShowAcceptModal(false);
            fetchCampaigns();
        } catch (err) {
            Swal.fire('Error', 'Failed to start campaign', 'error');
        }
    };

    const openMetricsModal = (campaign) => {
        setSelectedCampaign(campaign);
        setMetricsData(campaign.metrics || { reach: 0, leads: 0, conversions: 0, spent: 0 });
        setShowMetricsModal(true);
    };

    const handleMetricsSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateCampaignMetrics(selectedCampaign._id, metricsData);
            Swal.fire('Updated!', 'Campaign metrics updated successfully', 'success');
            setShowMetricsModal(false);
            fetchCampaigns();
        } catch (err) {
            Swal.fire('Error', 'Failed to update metrics', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCampaignTypeColor = (type) => {
        return type === 'Reach'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    };

    const activeCampaigns = campaigns.filter(c => c.status === 'Pending' || c.status === 'Active');
    const completedCampaigns = campaigns.filter(c => c.status === 'Completed' || c.status === 'Cancelled');

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white transition-colors duration-300">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Performance<span className="text-blue-600">Ads</span></h1>
                </div>
                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <MdDashboard className="text-xl" /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveView('campaigns')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeView === 'campaigns' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <MdCampaign className="text-xl" /> Ad Campaigns
                    </button>
                    <button
                        onClick={() => setActiveView('history')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeView === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <MdHistory className="text-xl" /> History
                    </button>
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold">
                        <MdLogout className="text-xl" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-h-screen overflow-y-auto w-full">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <h1 className="text-xl font-black">Performance<span className="text-blue-600">Ads</span></h1>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-2xl">
                        <MdMenu />
                    </button>
                </div>

                <div className="p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {activeView === 'dashboard' && (
                            <>
                                {/* Header */}
                                <div className="flex justify-between items-center mb-8 hidden md:flex">
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Campaign Intelligence</h1>
                                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Welcome back, {user?.name}</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="text-right px-4 border-r border-zinc-200 dark:border-zinc-800">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Spent</p>
                                            <p className="text-lg font-black text-red-600 leading-none">AED {campaigns.reduce((acc, c) => acc + (c.metrics?.spent || 0), 0).toFixed(0)}</p>
                                        </div>
                                        <div className="text-right px-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Reach</p>
                                            <p className="text-lg font-black text-blue-600 leading-none">{(campaigns.reduce((acc, c) => acc + (c.metrics?.reach || 0), 0) / 1000).toFixed(1)}k</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Campaigns */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]"></span>
                                            Active Requests ({activeCampaigns.length})
                                        </h2>
                                        <div className="h-px flex-1 bg-gradient-to-r from-blue-600/20 to-transparent ml-4"></div>
                                    </div>

                                    {activeCampaigns.length === 0 ? (
                                        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-700">
                                                <MdCampaign className="text-3xl text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-medium">No active ad requests assigned to you.</p>
                                            <p className="text-xs text-slate-500 mt-1 italic">Backend Managers will assign new campaigns here.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {activeCampaigns.map((campaign) => (
                                                <div key={campaign._id} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors"></div>

                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                        <div>
                                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{campaign.campaignType} Campaign</p>
                                                            <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{campaign.project?.companyName || 'Project'}</h3>
                                                            <p className="text-sm font-medium text-slate-400">{campaign.project?.clientName}</p>
                                                        </div>
                                                        <div className={`p-2 rounded-xl border ${getStatusColor(campaign.status)} font-black text-[10px] uppercase tracking-tighter`}>
                                                            {campaign.status}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 mb-6 relative z-10">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">Budget Allocation</p>
                                                                <p className="text-sm font-black text-green-600">AED {campaign.budgetAllocation}</p>
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">Time Remaining</p>
                                                                <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                                                                    {Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24))} Days
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {campaign.notes && (
                                                            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-800/20">
                                                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-tight mb-1">Requirements / Notes</p>
                                                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{campaign.notes}</p>
                                                            </div>
                                                        )}

                                                        <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3 px-1">
                                                                <span>Project Performance</span>
                                                                <span className="text-blue-600">Live Metrics</span>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                                <div>
                                                                    <p className="text-[8px] font-black text-slate-400 mb-0.5">Reach</p>
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{(campaign.metrics?.reach || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[8px] font-black text-slate-400 mb-0.5">Leads</p>
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white ">{campaign.metrics?.leads || 0}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[8px] font-black text-slate-400 mb-0.5">Conv.</p>
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white ">{campaign.metrics?.conversions || 0}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[8px] font-black text-slate-400 mb-0.5">CPL</p>
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white ">
                                                                        {campaign.metrics?.leads > 0 ? (campaign.metrics?.spent / campaign.metrics?.leads).toFixed(1) : '0'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 relative z-10">
                                                        <button
                                                            onClick={() => openMetricsModal(campaign)}
                                                            className="flex-1 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/5"
                                                        >
                                                            Update Metrics
                                                        </button>
                                                        {campaign.status === 'Pending' && (
                                                            <button
                                                                onClick={() => initiateStartCampaign(campaign)}
                                                                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20"
                                                            >
                                                                Start Ad
                                                            </button>
                                                        )}
                                                        {campaign.status === 'Active' && (
                                                            <button
                                                                onClick={() => handleStatusChange(campaign, 'Completed')}
                                                                className="flex-1 bg-emerald-500 text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20"
                                                            >
                                                                Resolve
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Completed Summary */}
                                {completedCampaigns.length > 0 && (
                                    <div className="mt-12 bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Historical Intelligence</h2>
                                            <button onClick={() => setActiveView('history')} className="text-sm font-black text-blue-600 uppercase tracking-widest hover:underline">View All Records</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {completedCampaigns.slice(0, 4).map((campaign) => (
                                                <div key={campaign._id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                                                    <h3 className="font-bold text-xs mb-1 truncate">{campaign.project?.projectName}</h3>
                                                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                                                        <span>{campaign.campaignType}</span>
                                                        <span className="text-emerald-500 font-black">{campaign.metrics?.leads} Leads</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {activeView === 'campaigns' && (
                            <div className="py-10 text-center">
                                <h1 className="text-2xl font-bold">Comprehensive Campaign Management</h1>
                                <p className="text-slate-500 mt-2 italic">Detailed list view available in next update.</p>
                            </div>
                        )}

                        {activeView === 'history' && (
                            <div className="py-10 text-center">
                                <h1 className="text-2xl font-bold">Historical Data Repository</h1>
                                <p className="text-slate-500 mt-2 italic">Archive access available in next update.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Metrics Modal */}
            {showMetricsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-lg shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        <h2 className="text-3xl font-black mb-1 text-slate-900 dark:text-white tracking-tighter">Campaign Reporting</h2>
                        <p className="text-sm text-slate-500 mb-10 font-medium italic">Update real-time performance metrics for {selectedCampaign?.project?.projectName}</p>

                        <form onSubmit={handleMetricsSubmit} className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Reach</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800 border-transparent rounded-2xl font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={metricsData.reach}
                                    onChange={(e) => setMetricsData({ ...metricsData, reach: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leads Generated</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800 border-transparent rounded-2xl font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={metricsData.leads}
                                    onChange={(e) => setMetricsData({ ...metricsData, leads: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conversion Count</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800 border-transparent rounded-2xl font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={metricsData.conversions}
                                    onChange={(e) => setMetricsData({ ...metricsData, conversions: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget Spent (AED)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800 border-transparent rounded-2xl font-black text-lg text-emerald-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={metricsData.spent}
                                    onChange={(e) => setMetricsData({ ...metricsData, spent: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="col-span-2 flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowMetricsModal(false)}
                                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-400 font-bold rounded-2xl hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Broadcast Data
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Accept / Start Campaign Modal */}
            {showAcceptModal && selectedCampaign && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 w-full max-w-lg shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                        <h2 className="text-3xl font-black mb-1 text-slate-900 dark:text-white tracking-tighter">Start Campaign</h2>
                        <p className="text-sm text-slate-500 mb-8 font-medium italic">Confirm details for {selectedCampaign?.project?.companyName}</p>

                        <form onSubmit={handleAcceptSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Budget Allocation</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800 border-transparent rounded-2xl font-black text-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    value={acceptCampaignData.budgetAllocation}
                                    onChange={(e) => setAcceptCampaignData({ ...acceptCampaignData, budgetAllocation: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Strategy / Details</label>
                                <textarea
                                    required
                                    rows="4"
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800 border-transparent rounded-2xl font-medium text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                                    placeholder="Enter campaign details, targeting strategy, creatives used, etc..."
                                    value={acceptCampaignData.campaignDetails}
                                    onChange={(e) => setAcceptCampaignData({ ...acceptCampaignData, campaignDetails: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowAcceptModal(false)}
                                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-zinc-800 text-slate-400 font-bold rounded-2xl hover:text-slate-900 dark:hover:text-white transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 bg-green-600 text-white font-black rounded-2xl shadow-2xl shadow-green-600/30 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Launch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PMDashboard;
