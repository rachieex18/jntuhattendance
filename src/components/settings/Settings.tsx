import React from 'react';
import { Settings as SettingsIcon, User, Shield } from 'lucide-react';

export const Settings = () => {
    return (
        <div className="bg-surface p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-2xl font-bold text-primary-light mb-6 flex items-center gap-2">
                <SettingsIcon className="w-6 h-6" />
                Settings & Profile
            </h2>
            
            <div className="space-y-6">
                <div className="bg-secondary p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Demo Profile
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-text-secondary">Name:</span> <span className="text-text-primary">Demo Student</span></p>
                        <p><span className="text-text-secondary">Roll Number:</span> <span className="text-text-primary">DEMO123</span></p>
                        <p><span className="text-text-secondary">Semester:</span> <span className="text-text-primary">6</span></p>
                        <p><span className="text-text-secondary">Branch:</span> <span className="text-text-primary">Computer Science</span></p>
                    </div>
                </div>

                <div className="bg-secondary p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Privacy Settings
                    </h3>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between">
                            <span className="text-text-secondary">Show attendance to friends</span>
                            <input type="checkbox" className="rounded" defaultChecked disabled />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-text-secondary">Show subject details</span>
                            <input type="checkbox" className="rounded" disabled />
                        </label>
                    </div>
                </div>

                <div className="text-center py-4">
                    <p className="text-text-secondary text-sm">
                        Settings are disabled in demo mode
                    </p>
                </div>
            </div>
        </div>
    );
};