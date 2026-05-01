const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path to store logs persistently
const logFilePath = path.join(__dirname, '../data/audit_logs.json');

// Ensure the data directory exists
const dataDir = path.dirname(logFilePath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Loads logs from the JSON file or returns an empty array if file doesn't exist
 */
function getLogs() {
    try {
        if (fs.existsSync(logFilePath)) {
            const data = fs.readFileSync(logFilePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error reading audit logs:", error);
    }
    return [];
}

/**
 * Adds a tamper-evident log entry using SHA-256 Hashing
 */
function addLog(action, user, details = {}) {
    const logs = getLogs();
    
    // 1. Get the hash of the previous entry to "link" the chain
    // If it's the first log, we use a "genesis" string
    const previousHash = logs.length > 0 ? logs[logs.length - 1].hash : "GENESIS_BLOCK";

    const timestamp = new Date().toISOString();

    // 2. Create a unique string representing this log's data
    // We include the previousHash to ensure the order cannot be changed
    const dataToHash = JSON.stringify({
        action,
        user,
        details,
        timestamp,
        previousHash
    });

    // 3. Generate SHA-256 Hash
    const currentHash = crypto
        .createHash('sha256')
        .update(dataToHash)
        .digest('hex');

    // 4. Create the new log entry
    const newEntry = {
        id: Date.now(),
        action,
        user,
        details,
        time: timestamp,
        previousHash,
        hash: currentHash
    };

    logs.push(newEntry);

    // 5. Persist the log chain to the data folder
    try {
        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to audit logs:", error);
    }
}

module.exports = { addLog, getLogs };