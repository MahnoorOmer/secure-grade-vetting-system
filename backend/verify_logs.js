const { getLogs } = require('./middleware/auditlogger');
const crypto = require('crypto');

const logs = getLogs();
let isValid = true;

for (let i = 1; i < logs.length; i++) {
    const prevLog = logs[i-1];
    const currentLog = logs[i];

    // Check if the link is broken
    if (currentLog.previousHash !== prevLog.hash) {
        console.error(`❌ TAMPERING DETECTED at Log ID: ${currentLog.id}`);
        console.error(`Expected previous hash: ${prevLog.hash}`);
        console.error(`But found: ${currentLog.previousHash}`);
        isValid = false;
        break;
    }
}

if (isValid) console.log("✅ Audit Log Integrity Verified: No tampering detected.");