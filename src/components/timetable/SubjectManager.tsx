import React, { useState } from 'react';
import { BookOpen, Trash2, Loader2 } from 'lucide-react';
import { useAttendance } from '../../hooks/useAttendance';
import { toast } from 'sonner';

export const SubjectManager = () => {
    const { subjects, deleteSubject, loading } = useAttendance();
    const [deletingId, setDeletingId] = useState<string | number | null>(null);

    const handleDeleteExisting = async (id: string | number, name: string) => {
        console.log(`Attempting to delete subject: ${name} (ID: ${id})`);
        if (!confirm(`Are you sure you want to remove "${name}"? This will also delete its attendance history.`)) return;

        setDeletingId(id);
        const result = await deleteSubject(id);
        if (result.success) {
            toast.success("Subject removed successfully");
        } else {
            toast.error("Failed to remove subject");
        }
        setDeletingId(null);
    };

    return (
        <div className="bg-surface p-8 rounded-3xl border border-gray-800 shadow-2xl animate-fadeIn relative overflow-hidden max-w-6xl mx-auto">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <BookOpen className="w-32 h-32" />
            </div>

            <div className="mb-8">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-xl">
                        <BookOpen className="w-8 h-8 text-primary-light" />
                    </div>
                    My Active Subjects
                </h2>
                <p className="text-text-secondary mt-2 font-medium">View and manage the subjects you've already added to your profile.</p>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-secondary">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-light" />
                    <p className="font-bold animate-pulse">Fetching your data...</p>
                </div>
            ) : subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(sub => (
                        <div key={sub.id} className="bg-secondary/40 border border-gray-800 p-5 rounded-2xl hover:border-gray-600 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${sub.subject_type === 'lab' ? 'bg-indigo-900/40 text-indigo-300' : 'bg-amber-900/40 text-amber-300'
                                    }`}>
                                    {sub.subject_type}
                                </span>
                                <button
                                    onClick={() => handleDeleteExisting(sub.id, sub.subject_name)}
                                    disabled={deletingId === sub.id}
                                    className="text-gray-600 hover:text-danger p-2 hover:bg-danger/10 rounded-xl transition-all"
                                >
                                    {deletingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                            <h3 className="font-bold text-white text-lg leading-tight mb-2">{sub.subject_name}</h3>
                            <div className="flex items-center gap-4 text-xs text-text-secondary font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                                    {sub.hours_per_week} Hours/Week
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-16 text-center bg-secondary/20 rounded-3xl border border-dashed border-gray-800">
                    <div className="bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-text-secondary">No subjects found</h3>
                    <p className="text-gray-500 text-sm mt-1">Add some subjects to get started tracking your attendance.</p>
                </div>
            )}
        </div>
    );
};
