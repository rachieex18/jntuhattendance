import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Check, X, Clock, BarChart3, Loader2, ShieldCheck, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

interface Friend {
    friendship_id: number;
    status: 'pending' | 'accepted';
    sender_id: number;
    user_id: number;
    email: string;
    full_name: string;
    roll_number: string;
    branch: string;
    attendance?: {
        attended: number;
        total: number;
        percentage: number;
    };
}

interface SearchResult {
    id: number;
    email: string;
    full_name: string;
    roll_number: string;
    branch: string;
}

const API_BASE = 'http://localhost:3001/api';

export const FriendsManager = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (user) {
            fetchFriends();
        }
    }, [user]);

    const fetchFriends = async () => {
        try {
            const response = await fetch(`${API_BASE}/friends/${user?.id}`);
            const data = await response.json();

            // For accepted friends, fetch their attendance too
            const friendsWithAttendance = await Promise.all(data.map(async (f: Friend) => {
                if (f.status === 'accepted') {
                    const attRes = await fetch(`${API_BASE}/friends/attendance/${f.user_id}?userId=${user?.id}`);
                    const attData = await attRes.json();
                    return { ...f, attendance: attData };
                }
                return f;
            }));

            setFriends(friendsWithAttendance);
        } catch (error) {
            toast.error("Failed to load friends list");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`${API_BASE}/users/search?query=${query}&currentUserId=${user?.id}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const sendRequest = async (friendId: number) => {
        try {
            const response = await fetch(`${API_BASE}/friends/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, friendId })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Friend request sent!");
                fetchFriends();
                setSearchQuery('');
                setSearchResults([]);
            } else {
                toast.error(data.error || "Failed to send request");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const acceptRequest = async (friendId: number) => {
        try {
            const response = await fetch(`${API_BASE}/friends/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, friendId })
            });
            if (response.ok) {
                toast.success("Friend request accepted!");
                fetchFriends();
            }
        } catch (error) {
            toast.error("Failed to accept request");
        }
    };

    const pendingRequests = friends.filter(f => f.status === 'pending' && f.sender_id !== user?.id);
    const sentRequests = friends.filter(f => f.status === 'pending' && f.sender_id === user?.id);
    const activeFriends = friends.filter(f => f.status === 'accepted');

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header & Search */}
            <div className="bg-surface p-8 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Users className="w-64 h-64 text-primary-light" />
                </div>

                <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary-light" />
                    Friends & Social
                </h2>
                <p className="text-text-secondary mb-8">Connect with classmates and keep track of group attendance goals.</p>

                <div className="relative max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, roll number, or email..."
                        className="w-full bg-secondary border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white outline-none focus:border-primary-light focus:ring-1 focus:ring-primary-light transition-all shadow-lg"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary-light" />}
                </div>

                {searchResults.length > 0 && (
                    <div className="mt-4 bg-secondary border border-gray-700 rounded-xl overflow-hidden shadow-2xl animate-slideIn">
                        {searchResults.map(result => (
                            <div key={result.id} className="flex items-center justify-between p-4 hover:bg-gray-800 transition-colors border-b border-gray-700 last:border-none">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary-dark/30 rounded-full flex items-center justify-center border border-primary-light/20">
                                        <UserCircle className="w-6 h-6 text-primary-light" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{result.full_name}</p>
                                        <p className="text-xs text-gray-400">{result.roll_number} • {result.branch}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => sendRequest(result.id)}
                                    className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Add Friend
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Requests */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface p-6 rounded-2xl border border-gray-800 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-warning" />
                            Friend Requests
                        </h3>

                        {pendingRequests.length === 0 ? (
                            <p className="text-sm text-gray-500 italic py-4">No incoming requests</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingRequests.map(req => (
                                    <div key={req.friendship_id} className="p-3 bg-secondary rounded-xl border border-gray-700 flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-white">{req.full_name}</p>
                                            <p className="text-[10px] text-gray-400">{req.roll_number}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => acceptRequest(req.user_id)}
                                                className="p-2 bg-success/20 text-success hover:bg-success rounded-lg transition-all"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 bg-danger/20 text-danger hover:bg-danger rounded-lg transition-all">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sentRequests.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-800">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Sent Requests</h4>
                                <div className="space-y-3">
                                    {sentRequests.map(req => (
                                        <div key={req.friendship_id} className="flex items-center justify-between py-2 text-sm">
                                            <span className="text-gray-300">{req.full_name}</span>
                                            <span className="text-[10px] px-2 py-1 bg-gray-800 rounded-full text-gray-500 font-bold uppercase">Pending</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Friends List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface p-6 rounded-2xl border border-gray-800 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-success" />
                            My Friends
                        </h3>

                        {activeFriends.length === 0 ? (
                            <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-dashed border-gray-800">
                                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500">You haven't added any friends yet.</p>
                                <button className="text-primary-light text-sm mt-2 hover:underline">Invite Classmates</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeFriends.map(friend => (
                                    <div key={friend.user_id} className="bg-secondary p-5 rounded-2xl border border-gray-700 hover:border-primary-light/50 transition-all group relative overflow-hidden">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-white font-black text-xl border border-white/10 shadow-lg">
                                                    {friend.full_name[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-primary-light transition-colors">{friend.full_name}</h4>
                                                    <p className="text-xs text-gray-500">{friend.roll_number}</p>
                                                </div>
                                            </div>
                                            <div className="bg-gray-800 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                                                {friend.branch} member
                                            </div>
                                        </div>

                                        {friend.attendance && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Overall Attendance</span>
                                                    <span className={`text-sm font-black ${friend.attendance.percentage >= 75 ? 'text-success' :
                                                            friend.attendance.percentage >= 65 ? 'text-warning' : 'text-danger'
                                                        }`}>
                                                        {friend.attendance.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${friend.attendance.percentage >= 75 ? 'bg-success' :
                                                                friend.attendance.percentage >= 65 ? 'bg-warning' : 'bg-danger'
                                                            }`}
                                                        style={{ width: `${Math.min(friend.attendance.percentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                                                    <span>{friend.attendance.attended} Hours Attended</span>
                                                    <span>Goal: 75%</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute top-0 right-0 p-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-bl-lg transform translate-x-full group-hover:translate-x-0 transition-transform">
                                            Sync Active
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};