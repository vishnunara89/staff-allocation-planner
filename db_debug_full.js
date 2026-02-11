const Database = require('better-sqlite3');
const db = new Database('staff-planner.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log(`\nTable: ${table.name}`);
    console.log(JSON.stringify(columns, null, 2));
}

const fks = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
for (const table of fks) {
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
    if (foreignKeys.length > 0) {
        console.log(`\nForeign Keys for ${table.name}:`);
        console.log(JSON.stringify(foreignKeys, null, 2));
    }
}
