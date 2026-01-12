import React from 'react';
import { HiSparkles } from 'react-icons/hi';

const Avatar = ({ name, size = 10 }) => {
    const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'NA';
    const sizeClass = size === 12 ? 'w-12 h-12 text-sm' : size === 8 ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

    return (
        <div className={`rounded-full ${sizeClass} flex items-center justify-center font-semibold text-white shadow-md`} style={{ background: '#000', border: '2px solid #D8F60D' }}>
            {initials}
        </div>
    );
};

const ProjectCard = ({ project, onClick }) => {
    const isPaused = project.status === 'Paused';

    // Calculate progress using only visible checklist steps (align with ProjectDetailModal)
    const visibleChecklistKeys = ['meetingScheduled','meetingMinutesSent','contentCalendarSent','clientApprovalReceived','workStarted','socialMediaLinks','qcRequestsCreated','allWorkCompleted','monthlyReviewSent'];
    const totalSteps = visibleChecklistKeys.length;
    const completedSteps = visibleChecklistKeys.filter(key => project.checklist && project.checklist[key]?.done).length;
    const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

    const latestQc = project.qcRequests && project.qcRequests.length > 0 ? project.qcRequests[project.qcRequests.length - 1] : null;

    const salesExec = project.saleId?.createdBy;

    const dueText = project.dueDate ? new Date(project.dueDate).toLocaleDateString() : null;

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer bg-white p-4 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 relative overflow-hidden`}
            title={`${project.clientName} — ${project.companyName || ''}`}
        >
            {/* top accent header */}
            <div className="absolute left-0 top-0 w-full h-1 bg-[#D8F60D]" />

            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Avatar name={project.clientName} size={12} />
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 truncate">{project.clientName}</h3>
                        <p className="text-xs text-gray-500 truncate">{project.companyName || 'No Company'}</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full font-semibold text-sm ${isPaused ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'bg-[#D8F60D] text-black'}`}>{project.status}</div>
                    {dueText && <div className="text-xs text-gray-400">Due: <span className="font-medium text-gray-700">{dueText}</span></div>}
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Avatar name={salesExec?.name || 'Sales'} size={8} />
                        <div className="text-xs">
                            <div className="text-gray-500">Sales</div>
                            <div className="font-medium text-gray-800 truncate">{salesExec?.name || '-'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-gray-500">QC:</div>
                    <div className="text-sm font-semibold text-gray-800">{project.qcRequests?.length || 0}</div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-2"><HiSparkles className="text-[#D8F60D]" /> <span>Progress</span></span>
                    <span className="text-sm font-semibold text-gray-800">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full ${isPaused ? 'bg-gray-400' : 'bg-[#D8F60D]'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {latestQc && (
                <div className="border-t pt-3 mt-3 flex items-start justify-between">
                    <div className="flex-1 text-sm text-gray-700">
                        <div className="text-xs text-gray-500 mb-1">Latest QC <span className="px-2 py-0.5 rounded ml-2 text-xs bg-black text-white">{latestQc.status}</span></div>
                        <div className="text-sm truncate">{latestQc.details}</div>
                    </div>
                    <div className="pl-3 flex items-center">
                        <button className="text-xs px-3 py-1 bg-white border rounded-md hover:bg-gray-50">View</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectCard;
