import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getServices, createService, updateService, deleteService } from '../../services/serviceService';

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', category: '' });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await getServices();
            if (res.success) setServices(res.data);
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to fetch services', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingService) {
                await updateService(editingService._id, formData);
                Swal.fire('Updated!', 'Service updated successfully', 'success');
            } else {
                await createService(formData);
                Swal.fire('Created!', 'Service created successfully', 'success');
            }
            setShowModal(false);
            setEditingService(null);
            setFormData({ name: '', description: '', category: '' });
            fetchServices();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Operation failed', 'error');
        }
    };

    const handleEdit = (service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            description: service.description || '',
            category: service.category || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (service) => {
        const result = await Swal.fire({
            title: 'Delete Service?',
            text: `Are you sure you want to delete "${service.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteService(service._id);
                Swal.fire('Deleted!', 'Service deleted successfully', 'success');
                fetchServices();
            } catch (err) {
                Swal.fire('Error', 'Failed to delete service', 'error');
            }
        }
    };

    const handleToggleActive = async (service) => {
        try {
            await updateService(service._id, { isActive: !service.isActive });
            fetchServices();
        } catch (err) {
            Swal.fire('Error', 'Failed to update service status', 'error');
        }
    };

    const openCreateModal = () => {
        setEditingService(null);
        setFormData({ name: '', description: '', category: '' });
        setShowModal(true);
    };

    // Group services by category
    const groupedServices = services.reduce((acc, service) => {
        const cat = service.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(service);
        return acc;
    }, {});

    return (
        <>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Service Catalog</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage services available for prospect selection</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Service
                    </button>
                </div>

                {/* Services Grid */}
                {Object.keys(groupedServices).length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-lg">No services yet. Create your first service!</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedServices).map(([category, categoryServices]) => (
                            <div key={category}>
                                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    {category}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categoryServices.map((service) => (
                                        <div
                                            key={service._id}
                                            className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 transition-all ${service.isActive
                                                    ? 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                                                    : 'border-red-200 dark:border-red-900 opacity-60'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{service.name}</h3>
                                                <span
                                                    className={`text-xs font-bold px-2 py-1 rounded-full ${service.isActive
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                >
                                                    {service.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                                                {service.description || 'No description'}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(service)}
                                                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(service)}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${service.isActive
                                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                                        }`}
                                                >
                                                    {service.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(service)}
                                                    className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
                            {editingService ? 'Edit Service' : 'Create New Service'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Service Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Social Media Management"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g., Marketing"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the service..."
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg"
                                >
                                    {editingService ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ServiceManagement;
