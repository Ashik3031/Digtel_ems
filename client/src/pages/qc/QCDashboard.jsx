import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  MdDashboard,
  MdHistory,
  MdLogout,
  MdMenu,
  MdClose,
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdDescription,
  MdLink,
  MdPerson,
  MdRefresh
} from 'react-icons/md';

const QCDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('new'); // 'new' | 'history'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Visible checklist keys from Account Manager
  const visibleChecklistKeys = ['meetingScheduled', 'meetingMinutesSent', 'contentCalendarSent', 'clientApprovalReceived', 'workStarted', 'socialMediaLinks', 'qcRequestsCreated', 'allWorkCompleted', 'monthlyReviewSent'];

  const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchRequests();

    socket.on('qc_updated', handleUpdate);
    socket.on('project_updated', handleUpdate);

    return () => {
      socket.off('qc_updated', handleUpdate);
      socket.off('project_updated', handleUpdate);
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/projects/qc-requests');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.fire({ icon: 'error', title: 'Failed to load QC requests' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const updateStatus = async (projectId, qcId, status, feedback = '') => {
    try {
      const payload = { status };
      if (feedback) payload.feedback = feedback;
      const res = await axios.put(`/api/projects/${projectId}/qc/${qcId}`, payload);

      toast.fire({ icon: 'success', title: `QC request ${status}` });

      // Update local state
      setRequests(prev => prev.map(r => {
        if (String(r.projectId) === String(projectId) && String(r.qcRequest._id) === String(qcId)) {
          // Start of Selection
          return { ...r, qcRequest: { ...r.qcRequest, ...res.data.data.qc } };
        }
        return r;
      }));
    } catch (err) {
      toast.fire({ icon: 'error', title: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleApprove = (r) => {
    Swal.fire({
      title: 'Approve this request?',
      text: `${r.clientName} — ${r.qcRequest.details}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Approve'
    }).then(result => {
      if (result.isConfirmed) updateStatus(r.projectId, r.qcRequest._id, 'Approved');
    });
  };

  const handleRedoOrReject = (r, action) => {
    Swal.fire({
      title: `${action} Request`,
      input: 'textarea',
      inputLabel: 'Feedback / Instructions',
      inputPlaceholder: 'Provide details...',
      showCancelButton: true,
      confirmButtonColor: action === 'Redo' ? '#F59E0B' : '#EF4444',
      confirmButtonText: `Submit ${action}`,
      preConfirm: (value) => {
        if (!value) Swal.showValidationMessage('Please enter feedback');
        return value;
      }
    }).then(result => {
      if (result.isConfirmed) updateStatus(r.projectId, r.qcRequest._id, action === 'Redo' ? 'Redo' : 'Rejected', result.value);
    });
  };

  // Filter and Group Logic
  const filteredRequests = requests.filter(r => {
    const status = r.qcRequest.status;
    if (activeView === 'new') {
      return status === 'Pending';
    } else {
      // History: Approved, Rejected, Redo
      return status === 'Approved' || status === 'Rejected' || status === 'Redo';
    }
  });

  const groupedByProject = filteredRequests.reduce((acc, req) => {
    const projectId = String(req.projectId);
    if (!acc[projectId]) {
      acc[projectId] = {
        projectId: req.projectId,
        clientName: req.clientName,
        companyName: req.companyName,
        salesExec: req.salesExec,
        am: req.am,
        qcRequests: []
      };
    }
    acc[projectId].qcRequests.push(req);
    return acc;
  }, {});

  const projectList = Object.values(groupedByProject).sort((a, b) => b.qcRequests.length - a.qcRequests.length);

  return (
    <div className="flex h-screen bg-white dark:bg-black transition-colors duration-300 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h1 className="text-2xl font-black text-black dark:text-white tracking-tighter">
            QC<span className="text-[#D8F60D]">.Panel</span>
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500">
            <MdClose size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => { setActiveView('new'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'new' ? 'bg-[#D8F60D] text-black shadow-lg shadow-[#D8F60D]/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <MdDashboard size={20} />
            New Requests
          </button>
          <button
            onClick={() => { setActiveView('history'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'history' ? 'bg-[#D8F60D] text-black shadow-lg shadow-[#D8F60D]/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <MdHistory size={20} />
            History
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <MdLogout size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black transition-colors duration-300">
        {/* Mobile Header */}
        <header className="md:hidden p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-black">
          <h2 className="text-lg font-bold text-black dark:text-white">{activeView === 'new' ? 'New Requests' : 'History'}</h2>
          <button onClick={() => setIsSidebarOpen(true)} className="text-black dark:text-white">
            <MdMenu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black text-black dark:text-white mb-2">{activeView === 'new' ? 'Pending QC Requests' : 'QC History'}</h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                {activeView === 'new'
                  ? 'Review and approve pending deliverables'
                  : 'Archive of approved, rejected, or redo requests'
                }
              </p>
            </div>
            <button onClick={fetchRequests} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-black dark:text-white transition-colors">
              <MdRefresh size={24} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D8F60D]"></div>
            </div>
          ) : projectList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <MdCheckCircle className="text-6xl mb-4 text-zinc-200 dark:text-zinc-800" />
              <p className="text-lg font-medium">No requests found in {activeView} view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {projectList.map((project) => (
                <div key={project.projectId} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-all hover:shadow-md">
                  {/* Project Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800 gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-3">
                        {project.clientName}
                        <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs rounded-full font-bold">
                          {project.qcRequests.length} Item{project.qcRequests.length !== 1 ? 's' : ''}
                        </span>
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{project.companyName || 'No Company Name'}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {project.salesExec && (
                        <div className="flex items-center gap-1 bg-zinc-50 dark:bg-black px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                          <MdPerson className="text-blue-500" />
                          Sales: <span className="text-black dark:text-white">{project.salesExec.name}</span>
                        </div>
                      )}
                      {project.am && (
                        <div className="flex items-center gap-1 bg-zinc-50 dark:bg-black px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                          <MdPerson className="text-purple-500" />
                          AM: <span className="text-black dark:text-white">{project.am.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Requests List */}
                  <div className="space-y-4">
                    {project.qcRequests.map((r) => (
                      <div key={`${r.projectId}-${r.qcRequest._id}`} className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5 hover:border-[#D8F60D]/30 transition-colors">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-lg leading-tight">{r.qcRequest.details}</h4>
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${r.qcRequest.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                  r.qcRequest.status === 'Rejected' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                                    r.qcRequest.status === 'Redo' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                      'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                }`}>
                                {r.qcRequest.status}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mb-4 flex items-center gap-1">
                              Requested on {new Date(r.qcRequest.requestDate).toLocaleString()}
                              {r.qcCreator && <span>by <span className="text-zinc-500 dark:text-zinc-300 font-medium">{r.qcCreator.name}</span></span>}
                            </p>

                            {r.qcRequest.feedback && (
                              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                                <strong className="block text-xs uppercase opacity-70 mb-1">Feedback</strong>
                                {r.qcRequest.feedback}
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Checklist */}
                              {r.checklist && (
                                <div>
                                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Checklist Status</p>
                                  <div className="flex flex-wrap gap-2">
                                    {visibleChecklistKeys.map((key) => {
                                      const item = r.checklist[key];
                                      if (!item) return null;
                                      return (
                                        <span key={key} className={`px-2 py-1 rounded text-[10px] font-bold border ${item.done ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-500'}`}>
                                          {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Assets */}
                              {(r.contentCalendarLink || (r.socialLinks && r.socialLinks.length > 0)) && (
                                <div>
                                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Delivered Assets</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {r.contentCalendarLink && (
                                      <a href={r.contentCalendarLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                        <MdDescription /> Calendar
                                      </a>
                                    )}
                                    {r.socialLinks && r.socialLinks.map((s, idx) => (
                                      <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                                        <MdLink /> {s.platform}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions - Only visible in 'New' view */}
                          {activeView === 'new' && (
                            <div className="flex lg:flex-col gap-3 min-w-[140px] pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 lg:pl-6">
                              <button onClick={() => handleApprove(r)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5">
                                <MdCheckCircle /> Approve
                              </button>
                              <button onClick={() => handleRedoOrReject(r, 'Redo')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-bold shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5">
                                <MdWarning /> Redo
                              </button>
                              <button onClick={() => handleRedoOrReject(r, 'Reject')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-bold shadow-md shadow-zinc-700/20 transition-all hover:-translate-y-0.5">
                                <MdCancel /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QCDashboard;
