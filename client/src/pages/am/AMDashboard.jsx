import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProjectCard from '../../components/am/ProjectCard';
import ProjectDetailModal from '../../components/am/ProjectDetailModal';

const AMDashboard = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Account Management</h1>
                        <p className="text-gray-500">Welcome, <span className="font-semibold text-primary-600">{user?.name}</span></p>
                    </div>
                    <button onClick={handleLogout} className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50">
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Active Projects */}
                    {projects.filter(p => p.status === 'Active').map(project => (
                        <ProjectCard key={project._id} project={project} onClick={() => setSelectedProject(project)} />
                    ))}

                    {/* Paused Projects */}
                    {projects.filter(p => p.status === 'Paused').map(project => (
                        <ProjectCard key={project._id} project={project} onClick={() => setSelectedProject(project)} />
                    ))}

                    {/* Completed Projects (Optional - maybe hidden or different section) */}
                </div>

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
