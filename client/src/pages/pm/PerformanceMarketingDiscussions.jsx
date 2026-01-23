import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const PerformanceMarketingDiscussions = () => {
    const { logout, user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    const [discussions, setDiscussions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize with sample discussions
        setDiscussions([
            { id: 1, title: 'Q1 Campaign Strategy', lastMessage: 'Reviewing budget allocation...', participants: 3 },
            { id: 2, title: 'Social Media Analytics', lastMessage: 'Great engagement numbers this week', participants: 5 },
            { id: 3, title: 'Performance Metrics Review', lastMessage: 'Let\'s discuss ROI improvements', participants: 2 }
        ]);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleSelectDiscussion = (discussion) => {
        setSelectedDiscussion(discussion);
        setMessages([
            { id: 1, author: 'Sarah', message: 'Let\'s start discussing the Q1 campaigns', time: '10:30 AM' },
            { id: 2, author: 'Mike', message: 'I\'ve prepared the initial budget breakdown', time: '10:45 AM' },
            { id: 3, author: user?.name, message: 'Great! Let\'s review those numbers.', time: '11:00 AM' }
        ]);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedDiscussion) return;

        const message = {
            id: messages.length + 1,
            author: user?.name,
            message: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, message]);
        setNewMessage('');
    };

    const handleBackToDashboard = () => {
        navigate('/performance-marketing');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-black text-blue-600">PM Discussions</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700 font-medium">Welcome, {user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button
                    onClick={handleBackToDashboard}
                    className="mb-6 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                    ← Back to Dashboard
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                    {/* Discussions List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-black text-gray-900">Discussions</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {discussions.map((discussion) => (
                                <button
                                    key={discussion.id}
                                    onClick={() => handleSelectDiscussion(discussion)}
                                    className={`w-full text-left px-6 py-4 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                        selectedDiscussion?.id === discussion.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                                >
                                    <p className="font-bold text-gray-900 truncate">{discussion.title}</p>
                                    <p className="text-sm text-gray-600 truncate">{discussion.lastMessage}</p>
                                    <p className="text-xs text-gray-500 mt-1">{discussion.participants} participants</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Messages Area */}
                    {selectedDiscussion ? (
                        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-black text-gray-900">{selectedDiscussion.title}</h3>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-blue-600">{msg.author.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 text-sm">{msg.author}</p>
                                                <p className="text-xs text-gray-500">{msg.time}</p>
                                            </div>
                                            <p className="text-gray-700 text-sm mt-1">{msg.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                            <p className="text-gray-500 text-lg font-medium">Select a discussion to view messages</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerformanceMarketingDiscussions;
