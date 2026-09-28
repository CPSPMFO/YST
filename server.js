const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const AUDIT_FILE = path.join(__dirname, 'regulatory_audit_log.csv');

app.use(cors({ origin: '*' }));
app.use(express.json());

if (!fs.existsSync(AUDIT_FILE)) {
  const csvHeaders = "LogID,Timestamp,Date,Category,Initiative,Title,Owner,Hours,Purpose,ClientIP\n";
  fs.writeFileSync(AUDIT_FILE, csvHeaders, 'utf8');
}

app.post('/api/logs/audit', (req, res) => {
  try {
    const { id, date, category, stage, title, owner, hours, purpose } = req.body;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const serverTimestamp = new Date().toISOString();

    const clean = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
    const csvRow = [clean(id), clean(serverTimestamp), clean(date), clean(category), clean(stage), clean(title), clean(owner), clean(hours), clean(purpose), clean(clientIP)].join(',') + '\n';

    fs.appendFileSync(AUDIT_FILE, csvRow, 'utf8');
    console.log(`[AUDIT LOGGED] ${id} - ${title}`);

    return res.status(200).json({ success: true, message: "Logged to permanent server file.", logId: id });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Logging failed." });
  }
});

app.get('/api/logs/audit/export', (req, res) => {
  if (req.query.key !== 'MasterAuditAccess2026!') return res.status(401).json({ error: "Unauthorized key." });
  return res.download(AUDIT_FILE, 'regulatory_audit_log.csv');
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
