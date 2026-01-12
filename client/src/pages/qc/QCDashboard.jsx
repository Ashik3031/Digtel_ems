import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useSocket } from '../../context/SocketContext';

const QCDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  // Visible checklist keys from Account Manager (same 9 items)
  const visibleChecklistKeys = ['meetingScheduled', 'meetingMinutesSent', 'contentCalendarSent', 'clientApprovalReceived', 'workStarted', 'socialMediaLinks', 'qcRequestsCreated', 'allWorkCompleted', 'monthlyReviewSent'];

  const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/projects/qc-requests');
      setRequests(res.data.data || []);
    } catch (err) {
      toast.fire({ icon: 'error', title: 'Failed to load QC requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    if (socket) {
      socket.on('qc_updated', () => fetchRequests());
      socket.on('project_updated', () => fetchRequests());
    }
    return () => {
      if (socket) {
        socket.off('qc_updated');
        socket.off('project_updated');
      }
    };
  }, [socket]);

  // Group requests by projectId, exclude Redo status (completed loops)
  const groupedByProject = requests.reduce((acc, req) => {
    // Filter out "Redo" status to avoid showing redo loops
    if (req.qcRequest.status === 'Redo') return acc;
    
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

  const updateStatus = async (projectId, qcId, status, feedback = '') => {
    try {
      const payload = { status };
      if (feedback) payload.feedback = feedback;
      const res = await axios.put(`/api/projects/${projectId}/qc/${qcId}`, payload);
      toast.fire({ icon: 'success', title: 'QC updated' });
      // update local list
      setRequests(prev => prev.map(r => {
        if (String(r.projectId) === String(projectId) && String(r.qcRequest._id) === String(qcId)) {
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
      showCancelButton: true
    }).then(result => {
      if (result.isConfirmed) updateStatus(r.projectId, r.qcRequest._id, 'Approved');
    });
  };

  const handleRedoOrReject = (r, action) => {
    Swal.fire({
      title: `${action} request`,
      input: 'textarea',
      inputLabel: 'Feedback / instructions',
      inputPlaceholder: 'Provide details for redo or reason for rejection',
      showCancelButton: true,
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage('Please enter feedback');
        }
        return value;
      }
    }).then(result => {
      if (result.isConfirmed) updateStatus(r.projectId, r.qcRequest._id, action === 'Redo' ? 'Redo' : 'Rejected', result.value);
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">QC Dashboard (Project-Wise)</h2>
      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {!loading && projectList.length === 0 && <p className="text-sm italic text-gray-400">No QC requests pending</p>}

      <div className="space-y-6">
        {projectList.map((project) => (
          <div key={project.projectId} className="bg-white border rounded-lg p-6 shadow">
            {/* Project Header */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{project.clientName}</h3>
                <p className="text-sm text-gray-500">{project.companyName || 'No company'}</p>
                <div className="mt-2 text-xs text-gray-600">
                  {project.salesExec && <span>Sales Exec: <strong>{project.salesExec.name}</strong></span>}
                  {project.am && <span className="ml-3">AM: <strong>{project.am.name}</strong></span>}
                </div>
              </div>
              <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-semibold text-sm">
                {project.qcRequests.length} request{project.qcRequests.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* QC Requests for this project */}
            <div className="space-y-4">
              {project.qcRequests.map((r) => (
                <div key={`${r.projectId}-${r.qcRequest._id}`} className="bg-gray-50 border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">{r.qcRequest.details}</div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${r.qcRequest.status === 'Approved' ? 'bg-green-100 text-green-700' : r.qcRequest.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {r.qcRequest.status}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">{new Date(r.qcRequest.requestDate).toLocaleString()}</div>

                      {r.qcRequest.feedback && (
                        <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                          <strong>Feedback:</strong> {r.qcRequest.feedback}
                        </div>
                      )}

                      {/* Requested by (creator) */}
                      {r.qcCreator && (
                        <div className="text-xs text-gray-600 mb-2">
                          Requested by: <strong>{r.qcCreator.name}</strong> <span className="text-gray-400">({r.qcCreator.role || 'User'})</span>
                        </div>
                      )}

                      {/* Show only visible checklist items */}
                      {r.checklist && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-gray-700 mb-2">Checklist Items</div>
                          <div className="flex flex-wrap gap-2">
                            {visibleChecklistKeys.map((key) => {
                              const item = r.checklist[key];
                              if (!item) return null;
                              return (
                                <span key={key} className={`px-2 py-1 rounded text-xs ${item.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Assets */}
                      {(r.contentCalendarLink || (r.socialLinks && r.socialLinks.length > 0)) && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-gray-700 mb-2">Assets</div>
                          <div className="flex flex-col gap-1">
                            {r.contentCalendarLink && <a href={r.contentCalendarLink} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">📊 View Spreadsheet</a>}
                            {r.socialLinks && r.socialLinks.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {r.socialLinks.map((s, idx) => (
                                  <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600">📱 {s.platform}</a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 min-w-fit">
                      <button onClick={() => handleApprove(r)} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
                        Approve
                      </button>
                      <button onClick={() => handleRedoOrReject(r, 'Redo')} className="px-4 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700">
                        Redo
                      </button>
                      <button onClick={() => handleRedoOrReject(r, 'Reject')} className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QCDashboard;
