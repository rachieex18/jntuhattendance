-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  roll_number TEXT UNIQUE,
  semester INTEGER,
  branch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    subject_name TEXT NOT NULL,
    credits INTEGER DEFAULT 3,
    hours_per_week INTEGER DEFAULT 4,
    subject_type TEXT CHECK (subject_type IN ('theory', 'lab')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subject_name)
);

-- Attendance records (hour-based)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_attended DECIMAL NOT NULL,
  total_hours DECIMAL NOT NULL,
  is_midterm BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, user_id, date)
);

-- Timetable storage
CREATE TABLE timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  parsed_data JSONB,
  semester INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends system
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Privacy settings
CREATE TABLE privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  show_attendance_to_friends BOOLEAN DEFAULT TRUE,
  show_subject_details BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_subjects_user ON subjects(user_id);
CREATE INDEX idx_friendships_user ON friendships(user_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subjects: Users can manage their own subjects
CREATE POLICY "Users can manage own subjects" ON subjects FOR ALL USING (auth.uid() = user_id);

-- Attendance: Users can manage their own attendance
CREATE POLICY "Users can manage own attendance" ON attendance FOR ALL USING (auth.uid() = user_id);

-- Timetables: Users can manage their own timetables
CREATE POLICY "Users can manage own timetables" ON timetables FOR ALL USING (auth.uid() = user_id);

-- Friendships: Users can view their own friendships or search for others
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage own friendships" ON friendships FOR ALL USING (auth.uid() = user_id);

-- Privacy: Users can manage their own privacy settings
CREATE POLICY "Users can manage own privacy" ON privacy_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Friends can view each other's privacy settings" ON privacy_settings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM friendships 
    WHERE status = 'accepted' AND (
      (user_id = privacy_settings.user_id AND friend_id = auth.uid()) OR 
      (friend_id = privacy_settings.user_id AND user_id = auth.uid())
    )
  )
);

-- Attendance: Friends can view aggregate attendance if privacy allowed
CREATE POLICY "Friends can view attendance" ON attendance FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM friendships f
    JOIN privacy_settings p ON p.user_id = attendance.user_id
    WHERE f.status = 'accepted' 
    AND p.show_attendance_to_friends = TRUE
    AND (
      (f.user_id = attendance.user_id AND f.friend_id = auth.uid()) OR 
      (f.friend_id = attendance.user_id AND f.user_id = auth.uid())
    )
  )
);

-- Subjects: Friends can view subjects if privacy allowed
CREATE POLICY "Friends can view subjects" ON subjects FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM friendships f
    JOIN privacy_settings p ON p.user_id = subjects.user_id
    WHERE f.status = 'accepted' 
    AND p.show_subject_details = TRUE
    AND (
      (f.user_id = subjects.user_id AND f.friend_id = auth.uid()) OR 
      (f.friend_id = subjects.user_id AND f.user_id = auth.uid())
    )
  )
);
