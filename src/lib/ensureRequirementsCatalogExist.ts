import type { Database } from "better-sqlite3";

export function ensureRequirementsCatalogExist(db: Database) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS requirements_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL
    )
  `).run();

    // Seed defaults if empty
    const count = (db.prepare("SELECT COUNT(*) as c FROM requirements_catalog").get() as any)?.c ?? 0;
    if (count === 0) {
        const insert = db.prepare("INSERT INTO requirements_catalog (type, value) VALUES (?, ?)");
        const defaults = [
            ["language", "Arabic"],
            ["language", "French"],
            ["language", "Russian"],
            ["skill", "Wine Service"],
            ["skill", "Silver Service"],
            ["skill", "Cocktail Making"],
        ];
        const seed = db.transaction((items: string[][]) => {
            for (const item of items) insert.run(item[0], item[1]);
        });
        seed(defaults);
    }

    console.log("✅ requirements_catalog table verified");
}
