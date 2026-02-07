import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'staff-planner.db');

let db: any;

try {
    db = new Database(dbPath, { verbose: console.log });
} catch (error) {
    console.error("Failed to connect to database:", error);
    throw error;
}

export default db;
