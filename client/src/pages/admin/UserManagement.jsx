import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    MdPersonAdd,
    MdEdit,
    MdLockReset,
    MdDelete,
    MdCheckCircle,
    MdCancel
} from 'react-icons/md';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'Client', manager: '', isActive: true
    });

    const roles = [
        'Super Admin', 'Admin', 'Sales Manager', 'Sales Executive',
        'Backend Manager', 'Account Manager', 'Backend Team Member', 'QC'
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await axios.put(`/api/admin/users/${editingUser._id}`, formData);
                Swal.fire('Updated', 'User updated successfully', 'success');
            } else {
                await axios.post('/api/admin/users', formData);
                Swal.fire('Created', 'New user created successfully', 'success');
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'Client', manager: '', isActive: true });
            fetchUsers();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Operation failed', 'error');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            manager: user.manager?._id || user.manager || '',
            isActive: user.isActive
        });
        setShowModal(true);
    };

    const handleStatusToggle = async (user) => {
        try {
            await axios.put(`/api/admin/users/${user._id}`, { isActive: !user.isActive });
            fetchUsers();
            Swal.fire({
                icon: 'success',
                title: user.isActive ? 'Deactivated' : 'Activated',
                timer: 1000,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const handleResetPassword = async (user) => {
        const { value: newPassword } = await Swal.fire({
            title: 'Reset Password',
            input: 'password',
            inputLabel: `Enter new password for ${user.name}`,
            inputPlaceholder: 'Minimum 6 characters',
            showCancelButton: true,
            inputAttributes: { minlength: 6 }
        });

        if (newPassword) {
            try {
                await axios.put(`/api/admin/users/${user._id}/reset-password`, { password: newPassword });
                Swal.fire('Success', 'Password has been reset', 'success');
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Failed to reset password', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">User Management</h1>
                    <p className="text-slate-500 font-medium">Manage organization hierarchy and access</p>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', email: '', password: '', role: 'Sales Executive', manager: '', isActive: true });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                    <MdPersonAdd className="text-xl" /> Create User
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Name & Email</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Manager</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic font-medium">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-slate-800 not-italic">
                                    <div className="font-bold">{user.name}</div>
                                    <div className="text-xs text-slate-400">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.role.includes('Admin') ? 'bg-purple-100 text-purple-700' :
                                            user.role.includes('Manage') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {user.manager?.name || '---'}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleStatusToggle(user)}
                                        className={`flex items-center gap-1.5 text-xs font-black uppercase ${user.isActive ? 'text-emerald-500' : 'text-red-400'}`}
                                    >
                                        {user.isActive ? <MdCheckCircle /> : <MdCancel />}
                                        {user.isActive ? 'Active' : 'Disabled'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(user)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit">
                                            <MdEdit />
                                        </button>
                                        <button onClick={() => handleResetPassword(user)} className="p-2 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors" title="Reset Password">
                                            <MdLockReset className="text-xl" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black mb-6 text-slate-800">{editingUser ? 'Edit User' : 'New User Discovery'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    required className="input-field bg-slate-50 border-transparent focus:bg-white font-bold h-12"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    required type="email" className="input-field bg-slate-50 border-transparent focus:bg-white font-bold h-12"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                                    <input
                                        required minLength={6} type="password"
                                        className="input-field bg-slate-50 border-transparent focus:bg-white font-bold h-12"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                                    <select
                                        className="input-field bg-slate-50 border-transparent focus:bg-white font-bold h-12"
                                        value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reporting Manager</label>
                                    <select
                                        className="input-field bg-slate-50 border-transparent focus:bg-white font-bold h-12 text-slate-500"
                                        value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })}
                                    >
                                        <option value="">No Manager</option>
                                        {users.filter(u => u.role.includes('Manager') || u.role.includes('Admin')).map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Discard</button>
                                <button type="submit" className="px-10 py-3 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest text-xs">
                                    {editingUser ? 'Save Updates' : 'Initialize User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
