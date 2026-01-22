import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import {
    MdFactory,
    MdTrendingUp,
    MdWarning,
    MdCheckCircle,
    MdRefresh,
    MdAssignment,
    MdEdit,
    MdClose,
    MdLink,
    MdContentCopy,
    MdSchedule,
    MdBuild,
    MdExpandMore,
    MdExpandLess,
    MdCheckBox,
    MdCheckBoxOutlineBlank,
    MdNotifications,
    MdLogout
} from 'react-icons/md';

const ProductionDashboard = () => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const socket = useSocket();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [editFormData, setEditFormData] = useState({ contentShot: 0, contentPending: 0 });
    const [savingProject, setSavingProject] = useState(null);
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    
    // Reminder Notification State
    const [reminders, setReminders] = useState([]);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [reminderEquipmentInput, setReminderEquipmentInput] = useState('');
    const [submittingReminderEquipment, setSubmittingReminderEquipment] = useState(false);
    
    // Shoot Workflow State
    const [showEquipmentInputModal, setShowEquipmentInputModal] = useState(false);
    const [selectedShootForEquipment, setSelectedShootForEquipment] = useState(null);
    const [equipmentInput, setEquipmentInput] = useState('');
    const [savingEquipmentForShoot, setSavingEquipmentForShoot] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [selectedShootForCompletion, setSelectedShootForCompletion] = useState(null);
    const [completionData, setCompletionData] = useState({ contentShot: 0, contentPending: 0 });
    const [completingShoot, setCompletingShoot] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Listen for shoot reminders from Backend Manager
    useEffect(() => {
        if (socket) {
            socket.on('shoot_reminder', (reminder) => {
                setReminders(prev => [...prev, { ...reminder, id: Date.now() }]);
                Swal.fire({
                    title: 'Shoot Reminder!',
                    text: `${reminder.clientName} - ${new Date(reminder.scheduledDate).toLocaleDateString()} at ${reminder.scheduledTime}`,
                    icon: 'info',
                    confirmButtonText: 'View & Submit Equipment'
                }).then(result => {
                    if (result.isConfirmed) {
                        setSelectedReminder({ ...reminder, id: Date.now() });
                        setReminderEquipmentInput('');
                        setShowReminderModal(true);
                    }
                });
            });

            return () => {
                socket.off('shoot_reminder');
            };
        }
    }, [socket]);

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            const projectsRes = await axios.get('/api/projects');
            if (projectsRes.data.success) {
                const projects = projectsRes.data.data || [];
                const dashboardMetrics = {
                    totalProjects: projects.length,
                    activeProjects: projects.filter(p => p.status === 'Active').length,
                    completedProjects: projects.filter(p => p.status === 'Completed').length,
                    delayedProjects: projects.filter(p => p.status === 'Delayed').length,
                    projects: projects
                };
                setDashboardData(dashboardMetrics);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            Swal.fire('Error', 'Failed to load production data', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setEditFormData({
            contentShot: project.contentProduction?.contentShot || 0,
            contentPending: project.contentProduction?.contentPending || 0
        });
    };

    const handleSaveContent = async (projectId) => {
        try {
            setSavingProject(projectId);
            await axios.put(`/api/projects/${projectId}/content-production`, {
                contentShot: parseInt(editFormData.contentShot) || 0,
                contentPending: parseInt(editFormData.contentPending) || 0
            });
            
            Swal.fire('Success', 'Content production updated successfully', 'success');
            setEditingProject(null);
            fetchDashboardData();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to update content production', 'error');
        } finally {
            setSavingProject(null);
        }
    };

    const getContentProgress = (project) => {
        const total = project.contentProduction?.totalContent || 0;
        if (total === 0) return 0;
        const shot = project.contentProduction?.contentShot || 0;
        return Math.round((shot / total) * 100);
    };

    const handleAddEquipmentForShoot = (project, shoot) => {
        setSelectedShootForEquipment({ project, shoot });
        setEquipmentInput('');
        setShowEquipmentInputModal(true);
    };

    const handleSaveEquipmentForShoot = async () => {
        if (!selectedShootForEquipment || !equipmentInput.trim()) {
            Swal.fire('Error', 'Please enter equipment name', 'error');
            return;
        }

        setSavingEquipmentForShoot(true);
        try {
            const { project, shoot } = selectedShootForEquipment;
            await axios.post(`/api/projects/${project._id}/equipment`, {
                equipmentName: equipmentInput.trim(),
                assignedTo: shoot._id
            });
            
            Swal.fire('Success', 'Equipment added for this shoot', 'success');
            setShowEquipmentInputModal(false);
            setEquipmentInput('');
            fetchDashboardData();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to add equipment', 'error');
        } finally {
            setSavingEquipmentForShoot(false);
        }
    };

    const handleReturnEquipment = async (projectId, equipmentId) => {
        try {
            await axios.put(`/api/projects/${projectId}/equipment/${equipmentId}`, {
                status: 'Available'
            });
            Swal.fire('Success', 'Equipment marked as returned', 'success');
            fetchDashboardData();
        } catch {
            Swal.fire('Error', 'Failed to return equipment', 'error');
        }
    };

    const handleSubmitReminderEquipment = async () => {
        if (!selectedReminder || !reminderEquipmentInput.trim()) {
            Swal.fire('Error', 'Please enter equipment details', 'error');
            return;
        }

        setSubmittingReminderEquipment(true);
        try {
            // Find the project with this shoot
            const project = dashboardData?.projects?.find(p => 
                p.shootSchedules?.some(s => String(s._id) === String(selectedReminder.shootId))
            );

            if (!project) {
                Swal.fire('Error', 'Project not found', 'error');
                return;
            }

            // Submit equipment for this shoot
            await axios.post(`/api/projects/${project._id}/equipment`, {
                equipmentName: reminderEquipmentInput,
                assignedTo: selectedReminder.shootId
            });

            Swal.fire('Success', 'Equipment submitted and reported to Backend Manager', 'success');
            setShowReminderModal(false);
            setReminders(prev => prev.filter(r => r.id !== selectedReminder.id));
            setReminderEquipmentInput('');
            setSelectedReminder(null);
            fetchDashboardData();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to submit equipment', 'error');
        } finally {
            setSubmittingReminderEquipment(false);
        }
    };

    const handleOpenCompletionModal = (project, shoot) => {
        // Check if equipment has been added for this shoot
        const shootEquipment = project.equipment?.filter(e => String(e.assignedTo) === String(shoot._id)) || [];
        if (shootEquipment.length === 0) {
            Swal.fire('Error', 'Please add equipment details for this shoot before marking it as completed', 'error');
            return;
        }

        setSelectedShootForCompletion({ project, shoot });
        setCompletionData({ contentShot: 0, contentPending: 0 });
        setShowCompletionModal(true);
    };

    const handleCompleteShoot = async () => {
        if (!selectedShootForCompletion) return;

        const { project, shoot } = selectedShootForCompletion;
        
        // Check if all equipment is returned
        const inUseEquipment = project.equipment?.filter(e => e.status === 'In Use' && String(e.assignedTo) === String(shoot._id)) || [];
        if (inUseEquipment.length > 0) {
            Swal.fire('Error', 'Please return all equipment before completing the shoot', 'error');
            return;
        }

        setCompletingShoot(true);
        try {
            // Update content production
            await axios.put(`/api/projects/${project._id}/content-production`, {
                contentShot: (project.contentProduction?.contentShot || 0) + parseInt(completionData.contentShot || 0),
                contentPending: (project.contentProduction?.contentPending || 0) + parseInt(completionData.contentPending || 0)
            });

            // Mark shoot as completed
            const res = await axios.put(`/api/projects/${project._id}/shoot-schedules/${shoot._id}/complete`);
            if (res.data.success) {
                Swal.fire('Success', 'Shoot marked as completed and content updated', 'success');
                setShowCompletionModal(false);
                fetchDashboardData();
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to complete shoot', 'error');
        } finally {
            setCompletingShoot(false);
        }
    };

    const handleLogout = async () => {
        Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to logout?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#D8F60D',
            cancelButtonColor: '#6b7280'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await logout();
                    Swal.fire('Logged Out', 'You have been successfully logged out', 'success');
                } catch {
                    Swal.fire('Error', 'Failed to logout', 'error');
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            padding: '2rem',
            maxWidth: '100%',
            backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
            minHeight: '100vh',
            transition: 'background-color 0.3s'
        }}>
            {/* Reminders Notification Bar */}
            {reminders.length > 0 && (
                <div className={`${theme === 'dark' ? 'bg-black/60 border-[#D8F60D]/40' : 'bg-[#D8F60D]/10 border-[#D8F60D]/60'} border-l-4 rounded-xl p-5 backdrop-blur-sm transition-all hover:shadow-lg`} style={{borderLeftColor: '#D8F60D'}}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <div style={{padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: theme === 'dark' ? 'rgba(216, 246, 13, 0.1)' : 'rgba(216, 246, 13, 0.2)'}}>
                                <MdNotifications className="text-xl" style={{color: '#D8F60D'}} />
                            </div>
                            <div className="flex-1">
                                <p style={{fontWeight: 'bold', fontSize: '1.125rem', color: theme === 'dark' ? 'white' : 'black'}}>🎯 {reminders.length} Shoot Reminder(s)</p>
                                <p style={{fontSize: '0.875rem', color: theme === 'dark' ? '#d1d5db' : '#374151', marginTop: '0.25rem'}}>Click to submit equipment details</p>
                                <div style={{marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                    {reminders.map((reminder) => (
                                        <button
                                            key={reminder.id}
                                            onClick={() => {
                                                setSelectedReminder(reminder);
                                                setReminderEquipmentInput('');
                                                setShowReminderModal(true);
                                            }}
                                            className={`block w-full text-left ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700/50' : 'bg-white border-gray-300 hover:bg-gray-50'} border rounded-lg p-3 transition-all hover:border-[#D8F60D] hover:shadow-md`}
                                        >
                                            <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{reminder.clientName}</p>
                                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>📅 {new Date(reminder.scheduledDate).toLocaleDateString()} at {reminder.scheduledTime} • 📍 {reminder.location}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setReminders([])}
                            className={`${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} flex-shrink-0 p-1 hover:bg-gray-200/20 rounded-lg transition-all`}
                        >
                            <MdClose className="text-2xl" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                        <div style={{padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: theme === 'dark' ? 'rgba(216, 246, 13, 0.1)' : 'rgba(216, 246, 13, 0.15)'}}>
                            <MdFactory style={{fontSize: '2rem', color: '#D8F60D'}} />
                        </div>
                        <div>
                            <h1 style={{fontSize: '2.25rem', fontWeight: '900', color: theme === 'dark' ? 'white' : 'black'}}>Production</h1>
                            <p style={{fontSize: '0.875rem', fontWeight: '500', color: theme === 'dark' ? '#9ca3af' : '#4b5563', marginTop: '0.25rem'}}>Track & manage production progress</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchDashboardData}
                    disabled={refreshing}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#000',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s',
                        backgroundColor: '#D8F60D',
                        border: 'none',
                        cursor: refreshing ? 'not-allowed' : 'pointer',
                        opacity: refreshing ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => !refreshing && (e.target.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)')}
                    onMouseLeave={(e) => !refreshing && (e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)')}
                >
                    <MdRefresh style={{fontSize: '1rem', animation: refreshing ? 'spin 1s linear infinite' : 'none'}} />
                    Refresh
                </button>
            </div>

            {/* Key Metrics */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
                <div style={{
                    backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#1f2937' : '#e5e7eb'}`,
                    padding: '1.5rem',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(216, 246, 13, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <div>
                            <p style={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme === 'dark' ? '#6b7280' : '#6b7280'}}> Total Projects</p>
                            <p style={{fontSize: '2.25rem', fontWeight: '900', marginTop: '0.75rem', color: '#D8F60D'}}>{dashboardData?.totalProjects || 0}</p>
                        </div>
                        <div style={{fontSize: '3.75rem', opacity: '0.1'}}>
                            <MdAssignment />
                        </div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#1f2937' : '#e5e7eb'}`,
                    padding: '1.5rem',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(216, 246, 13, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <div>
                            <p style={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme === 'dark' ? '#6b7280' : '#6b7280'}}>Active Projects</p>
                            <p style={{fontSize: '2.25rem', fontWeight: '900', marginTop: '0.75rem', color: '#D8F60D'}}>{dashboardData?.activeProjects || 0}</p>
                        </div>
                        <div style={{fontSize: '3.75rem', opacity: '0.1'}}>
                            <MdCheckCircle />
                        </div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#1f2937' : '#e5e7eb'}`,
                    padding: '1.5rem',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(216, 246, 13, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <div>
                            <p style={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme === 'dark' ? '#6b7280' : '#6b7280'}}>Completed</p>
                            <p style={{fontSize: '2.25rem', fontWeight: '900', marginTop: '0.75rem', color: '#D8F60D'}}>{dashboardData?.completedProjects || 0}</p>
                        </div>
                        <div style={{fontSize: '3.75rem', opacity: '0.1'}}>
                            <MdTrendingUp />
                        </div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0.75rem',
                    border: `1px solid ${theme === 'dark' ? '#1f2937' : '#e5e7eb'}`,
                    padding: '1.5rem',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <div>
                            <p style={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme === 'dark' ? '#6b7280' : '#6b7280'}}>Delayed</p>
                            <p style={{fontSize: '2.25rem', fontWeight: '900', marginTop: '0.75rem', color: '#ef4444'}}>{dashboardData?.delayedProjects || 0}</p>
                        </div>
                        <div style={{fontSize: '3.75rem', opacity: '0.1'}}>
                            <MdWarning />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Production Tracking */}
            <div style={{
                backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1rem',
                border: `1px solid ${theme === 'dark' ? '#1f2937' : '#e5e7eb'}`,
                overflow: 'hidden',
                transition: 'all 0.3s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    padding: '1.25rem 2rem',
                    borderBottom: `1px solid ${theme === 'dark' ? '#1f2937' : '#e5e7eb'}`,
                    backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.5)' : 'rgba(248, 250, 252, 0.5)'
                }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                        <div style={{width: '4px', height: '2rem', borderRadius: '9999px', backgroundColor: '#D8F60D'}}></div>
                        <h2 style={{fontSize: '1.5rem', fontWeight: '900', color: theme === 'dark' ? 'white' : 'black'}}>Content Production Tracking</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <tr>
                                <th className={`px-6 py-4 text-xs font-black uppercase tracking-widest w-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}></th>
                                <th className={`px-6 py-4 text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Project Name</th>
                                <th className={`px-6 py-4 text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Content Calendar</th>
                                <th className={`px-6 py-4 text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Status</th>
                                <th className={`px-6 py-4 text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Shoot Schedule</th>
                                <th className={`px-6 py-4 text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Shot / Pending</th>
                                <th className={`px-6 py-4 text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Progress</th>
                                <th className={`px-6 py-4 text-xs font-black uppercase tracking-widest text-right ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-200'}`}>
                            {dashboardData?.projects && dashboardData.projects.length > 0 ? (
                                dashboardData.projects.map((project) => (
                                    <>
                                    <tr key={project._id} className={`${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50'} transition-colors`}>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => setExpandedProjectId(expandedProjectId === project._id ? null : project._id)}
                                                className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                                            >
                                                {expandedProjectId === project._id ? 
                                                    <MdExpandLess className="text-xl" /> :
                                                    <MdExpandMore className="text-xl" />
                                                }
                                            </button>
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{project.clientName}</td>
                                        <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {project.contentCalendarLink ? (
                                                <a 
                                                    href={project.contentCalendarLink} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{color: '#D8F60D'}} className="hover:opacity-70 underline flex items-center gap-2 transition-colors"
                                                    title="Open content calendar"
                                                >
                                                    <MdLink className="text-lg\" />
                                                    View Calendar
                                                </a>
                                            ) : (
                                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Not provided</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span style={{
                                                padding: '0.625rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                backgroundColor: (project.status === 'Active' || project.status === 'Completed') ? (theme === 'dark' ? 'rgba(216, 246, 13, 0.15)' : 'rgba(216, 246, 13, 0.2)') : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                                                color: (project.status === 'Active' || project.status === 'Completed') ? '#D8F60D' : (theme === 'dark' ? '#9ca3af' : '#4b5563'),
                                                transition: 'all 0.3s'
                                            }}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {project.shootSchedules && project.shootSchedules.length > 0 ? (
                                                <div className="text-sm">
                                                    <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{project.shootSchedules.length} scheduled</p>
                                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{new Date(project.shootSchedules[0].scheduledDate).toLocaleDateString('en-IN')}</p>
                                                </div>
                                            ) : (
                                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Not scheduled</span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-bold`}>
                                            <span style={{color: '#D8F60D'}}>{project.contentProduction?.contentShot || 0}</span>
                                            <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}> / </span>
                                            <span className="text-orange-500">{project.contentProduction?.contentPending || 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-40">
                                                <div className={`w-full rounded-full h-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
                                                    <div
                                                        style={{
                                                            width: `${getContentProgress(project)}%`,
                                                            height: '0.5rem',
                                                            borderRadius: '9999px',
                                                            backgroundColor: '#D8F60D',
                                                            boxShadow: '0 0 20px rgba(216, 246, 13, 0.4)',
                                                            transition: 'all 0.5s ease-out'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span style={{color: '#D8F60D', fontSize: '12px', marginTop: '0.25rem', display: 'block', fontWeight: 'bold'}}>{getContentProgress(project)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEditProject(project)}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '0.5rem',
                                                    color: '#D8F60D',
                                                    backgroundColor: theme === 'dark' ? 'rgba(216, 246, 13, 0.1)' : 'rgba(216, 246, 13, 0.08)',
                                                    transition: 'all 0.3s',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'dark' ? 'rgba(216, 246, 13, 0.2)' : 'rgba(216, 246, 13, 0.15)'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = theme === 'dark' ? 'rgba(216, 246, 13, 0.1)' : 'rgba(216, 246, 13, 0.08)'}
                                                title="Edit Content Production"
                                            >
                                                <MdEdit className="text-xl" />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Expanded Shoots & Equipment Section */}
                                    {expandedProjectId === project._id && (
                                        <tr className={theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}>
                                            <td colSpan="8" className="px-6 py-4">
                                                <div className="space-y-6">
                                                    {/* Shoot Schedules */}
                                                    {project.shootSchedules && project.shootSchedules.length > 0 && (
                                                        <div>
                                                            <h4 style={{
                                                                fontSize: '0.875rem',
                                                                fontWeight: '900',
                                                                marginBottom: '0.75rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                color: '#D8F60D'
                                                            }}>
                                                                <MdSchedule /> Scheduled Shoots ({project.shootSchedules.length})
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                                {project.shootSchedules.map((shoot) => (
                                                                    <div key={shoot._id} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 transition-colors`}>
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div>
                                                                                <p className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Date & Time</p>
                                                                                <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{new Date(shoot.scheduledDate).toLocaleDateString('en-IN')}</p>
                                                                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{shoot.scheduledTime || 'TBD'}</p>
                                                                            </div>
                                                                            <span style={{
                                                                                padding: '0.25rem 0.5rem',
                                                                                borderRadius: '0.25rem',
                                                                                fontSize: '10px',
                                                                                fontWeight: 'bold',
                                                                                textTransform: 'uppercase',
                                                                                backgroundColor: (shoot.status === 'Scheduled' || shoot.status === 'Completed') ? (theme === 'dark' ? 'rgba(216, 246, 13, 0.15)' : 'rgba(216, 246, 13, 0.2)') : (theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
                                                                                color: (shoot.status === 'Scheduled' || shoot.status === 'Completed') ? '#D8F60D' : (theme === 'dark' ? '#f87171' : '#dc2626'),
                                                                                transition: 'all 0.3s'
                                                                            }}>
                                                                                {shoot.status}
                                                                            </span>
                                                                        </div>
                                                                        {shoot.location && (
                                                                            <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}><span className="font-bold">📍 Location:</span> {shoot.location}</p>
                                                                        )}
                                                                        {shoot.notes && (
                                                                            <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}><span className="font-bold">📝 Notes:</span> {shoot.notes}</p>
                                                                        )}
                                                                        {shoot.reminderCount > 0 && (
                                                                            <p style={{
                                                                                fontSize: '12px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.25rem',
                                                                                color: '#D8F60D',
                                                                                fontWeight: '500',
                                                                                marginTop: '0.5rem'
                                                                            }}>
                                                                                <MdNotifications /> {shoot.reminderCount} reminder(s) sent
                                                                            </p>
                                                                        )}
                                                                        
                                                                        {/* Equipment for this shoot */}
                                                                        {project.equipment && project.equipment.filter(e => String(e.assignedTo) === String(shoot._id)).length > 0 && (
                                                                            <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                                                                                <p style={{
                                                                                    fontSize: '12px',
                                                                                    fontWeight: 'bold',
                                                                                    marginBottom: '0.5rem',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '0.25rem',
                                                                                    color: '#D8F60D'
                                                                                }}>
                                                                                    <MdBuild className="text-sm" /> Equipment In Use
                                                                                </p>
                                                                                <div className="space-y-1">
                                                                                    {project.equipment.filter(e => String(e.assignedTo) === String(shoot._id)).map((equip) => (
                                                                                        <div key={equip._id} className={`flex items-center justify-between p-2 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                                                            <div>
                                                                                                <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{equip.name}</p>
                                                                                                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{equip.status}</p>
                                                                                            </div>
                                                                                            {equip.status === 'In Use' && (
                                                                                                <button
                                                                                                    onClick={() => handleReturnEquipment(project._id, equip._id)}
                                                                                                    style={{backgroundColor: '#D8F60D', color: '#000'}} className="hover:opacity-80 px-2 py-1 rounded text-[10px] font-bold transition-all active:scale-95"
                                                                                                >
                                                                                                    Return
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {shoot.status === 'Scheduled' && (
                                                                            <div className="flex gap-2 mt-3">
                                                                                <button
                                                                                    onClick={() => handleAddEquipmentForShoot(project, shoot)}
                                                                                    style={{backgroundColor: '#D8F60D', color: '#000'}} className="flex-1 hover:opacity-80 px-2 py-1 rounded text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                                                                                >
                                                                                    <MdBuild className="text-sm" /> Add Equipment
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleOpenCompletionModal(project, shoot)}
                                                                                    style={{backgroundColor: '#D8F60D', color: '#000'}} className="flex-1 hover:opacity-80 px-2 py-1 rounded text-xs font-bold transition-all active:scale-95"
                                                                                >
                                                                                    Mark Completed
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        No projects found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingProject && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Update Content Production</h2>
                                <p className="text-slate-500 text-sm mt-1">{editingProject.clientName}</p>
                            </div>
                            <button
                                onClick={() => setEditingProject(null)}
                                className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"
                            >
                                <MdClose className="text-xl" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                                    Content Shot
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editFormData.contentShot}
                                    onChange={(e) => setEditFormData({ ...editFormData, contentShot: e.target.value })}
                                    className="input-field bg-slate-50 border-transparent focus:bg-white font-bold h-12 w-full"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                                    Content Pending
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editFormData.contentPending}
                                    onChange={(e) => setEditFormData({ ...editFormData, contentPending: e.target.value })}
                                    className="input-field bg-slate-50 border-transparent focus:bg-white font-bold h-12 w-full"
                                    placeholder="0"
                                />
                            </div>

                            {(parseInt(editFormData.contentShot) > 0 || parseInt(editFormData.contentPending) > 0) && (
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Summary</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-emerald-600 font-black text-lg">{editFormData.contentShot}</p>
                                            <p className="text-xs text-slate-500">Shot</p>
                                        </div>
                                        <div>
                                            <p className="text-orange-600 font-black text-lg">{editFormData.contentPending}</p>
                                            <p className="text-xs text-slate-500">Pending</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-600 font-black text-lg">
                                                {parseInt(editFormData.contentShot) + parseInt(editFormData.contentPending)}
                                            </p>
                                            <p className="text-xs text-slate-500">Total</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 bg-white rounded-lg p-2">
                                        <p className="text-xs text-slate-600 font-bold">
                                            Progress: {parseInt(editFormData.contentShot) + parseInt(editFormData.contentPending) > 0 
                                                ? Math.round((parseInt(editFormData.contentShot) / (parseInt(editFormData.contentShot) + parseInt(editFormData.contentPending))) * 100)
                                                : 0}%
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => setEditingProject(null)}
                                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingProject === editingProject._id}
                                onClick={() => handleSaveContent(editingProject._id)}
                                className="px-10 py-3 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                            >
                                {savingProject === editingProject._id ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reminder Equipment Submission Modal */}
            {showReminderModal && selectedReminder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Submit Equipment for Shoot</h2>
                            <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-slate-800">
                                <MdClose className="text-2xl" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Project</label>
                                <p className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium">{selectedReminder.clientName}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Scheduled Date & Time</label>
                                <p className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium">
                                    {new Date(selectedReminder.scheduledDate).toLocaleDateString()} at {selectedReminder.scheduledTime}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                                <p className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium">{selectedReminder.location || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Equipment Details</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Sony FX30, Tripod, Ring Light, Boom Mic, etc."
                                    value={reminderEquipmentInput}
                                    onChange={(e) => setReminderEquipmentInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitReminderEquipment(); }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '500',
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                                        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                                        transition: 'all 0.3s',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(216, 246, 13, 0.2)'}
                                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                                    autoFocus
                                />
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>List all equipment being used for this shoot (comma-separated)</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowReminderModal(false)}
                                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors ${theme === 'dark' ? 'text-white bg-gray-800 hover:bg-gray-700' : 'text-gray-800 bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReminderEquipment}
                                disabled={submittingReminderEquipment || !reminderEquipmentInput.trim()}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#D8F60D',
                                    color: '#000',
                                    borderRadius: '0.5rem',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    opacity: submittingReminderEquipment || !reminderEquipmentInput.trim() ? '0.5' : '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem'
                                }}
                                onMouseEnter={(e) => !submittingReminderEquipment && !reminderEquipmentInput.trim() && (e.target.style.opacity = '0.85')}
                                onMouseLeave={(e) => !submittingReminderEquipment && !reminderEquipmentInput.trim() && (e.target.style.opacity = '1')}
                            >
                                {submittingReminderEquipment ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> : <MdBuild />}
                                {submittingReminderEquipment ? 'Submitting...' : 'Submit Equipment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Equipment Input Modal */}
            {showEquipmentInputModal && selectedShootForEquipment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl p-8 w-full max-w-lg shadow-2xl border transition-colors`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#D8F60D'}}>Add Equipment for Shoot</h2>
                            <button onClick={() => setShowEquipmentInputModal(false)} style={{color: '#D8F60D'}} className="hover:opacity-70 transition-opacity">
                                <MdClose className="text-2xl" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#D8F60D'}}>Equipment Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Sony FX30, Tripod, Ring Light, etc."
                                    value={equipmentInput}
                                    onChange={(e) => setEquipmentInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEquipmentForShoot(); }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.5rem',
                                        focusRing: '2px',
                                        focusRingColor: '#D8F60D',
                                        fontWeight: '500',
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                                        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                                        transition: 'all 0.3s',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(216, 246, 13, 0.2)'}
                                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                                    autoFocus
                                />
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Type the name of the equipment being used</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEquipmentInputModal(false)}
                                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors ${theme === 'dark' ? 'text-white bg-gray-800 hover:bg-gray-700' : 'text-gray-800 bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEquipmentForShoot}
                                disabled={savingEquipmentForShoot || !equipmentInput.trim()}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#D8F60D',
                                    color: '#000',
                                    borderRadius: '0.5rem',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    opacity: savingEquipmentForShoot || !equipmentInput.trim() ? '0.5' : '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem'
                                }}
                                onMouseEnter={(e) => !savingEquipmentForShoot && !equipmentInput.trim() && (e.target.style.opacity = '0.85')}
                                onMouseLeave={(e) => !savingEquipmentForShoot && !equipmentInput.trim() && (e.target.style.opacity = '1')}
                            >
                                {savingEquipmentForShoot ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> : <MdBuild />}
                                {savingEquipmentForShoot ? 'Adding...' : 'Add Equipment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shoot Completion Modal */}
            {showCompletionModal && selectedShootForCompletion && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl p-8 w-full max-w-lg shadow-2xl border transition-colors`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#D8F60D'}}>Complete Shoot</h2>
                            <button onClick={() => setShowCompletionModal(false)} style={{color: '#D8F60D'}} className="hover:opacity-70 transition-opacity">
                                <MdClose className="text-2xl" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#D8F60D'}}>Content Shot</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={completionData.contentShot}
                                    onChange={(e) => setCompletionData({ ...completionData, contentShot: parseInt(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '700',
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                                        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                                        transition: 'all 0.3s',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(216, 246, 13, 0.2)'}
                                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                                    placeholder="0"
                                />
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Total content pieces shot in this session</p>
                            </div>

                            <div>
                                <label style={{display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#D8F60D'}}>Content Pending</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={completionData.contentPending}
                                    onChange={(e) => setCompletionData({ ...completionData, contentPending: parseInt(e.target.value) || 0 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '700',
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                                        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                                        transition: 'all 0.3s',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(216, 246, 13, 0.2)'}
                                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                                    placeholder="0"
                                />
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Content pieces still pending</p>
                            </div>

                            <div style={{
                                backgroundColor: theme === 'dark' ? 'rgba(216, 246, 13, 0.1)' : 'rgba(216, 246, 13, 0.2)',
                                border: `1px solid ${theme === 'dark' ? 'rgba(216, 246, 13, 0.2)' : 'rgba(216, 246, 13, 0.3)'}`,
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                transition: 'all 0.3s'
                            }}>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: '#D8F60D'
                                }}>
                                    <span className="font-bold">⚠️ Note:</span> Make sure all equipment has been returned before completing this shoot.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCompletionModal(false)}
                                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors ${theme === 'dark' ? 'text-white bg-gray-800 hover:bg-gray-700' : 'text-gray-800 bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteShoot}
                                disabled={completingShoot}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#D8F60D',
                                    color: '#000',
                                    borderRadius: '0.5rem',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    opacity: completingShoot ? '0.5' : '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem'
                                }}
                                onMouseEnter={(e) => !completingShoot && (e.target.style.opacity = '0.85')}
                                onMouseLeave={(e) => !completingShoot && (e.target.style.opacity = '1')}
                            >
                                {completingShoot ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div> : <MdCheckCircle />}
                                {completingShoot ? 'Completing...' : 'Complete Shoot'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Info Card */}
            <div style={{
                backgroundImage: theme === 'dark' ? 'linear-gradient(to right, rgba(216, 246, 13, 0.1), rgba(216, 246, 13, 0.05))' : 'linear-gradient(to right, rgba(216, 246, 13, 0.15), rgba(216, 246, 13, 0.1))',
                borderRadius: '1.875rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: '1.5rem',
                color: theme === 'dark' ? '#D8F60D' : '#000',
                transition: 'all 0.3s'
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <p style={{color: theme === 'dark' ? 'rgba(216, 246, 13, 0.7)' : 'rgba(0,0,0,0.6)', fontWeight: '500'}}>Logged in as</p>
                        <h3 style={{fontSize: '1.5rem', fontWeight: '900', marginTop: '0.25rem', color: '#D8F60D'}}>{user?.name}</h3>
                        <p style={{color: theme === 'dark' ? 'rgba(216, 246, 13, 0.6)' : 'rgba(0,0,0,0.5)', fontSize: '0.875rem', marginTop: '0.25rem'}}>{user?.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div style={{fontSize: '3.75rem', opacity: '0.1'}}>
                            <MdFactory />
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                backgroundColor: theme === 'dark' ? 'rgba(216, 246, 13, 0.15)' : 'rgba(216, 246, 13, 0.2)',
                                color: '#D8F60D',
                                border: `2px solid #D8F60D`,
                                borderRadius: '0.75rem',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#D8F60D';
                                e.target.style.color = '#000';
                                e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = theme === 'dark' ? 'rgba(216, 246, 13, 0.15)' : 'rgba(216, 246, 13, 0.2)';
                                e.target.style.color = '#D8F60D';
                                e.target.style.transform = 'scale(1)';
                            }}
                        >
                            <MdLogout style={{fontSize: '1.25rem'}} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionDashboard;
