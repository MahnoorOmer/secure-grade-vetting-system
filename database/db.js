const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

let dbInstance = null;

async function initDb() {
  const dbFile = path.join(__dirname, 'secure_grade.sqlite');
  const dbExists = fs.existsSync(dbFile);

  dbInstance = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  if (!dbExists) {
    console.log(chalk.yellow("⚠️  SQLite database not found. Initializing new database..."));
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await dbInstance.exec(schemaSql);
    console.log(chalk.green("✅ SQLite database initialized and seeded."));
  } else {
    console.log(chalk.cyan("🗄️  SQLite connected to secure_grade.sqlite"));
  }

  // Wrapper to simulate pg's query(sql, params) behavior
  dbInstance.query = async (sql, params = []) => {
    // Replace Postgres parameter placeholders $1, $2, etc., with ?
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    
    // Determine if it's a SELECT (all) or INSERT/UPDATE/DELETE (run)
    const isSelect = sqliteSql.trim().toUpperCase().startsWith("SELECT") || 
                     sqliteSql.trim().toUpperCase().startsWith("WITH");
    
    // Handle RETURNING clause which sqlite supports but requires `all` or `get` to fetch results
    const hasReturning = sqliteSql.trim().toUpperCase().includes("RETURNING");

    if (isSelect || hasReturning) {
        const rows = await dbInstance.all(sqliteSql, params);
        return { rows, rowCount: rows.length };
    } else {
        const result = await dbInstance.run(sqliteSql, params);
        return { rows: [], rowCount: result.changes, lastID: result.lastID };
    }
  };

  return dbInstance;
}

// Immediately invoked setup
const poolPromise = initDb();

// Export a proxy that awaits connection on first query
module.exports = {
  query: async (sql, params) => {
    const db = await poolPromise;
    return db.query(sql, params);
  }
};
