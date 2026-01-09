import React from 'react';

const ProjectCard = ({ project, onClick }) => {
    const isPaused = project.status === 'Paused';

    // Calculate progress roughly
    const totalSteps = 11;
    const completedSteps = Object.values(project.checklist).filter(step => step.done).length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden ${isPaused ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'}`}
        >
            {isPaused && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg">
                    PAUSED
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{project.clientName}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{project.companyName || 'No Company'}</p>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-primary-600'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Latest QC Status if any */}
            {project.qcRequests && project.qcRequests.length > 0 && (
                <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-gray-500">Latest QC:</span>
                        <span className={`px-2 py-0.5 rounded-full ${project.qcRequests[project.qcRequests.length - 1].status === 'Approved' ? 'bg-green-100 text-green-700' :
                                project.qcRequests[project.qcRequests.length - 1].status === 'Redo' ? 'bg-red-100 text-red-700' :
                                    'bg-orange-100 text-orange-700'
                            }`}>
                            {project.qcRequests[project.qcRequests.length - 1].status}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectCard;
