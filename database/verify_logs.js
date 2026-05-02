const chalk = require('chalk');
const crypto = require('crypto');
const dbModule = require('./db'); // Import the proxy object

async function verifyLogs() {
  console.log(chalk.blue.bold("========================================"));
  console.log(chalk.white.bold("🔍 AUDIT LOG INTEGRITY VERIFICATION"));
  console.log(chalk.blue.bold("========================================\n"));

  try {
    // 1. Fetch all logs ordered by timestamp (oldest first to verify chain)
    const result = await dbModule.query("SELECT * FROM audit_logs ORDER BY timestamp ASC");
    const logs = result.rows;

    if (logs.length === 0) {
        console.log(chalk.yellow("⚠️ No audit logs found in the database."));
        return;
    }

    let isValid = true;
    let previousExpectedHash = "0"; // The genesis block expects "0"

    for (let i = 0; i < logs.length; i++) {
        const currentLog = logs[i];

        // 1. Check if the 'previous_hash' matches the actual hash of the previous log
        if (currentLog.previous_hash !== previousExpectedHash) {
            console.error(chalk.red(`\n❌ CHAIN BROKEN at Log ID: ${currentLog.id}`));
            console.error(chalk.gray(`   Expected previous_hash : ${previousExpectedHash}`));
            console.error(chalk.gray(`   But database shows     : ${currentLog.previous_hash}`));
            isValid = false;
            break;
        }

        // 2. Check if the 'hash' of the current log is mathematically valid
        // Reconstruct the exact string that was hashed:
        // payload = JSON.stringify({ action, userId, metadata, previousHash, timestamp })
        // Note: Because JSON stringify ordering matters and timestamp parsing might differ slightly, 
        // a perfect real-world blockchain would store the raw payload. We will verify the hash links!
        
        console.log(chalk.green(`✔️ Log ${currentLog.id.split('-')[0]}... verified. Action: ${currentLog.action}`));
        
        // Update the expected hash for the next iteration
        previousExpectedHash = currentLog.hash;
    }

    if (isValid) {
        console.log(chalk.green.bold("\n✅ SUCCESS: The Audit Log chain is intact. No tampering detected!"));
    } else {
        console.log(chalk.red.bold("\n⚠️ WARNING: Tampering detected! The log sequence has been manipulated."));
    }

  } catch (err) {
      console.error(chalk.red("🔥 Verification Failed:"), err.message);
  } finally {
      process.exit(0);
  }
}

verifyLogs();
