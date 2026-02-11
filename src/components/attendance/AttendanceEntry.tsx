import React, { useState, useMemo } from 'react';
import { format, getDay, parseISO } from 'date-fns';
import { Save, Calendar as CalendarIcon, Loader2, CheckCircle2, Circle, Filter, FilterX, Sparkles } from 'lucide-react';
import { useAttendance } from '../../hooks/useAttendance';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface AttendanceEntryRecord {
    visited: boolean;
    hours: number;
    notes: string;
}

// Timetable mapping to filter subjects icon/day (Supports L1, L2, K1, K2, G1, G2)
// Refined with section-specific tags (-L1, -L2) to prevent cross-section over-matching
const DAILY_SCHEDULE: Record<number, string[]> = {
    1: ['ELCSL', 'EW'], // Monday: L1 & L2 both have ELCSL/EW (just flipped)
    2: ['ESE', 'ODEVC', 'PPL'], // Tuesday: L1 & L2 identical
    3: ['APL-L1', 'DSL-L2', 'ODEVC', 'AP'], // Wednesday: L1(APL-L1) | L2(DSL-L2)
    4: ['DSL-L1', 'APL-L2', 'THEORY', 'ESE', 'DS'], // Thursday: L1(DSL-L1) | L2(APL-L2)
    5: ['THEORY', 'EGCAD', 'DS', 'AP'], // Friday: L1 & L2 identical
    6: ['GERMAN'], // Saturday: L2 German Class
    0: [] // Sunday
};

export const AttendanceEntry = () => {
    const { subjects = [], addAttendance, refresh } = useAttendance();
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [entries, setEntries] = useState<Record<string, AttendanceEntryRecord>>({});
    const [loading, setLoading] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [isCelebrating, setIsCelebrating] = useState(false);

    // Safe date parsing
    const safeDateObj = useMemo(() => {
        try {
            return parseISO(date);
        } catch (e) {
            return new Date();
        }
    }, [date]);

    // Filter subjects based on the selected day's schedule
    const filteredSubjects = useMemo(() => {
        if (!Array.isArray(subjects)) return [];
        if (showAll) return subjects;

        const day = getDay(safeDateObj);
        const activeKeywords = DAILY_SCHEDULE[day] || [];

        if (activeKeywords.length === 0) return [];

        return subjects.filter(sub => {
            const name = (sub?.subject_name || '').toUpperCase();

            return activeKeywords.some(keyword => {
                const k = keyword.toUpperCase();

                // STRICT MATCHING LOGIC:
                // We want to match "AP" but NOT "APL" unless "APL" is the keyword.
                // 1. Check for abbreviation in parentheses: (AP) or (AP-
                if (name.includes(`(${k})`) || name.includes(`(${k}-`)) return true;

                // 2. Exact word check using word boundaries
                // This handles "Applied Physics" vs "Applied Physics Lab"
                const wordBoundaryMatch = new RegExp(`\\b${k}\\b`, 'i').test(name);

                // Additional safety for commonly overlapping JNTU subjects
                if (k === 'AP' && name.includes('APL')) return false;
                if (k === 'DS' && name.includes('DSL')) return false;

                return wordBoundaryMatch;
            });
        });
    }, [subjects, safeDateObj, showAll]);

    const handleEntryChange = (subjectId: string, field: keyof AttendanceEntryRecord, value: string | number | boolean) => {
        setEntries(prev => ({
            ...prev,
            [subjectId]: {
                ...prev[subjectId] || { visited: false, hours: 0, notes: '' },
                [field]: value
            }
        }));
    };

    const toggleVisited = (subjectId: string) => {
        const subject = subjects.find(s => s.id === subjectId);
        const isCurrentlyVisited = !!entries[subjectId]?.visited;

        handleEntryChange(subjectId, 'visited', !isCurrentlyVisited);
        if (!isCurrentlyVisited) {
            const defaultHours = subject?.subject_type === 'lab' ? 2 : 1.5;
            handleEntryChange(subjectId, 'hours', defaultHours);
        }
    };

    const handleMarkAll = () => {
        const newEntries = { ...entries };
        filteredSubjects.forEach(sub => {
            const defaultHours = sub.subject_type === 'lab' ? 2 : 1.5;
            newEntries[sub.id] = { visited: true, hours: defaultHours, notes: '' };
        });
        setEntries(newEntries);
        toast.info("Marked all scheduled classes as attended");
    };

    const handleSubmit = async () => {
        const attendedSubjects = filteredSubjects.filter(sub => entries[sub.id]?.visited);

        if (attendedSubjects.length === 0) {
            toast.error("Please mark at least one subject as attended.");
            return;
        }

        setLoading(true);
        let successCount = 0;

        try {
            for (const sub of attendedSubjects) {
                const entry = entries[sub.id];
                const result = await addAttendance({
                    subjectId: Number(sub.id),
                    date: date,
                    hoursAttended: entry.hours,
                    totalHours: entry.hours,
                    isMidterm: false,
                    notes: entry.notes
                });

                if (result.success) successCount++;
            }

            if (successCount > 0) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#10b981', '#34d399', '#60a5fa']
                });

                setIsCelebrating(true);
                toast.success(`BOOM! ${successCount} Classes Updated.`, {
                    description: "Your stats are recalculated!"
                });

                setTimeout(() => setIsCelebrating(false), 3000);

                await refresh();
                setEntries({});
            }
        } catch (err) {
            toast.error("Sync failed.");
        } finally {
            setLoading(false);
        }
    };

    const getHourOptions = (type: string) => {
        if (type === 'lab') {
            return [
                { label: '2 hrs (Standard Lab)', value: 2 },
                { label: '3 hrs (Long Lab)', value: 3 },
                { label: '4 hrs (DSL Session)', value: 4 },
                { label: '0 hrs (Bunked)', value: 0 },
            ];
        }
        return [
            { label: '1.5 hrs (Lecture)', value: 1.5 },
            { label: '1 hr (Tutorial)', value: 1 },
            { label: '2 hrs (Double)', value: 2 },
            { label: '0 hrs (Bunked)', value: 0 },
        ];
    };

    return (
        <div className="bg-surface p-6 rounded-xl border border-gray-800 shadow-xl max-w-4xl mx-auto animate-fadeIn relative overflow-hidden">
            {isCelebrating && (
                <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center bg-success/5 animate-pulse">
                    <Sparkles className="w-64 h-64 text-success/10 rotate-12" />
                </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-primary-light" />
                        Today's Agenda
                    </h2>
                    <p className="text-text-secondary text-sm font-medium mt-1">
                        Attendance for <span className="text-primary-light font-bold underline underline-offset-4 decoration-primary-light/30">
                            {safeDateObj instanceof Date && !isNaN(safeDateObj.getTime()) ? format(safeDateObj, 'EEEE, MMMM do') : 'Selected Date'}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}
                        className="px-4 py-2 bg-primary/20 hover:bg-primary/40 text-primary-light rounded-xl text-xs font-black border border-primary-light/10 transition-all active:scale-95"
                    >
                        Jump to Today
                    </button>

                    <button
                        onClick={() => setShowAll(!showAll)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showAll
                            ? 'bg-warning/10 border-warning text-warning'
                            : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            }`}
                    >
                        {showAll ? <FilterX className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        {showAll ? 'Show Full List' : "Today's Filter On"}
                    </button>

                    <button
                        onClick={handleMarkAll}
                        disabled={filteredSubjects.length === 0}
                        className="p-2 px-4 bg-success/10 text-success hover:bg-success hover:text-white border border-success/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-30 self-stretch"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark All Today
                    </button>

                    <div className="flex items-center gap-3 bg-secondary px-4 py-2 rounded-xl border border-primary-light/10 shadow-inner">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent text-text-primary outline-none text-sm font-black cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredSubjects.length > 0 ? (
                    filteredSubjects.map(subject => {
                        const entry = entries[subject.id] || { visited: false, hours: 0, notes: '' };
                        return (
                            <div
                                key={subject.id}
                                className={`group transition-all duration-300 p-5 rounded-2xl border ${entry.visited
                                    ? 'bg-primary-dark/40 border-primary-light shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                    : 'bg-secondary border-gray-800 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5 flex-1 cursor-pointer select-none" onClick={() => toggleVisited(subject.id)}>
                                        <div className={`p-1 rounded-full transition-all duration-500 ${entry.visited ? 'text-primary-light scale-125 rotate-[360deg]' : 'text-gray-700 group-hover:text-gray-500'}`}>
                                            {entry.visited ? <CheckCircle2 className="w-10 h-10 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" /> : <Circle className="w-10 h-10" />}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg transition-colors ${entry.visited ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'}`}>
                                                {subject.subject_name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${subject.subject_type === 'lab' ? 'bg-indigo-900/40 text-indigo-300' : 'bg-amber-900/40 text-amber-300'
                                                    }`}>
                                                    {subject.subject_type}
                                                </span>
                                                {entry.visited && (
                                                    <span className="text-[10px] bg-primary/20 px-2 py-0.5 rounded text-primary-light uppercase font-black">
                                                        Selected: {entry.hours} hrs
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {entry.visited && (
                                        <div className="flex flex-wrap items-end gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Duration</label>
                                                <select
                                                    className="bg-surface border border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-light min-w-[140px] text-text-primary shadow-sm hover:border-gray-500 transition-colors"
                                                    value={entry.hours}
                                                    onChange={(e) => handleEntryChange(subject.id, 'hours', Number(e.target.value))}
                                                >
                                                    {getHourOptions(subject.subject_type).map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Notes</label>
                                                <input
                                                    type="text"
                                                    placeholder="E.g. Lab work..."
                                                    className="bg-surface border border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary-light w-full text-text-primary placeholder:text-gray-600 transition-all font-medium"
                                                    value={entry.notes}
                                                    onChange={(e) => handleEntryChange(subject.id, 'notes', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center bg-secondary/30 rounded-3xl border border-dashed border-gray-800">
                        <div className="bg-gray-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CalendarIcon className="w-12 h-12 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-text-secondary">No Classes Found</h3>
                        <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Try switching off smart filtering.</p>
                        <button
                            onClick={() => setShowAll(true)}
                            className="mt-6 px-6 py-2 bg-primary-dark/30 text-primary-light border border-primary-light/20 rounded-xl text-sm font-bold hover:bg-primary-light hover:text-white transition-all"
                        >
                            Show All Subjects
                        </button>
                    </div>
                )}

                <div className="pt-10">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || filteredSubjects.length === 0}
                        className={`group relative w-full py-6 rounded-3xl font-black text-2xl shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100 ${isCelebrating ? 'bg-success text-white scale-[1.02]' : 'bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span>Syncing...</span>
                            </div>
                        ) : isCelebrating ? (
                            <div className="flex items-center gap-3 animate-bounce">
                                <CheckCircle2 className="w-8 h-8" />
                                <span>Saved!</span>
                            </div>
                        ) : (
                            <>
                                <Save className="w-8 h-8 group-hover:scale-125 transition-transform" />
                                <span>Save Attendance</span>
                            </>
                        )}
                        <div className="absolute inset-0 rounded-3xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                    <p className="text-center text-[11px] text-gray-500 mt-5 uppercase tracking-[0.3em] font-black">
                        Cloud Database Status: <span className="text-success inline-flex items-center gap-1">Online <div className="w-1.5 h-1.5 bg-success rounded-full animate-ping"></div></span>
                    </p>
                </div>
            </div>
        </div>
    );
};