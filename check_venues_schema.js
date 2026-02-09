const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'staff-planner.db');
const db = new Database(dbPath);
const info = db.prepare("PRAGMA table_info(venues)").all();
console.log('Venues Schema:', info);
db.close();
