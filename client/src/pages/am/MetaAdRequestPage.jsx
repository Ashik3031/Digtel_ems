import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { MdAdd, MdClose } from 'react-icons/md';

const MetaAdRequestPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [requests, setRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [formData, setFormData] = useState({
        project: '',
        adType: 'Reach',
        startDate: '',
        endDate: '',
        type: 'Image',
        budgetAllocated: '',
        notes: '',
        campaignName: ''
    });

    useEffect(() => {
        fetchProjects();
        fetchMyRequests();
    }, []);

    const fetchProjects = async () => {
        try {
            setProjectsLoading(true);
            // Fetch all projects first
            const res = await axios.get('/api/projects');
            console.log('Projects response:', res.data);
            if (res.data.success) {
                const allProjects = res.data.data || [];
                setProjects(allProjects);
                console.log('Projects loaded:', allProjects);
            } else if (res.data.data) {
                // Some APIs return data without success flag
                setProjects(res.data.data);
                console.log('Projects loaded (no success flag):', res.data.data);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            Swal.fire('Error', 'Failed to load projects', 'error');
        } finally {
            setProjectsLoading(false);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await axios.get('/api/meta-ad/my-requests');
            if (res.data.success) {
                setRequests(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post('/api/meta-ad/request', formData);
            if (res.data.success) {
                Swal.fire('Success', 'Meta Ad request created successfully', 'success');
                setShowModal(false);
                setFormData({
                    project: '',
                    adType: 'Reach',
                    startDate: '',
                    endDate: '',
                    type: 'Image',
                    budgetAllocated: '',
                    notes: '',
                    campaignName: ''
                });
                fetchMyRequests();
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to create request', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'Accepted':
                return 'bg-green-100 text-green-700';
            case 'Rejected':
                return 'bg-red-100 text-red-700';
            case 'Completed':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/account-manager')}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                            >
                                ← Back
                            </button>
                            <h1 className="text-2xl font-black text-blue-600">Meta Ad Requests</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700 font-medium">{user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">My Meta Ad Requests</h2>
                        <p className="text-gray-600 mt-2">Create and manage your meta ad requests</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all w-full sm:w-auto justify-center"
                    >
                        <MdAdd className="text-xl" />
                        New Request
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-gray-600 text-sm font-medium">Total Requests</p>
                        <p className="text-2xl font-black text-blue-600 mt-1">{requests.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-gray-600 text-sm font-medium">Pending</p>
                        <p className="text-2xl font-black text-yellow-600 mt-1">{requests.filter(r => r.status === 'Pending').length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-gray-600 text-sm font-medium">Accepted</p>
                        <p className="text-2xl font-black text-green-600 mt-1">{requests.filter(r => r.status === 'Accepted').length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-gray-600 text-sm font-medium">Rejected</p>
                        <p className="text-2xl font-black text-red-600 mt-1">{requests.filter(r => r.status === 'Rejected').length}</p>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {requests.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 text-lg">No requests yet. Create your first one!</p>
                        </div>
                    ) : (
                        <div className="w-full">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Project / Campaign</th>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Ad Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-600 uppercase">Period</th>
                                        <th className="px-4 py-3 text-right text-xs font-black text-gray-600 uppercase">Budget</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {requests.map((request) => (
                                        <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-blue-600">{request.campaignName || 'Unnamed Campaign'}</span>
                                                    <span className="text-gray-500 text-xs">{request.project?.clientName || 'N/A'}</span>
                                                    {request.project?.companyName && <span className="text-gray-400 text-[10px]">{request.project.companyName}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">{request.adType}</td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 text-right text-sm">${request.budgetAllocated}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${getStatusColor(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900">Create Meta Ad Request</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MdClose className="text-2xl text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Campaign Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Campaign Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.campaignName}
                                    onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                                    placeholder="e.g. Summer Sale 2024"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Project Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Project *</label>
                                {projects.length === 0 ? (
                                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                                        <p className="text-sm">No projects available. Please contact your administrator.</p>
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.project}
                                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">-- Select a project --</option>
                                        {projects.map((project) => (
                                            <option key={project._id} value={project._id}>
                                                {project.clientName} {project.companyName ? `(${project.companyName})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Ad Type and Campaign Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ad Type *</label>
                                    <select
                                        value={formData.adType}
                                        onChange={(e) => setFormData({ ...formData, adType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Reach">Reach</option>
                                        <option value="Lead">Lead</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Campaign Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Image">Image</option>
                                        <option value="Video">Video</option>
                                        <option value="Carousel">Carousel</option>
                                        <option value="Collection">Collection</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date *</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date *</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Budget */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Budget Allocated (USD) *</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.budgetAllocated}
                                    onChange={(e) => setFormData({ ...formData, budgetAllocated: e.target.value })}
                                    placeholder="Enter budget amount"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Add any additional notes..."
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 text-gray-700 font-bold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Creating...' : 'Create Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetaAdRequestPage;
