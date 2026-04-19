const logs = [];

function addLog(action, user, details = {}) {
  logs.push({
    id: Date.now(),
    action,
    user,
    details,
    time: new Date().toISOString()
  });
}

function getLogs() {
  return logs;
}

module.exports = { addLog, getLogs };