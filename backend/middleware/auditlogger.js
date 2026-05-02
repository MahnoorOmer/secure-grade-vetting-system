const crypto = require("crypto");
const chalk  = require("chalk");

let pool;
const getPool = () => { if (!pool) pool = require("../../database/db"); return pool; };

const addLog = async (userEmail, action, metadata = {}, userId = null) => {
  try {
    const db = getPool();
    const lastRow = await db.query("SELECT hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1");
    const previousHash = lastRow.rows.length > 0 ? lastRow.rows[0].hash : "0";
    const payload = JSON.stringify({ action, userId, metadata, previousHash, timestamp: new Date().toISOString() });
    const hash = crypto.createHash("sha256").update(payload).digest("hex");
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO audit_logs (id, action, user_id, hash, previous_hash, metadata) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, action, userId || null, hash, previousHash, JSON.stringify(metadata)]
    );
    console.log(chalk.gray(`  📋 LOG [${action}] by ${userEmail}`));
  } catch (err) {
    console.error(chalk.red("⚠️  Audit log failed:"), err.message);
  }
};

const getLogs = async () => {
  const db = getPool();
  const result = await db.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200");
  return result.rows;
};

module.exports = { addLog, getLogs };