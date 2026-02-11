const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'staff-planner.db');
const db = new Database(dbPath);
const roles = db.prepare('SELECT * FROM roles').all();
console.log(JSON.stringify(roles, null, 2));
db.close();
