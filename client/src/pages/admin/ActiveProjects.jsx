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
    MdDescription,
    MdComment,
    MdSend
} from 'react-icons/md';

const ActiveProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, paused
    const socket = useSocket();

    // Remarks state
    const [remarkInput, setRemarkInput] = useState('');
    const [remarkLoading, setRemarkLoading] = useState(false);

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
        socket.on('project_updated', handleProjectUpdate);

        return () => {
            socket.off('new_project', handleProjectUpdate);
            socket.off('sale_handover', handleProjectUpdate);
            socket.off('project_updated', handleProjectUpdate);
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

    const handleAddRemark = async (projectId) => {
        if (!remarkInput.trim()) return;
        setRemarkLoading(true);
        try {
            const res = await axios.post(`/api/projects/${projectId}/remarks`, { text: remarkInput });
            if (res.data.success) {
                setRemarkInput('');
            }
        } catch (err) {
            console.error("Failed to add remark", err);
        } finally {
            setRemarkLoading(false);
        }
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
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
                return { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', icon: <MdPlayArrow /> };
            case 'Paused':
                return { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', icon: <MdPause /> };
            case 'Completed':
                return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-400', icon: <MdCheckCircle /> };
            default:
                return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-400', icon: <MdFolder /> };
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return 'text-[#D8F60D]';
        if (percentage >= 50) return 'text-blue-500 dark:text-blue-400';
        if (percentage >= 25) return 'text-amber-500 dark:text-amber-400';
        return 'text-red-500 dark:text-red-400';
    };

    // Match Account Manager's visible checklist keys and labels
    const visibleChecklistKeys = ['meetingScheduled', 'meetingMinutesSent', 'contentCalendarSent', 'clientApprovalReceived', 'workStarted', 'socialMediaLinks', 'qcRequestsCreated', 'allWorkCompleted', 'monthlyReviewSent'];

    const checklistLabels = {
        meetingScheduled: 'Meeting Scheduled',
        meetingMinutesSent: 'Meeting Minutes Sent',
        contentCalendarSent: 'Content + Calendar Sent',
        clientApprovalReceived: 'Client Approval Received',
        workStarted: 'Work Started',
        socialMediaLinks: 'Social Media Links Created/Added',
        qcRequestsCreated: 'Work in Progress',
        allWorkCompleted: 'All Work Completed',
        monthlyReviewSent: 'Monthly Review Sent'
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] bg-white dark:bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D8F60D]"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 bg-white dark:bg-black min-h-screen p-8 transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-black dark:text-white">Active Projects</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Projects currently in progress with backend team</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-zinc-800">
                        {['all', 'active', 'paused'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${filter === f
                                    ? 'bg-[#D8F60D] text-black shadow-md'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
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
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Active</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{projects.filter(p => p.status === 'Active').length}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Paused</p>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{projects.filter(p => p.status === 'Paused').length}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Collected</p>
                    <p className="text-3xl font-black text-[#D8F60D] mt-1">AED {projects.reduce((sum, p) => sum + (p.payment?.collectedAmount || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pending Payments</p>
                    <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">AED {projects.reduce((sum, p) => sum + (p.payment?.pendingAmount || 0), 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
                {filteredProjects.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                        <MdFolder className="text-5xl text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 font-medium">No projects found</p>
                    </div>
                ) : (
                    filteredProjects.map((project) => {
                        const statusStyle = getStatusStyle(project.status);
                        const isExpanded = expandedProject === project._id;
                        let progress = project.progress; // Assuming progress exists

                        return (
                            <div
                                key={project._id}
                                className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#D8F60D] ring-1 ring-[#D8F60D] shadow-xl' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                            >
                                {/* Project Header */}
                                <div
                                    className="p-6 cursor-pointer"
                                    onClick={() => setExpandedProject(isExpanded ? null : project._id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-black dark:text-white">{project.clientName}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${statusStyle.bg.replace('bg-', 'border-').replace('/20', '/30')} ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {statusStyle.icon} {project.status}
                                                </span>
                                                {project.qc && project.qc.pending > 0 && (
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 flex items-center gap-1">
                                                        <MdWarning /> {project.qc.pending} QC Pending
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{project.companyName || 'No Company'}</p>
                                        </div>

                                        {/* Progress Ring */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden md:block">
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Collected</p>
                                                <p className="text-lg font-black text-[#D8F60D]">AED {project.payment?.collectedAmount?.toLocaleString() || 0}</p>
                                            </div>
                                            <div className="text-right hidden md:block">
                                                <p className="text-xs text-zinc-400 font-bold uppercase">Pending</p>
                                                <p className="text-lg font-black text-red-600 dark:text-red-400">AED {project.payment?.pendingAmount?.toLocaleString() || 0}</p>
                                            </div>
                                            <div className="relative w-16 h-16">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle
                                                        className="text-zinc-100 dark:text-zinc-800"
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
                                                    <span className="text-sm font-black text-black dark:text-white">{project.progress.percentage}%</span>
                                                </div>
                                            </div>
                                            <button className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                                                {isExpanded ? <MdExpandLess className="text-2xl" /> : <MdExpandMore className="text-2xl" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                            <span>Progress: {project.progress.completed}/{project.progress.total} steps</span>
                                            <span>Started: {formatDate(project.createdAt)}</span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-[#D8F60D] transition-all duration-500`}
                                                style={{ width: `${project.progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-black/50 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Left: Checklist */}
                                            <div className="lg:col-span-2">
                                                <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                                    <MdCheckCircle className="text-[#D8F60D]" /> Project Checklist
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {visibleChecklistKeys.map((key) => {
                                                        const value = project.checklist ? project.checklist[key] : null;
                                                        return (
                                                            <div
                                                                key={key}
                                                                className={`p-3 rounded-xl flex items-center gap-3 border ${value?.done
                                                                    ? 'bg-[#D8F60D]/10 border-[#D8F60D]/30'
                                                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                                                    }`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${value?.done ? 'bg-[#D8F60D] text-black shadow-sm' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                                                                    }`}>
                                                                    {value?.done && <MdCheckCircle className="text-xs" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className={`text-sm font-bold ${value?.done ? 'text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-500'}`}>
                                                                        {checklistLabels[key] || key}
                                                                    </p>
                                                                    {value?.date && (
                                                                        <p className="text-[10px] text-zinc-400">{formatDate(value.date)}</p>
                                                                    )}

                                                                    {/* Inline assets from AM modal */}
                                                                    {key === 'contentCalendarSent' && project.contentCalendarLink && (
                                                                        <div className="mt-2 text-xs">
                                                                            <a href={project.contentCalendarLink} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
                                                                                <MdDescription className="text-sm" />
                                                                                Content Calendar
                                                                            </a>
                                                                        </div>
                                                                    )}

                                                                    {key === 'socialMediaLinks' && project.socialLinks && project.socialLinks.length > 0 && (
                                                                        <div className="mt-2 text-xs flex flex-wrap gap-2">
                                                                            {project.socialLinks.map((s, idx) => (
                                                                                <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-xs">
                                                                                    <MdLink className="text-sm" /> {s.platform}
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Right: Details */}
                                            <div className="space-y-4">
                                                {/* Payment Details */}
                                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                    <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                                        <MdAttachMoney className="text-[#D8F60D]" /> Payment Details
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-500">Total Amount</span>
                                                            <span className="font-bold text-black dark:text-white">AED {project.payment?.totalAmount?.toLocaleString() || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-500">Collected</span>
                                                            <span className="font-bold text-[#D8F60D]">AED {project.payment?.collectedAmount?.toLocaleString() || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-zinc-500">Pending</span>
                                                            <span className="font-bold text-red-600 dark:text-red-400">AED {project.payment?.pendingAmount?.toLocaleString() || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                                            <span className="text-zinc-500">Status</span>
                                                            <span className={`font-bold ${project.payment?.paymentStatus === 'Received' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                                {project.payment?.paymentStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contact & Links */}
                                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                    <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                                        <MdLink className="text-blue-500 dark:text-blue-400" /> Links & Contact
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        {project.saleDetails?.clientPhone && (
                                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                                                <MdPhone className="text-zinc-400" />
                                                                {project.saleDetails.clientPhone}
                                                            </div>
                                                        )}
                                                        {project.contentCalendarLink && (
                                                            <a
                                                                href={project.contentCalendarLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
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
                                                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                                                            >
                                                                <MdLink className="text-blue-400" />
                                                                {link.platform}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Requirements & Remarks */}
                                            <div className="space-y-4">
                                                {/* Requirements */}
                                                {project.saleDetails?.requirements && (
                                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                        <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Requirements</h4>
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-300">{project.saleDetails.requirements}</p>
                                                    </div>
                                                )}

                                                {/* Remarks Section */}
                                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                                    <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                                        <MdComment className="text-indigo-500 dark:text-indigo-400" /> Remarks
                                                    </h4>

                                                    <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-1 custom-scrollbar">
                                                        {project.remarks && project.remarks.length > 0 ? (
                                                            project.remarks.slice().reverse().map((remark, idx) => (
                                                                <div key={idx} className="bg-zinc-50 dark:bg-black p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
                                                                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{remark.text}</p>
                                                                    <div className="flex justify-between items-center mt-2 text-xs text-zinc-400">
                                                                        <span>{remark.user?.name || 'Unknown User'}</span>
                                                                        <span>{formatDateTime(remark.date)}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-zinc-400 text-sm italic">No remarks yet.</p>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D8F60D]"
                                                            placeholder="Add a remark..."
                                                            value={remarkInput}
                                                            onChange={(e) => setRemarkInput(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleAddRemark(project._id);
                                                            }}
                                                        />
                                                        <button
                                                            className="bg-[#D8F60D] hover:bg-[#bce00b] text-black px-3 py-2 rounded-lg flex items-center justify-center disabled:opacity-50 font-bold"
                                                            onClick={() => handleAddRemark(project._id)}
                                                            disabled={!remarkInput.trim() || remarkLoading}
                                                        >
                                                            {remarkLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> : <MdSend />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* QC Requests */}
                                                {project.qc.total > 0 && (
                                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                        <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                                            <MdWarning className="text-amber-500" /> QC Requests ({project.qc.total})
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {project.qc.requests.slice(0, 3).map((qc, i) => (
                                                                <div key={i} className="flex items-center justify-between text-sm">
                                                                    <span className="text-zinc-600 dark:text-zinc-300 truncate flex-1">{qc.details || 'QC Request'}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${qc.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                                                        qc.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                                                            'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
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
