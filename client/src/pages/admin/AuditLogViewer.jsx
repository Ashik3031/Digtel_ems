import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    MdSearch,
    MdFilterList,
    MdHistory,
    MdNavigateBefore,
    MdNavigateNext
} from 'react-icons/md';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pages: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs(1);
    }, []);

    const fetchLogs = async (page) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/audit-logs?page=${page}&limit=15`);
            if (res.data.success) {
                setLogs(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        if (action.includes('CREATED')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (action.includes('PUSH')) return 'bg-purple-50 text-purple-600 border-purple-100';
        if (action.includes('PASSWORD') || action.includes('DISABLED')) return 'bg-red-50 text-red-600 border-red-100';
        return 'bg-slate-50 text-slate-600 border-slate-100';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <MdHistory className="text-blue-600" /> Audit Logs
                    </h1>
                    <p className="text-slate-500 font-medium">Global activity stream for security and transparency</p>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-5 border-b border-slate-100">Timestamp</th>
                                <th className="px-6 py-5 border-b border-slate-100">User</th>
                                <th className="px-6 py-5 border-b border-slate-100">Action</th>
                                <th className="px-6 py-5 border-b border-slate-100">Target Resource</th>
                                <th className="px-6 py-5 border-b border-slate-100">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium italic text-xs">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-400 not-italic font-bold whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase not-italic">
                                                {log.performedBy?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="text-slate-700 not-italic font-bold">{log.performedBy?.name || 'Anonymous'}</div>
                                                <div className="text-[10px] opacity-60 uppercase">{log.performedBy?.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 not-italic">
                                        {log.targetResource || 'System'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs truncate text-slate-400 group relative">
                                            {JSON.stringify(log.details)}
                                            {/* Tooltip for overflow (simplified) */}
                                            <div className="hidden group-hover:block absolute z-10 bg-slate-800 text-white p-2 rounded text-[10px] w-64 break-words shadow-xl">
                                                {JSON.stringify(log.details, null, 2)}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Page {pagination.current} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.current === 1}
                            onClick={() => fetchLogs(pagination.current - 1)}
                            className="p-2 bg-white rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <MdNavigateBefore />
                        </button>
                        <button
                            disabled={pagination.current === pagination.pages}
                            onClick={() => fetchLogs(pagination.current + 1)}
                            className="p-2 bg-white rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <MdNavigateNext />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogViewer;
