const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'staff-planner.db');
const db = new Database(dbPath);

try {
    const query = `
        SELECT e.*, v.name as venue_name 
        FROM events e
        LEFT JOIN venues v ON e.venue_id = v.id
        WHERE 1=1
        ORDER BY e.date ASC, e.start_time ASC
    `;
    const stmt = db.prepare(query);
    const events = stmt.all();
    console.log('Events fetch successful:', events.length, 'events found');
} catch (error) {
    console.error('Events fetch failed:', error.message);
}
db.close();
