import React, { useState } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { ManualSubjectEntry } from '../timetable/ManualSubjectEntry';
import { SubjectManager } from '../timetable/SubjectManager';
import { AttendanceEntry } from '../attendance/AttendanceEntry';
import { FriendsManager } from '../friends/FriendsManager';
import { BarChart3, Calendar, Plus, ShieldCheck, ShieldAlert, AlertTriangle, CheckSquare, Users, Loader2, TrendingUp, Settings as SettingsIcon, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings } from '../settings/Settings';

interface StatCardProps {
    label: string;
    value: string | number;
    subtext: string;
    type: 'safe' | 'warning' | 'condonation' | 'danger' | 'detained' | 'success' | 'neutral' | string;
}

export const Dashboard = () => {
    const { stats, loading, subjects, trendData } = useAttendance();
    const [view, setView] = useState<'dashboard' | 'manual' | 'attendance' | 'friends' | 'settings' | 'manage-subjects'>('dashboard');

    const StatCard = ({ label, value, subtext, type }: StatCardProps) => {
        let color = 'text-primary-light';
        let bg = 'bg-primary-dark';
        let Icon = ShieldCheck;

        if (type === 'warning' || type === 'condonation') {
            color = 'text-warning';
            bg = 'bg-yellow-900/20';
            Icon = ShieldAlert;
        } else if (type === 'danger' || type === 'detained') {
            color = 'text-danger';
            bg = 'bg-red-900/20';
            Icon = AlertTriangle;
        }

        return (
            <div className="bg-surface p-6 rounded-xl border border-gray-800 shadow-lg hover:border-gray-700 transition-all cursor-default">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-text-secondary text-sm font-medium">{label}</p>
                        <h3 className={`text-3xl font-bold mt-1 ${color}`}>{value}</h3>
                    </div>
                    <div className={`p-3 rounded-lg ${bg}`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                </div>
                <p className="text-sm text-gray-500">{subtext}</p>
            </div>
        );
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary-light" />
            <p className="text-text-secondary animate-pulse">Loading dashboard statistics...</p>
        </div>
    );

    const aggregatePercentage = stats?.aggregatePercentage ?? 0;
    const status = stats?.status ?? 'safe';
    const bunkableHours = stats?.bunkableHours ?? 0;

    return (
        <div className="container mx-auto max-w-7xl animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary">Track your attendance and manage your academic status.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Navigation Buttons */}
                    {view !== 'dashboard' && (
                        <button
                            onClick={() => setView('dashboard')}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors text-white"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Dashboard
                        </button>
                    )}

                    <button
                        onClick={() => setView('friends')}
                        className={`px-4 py-2 border border-gray-700 rounded-lg flex items-center gap-2 transition-colors ${view === 'friends' ? 'bg-primary text-white' : 'bg-secondary hover:bg-gray-800 text-text-primary'}`}
                    >
                        <Users className="w-4 h-4" />
                        Friends
                    </button>
                    <button
                        onClick={() => setView('attendance')}
                        className={`px-4 py-2 border border-gray-700 rounded-lg flex items-center gap-2 transition-colors ${view === 'attendance' ? 'bg-primary text-white' : 'bg-secondary hover:bg-gray-800 text-text-primary'}`}
                    >
                        <CheckSquare className="w-4 h-4" />
                        Mark Attendance
                    </button>
                    <button
                        onClick={() => setView('settings')}
                        className={`px-4 py-2 border border-gray-700 rounded-lg flex items-center gap-2 transition-colors ${view === 'settings' ? 'bg-primary text-white' : 'bg-secondary hover:bg-gray-800 text-text-primary'}`}
                    >
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                    </button>

                    {/* Management Buttons */}
                    <div className="w-px h-8 bg-gray-700 mx-1 hidden md:block"></div>

                    <button
                        onClick={() => setView('manage-subjects')}
                        className={`px-4 py-2 border border-primary-light/30 rounded-lg flex items-center gap-2 transition-colors ${view === 'manage-subjects' ? 'bg-primary text-white' : 'bg-secondary hover:bg-gray-800 text-primary-light'}`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Manage Subjects
                    </button>

                    <button
                        onClick={() => setView('manual')}
                        className={`px-4 py-2 border border-success/30 rounded-lg flex items-center gap-2 transition-colors ${view === 'manual' ? 'bg-success text-white' : 'bg-secondary hover:bg-gray-800 text-success'}`}
                    >
                        <Plus className="w-4 h-4" />
                        Add Manually
                    </button>
                </div>
            </div>

            {view === 'friends' ? (
                <FriendsManager />
            ) : view === 'settings' ? (
                <Settings />
            ) : view === 'manage-subjects' ? (
                <SubjectManager />
            ) : view === 'manual' ? (
                <ManualSubjectEntry />
            ) : view === 'attendance' ? (
                <AttendanceEntry />
            ) : (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Overall Attendance"
                            value={`${aggregatePercentage.toFixed(1)}%`}
                            subtext={status === 'safe' ? "Safe zone (>75%)" : status === 'condonation' ? "Condonation Required (₹300)" : "Detained - No Exam Entry"}
                            type={status}
                        />
                        <StatCard
                            label="Attended Hours"
                            value={`${stats?.totalAttended ?? 0} hrs`}
                            subtext="Total hours recorded"
                            type="neutral"
                        />
                        <StatCard
                            label="Bunkable Hours"
                            value={`${bunkableHours} hrs`}
                            subtext="To maintain 75%"
                            type={bunkableHours > 0 ? "success" : "danger"}
                        />
                        <StatCard
                            label="Total Classes"
                            value={`${stats?.totalExpected ?? 0} hrs`}
                            subtext="Semester to date"
                            type="neutral"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Attendance Trend */}
                        <div className="lg:col-span-2 bg-surface rounded-xl border border-gray-800 p-6">
                            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-accent" />
                                Attendance Trend
                            </h3>
                            <div className="h-[300px] w-full">
                                {trendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#9CA3AF"
                                                fontSize={12}
                                                tickFormatter={(str) => {
                                                    const d = new Date(str);
                                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                                }}
                                            />
                                            <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                itemStyle={{ color: '#60A5FA' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="percentage"
                                                stroke="#60A5FA"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#60A5FA' }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 italic">
                                        Not enough data to show trend. Mark attendance for a few days!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subject Breakdown Shortcut or Info */}
                        <div className="bg-surface rounded-xl border border-gray-800 p-6">
                            <h3 className="text-xl font-bold text-text-primary mb-6">Status Overview</h3>
                            <div className="space-y-6">
                                <div className="p-4 rounded-lg bg-secondary border border-gray-700">
                                    <p className="text-sm text-text-secondary mb-1">Target 75%</p>
                                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${aggregatePercentage >= 75 ? 'bg-success' : aggregatePercentage >= 65 ? 'bg-warning' : 'bg-danger'}`}
                                            style={{ width: `${Math.min(aggregatePercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-right text-xs mt-2 font-bold text-text-primary">{aggregatePercentage.toFixed(1)}%</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Safe Zone</span>
                                        <span className="text-success font-bold">≥ 75%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Condonation</span>
                                        <span className="text-warning font-bold">65% - 75%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Detained</span>
                                        <span className="text-danger font-bold">&lt; 65%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subjects List */}
                    <div className="bg-surface rounded-xl border border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-accent" />
                                Subject Performance
                            </h3>
                        </div>

                        {subjects.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-text-secondary mb-4">No subjects found. Add subjects to get started.</p>
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setView('manual')}
                                        className="px-6 py-2 bg-secondary border border-gray-700 text-text-primary rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Add Manually
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary text-gray-400 text-sm">
                                        <tr>
                                            <th className="p-4 pl-6">Subject</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Attended/Total</th>
                                            <th className="p-4">Percentage</th>
                                            <th className="p-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {stats?.subjectStats.map((sub: { subject_name: string, subject_type: string, attended: number, total: number, percentage: number }, i: number) => (
                                            <tr key={i} className="hover:bg-secondary/50 transition-colors">
                                                <td className="p-4 pl-6 font-medium text-text-primary">{sub.subject_name}</td>
                                                <td className="p-4 text-text-secondary uppercase text-xs">{sub.subject_type}</td>
                                                <td className="p-4 text-text-secondary">{sub.attended} / {sub.total} hrs</td>
                                                <td className="p-4 font-bold text-text-primary">{sub.percentage.toFixed(1)}%</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.percentage >= 75 ? 'bg-success/20 text-success' :
                                                        sub.percentage >= 65 ? 'bg-warning/20 text-warning' :
                                                            'bg-danger/20 text-danger'
                                                        }`}>
                                                        {sub.percentage >= 75 ? 'Safe' : sub.percentage >= 65 ? 'Warning' : 'Critical'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
