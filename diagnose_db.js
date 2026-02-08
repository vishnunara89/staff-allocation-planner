const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('staff-planner.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
let output = '';

for (const table of tables) {
    output += `\nTable: ${table.name}\n`;
    const info = db.prepare(`PRAGMA table_info(${table.name})`).all();
    output += JSON.stringify(info, null, 2) + '\n';
}

fs.writeFileSync('db_diagnostics.txt', output);
db.close();
console.log('Diagnostics written to db_diagnostics.txt');
