const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const rbac = require('../middleware/rbac');

// GET /api/audit-logs - Secure endpoint to view audit logs
router.get('/audit-logs', rbac(['admin']), (req, res) => {
  const logPath = path.join(__dirname, '../../logs/audit.log');
  if (!fs.existsSync(logPath)) return res.status(404).json({ message: 'No audit logs found' });
  const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).map(line => {
    try { return JSON.parse(line); } catch { return { raw: line }; }
  });
  res.json({ logs });
});

module.exports = router;
