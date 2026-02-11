-- ============================================
-- JNTU ATTENDANCE TRACKER - SUPABASE SCHEMA
-- ============================================

-- Users table (for custom authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    roll_number TEXT UNIQUE,
    semester INTEGER,
    branch TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    credits INTEGER DEFAULT 3,
    hours_per_week INTEGER DEFAULT 4,
    subject_type TEXT CHECK (subject_type IN ('theory', 'lab')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subject_name)
);

-- Attendance records
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours_attended DECIMAL NOT NULL,
    total_hours DECIMAL NOT NULL,
    is_midterm BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roll_number ON users(roll_number);
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_subject_id ON attendance(subject_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- Enable Row Level Security (optional - can be disabled for custom auth)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;