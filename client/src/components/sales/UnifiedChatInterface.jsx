import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSales, addComment, addReply, markCommentsRead } from '../../services/salesService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiCalendar, FiChevronRight, FiMoreVertical, FiMessageSquare, FiSend, FiUser } from 'react-icons/fi';
import Swal from 'sweetalert2';

const UnifiedChatInterface = ({ backLink = '/' }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    // State
    const [sales, setSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState({});
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchSales = async () => {
        try {
            const res = await getSales(filters);
            if (res.success) {
                setSales(res.data);
                if (selectedSale) {
                    const updatedSelected = res.data.find(s => s._id === selectedSale._id);
                    if (updatedSelected) setSelectedSale(updatedSelected);
                }
            }
        } catch (err) {
            console.error('Fetch sales failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [filters]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => fetchSales();
        socket.on('sale_updated', handleUpdate);
        return () => socket.off('sale_updated', handleUpdate);
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedSale?.comments]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !selectedSale) return;
        try {
            const res = await addComment(selectedSale._id, commentText);
            if (res.success) {
                setCommentText('');
                fetchSales();
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to add remark', 'error');
        }
    };

    const handleAddReply = async (commentId) => {
        const text = replyText[commentId];
        if (!text?.trim() || !selectedSale) return;
        try {
            const res = await addReply(selectedSale._id, commentId, text);
            if (res.success) {
                setReplyText({ ...replyText, [commentId]: '' });
                fetchSales();
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to add reply', 'error');
        }
    };

    const selectSale = async (sale) => {
        setSelectedSale(sale);
        if (sale.hasUnreadManagerComment) {
            await markCommentsRead(sale._id);
            fetchSales();
        }
    };

    if (loading && sales.length === 0) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] dark:bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D8F60D]"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#f0f2f5] dark:bg-black overflow-hidden font-sans">
            {/* WhatsApp Header Style */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-3 lg:px-6 shadow-sm z-20">
                <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(backLink)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <FiChevronRight className="rotate-180 text-zinc-500" />
                        </button>
                        <h1 className="text-xl font-black text-black dark:text-white tracking-tight">Project Discussions</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#D8F60D] transition-colors" />
                            <input
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search conversations..."
                                className="pl-10 pr-4 py-2 bg-[#f0f2f5] dark:bg-black border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#D8F60D] outline-none w-64 transition-all"
                            />
                        </div>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="px-4 py-2 bg-[#f0f2f5] dark:bg-black border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#D8F60D] outline-none appearance-none font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer"
                        >
                            <option value="">All Projects</option>
                            <option value="Prospect">Prospect</option>
                            <option value="Sale">Sale</option>
                            <option value="Handover">Handover</option>
                        </select>
                        <div className="flex items-center gap-2 bg-[#f0f2f5] dark:bg-black rounded-2xl px-3 py-1 border-none shadow-sm">
                            <FiCalendar className="text-zinc-400" />
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="bg-transparent text-xs outline-none dark:invert font-bold" />
                            <span className="text-zinc-400">-</span>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="bg-transparent text-xs outline-none dark:invert font-bold" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden max-w-[1800px] mx-auto w-full">
                {/* Conversations Sidebar (Left) */}
                <aside className="w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 shadow-sm z-10">
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {sales.map(sale => (
                            <div
                                key={sale._id}
                                onClick={() => selectSale(sale)}
                                className={`group p-4 border-b border-zinc-50 dark:border-zinc-800 transition-all cursor-pointer relative ${selectedSale?._id === sale._id ? 'bg-[#f0f2f5] dark:bg-black border-l-4 border-l-[#D8F60D]' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-[15px] text-black dark:text-white truncate pr-4">{sale.clientName}</h4>
                                    <span className="text-[10px] font-medium text-zinc-400">{new Date(sale.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center pr-2">
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate flex-1">
                                        {sale.comments && sale.comments.length > 0 ? (
                                            <span className="italic">"{sale.comments[sale.comments.length - 1].text}"</span>
                                        ) : (
                                            `Project: ${sale.companyName || 'No Company'}`
                                        )}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${sale.status === 'Sale' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 dark:bg-black text-zinc-500'}`}>{sale.status}</span>
                                        {sale.hasUnreadManagerComment && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Discussion Area (Right) */}
                <main className={`flex-1 flex flex-col relative bg-[#E5DDD5] dark:bg-black bg-opacity-40`}>
                    {/* Wallpaper Pattern (optional, but WhatsApp feel) */}
                    <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

                    {selectedSale ? (
                        <>
                            {/* Chat Toolbar */}
                            <div className="bg-[#f0f2f5] dark:bg-zinc-900 p-3 px-6 flex items-center justify-between z-10 shadow-sm border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <h2 className="font-bold text-black dark:text-white leading-tight">{selectedSale.clientName}</h2>
                                        <p className="text-[11px] text-zinc-500 font-medium">Group Chat • {selectedSale.comments?.length || 0} Remarks</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => navigate(backLink)} className="text-xs font-black uppercase text-zinc-500 hover:text-black dark:hover:text-white transition-colors">Details</button>
                                    <FiMoreVertical className="text-zinc-400 cursor-pointer" />
                                </div>
                            </div>

                            {/* Conversation List */}
                            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 custom-scrollbar relative z-10">
                                {selectedSale.comments?.map((comment, idx) => {
                                    const isMe = comment.user?._id === user.id;
                                    return (
                                        <div key={idx} className="flex flex-col space-y-3">
                                            {/* Top-Level Remark (The Bubble) */}
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`relative max-w-[85%] lg:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-[#dcf8c6] dark:bg-[#D8F60D] text-black rounded-tr-none' : 'bg-white dark:bg-zinc-900 text-black dark:text-white rounded-tl-none border border-zinc-200 dark:border-zinc-800'}`}>
                                                    {/* Visual Bubble Tail */}
                                                    <div className={`absolute top-0 w-3 h-3 ${isMe ? '-right-1.5 bg-[#dcf8c6] dark:bg-[#D8F60D]' : '-left-1.5 bg-white dark:bg-zinc-900 border-l border-t border-zinc-200 dark:border-zinc-800'} transform rotate-45 z-[-1]`}></div>

                                                    {!isMe && (
                                                        <div className="flex items-center justify-between gap-4 mb-1 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                                                            <span className={`text-[10px] font-black uppercase tracking-tight ${comment.user?.role === 'Admin' || comment.user?.role === 'Super Admin' ? 'text-red-500' : 'text-indigo-600 dark:text-[#D8F60D]'}`}>
                                                                {comment.user?.name}
                                                            </span>
                                                            <span className="text-[9px] bg-zinc-100 dark:bg-black text-zinc-500 px-1.5 py-0.5 rounded-full font-bold">{comment.user?.role}</span>
                                                        </div>
                                                    )}

                                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{comment.text}</p>

                                                    <div className={`text-[10px] text-right mt-1 font-medium ${isMe ? 'text-green-700/70 dark:text-black/50' : 'text-zinc-400'}`}>
                                                        {new Date(comment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Replies (Threaded beneath) */}
                                            {comment.replies?.map((reply, ridx) => {
                                                const riMe = reply.user?._id === user.id;
                                                return (
                                                    <div key={ridx} className={`flex flex-col ${riMe ? 'items-end' : 'items-start'} ${isMe ? '' : 'pl-6'}`}>
                                                        <div className={`relative max-w-[80%] px-4 py-2 rounded-2xl shadow-sm italic text-xs ${riMe ? 'bg-[#e7fed3] dark:bg-[#bce00b] text-black ml-12' : 'bg-[#f0f2f5] dark:bg-zinc-800 text-black dark:text-white mr-12'}`}>
                                                            {!riMe && (
                                                                <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-tighter mb-1">{reply.user?.name} ({reply.user?.role})</span>
                                                            )}
                                                            <p className="leading-snug">{reply.text}</p>
                                                            <div className="text-[9px] text-right mt-1 opacity-60">
                                                                {new Date(reply.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Mini Reply Field (Integrated into bubble thread) */}
                                            <div className={`flex gap-2 max-w-[400px] ${isMe ? 'ml-auto' : 'pl-6'}`}>
                                                <input
                                                    value={replyText[comment._id] || ''}
                                                    onChange={e => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddReply(comment._id)}
                                                    placeholder="Reply to this thread..."
                                                    className="flex-1 bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-1.5 text-xs focus:ring-1 focus:ring-[#D8F60D] outline-none transition-all"
                                                />
                                                <button
                                                    onClick={() => handleAddReply(comment._id)}
                                                    className="p-2 text-zinc-400 hover:text-[#D8F60D] transition-all"
                                                >
                                                    <FiSend className="text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Footer Input Control */}
                            <footer className="bg-[#f0f2f5] dark:bg-zinc-900 p-4 border-t border-zinc-200 dark:border-zinc-800 z-10">
                                <form onSubmit={handleAddComment} className="flex items-center gap-3 max-w-[1200px] mx-auto relative">
                                    <input
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder="Type a new report or note..."
                                        className="flex-1 bg-white dark:bg-black border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-0 outline-none shadow-sm dark:text-white placeholder:text-zinc-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!commentText.trim()}
                                        className="w-14 h-14 bg-[#D8F60D] text-black rounded-2xl flex items-center justify-center shadow-lg shadow-[#D8F60D]/10 hover:bg-[#bce00b] transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        <FiSend className="text-xl" />
                                    </button>
                                </form>
                            </footer>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center relative z-10 opacity-30 grayscale">
                            <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-xl border border-white dark:border-zinc-800 flex flex-col items-center">
                                <FiMessageSquare className="w-24 h-24 mb-6 text-zinc-300" />
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Digtel Chat Engine</h3>
                                <p className="text-xs font-bold uppercase tracking-widest mt-2 text-zinc-500">Select a project to start collaborating</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Global Chat Style Rules */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #ced3d6; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D8F60D; }
            `}} />
        </div>
    );
};

export default UnifiedChatInterface;
