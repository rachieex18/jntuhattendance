#!/bin/bash
echo "🗄️  JNTU Attendance Database Viewer"
echo "=================================="
echo ""

# Navigate to server directory
cd server

echo "📊 Database Tables:"
sqlite3 attendance.db ".tables"
echo ""

echo "👤 Users Table:"
sqlite3 attendance.db "SELECT id, email, full_name, roll_number, verified, created_at FROM users;"
echo ""

echo "📚 Subjects Table:"
sqlite3 attendance.db "SELECT * FROM subjects;"
echo ""

echo "📝 Attendance Records:"
sqlite3 attendance.db "SELECT * FROM attendance;"
echo ""

echo "📈 Database Statistics:"
echo "Users: $(sqlite3 attendance.db 'SELECT COUNT(*) FROM users;')"
echo "Subjects: $(sqlite3 attendance.db 'SELECT COUNT(*) FROM subjects;')"
echo "Attendance Records: $(sqlite3 attendance.db 'SELECT COUNT(*) FROM attendance;')"
echo ""

echo "💡 To explore interactively, run:"
echo "   cd server && sqlite3 attendance.db"
echo ""
echo "📋 Useful SQLite commands:"
echo "   .tables          - Show all tables"
echo "   .schema          - Show table structures"
echo "   .quit            - Exit SQLite"