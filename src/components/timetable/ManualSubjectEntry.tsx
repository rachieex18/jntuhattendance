import React, { useState } from 'react';
import { PlusCircle, Save, BookOpen, Trash2, Loader2, LayoutGrid } from 'lucide-react';
import { useAttendance } from '../../hooks/useAttendance';
import { toast } from 'sonner';

interface SubjectEntry {
    name: string;
    type: 'theory' | 'lab' | string;
    hours: number;
}

const SECTION_PRESETS: Record<string, SubjectEntry[]> = {
    'L1': [
        { name: 'English Language and Communication Skills Lab (ELCSL-L1)', type: 'lab', hours: 2 },
        { name: 'Engineering Workshop (EW-L1)', type: 'lab', hours: 2 },
        { name: 'English for Skill Enhancement (ESE)', type: 'theory', hours: 3 },
        { name: 'Ordinary Differential Equations and Vector Calculus (ODEVC)', type: 'theory', hours: 3 },
        { name: 'Python Programming Lab (PPL)', type: 'lab', hours: 3 },
        { name: 'Applied Physics Lab (APL-L1)', type: 'lab', hours: 2 },
        { name: 'Applied Physics (AP)', type: 'theory', hours: 3 },
        { name: 'Data Structures Lab (DSL-L1)', type: 'lab', hours: 2 },
        { name: 'Engineering Graphics and Computer Aided Drafting (Theory)', type: 'theory', hours: 2 },
        { name: 'Data Structures (DS)', type: 'theory', hours: 3 },
        { name: 'Engineering Graphics and Computer Aided Drafting (EGCAD)', type: 'lab', hours: 2 }
    ],
    'L2': [
        { name: 'Engineering Workshop (EW-L2)', type: 'lab', hours: 2 },
        { name: 'English Language and Communication Skills Lab (ELCSL-L2)', type: 'lab', hours: 2 },
        { name: 'English for Skill Enhancement (ESE)', type: 'theory', hours: 3 },
        { name: 'Ordinary Differential Equations and Vector Calculus (ODEVC)', type: 'theory', hours: 3 },
        { name: 'Python Programming Lab (PPL)', type: 'lab', hours: 3 },
        { name: 'Data Structures Lab (DSL-L2)', type: 'lab', hours: 2 },
        { name: 'Applied Physics (AP)', type: 'theory', hours: 3 },
        { name: 'Applied Physics Lab (APL-L2)', type: 'lab', hours: 2 },
        { name: 'Engineering Graphics and Computer Aided Drafting (Theory)', type: 'theory', hours: 2 },
        { name: 'Data Structures (DS)', type: 'theory', hours: 3 },
        { name: 'Engineering Graphics and Computer Aided Drafting (EGCAD)', type: 'lab', hours: 2 },
        { name: 'German Class', type: 'theory', hours: 2 }
    ],
    'K1': [
        { name: 'Engineering Physics Lab (EPL-K1)', type: 'lab', hours: 1.5 },
        { name: 'Python Programming Lab - Theory (PPL-T)', type: 'theory', hours: 1 },
        { name: 'Python Programming Lab (PPL)', type: 'lab', hours: 2 },
        { name: 'Engineering Graphics and Computer Aided Drafting (EGCAD-Theory)', type: 'theory', hours: 2 },
        { name: 'Engineering Graphics and Computer Aided Drafting (EGCAD-Lab)', type: 'lab', hours: 2 },
        { name: 'Ordinary Differential Equations and Vector Calculus (ODEVC)', type: 'theory', hours: 3 },
        { name: 'Applied Physics (AP)', type: 'theory', hours: 3 },
        { name: 'Data Structures (DS)', type: 'theory', hours: 3 },
        { name: 'English Language and Communication Skills Lab (ELCSL-K1)', type: 'lab', hours: 2 },
        { name: 'English for Skill Enhancement (ESE)', type: 'theory', hours: 3 },
        { name: 'Engineering Workshop (EW-K1)', type: 'lab', hours: 2 }
    ],
    'K2': [
        { name: 'Data Structures Lab (DSL-K2)', type: 'lab', hours: 6 },
        { name: 'Python Programming Lab - Theory (PPL-T)', type: 'theory', hours: 1 },
        { name: 'Python Programming Lab (PPL)', type: 'lab', hours: 2 },
        { name: 'Engineering Graphics and Computer Aided Drafting (EGCAD-Theory)', type: 'theory', hours: 2 },
        { name: 'Engineering Graphics and Computer Aided Drafting (EGCAD-Lab)', type: 'lab', hours: 2 },
        { name: 'Ordinary Differential Equations and Vector Calculus (ODEVC)', type: 'theory', hours: 3 },
        { name: 'Applied Physics (AP)', type: 'theory', hours: 3 },
        { name: 'Data Structures (DS)', type: 'theory', hours: 3 },
        { name: 'Engineering Workshop (EW-K2)', type: 'lab', hours: 2 },
        { name: 'English for Skill Enhancement (ESE)', type: 'theory', hours: 3 },
        { name: 'English Language and Communication Skills Lab (ELCSL-K2)', type: 'lab', hours: 2 }
    ],
    'G1': [
        { name: 'Applied Physics (AP)', type: 'theory', hours: 3 },
        { name: 'English for Skill Enhancement (ESE)', type: 'theory', hours: 3 },
        { name: 'Ordinary Differential Equations and Vector Calculus (ODEVC)', type: 'theory', hours: 3 },
        { name: 'Data Structures (DS)', type: 'theory', hours: 3 },
        { name: 'Engineering Workshop Lab (EW-Lab)', type: 'lab', hours: 2 },
        { name: 'Engineering Graphics (Theory)', type: 'theory', hours: 2 },
        { name: 'Engineering Graphics (Practical)', type: 'lab', hours: 2 },
        { name: 'English Language Lab (ELL)', type: 'lab', hours: 2 },
        { name: 'Applied Physics Lab (APL)', type: 'lab', hours: 2 },
        { name: 'Data Structures Lab (DSL)', type: 'lab', hours: 2 },
        { name: 'Python Programming Lab - Theory (PPL-T)', type: 'theory', hours: 1 },
        { name: 'Python Programming Lab (Practical)', type: 'lab', hours: 2 }
    ],
    'G2': [
        { name: 'Applied Physics (AP)', type: 'theory', hours: 3 },
        { name: 'English for Skill Enhancement (ESE)', type: 'theory', hours: 3 },
        { name: 'Ordinary Differential Equations and Vector Calculus (ODEVC)', type: 'theory', hours: 3 },
        { name: 'Data Structures (DS)', type: 'theory', hours: 3 },
        { name: 'English Language Lab (ELL)', type: 'lab', hours: 2 },
        { name: 'Engineering Graphics (Theory)', type: 'theory', hours: 2 },
        { name: 'Engineering Graphics (Practical)', type: 'lab', hours: 2 },
        { name: 'Engineering Workshop Lab (EW-Lab)', type: 'lab', hours: 2 },
        { name: 'Data Structures Lab (DSL)', type: 'lab', hours: 2 },
        { name: 'Applied Physics Lab (APL)', type: 'lab', hours: 2 },
        { name: 'Python Programming Lab - Theory (PPL-T)', type: 'theory', hours: 1 },
        { name: 'Python Programming Lab (Practical)', type: 'lab', hours: 2 }
    ]
};

export const ManualSubjectEntry = () => {
    const { addSubject, refresh } = useAttendance();
    const [subjects, setSubjects] = useState<SubjectEntry[]>([
        { name: '', type: 'theory', hours: 4 }
    ]);
    const [saving, setSaving] = useState(false);
    const [selectedSection, setSelectedSection] = useState<string>('');

    const handleSectionSelect = (section: string) => {
        setSelectedSection(section);
        if (section && SECTION_PRESETS[section]) {
            setSubjects([...SECTION_PRESETS[section]]);
            toast.success(`Loaded subjects for Section ${section}`);
        }
    };

    const handleSubjectChange = (index: number, field: keyof SubjectEntry, value: string | number) => {
        const newSubjects = [...subjects];
        (newSubjects[index] as any)[field] = value;
        setSubjects(newSubjects);
    };

    const handleRemoveSubject = (index: number) => {
        const newSubjects = subjects.filter((_, i) => i !== index);
        setSubjects(newSubjects);
    };

    const handleAddSubject = () => {
        setSubjects([...subjects, { name: '', type: 'theory', hours: 4 }]);
    };

    const handleSave = async () => {
        const invalidSubjects = subjects.filter(s => !s.name.trim());
        if (invalidSubjects.length > 0) {
            toast.error("Please fill in all subject names");
            return;
        }

        if (subjects.length === 0) {
            toast.error("Please add at least one subject");
            return;
        }

        setSaving(true);
        let successCount = 0;

        try {
            for (const subject of subjects) {
                const result = await addSubject({
                    subjectName: subject.name,
                    subjectType: subject.type as any,
                    hoursPerWeek: subject.hours,
                    credits: subject.type === 'lab' ? 2 : 3
                });

                if (result.success) successCount++;
            }

            if (successCount > 0) {
                toast.success(`Successfully saved ${successCount} subjects!`);
                await refresh();
                setSubjects([{ name: '', type: 'theory', hours: 4 }]);
                setSelectedSection('');
            }
        } catch (err) {
            toast.error("Failed to save subjects.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface p-8 rounded-3xl border border-gray-800 shadow-2xl animate-fadeIn max-w-6xl mx-auto">
            <div className="mb-10">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <div className="p-2 bg-success/20 rounded-xl">
                        <PlusCircle className="w-8 h-8 text-success" />
                    </div>
                    Add New Subjects
                </h2>
                <p className="text-text-secondary mt-2 font-medium">Expand your timetable or fix missing entries.</p>
            </div>

            <div className="space-y-8">
                <div className="bg-secondary/30 p-8 rounded-3xl border border-primary-light/10">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-primary-dark/40 rounded-2xl border border-primary-light/20 shadow-inner">
                                <LayoutGrid className="w-8 h-8 text-primary-light" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Preset Sections</h3>
                                <p className="text-sm text-text-secondary font-medium">Quick-load subjects from your specific section.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full xl:w-auto">
                            {['L1', 'L2', 'K1', 'K2', 'G1', 'G2'].map(section => (
                                <button
                                    key={section}
                                    onClick={() => handleSectionSelect(section)}
                                    className={`px-5 py-4 rounded-2xl font-black transition-all border text-sm uppercase tracking-tighter ${selectedSection === section
                                        ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-105'
                                        : 'bg-secondary border-gray-800 text-text-secondary hover:border-primary-light/50 hover:text-white'
                                        }`}
                                >
                                    {section}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center px-4">
                    <h3 className="font-black text-white text-xl uppercase tracking-widest">Entry Table</h3>
                    <button
                        onClick={handleAddSubject}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-black transition-all border border-gray-700 hover:border-gray-500 shadow-lg text-sm"
                    >
                        <PlusCircle className="w-5 h-5 text-primary-light" />
                        Add Row
                    </button>
                </div>

                <div className="bg-secondary/40 rounded-3xl overflow-hidden border border-gray-800 shadow-inner">
                    <table className="w-full text-left">
                        <thead className="bg-secondary/80 text-gray-400 uppercase text-[10px] font-black tracking-[0.2em]">
                            <tr>
                                <th className="p-5 pl-8">Subject Name</th>
                                <th className="p-5">Type</th>
                                <th className="p-5">Hrs/Week</th>
                                <th className="p-5 text-right pr-8">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {subjects.map((subject, idx) => (
                                <tr key={idx} className="group hover:bg-primary-dark/10 transition-colors">
                                    <td className="p-4 pl-8">
                                        <input
                                            type="text"
                                            value={subject.name}
                                            placeholder="e.g. Data Structures"
                                            onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)}
                                            className="bg-surface/50 border border-gray-700 hover:border-gray-500 focus:border-primary-light rounded-2xl px-5 py-3 w-full outline-none transition-all text-text-primary font-bold placeholder:text-gray-700 placeholder:italic"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={subject.type}
                                            onChange={(e) => handleSubjectChange(idx, 'type', e.target.value)}
                                            className="bg-surface/50 border border-gray-700 rounded-2xl px-5 py-3 outline-none text-text-primary font-bold hover:border-gray-500 focus:border-primary-light transition-all cursor-pointer w-full appearance-none"
                                        >
                                            <option value="theory">Theory</option>
                                            <option value="lab">Lab</option>
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                min="0.5"
                                                max="20"
                                                step="0.5"
                                                value={subject.hours}
                                                onChange={(e) => handleSubjectChange(idx, 'hours', Number(e.target.value))}
                                                className="bg-surface/50 border border-gray-700 hover:border-gray-500 focus:border-primary-light rounded-2xl px-5 py-3 w-28 outline-none transition-all text-text-primary font-black text-center"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-8">
                                        <button
                                            onClick={() => handleRemoveSubject(idx)}
                                            className="p-3 text-gray-600 hover:text-danger hover:bg-danger/10 rounded-2xl transition-all"
                                            title="Remove Row"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || subjects.length === 0}
                    className="group relative w-full py-6 bg-gradient-to-r from-success to-emerald-600 hover:from-emerald-500 hover:to-success text-white rounded-3xl font-black text-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-30 disabled:grayscale shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-[0.98]"
                >
                    {saving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Save className="w-8 h-8 group-hover:scale-125 transition-transform" />}
                    <span>{saving ? 'Saving Data...' : `Commit ${subjects.length} New Subjects`}</span>
                    <div className="absolute inset-0 rounded-3xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
            </div>
        </div>
    );
};
