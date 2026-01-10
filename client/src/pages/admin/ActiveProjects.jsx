import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import {
    MdFolder,
    MdPause,
    MdPlayArrow,
    MdCheckCircle,
    MdAccessTime,
    MdPhone,
    MdAttachMoney,
    MdWarning,
    MdExpandMore,
    MdExpandLess,
    MdLink,
    MdDescription
} from 'react-icons/md';

const ActiveProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, paused
    const socket = useSocket();

    useEffect(() => {
        fetchProjects();
    }, []);

    // Real-time socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleProjectUpdate = () => {
            fetchProjects();
        };

        socket.on('new_project', handleProjectUpdate);
        socket.on('sale_handover', handleProjectUpdate);

        return () => {
            socket.off('new_project', handleProjectUpdate);
            socket.off('sale_handover', handleProjectUpdate);
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

    const filteredProjects = projects.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'active') return p.status === 'Active';
        if (filter === 'paused') return p.status === 'Paused';
        return true;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active':
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <MdPlayArrow /> };
            case 'Paused':
                return { bg: 'bg-amber-100', text: 'text-amber-700', icon: <MdPause /> };
            case 'Completed':
                return { bg: 'bg-slate-100', text: 'text-slate-700', icon: <MdCheckCircle /> };
            default:
                return { bg: 'bg-slate-100', text: 'text-slate-700', icon: <MdFolder /> };
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-blue-500';
        if (percentage >= 25) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const checklistLabels = {
        meetingScheduled: 'Meeting Scheduled',
        meetingMinutesSent: 'Meeting Minutes Sent',
        contentCalendarSent: 'Content Calendar Sent',
        clientApprovalReceived: 'Client Approval Received',
        workStarted: 'Work Started',
        socialMediaLinks: 'Social Media Links',
        spreadsheetLinkAdded: 'Spreadsheet Link Added',
        qcRequestsCreated: 'QC Requests Created',
        redoLoopsCompleted: 'Redo Loops Completed',
        allWorkCompleted: 'All Work Completed',
        monthlyReviewSent: 'Monthly Review Sent'
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Active Projects</h1>
                    <p className="text-slate-500 font-medium">Projects currently in progress with backend team</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        {['all', 'active', 'paused'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${filter === f
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {f} ({f === 'all' ? projects.length : projects.filter(p => p.status === f.charAt(0).toUpperCase() + f.slice(1)).length})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active</p>
                    <p className="text-3xl font-black text-emerald-600 mt-1">{projects.filter(p => p.status === 'Active').length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paused</p>
                    <p className="text-3xl font-black text-amber-600 mt-1">{projects.filter(p => p.status === 'Paused').length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
                    <p className="text-3xl font-black text-blue-600 mt-1">₹{projects.reduce((sum, p) => sum + (p.payment?.collectedAmount || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payments</p>
                    <p className="text-3xl font-black text-red-600 mt-1">₹{projects.reduce((sum, p) => sum + (p.payment?.pendingAmount || 0), 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
                {filteredProjects.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                        <MdFolder className="text-5xl text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No projects found</p>
                    </div>
                ) : (
                    filteredProjects.map((project) => {
                        const statusStyle = getStatusStyle(project.status);
                        const isExpanded = expandedProject === project._id;

                        return (
                            <div
                                key={project._id}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
                            >
                                {/* Project Header */}
                                <div
                                    className="p-6 cursor-pointer"
                                    onClick={() => setExpandedProject(isExpanded ? null : project._id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-slate-800">{project.clientName}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {statusStyle.icon} {project.status}
                                                </span>
                                                {project.qc.pending > 0 && (
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 flex items-center gap-1">
                                                        <MdWarning /> {project.qc.pending} QC Pending
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">{project.companyName || 'No Company'}</p>
                                        </div>

                                        {/* Progress Ring */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden md:block">
                                                <p className="text-xs text-slate-400 font-bold uppercase">Collected</p>
                                                <p className="text-lg font-black text-emerald-600">₹{project.payment?.collectedAmount?.toLocaleString() || 0}</p>
                                            </div>
                                            <div className="text-right hidden md:block">
                                                <p className="text-xs text-slate-400 font-bold uppercase">Pending</p>
                                                <p className="text-lg font-black text-red-600">₹{project.payment?.pendingAmount?.toLocaleString() || 0}</p>
                                            </div>
                                            <div className="relative w-16 h-16">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle
                                                        className="text-slate-100"
                                                        strokeWidth="4"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r="28"
                                                        cx="32"
                                                        cy="32"
                                                    />
                                                    <circle
                                                        className={getProgressColor(project.progress.percentage)}
                                                        strokeWidth="4"
                                                        strokeDasharray={176}
                                                        strokeDashoffset={176 - (project.progress.percentage / 100) * 176}
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r="28"
                                                        cx="32"
                                                        cy="32"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-sm font-black text-slate-700">{project.progress.percentage}%</span>
                                                </div>
                                            </div>
                                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                                {isExpanded ? <MdExpandLess className="text-2xl" /> : <MdExpandMore className="text-2xl" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Progress: {project.progress.completed}/{project.progress.total} steps</span>
                                            <span>Started: {formatDate(project.createdAt)}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getProgressColor(project.progress.percentage)} transition-all duration-500`}
                                                style={{ width: `${project.progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 p-6 bg-slate-50 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Left: Checklist */}
                                            <div className="lg:col-span-2">
                                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                    <MdCheckCircle className="text-blue-500" /> Project Checklist
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(project.checklist || {}).map(([key, value]) => (
                                                        <div
                                                            key={key}
                                                            className={`p-3 rounded-xl flex items-center gap-3 ${value?.done
                                                                    ? 'bg-emerald-50 border border-emerald-100'
                                                                    : 'bg-white border border-slate-100'
                                                                }`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${value?.done ? 'bg-emerald-500 text-white' : 'bg-slate-200'
                                                                }`}>
                                                                {value?.done && <MdCheckCircle className="text-xs" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className={`text-sm font-medium ${value?.done ? 'text-emerald-700' : 'text-slate-600'}`}>
                                                                    {checklistLabels[key] || key}
                                                                </p>
                                                                {value?.date && (
                                                                    <p className="text-[10px] text-slate-400">{formatDate(value.date)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right: Details */}
                                            <div className="space-y-4">
                                                {/* Payment Details */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                        <MdAttachMoney className="text-emerald-500" /> Payment Details
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Total Amount</span>
                                                            <span className="font-bold">₹{project.payment?.totalAmount?.toLocaleString() || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Collected</span>
                                                            <span className="font-bold text-emerald-600">₹{project.payment?.collectedAmount?.toLocaleString() || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Pending</span>
                                                            <span className="font-bold text-red-600">₹{project.payment?.pendingAmount?.toLocaleString() || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between pt-2 border-t border-slate-100">
                                                            <span className="text-slate-500">Status</span>
                                                            <span className={`font-bold ${project.payment?.paymentStatus === 'Received' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                {project.payment?.paymentStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contact & Links */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                        <MdLink className="text-blue-500" /> Links & Contact
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        {project.saleDetails?.clientPhone && (
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <MdPhone className="text-slate-400" />
                                                                {project.saleDetails.clientPhone}
                                                            </div>
                                                        )}
                                                        {project.contentCalendarLink && (
                                                            <a
                                                                href={project.contentCalendarLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-blue-600 hover:underline"
                                                            >
                                                                <MdDescription className="text-blue-400" />
                                                                Content Calendar
                                                            </a>
                                                        )}
                                                        {project.socialLinks?.map((link, i) => (
                                                            <a
                                                                key={i}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-blue-600 hover:underline"
                                                            >
                                                                <MdLink className="text-blue-400" />
                                                                {link.platform}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Requirements */}
                                                {project.saleDetails?.requirements && (
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                        <h4 className="text-sm font-bold text-slate-700 mb-2">Requirements</h4>
                                                        <p className="text-sm text-slate-600">{project.saleDetails.requirements}</p>
                                                    </div>
                                                )}

                                                {/* QC Requests */}
                                                {project.qc.total > 0 && (
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                            <MdWarning className="text-amber-500" /> QC Requests ({project.qc.total})
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {project.qc.requests.slice(0, 3).map((qc, i) => (
                                                                <div key={i} className="flex items-center justify-between text-sm">
                                                                    <span className="text-slate-600 truncate flex-1">{qc.details || 'QC Request'}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${qc.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                                                            qc.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                                                                'bg-red-100 text-red-600'
                                                                        }`}>
                                                                        {qc.status}
                                                                    </span>
                                                                </div>
                                                            ))}
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
    );
};

export default ActiveProjects;
