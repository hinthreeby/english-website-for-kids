// Structured log for sensitive admin actions (stdout → captured by hosting logs)
function adminLog(action, adminId, targetId, details = {}) {
  console.log(
    JSON.stringify({
      type: "ADMIN_ACTION",
      action,
      adminId: adminId?.toString(),
      targetId: targetId?.toString() ?? null,
      details,
      timestamp: new Date().toISOString(),
    })
  );
}

module.exports = { adminLog };
