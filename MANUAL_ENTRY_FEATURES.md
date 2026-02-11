# Manual Subject Entry & Flexible Hour Selection

## Overview
The timetable management system now supports **manual subject entry** in addition to OCR scanning, and provides **flexible hour selection** when marking attendance.

## New Features

### 1. Manual Subject Entry (Timetable Uploader)

Users now have **two ways** to add subjects:

#### Option A: Scan Timetable (AI-Powered)
- Upload a timetable image
- Gemini AI automatically extracts subjects
- Review and edit the detected subjects
- Save to your profile

#### Option B: Add Manually
- Click "Add Manually" button
- Enter subjects one by one
- Fill in subject name, type (theory/lab), and hours per week
- Add multiple subjects with the "+ Add Subject" button
- Save when complete

### Key Improvements:
- **Dual-mode interface**: Choose between OCR scanning or manual entry
- **Better UX**: Clear visual separation between the two options
- **Validation**: System checks that all subject names are filled before saving
- **Flexible editing**: Add, edit, or remove subjects at any time
- **Cancel option**: Discard changes and start over

---

### 2. Flexible Hour Selection (Attendance Marking)

When marking attendance, users can now select **specific durations** for each class session:

#### For Theory Classes:
- **0h** (Bunked)
- **1h** (Standard lecture)
- **1.5h** (Extended lecture)
- **2h** (Double period)

#### For Lab Classes:
- **0h** (Bunked)
- **2h** (Short lab session)
- **2.5h** (Standard lab)
- **3h** (Full lab session)

### How It Works:
1. Mark a subject as "Attended" by clicking the checkbox
2. Select the duration from the dropdown menu
3. Optionally mark as midterm and add notes
4. Save attendance records

---

## User Interface Updates

### Timetable Uploader
```
┌─────────────────────────────────────────────┐
│  Manage Subjects                            │
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Scan         │  │ Add          │        │
│  │ Timetable    │  │ Manually     │        │
│  │              │  │              │        │
│  │ [Upload]     │  │ [BookOpen]   │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

When editing subjects:
```
┌─────────────────────────────────────────────────────────┐
│  Your Subjects              [+ Add Subject]             │
├─────────────────────────────────────────────────────────┤
│  Subject Name    │ Type    │ Hours/Week │ Action       │
├─────────────────────────────────────────────────────────┤
│  [Input field]   │ Theory  │ 4          │ Remove       │
│  [Input field]   │ Lab     │ 3          │ Remove       │
└─────────────────────────────────────────────────────────┘
│  [Cancel]  [Save X Subjects]                            │
└─────────────────────────────────────────────────────────┘
```

### Attendance Entry
```
┌─────────────────────────────────────────────────────────┐
│  ☑ Data Structures                                      │
│     THEORY                                              │
│                                                         │
│     Duration: [1.5h ▼]  Midterm: [Toggle]             │
│     Notes: [Optional text field]                       │
└─────────────────────────────────────────────────────────┘
```

---

## Benefits

### For Students:
- **No timetable image?** No problem - add subjects manually
- **Accurate tracking**: Select exact hours attended for each session
- **Flexibility**: Different lab/theory durations supported
- **Quick entry**: Pre-filled defaults speed up the process

### For Accuracy:
- **Real-world scenarios**: Not all labs are 3 hours, not all lectures are 1 hour
- **Better calculations**: Attendance percentage based on actual hours
- **Bunking tracking**: Mark attended but 0 hours for accurate records

---

## Usage Examples

### Example 1: Adding Subjects Manually
1. Navigate to "Manage Subjects"
2. Click "Add Manually"
3. Fill in the first subject:
   - Name: "Data Structures"
   - Type: Theory
   - Hours/Week: 4
4. Click "+ Add Subject" to add more
5. Click "Save X Subjects"

### Example 2: Marking Attendance with Custom Hours
1. Go to "Mark Attendance"
2. Select today's date
3. Check "Web Development Lab"
4. Select duration: "2.5h" (lab ran shorter today)
5. Add note: "Finished early"
6. Click "Update Attendance Records"

### Example 3: Mixed Workflow
1. Upload timetable image (OCR extracts 5 subjects)
2. Review detected subjects
3. Click "+ Add Subject" to add a missing elective
4. Edit hours for subjects that were detected incorrectly
5. Save all subjects together

---

## Technical Details

### Subject Entry Interface
- **State management**: `showManualEntry` flag controls UI mode
- **Validation**: Prevents saving empty subject names
- **Reset functionality**: Cancel button clears all state
- **Dynamic UI**: Shows appropriate prompts based on entry method

### Hour Selection
- **Type-aware**: Different options for theory vs lab
- **Pre-configured options**: Limited to realistic durations
- **Default values**: Auto-selects common durations when toggling attendance

### Data Structure
```typescript
interface SubjectEntry {
    name: string;
    type: 'theory' | 'lab';
    hours: number;  // Hours per week
}

interface AttendanceEntryRecord {
    visited: boolean;
    hours: number;  // Hours for this specific session
    notes: string;
    is_midterm: boolean;
}
```

---

## Future Enhancements

Potential improvements:
- Save subject templates for reuse across semesters
- Import/export subject lists
- Bulk edit operations
- Custom hour options for special cases
- Integration with calendar for automatic session duration suggestions
- Analytics showing most common session durations

---

## Tips for Best Results

1. **Be consistent**: Use the same subject names across all entries
2. **Accurate hours**: Select the actual duration attended, not scheduled
3. **Use notes**: Document reasons for bunking or unusual durations
4. **Regular updates**: Mark attendance daily for best accuracy
5. **Review subjects**: Periodically check that hours/week matches your actual schedule
