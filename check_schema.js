const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'staff-planner.db');
const db = new Database(dbPath);
const info = db.prepare("PRAGMA table_info(events)").all();
console.log('Events Schema:', info);
db.close();
