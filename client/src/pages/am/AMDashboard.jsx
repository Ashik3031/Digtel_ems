import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import ProjectCard from '../../components/am/ProjectCard';
import ProjectDetailModal from '../../components/am/ProjectDetailModal';

const AMDashboard = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);


    // UI controls
    const [filter, setFilter] = useState('All'); // All | Active | Paused
    const [query, setQuery] = useState('');

    // Exclude completed & renewal projects from the main list and keep them in separate sections (case-insensitive)
    const nonCompleted = projects.filter(p => {
        const s = (p.status || '').toLowerCase();
        return s !== 'completed' && s !== 'renewal';
    });

    const filteredProjects = nonCompleted.filter(p => {
        if (filter === 'Active' && p.status !== 'Active') return false;
        if (filter === 'Paused' && p.status !== 'Paused') return false;
        if (query && !p.clientName.toLowerCase().includes(query.toLowerCase()) && !(p.companyName || '').toLowerCase().includes(query.toLowerCase())) return false;
        return true;
    });
    // Collections for Completed and Renewal projects (respect current search query)
    const completedProjects = projects.filter(p => ((p.status || '').toLowerCase() === 'completed') && (!query || p.clientName.toLowerCase().includes(query.toLowerCase()) || (p.companyName || '').toLowerCase().includes(query.toLowerCase())));

    const renewalProjects = projects.filter(p => ((p.status || '').toLowerCase() === 'renewal') && (!query || p.clientName.toLowerCase().includes(query.toLowerCase()) || (p.companyName || '').toLowerCase().includes(query.toLowerCase())));

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'Active').length,
        paused: projects.filter(p => p.status === 'Paused').length,
        completed: projects.filter(p => p.status === 'Completed').length,
        qcPending: projects.filter(p => (p.qcRequests || []).some(q => q.status === 'Pending' || q.status === 'Redo')).length
    };



    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('new_project', (project) => {
            setProjects(prev => [project, ...prev]);
        });

        socket.on('project_updated', (updatedProject) => {
            setProjects(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
            if (selectedProject && selectedProject._id === updatedProject._id) {
                setSelectedProject(updatedProject);
            }
        });

        return () => {
            socket.off('new_project');
            socket.off('project_updated');
        };
    }, [socket, selectedProject]);

    const fetchProjects = async () => {
        try {
            const res = await axios.get('/api/projects');
            setProjects(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleRestore = async (projectId) => {
        const confirm = await Swal.fire({
            title: 'Restore project to Active?',
            text: 'This will move the project back to Active status.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel'
        });
        if (!confirm.isConfirmed) return;
        setActionLoading(projectId);
        try {
            const res = await axios.put(`/api/projects/${projectId}/status`, { status: 'Active' });
            setProjects(prev => prev.map(p => p._id === projectId ? res.data.data : p));
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: 'Project restored to Active' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Restore failed' });
        } finally {
            setActionLoading(null);
        }
    };

    // Scroll helper to jump to sections (mobile/tablet friendly)
    const goToSection = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black dark:text-white">Account Management</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">Welcome, <span className="font-semibold text-[#D8F60D]">{user?.name}</span></p>
                        <div className="mt-3 flex items-center gap-3 text-sm">
                            <div className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300">Total: <strong className="ml-1 text-black dark:text-white">{stats.total}</strong></div>
                            <div className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300">Active: <strong className="ml-1 text-black dark:text-white">{stats.active}</strong></div>
                            <div className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300">Paused: <strong className="ml-1 text-black dark:text-white">{stats.paused}</strong></div>
                            <div className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300">QC Pending: <strong className="ml-1 text-black dark:text-white">{stats.qcPending}</strong></div>
                        </div>

                        {/* Small Completed / Renewal preview panel near stats */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-sm font-semibold text-black dark:text-white">Completed</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{completedProjects.length}</div>
                                </div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-500 space-y-1">
                                    {completedProjects.slice(0, 2).map(p => (
                                        <div key={p._id} className="truncate">{p.clientName} {p.companyName ? <span className="text-zinc-400">• {p.companyName}</span> : null}</div>
                                    ))}
                                    {completedProjects.length === 0 && <div className="text-zinc-400">No completed projects</div>}
                                </div>
                                <div className="mt-2 text-right">
                                    <button onClick={() => goToSection('completed-projects')} className="text-xs text-[#D8F60D] hover:underline">View all</button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-sm font-semibold text-black dark:text-white">Renewal</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{renewalProjects.length}</div>
                                </div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-500 space-y-1">
                                    {renewalProjects.slice(0, 2).map(p => (
                                        <div key={p._id} className="truncate">{p.clientName} {p.companyName ? <span className="text-zinc-400">• {p.companyName}</span> : null}</div>
                                    ))}
                                    {renewalProjects.length === 0 && <div className="text-zinc-400">No renewal projects</div>}
                                </div>
                                <div className="mt-2 text-right">
                                    <button onClick={() => goToSection('renewal-projects')} className="text-xs text-[#D8F60D] hover:underline">View all</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2">
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects" className="px-2 py-1 w-48 text-sm bg-transparent border-none text-black dark:text-white focus:outline-none placeholder-zinc-400" />
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setFilter('All')} className={`px-3 py-1 rounded transition-colors ${filter === 'All' ? 'bg-[#D8F60D] text-black font-bold' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>All</button>
                            <button onClick={() => setFilter('Active')} className={`px-3 py-1 rounded transition-colors ${filter === 'Active' ? 'bg-[#D8F60D] text-black font-bold' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>Active</button>
                            <button onClick={() => setFilter('Paused')} className={`px-3 py-1 rounded transition-colors ${filter === 'Paused' ? 'bg-[#D8F60D] text-black font-bold' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>Paused</button>
                        </div>

                        <button onClick={handleLogout} className="bg-white dark:bg-black text-red-600 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm">
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.length === 0 && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-500 dark:text-zinc-400">No projects match your search or filter.</div>
                    )}
                    {filteredProjects.map(project => (
                        <ProjectCard key={project._id} project={project} onClick={() => setSelectedProject(project)} />
                    ))}
                </div>

                {/* Full Completed projects section */}
                {completedProjects.length > 0 && (
                    <div id="completed-projects" className="mt-8">
                        <h2 className="text-xl font-semibold mb-3 text-black dark:text-white">Completed Projects</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completedProjects.map(p => (
                                <div key={p._id} className="relative group">
                                    <ProjectCard project={p} onClick={() => setSelectedProject(p)} />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button disabled={actionLoading === p._id} onClick={() => handleRestore(p._id)} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs rounded shadow-sm text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700">{actionLoading === p._id ? 'Restoring...' : 'Restore'}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Full Renewal projects section */}
                {renewalProjects.length > 0 && (
                    <div id="renewal-projects" className="mt-8">
                        <h2 className="text-xl font-semibold mb-3 text-black dark:text-white">Renewal Projects</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {renewalProjects.map(p => (
                                <div key={p._id} className="relative group">
                                    <ProjectCard project={p} onClick={() => setSelectedProject(p)} />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button disabled={actionLoading === p._id} onClick={() => handleRestore(p._id)} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs rounded shadow-sm text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700">{actionLoading === p._id ? 'Restoring...' : 'Restore'}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedProject && (
                    <ProjectDetailModal
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default AMDashboard;
