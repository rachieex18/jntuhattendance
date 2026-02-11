const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/attendance.db');

console.log('🗄️  JNTU Attendance Database Dashboard');
console.log('=====================================\n');

// Get users
db.all("SELECT id, email, full_name, roll_number, verified, created_at FROM users", (err, users) => {
    if (err) {
        console.error('Error fetching users:', err);
        return;
    }
    
    console.log('👤 USERS:');
    console.table(users);
    
    // Get subjects
    db.all("SELECT * FROM subjects", (err, subjects) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            return;
        }
        
        console.log('\n📚 SUBJECTS:');
        if (subjects.length > 0) {
            console.table(subjects);
        } else {
            console.log('   No subjects found. Add subjects via the app!');
        }
        
        // Get attendance
        db.all("SELECT * FROM attendance", (err, attendance) => {
            if (err) {
                console.error('Error fetching attendance:', err);
                return;
            }
            
            console.log('\n📝 ATTENDANCE:');
            if (attendance.length > 0) {
                console.table(attendance);
            } else {
                console.log('   No attendance records found. Start tracking attendance!');
            }
            
            // Statistics
            db.get("SELECT COUNT(*) as users FROM users", (err, userCount) => {
                db.get("SELECT COUNT(*) as subjects FROM subjects", (err, subjectCount) => {
                    db.get("SELECT COUNT(*) as attendance FROM attendance", (err, attendanceCount) => {
                        console.log('\n📈 STATISTICS:');
                        console.log(`   Users: ${userCount.users}`);
                        console.log(`   Subjects: ${subjectCount.subjects}`);
                        console.log(`   Attendance Records: ${attendanceCount.attendance}`);
                        
                        db.close();
                    });
                });
            });
        });
    });
});