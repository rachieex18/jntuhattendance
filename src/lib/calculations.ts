import { Subject, Attendance } from '../types/database.types';

export const calculateAttendanceStats = (
    subjects: Subject[],
    attendance: Attendance[]
) => {
    let totalAttended = 0;
    let totalExpected = 0;

    // Group attendance by subject
    const subjectStats = subjects.map(subject => {
        const subjectAttendance = attendance.filter(a => a.subject_id === subject.id);

        // Sum hours from regular classes
        const baseAttended = subjectAttendance.reduce((sum, a) => sum + Number(a.hours_attended), 0);
        const baseTotal = subjectAttendance.reduce((sum, a) => sum + Number(a.total_hours), 0);

        // Add Midterm bonus (2 periods per midterm)
        // Check how many midterms were attended
        const midtermsAttended = subjectAttendance.filter(a => a.is_midterm).length;
        const bonus = midtermsAttended * 2;

        const finalAttended = baseAttended + bonus;
        // Total expected hours shouldn't necessarily increase by the bonus, 
        // as the bonus is a "gift" of attendance.
        const finalTotal = baseTotal;

        totalAttended += finalAttended;
        totalExpected += finalTotal;

        return {
            ...subject,
            attended: finalAttended,
            total: finalTotal,
            percentage: finalTotal > 0 ? (finalAttended / finalTotal) * 100 : 100
        };
    });

    const aggregatePercentage = totalExpected > 0 ? (totalAttended / totalExpected) * 100 : 100;

    return {
        aggregatePercentage,
        totalAttended,
        totalExpected,
        subjectStats,
        status: aggregatePercentage >= 75 ? 'safe' : aggregatePercentage >= 65 ? 'condonation' : 'detained'
    };
};

export const calculateBunkableHours = (attended: number, total: number, threshold: number = 0.75) => {
    if (total === 0) return 0;
    const currentPercentage = attended / total;
    if (currentPercentage < threshold) return 0;
    const maxTotalObj = attended / threshold;
    return Math.floor(maxTotalObj - total);
};

export const getAttendanceTrend = (attendance: Attendance[]) => {
    // Group by week
    const weeks: Record<string, { attended: number, total: number }> = {};

    attendance.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(record => {
        const date = new Date(record.date);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];

        if (!weeks[weekStart]) {
            weeks[weekStart] = { attended: 0, total: 0 };
        }

        weeks[weekStart].attended += Number(record.hours_attended);
        weeks[weekStart].total += Number(record.total_hours);
    });

    return Object.entries(weeks).map(([date, data]) => ({
        date,
        percentage: data.total > 0 ? (data.attended / data.total) * 100 : 100
    }));
};
