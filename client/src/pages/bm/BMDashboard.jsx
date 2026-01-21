import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    MdFolder,
    MdPause,
    MdPlayArrow,
    MdCheckCircle,
    MdAttachMoney,
    MdWarning,
    MdExpandMore,
    MdExpandLess,
    MdLink,
    MdDescription,
    MdComment,
    MdSend,
    MdLogout,
    MdDashboard,
    MdHistory,
    MdMenu
} from 'react-icons/md';

const BMDashboard = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [paymentUpdates, setPaymentUpdates] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);
    const [filter, setFilter] = useState('all');
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [remarkInput, setRemarkInput] = useState('');
    const [remarkLoading, setRemarkLoading] = useState(false);

    useEffect(() => {
        fetchProjects();
        fetchSalesData();
    }, []);

    useEffect(() => {
        // Request Notification permission
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        if (!socket) return;

        const playNotificationSound = () => {
            try {
                // Simple upbeat notification sound (beep)
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);
            } catch (e) {
                console.error("Audio play failed", e);
            }
        };

        const showNotification = (title, body) => {
            playNotificationSound(); // Always play sound

            if (Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body,
                    icon: '/vite.svg',
                    tag: 'bm-notification',
                    requireInteraction: false // Let it hide automatically to be less annoying if frequent
                });
                notification.onclick = function () {
                    window.focus();
                    this.close();
                };
            }
        };

        const handleProjectUpdate = (updatedProject) => {
            if (updatedProject && updatedProject._id) {
                setProjects(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
            } else {
                fetchProjects();
            }
        };

        const handleNewSale = (data) => {
            fetchSalesData();
            const clientName = data?.sale?.clientName || 'A Prospect';
            showNotification('New Sale Converted!', `${clientName} has been converted to a sale.`);
        };

        const handlePaymentAdded = (data) => {
            fetchSalesData();
            const clientName = data?.sale?.clientName || 'A Client';
            const amount = data?.paymentAmount ? `AED${data.paymentAmount}` : 'a payment';
            showNotification('Payment Received', `Received ${amount} from ${clientName}.`);
        };

        socket.on('new_project', fetchProjects);
        socket.on('sale_handover', fetchProjects);
        socket.on('project_updated', handleProjectUpdate);
        socket.on('sale_converted', handleNewSale);
        socket.on('payment_added', handlePaymentAdded);

        // Expose test function for button
        window.testNotification = () => showNotification('Test Alert', 'This is a test notification.');

        return () => {
            socket.off('new_project', fetchProjects);
            socket.off('sale_handover', fetchProjects);
            socket.off('project_updated', handleProjectUpdate);
            socket.off('sale_converted', handleNewSale);
            socket.off('payment_added', handlePaymentAdded);
            delete window.testNotification;
        };
    }, [socket]);

    const fetchProjects = async () => {
        try {
            const res = await axios.get('/api/admin/active-projects');
            if (res.data.success) {
                setProjects(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesData = async () => {
        try {
            const res = await axios.get('/api/sales?year=' + new Date().getFullYear());
            if (res.data.success) {
                const allSales = res.data.data.filter(s => s.status === 'Sale');
                setPaymentUpdates(allSales.filter(s => !s.bmNoted));
                setSalesHistory(allSales.filter(s => s.bmNoted));
            }
        } catch (err) {
            console.error("Failed to fetch sales", err);
        }
    };

    const handleMarkNoted = async (saleId) => {
        try {
            const res = await axios.put(`/api/sales/${saleId}/note`);
            if (res.data.success) {
                const sale = paymentUpdates.find(s => s._id === saleId);
                if (sale) {
                    setPaymentUpdates(prev => prev.filter(s => s._id !== saleId));
                    setSalesHistory(prev => [sale, ...prev]);
                }
            }
        } catch (err) { console.error(err); }
    };

    const handleAddRemark = async (projectId) => {
        if (!remarkInput.trim()) return;
        setRemarkLoading(true);
        try {
            const res = await axios.post(`/api/projects/${projectId}/remarks`, { text: remarkInput });
            if (res.data.success) {
                setRemarkInput('');
                setProjects(prev => prev.map(p => p._id === projectId ? res.data.data : p));
            }
        } catch (err) { console.error("Failed to add remark", err); }
        finally { setRemarkLoading(false); }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const filteredProjects = projects.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'active') return p.status === 'Active';
        if (filter === 'paused') return p.status === 'Paused';
        return true;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return { bg: 'bg-[#D8F60D]/20', text: 'text-black dark:text-[#D8F60D]', border: 'border-[#D8F60D]/50', icon: <MdPlayArrow /> };
            case 'Paused': return { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-500', border: 'border-amber-500/20', icon: <MdPause /> };
            default: return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700', icon: <MdFolder /> };
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return 'text-[#D8F60D]';
        if (percentage >= 50) return 'text-blue-500 dark:text-blue-400';
        if (percentage >= 25) return 'text-amber-500 dark:text-amber-400';
        return 'text-red-500 dark:text-red-400';
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A';

    const visibleChecklistKeys = ['meetingScheduled', 'meetingMinutesSent', 'contentCalendarSent', 'clientApprovalReceived', 'workStarted', 'socialMediaLinks', 'qcRequestsCreated', 'allWorkCompleted', 'monthlyReviewSent'];
    const checklistLabels = {
        meetingScheduled: 'Meeting Scheduled', meetingMinutesSent: 'Meeting Minutes Sent', contentCalendarSent: 'Content + Calendar Sent',
        clientApprovalReceived: 'Client Approval Received', workStarted: 'Work Started', socialMediaLinks: 'Social Media Links Created',
        qcRequestsCreated: 'Work in Progress', allWorkCompleted: 'All Work Completed', monthlyReviewSent: 'Monthly Review Sent'
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] bg-white dark:bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D8F60D]"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <h1 className="text-2xl font-black text-black dark:text-white tracking-tight">Backend<span className="text-[#D8F60D]">Manager</span></h1>
                </div>
                <nav className="p-4 space-y-2">
                    <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeView === 'dashboard' ? 'bg-[#D8F60D] text-black shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white'}`}>
                        <MdDashboard className="text-xl" /> Dashboard
                    </button>
                    <button onClick={() => setActiveView('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeView === 'history' ? 'bg-[#D8F60D] text-black shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white'}`}>
                        <MdHistory className="text-xl" /> Sales History
                    </button>
                    <button onClick={() => navigate('/backend-manager/discussions')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white">
                        <MdComment className="text-xl text-[#D8F60D]" /> Project Discussions
                    </button>
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold">
                        <MdLogout className="text-xl" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 transition-all bg-white dark:bg-black">
                <div className="md:hidden flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
                    <span className="font-bold text-lg">Backend Manager</span>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-black dark:text-white p-2">
                        <MdMenu className="text-2xl" />
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
                    {activeView === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-black dark:text-white mb-1">Overview</h2>
                                    <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {user?.name}</p>
                                </div>
                                <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-zinc-800">
                                    {['all', 'active', 'paused'].map((f) => (
                                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${filter === f ? 'bg-[#D8F60D] text-black shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}>
                                            {f}
                                        </button>
                                    ))}
                                    <button onClick={() => {
                                        if (window.testNotification) {
                                            window.testNotification();
                                        } else {
                                            alert('Notification system not ready.');
                                        }
                                    }} className="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700">
                                        Test Alert
                                    </button>
                                </div>
                            </div>

                            {/* Payment Updation Section */}
                            {paymentUpdates.length > 0 && (
                                <div className="bg-white dark:bg-zinc-900/50 border border-[#D8F60D] dark:border-[#D8F60D]/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D8F60D]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#D8F60D]/20 p-3 rounded-xl border border-[#D8F60D]/40">
                                                <MdAttachMoney className="text-3xl text-black dark:text-[#D8F60D]" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-black dark:text-white">Payment Updation</h3>
                                                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Review recent sales and payment activities</p>
                                            </div>
                                        </div>
                                        <span className="bg-[#D8F60D] text-black px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                            {paymentUpdates.length} Updates
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                        {paymentUpdates.map(sale => (
                                            <div key={sale._id} className="bg-zinc-50 dark:bg-black/40 backdrop-blur-md rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 hover:border-[#D8F60D] transition-all shadow-sm hover:shadow-lg group/card">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-bold text-lg text-black dark:text-white group-hover/card:text-[#D8F60D] transition-colors">{sale.clientName}</h4>
                                                    <span className="text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">{formatDateTime(sale.createdAt)}</span>
                                                </div>
                                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">{sale.companyName}</p>

                                                <div className="bg-white dark:bg-zinc-900/80 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 mb-4">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-zinc-500 dark:text-zinc-500">Collected</span>
                                                        <span className="text-black dark:text-[#D8F60D] font-bold">AED{sale.payment?.collectedAmount}</span>
                                                    </div>
                                                    {sale.payment?.paymentHistory?.length > 0 && (
                                                        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-2">
                                                            <p className="mb-1 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Latest Payment</p>
                                                            <div className="flex justify-between font-medium">
                                                                <span className="text-black dark:text-white">AED{sale.payment.paymentHistory[sale.payment.paymentHistory.length - 1].amount}</span>
                                                                <span>{formatDate(sale.payment.paymentHistory[sale.payment.paymentHistory.length - 1].date)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <button onClick={() => handleMarkNoted(sale._id)} className="w-full bg-black dark:bg-white hover:bg-[#D8F60D] hover:text-black text-white dark:text-black py-3 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                                                    <MdCheckCircle className="text-lg" /> Mark as Noted
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {filteredProjects.length === 0 ? (
                                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-16 text-center">
                                        <MdFolder className="text-6xl text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                                        <p className="text-zinc-500 font-medium">No projects found matching current filter</p>
                                    </div>
                                ) : (
                                    filteredProjects.map((project) => {
                                        const statusStyle = getStatusStyle(project.status);
                                        const isExpanded = expandedProject === project._id;
                                        let progress = project.progress;
                                        if (!progress && project.checklist) {
                                            const steps = Object.values(project.checklist);
                                            const completed = steps.filter(s => s.done).length;
                                            progress = { completed, total: steps.length, percentage: Math.round((completed / steps.length) * 100) };
                                        } else if (!progress) { progress = { percentage: 0, completed: 0, total: 11 }; }

                                        return (
                                            <div key={project._id} className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#D8F60D] ring-1 ring-[#D8F60D] shadow-xl' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                                                <div className="p-6 cursor-pointer" onClick={() => setExpandedProject(isExpanded ? null : project._id)}>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-[#D8F60D] transition-colors">{project.clientName}</h3>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                                    {statusStyle.icon} {project.status}
                                                                </span>
                                                                {project.qcRequests && project.qcRequests.some(q => q.status === 'Pending') && (
                                                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20 flex items-center gap-1">
                                                                        <MdWarning /> QC Pending
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{project.companyName || 'No Company'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="relative w-16 h-16 hidden sm:block">
                                                                <svg className="w-full h-full transform -rotate-90">
                                                                    <circle className="text-zinc-200 dark:text-zinc-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="26" cx="32" cy="32" />
                                                                    <circle className={getProgressColor(progress.percentage)} strokeWidth="6" strokeDasharray={163} strokeDashoffset={163 - (progress.percentage / 100) * 163} strokeLinecap="round" stroke="currentColor" fill="transparent" r="26" cx="32" cy="32" />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center hidden sm:flex">
                                                                    <span className="text-sm font-black text-black dark:text-white">{progress.percentage}%</span>
                                                                </div>
                                                            </div>
                                                            <button className="text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                                                                {isExpanded ? <MdExpandLess className="text-3xl" /> : <MdExpandMore className="text-3xl" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 sm:hidden">
                                                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                                            <span>Progress: {progress.completed}/{progress.total} steps</span>
                                                        </div>
                                                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                            <div className={`h-full bg-[#D8F60D] transition-all duration-500`} style={{ width: `${progress.percentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Content */}
                                                {isExpanded && (
                                                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-8 bg-zinc-50/50 dark:bg-black/50 animate-in slide-in-from-top-4 duration-300">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-zinc-400 dark:text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                                                    <MdCheckCircle className="text-[#D8F60D]" /> Project Checklist
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {visibleChecklistKeys.map((key) => {
                                                                        const value = project.checklist ? project.checklist[key] : null;
                                                                        return (
                                                                            <div key={key} className={`p-4 rounded-xl flex items-center gap-4 transition-all ${value?.done ? 'bg-[#D8F60D]/10 border border-[#D8F60D]/30' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'}`}>
                                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${value?.done ? 'bg-[#D8F60D] text-black shadow-lg shadow-[#D8F60D]/20' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                                                                                    {value?.done && <MdCheckCircle className="text-sm" />}
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <p className={`text-sm font-bold ${value?.done ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-500'}`}>{checklistLabels[key] || key}</p>
                                                                                    {value?.date && <p className="text-[10px] text-zinc-500 dark:text-[#D8F60D]/80 mt-0.5">{formatDate(value.date)}</p>}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-6">
                                                                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                                                    <h4 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                                                        <MdComment className="text-indigo-500 dark:text-indigo-400" /> Remarks
                                                                    </h4>
                                                                    <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar">
                                                                        {project.remarks && project.remarks.length > 0 ? (
                                                                            project.remarks.slice().reverse().map((remark, idx) => (
                                                                                <div key={idx} className="bg-zinc-50 dark:bg-black p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
                                                                                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{remark.text}</p>
                                                                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                                                                                        <span className="font-bold text-zinc-600 dark:text-zinc-400">{remark.user?.name || 'Unknown User'}</span>
                                                                                        <span>{formatDateTime(remark.date)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-zinc-500 dark:text-zinc-600 text-sm italic py-4 text-center">No remarks yet. Start the conversation.</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <input type="text" className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D8F60D] focus:border-transparent placeholder-zinc-400 dark:placeholder-zinc-600 transition-all" placeholder="Add a remark..." value={remarkInput} onChange={(e) => setRemarkInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddRemark(project._id); }} />
                                                                        <button className="bg-[#D8F60D] hover:bg-[#bce00b] text-black px-4 py-2 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={() => handleAddRemark(project._id)} disabled={!remarkInput.trim() || remarkLoading}>
                                                                            {remarkLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div> : <MdSend className="text-xl" />}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                                    <h4 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                                                        <MdLink className="text-blue-500 dark:text-blue-400" /> Important Links
                                                                    </h4>
                                                                    <div className="space-y-3 text-sm">
                                                                        {project.contentCalendarLink ? (
                                                                            <a href={project.contentCalendarLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:text-black dark:hover:text-white transition-colors p-3 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50">
                                                                                <MdDescription className="text-lg" /> Content Calendar
                                                                            </a>
                                                                        ) : (
                                                                            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800/50 text-zinc-500 dark:text-zinc-600 italic flex items-center gap-2">
                                                                                <MdDescription /> No Content Calendar Link
                                                                            </div>
                                                                        )}
                                                                        {project.socialLinks?.map((link, i) => (
                                                                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:text-black dark:hover:text-white transition-colors p-3 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50">
                                                                                <MdLink className="text-lg" /> {link.platform}
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {project.payment?.history && project.payment.history.length > 0 && (
                                                                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                                        <h4 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                                                            <MdAttachMoney className="text-[#D8F60D]" /> Payment History
                                                                        </h4>
                                                                        <div className="space-y-0.5">
                                                                            {project.payment.history.map((pay, idx) => (
                                                                                <div key={idx} className="flex justify-between items-center text-sm p-3 hover:bg-zinc-50 dark:hover:bg-black/40 rounded-lg transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                                                                                    <div>
                                                                                        <p className="font-bold text-black dark:text-white">AED{pay.amount}</p>
                                                                                        <p className="text-xs text-zinc-500">{pay.notes || 'No notes'}</p>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="text-xs text-zinc-400">{formatDate(pay.date)}</p>
                                                                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-600 capitalize">{pay.method}</p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-sm font-bold">
                                                                            <span className="text-zinc-500 dark:text-zinc-400">Total Collected:</span>
                                                                            <span className="text-[#D8F60D] text-lg">AED{project.payment.collectedAmount}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm mt-1">
                                                                            <span className="text-zinc-500">Pending:</span>
                                                                            <span className="text-red-500 dark:text-red-400">AED{project.payment.pendingAmount}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeView === 'history' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div>
                                <h2 className="text-3xl font-bold text-black dark:text-white mb-1">Sales History</h2>
                                <p className="text-zinc-500 dark:text-zinc-400">Archive of noted sales and active projects</p>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#D8F60D]/20 border-b border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <th className="p-4 text-sm font-bold text-black dark:text-[#D8F60D]">Client Name</th>
                                                <th className="p-4 text-sm font-bold text-black dark:text-[#D8F60D]">Company</th>
                                                <th className="p-4 text-sm font-bold text-black dark:text-[#D8F60D]">Total Collected</th>
                                                <th className="p-4 text-sm font-bold text-black dark:text-[#D8F60D]">Pending</th>
                                                <th className="p-4 text-sm font-bold text-black dark:text-[#D8F60D]">Last Payment</th>
                                                <th className="p-4 text-sm font-bold text-black dark:text-[#D8F60D]">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                            {salesHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="p-8 text-center text-zinc-500">No history found.</td>
                                                </tr>
                                            ) : (
                                                salesHistory.map((sale) => (
                                                    <tr key={sale._id} className="hover:bg-zinc-100 dark:hover:bg-black/20 transition-colors">
                                                        <td className="p-4 font-bold text-black dark:text-white">{sale.clientName}</td>
                                                        <td className="p-4 text-zinc-500 dark:text-zinc-400 text-sm">{sale.companyName}</td>
                                                        <td className="p-4 font-bold text-[#D8F60D] drop-shadow-sm text-shadow-sm">AED{sale.payment?.collectedAmount}</td>
                                                        <td className="p-4 text-red-500 dark:text-red-400 font-medium">AED{sale.payment?.pendingAmount}</td>
                                                        <td className="p-4 text-sm">
                                                            {sale.payment?.paymentHistory?.length > 0 ? (
                                                                <>
                                                                    <div className="text-black dark:text-white">AED{sale.payment.paymentHistory[sale.payment.paymentHistory.length - 1].amount}</div>
                                                                    <div className="text-[10px] text-zinc-500">{formatDate(sale.payment.paymentHistory[sale.payment.paymentHistory.length - 1].date)}</div>
                                                                </>
                                                            ) : <span className="text-zinc-400">-</span>}
                                                        </td>
                                                        <td className="p-4 text-sm text-zinc-500">{formatDate(sale.createdAt)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BMDashboard;
