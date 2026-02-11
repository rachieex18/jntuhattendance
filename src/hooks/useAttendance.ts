import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { Subject, Attendance } from '../types/database.types';
import { calculateAttendanceStats, calculateBunkableHours, getAttendanceTrend } from '../lib/calculations';

interface AttendanceStats {
    totalAttended: number;
    totalExpected: number;
    aggregatePercentage: number;
    status: 'safe' | 'condonation' | 'detained';
    subjectStats: Array<{
        subject_name: string;
        subject_type: string;
        attended: number;
        total: number;
        percentage: number;
    }>;
    bunkableHours: number;
}

const API_BASE = 'http://localhost:3001/api';

export const useAttendance = () => {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [trendData, setTrendData] = useState<Array<{ date: string, percentage: number }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Fetch subjects
            const subjectsResponse = await fetch(`${API_BASE}/subjects/${user.id}`);
            const subjectsData = await subjectsResponse.json();

            // Fetch attendance
            const attendanceResponse = await fetch(`${API_BASE}/attendance/${user.id}`);
            const attendanceData = await attendanceResponse.json();

            const fetchedSubjects = subjectsData || [];
            const fetchedAttendance = attendanceData || [];

            setSubjects(fetchedSubjects);
            setAttendance(fetchedAttendance);

            const calculatedStats = calculateAttendanceStats(fetchedSubjects, fetchedAttendance);
            const bunkable = calculateBunkableHours(calculatedStats.totalAttended, calculatedStats.totalExpected);
            const trend = getAttendanceTrend(fetchedAttendance);

            setStats({
                ...calculatedStats,
                bunkableHours: bunkable
            } as AttendanceStats);
            setTrendData(trend);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addSubject = async (subjectData: { subjectName: string; credits: number; hoursPerWeek: number; subjectType: string }) => {
        if (!user) return { success: false, error: 'User not authenticated' };

        try {
            const response = await fetch(`${API_BASE}/subjects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    ...subjectData,
                }),
            });

            if (response.ok) {
                await fetchData(); // Refresh data
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const addAttendance = async (attendanceData: { subjectId: number; date: string; hoursAttended: number; totalHours: number; isMidterm: boolean; notes?: string }) => {
        if (!user) return { success: false, error: 'User not authenticated' };

        try {
            const response = await fetch(`${API_BASE}/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    ...attendanceData,
                }),
            });

            if (response.ok) {
                await fetchData(); // Refresh data
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const deleteSubject = async (subjectId: string | number) => {
        if (!user) return { success: false, error: 'User not authenticated' };

        try {
            const response = await fetch(`${API_BASE}/subjects/${subjectId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchData(); // Refresh data
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.error };
            }
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    return {
        subjects,
        attendance,
        stats,
        trendData,
        loading,
        refresh: fetchData,
        addSubject,
        addAttendance,
        deleteSubject,
    };
};