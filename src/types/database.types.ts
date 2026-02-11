export type Profile = {
    id: string;
    full_name: string;
    roll_number: string | null;
    semester: number | null;
    branch: string | null;
    created_at: string;
    updated_at: string;
};

export type Subject = {
    id: string;
    user_id: string;
    subject_name: string;
    subject_code: string | null;
    credits: number;
    hours_per_week: number;
    subject_type: 'theory' | 'lab';
    created_at: string;
};

export type Attendance = {
    id: string;
    subject_id: string;
    user_id: string;
    date: string;
    hours_attended: number;
    total_hours: number;
    is_midterm: boolean;
    notes: string | null;
    created_at: string;
};

export type Timetable = {
    id: string;
    user_id: string;
    image_url: string | null;
    parsed_data: any;
    semester: number | null;
    created_at: string;
};

export type Friendship = {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
};

export type PrivacySettings = {
    user_id: string;
    show_attendance_to_friends: boolean;
    show_subject_details: boolean;
    updated_at: string;
};
