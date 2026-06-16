// Minimal diagnostic - no firebase dependencies
module.exports = (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const report = {
      ok: true,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      envKeyCount: Object.keys(process.env).length,
      firebaseKeyPresent: !!process.env.FIREBASE_CREDENTIALS_JSON,
      firebaseKeyLength: process.env.FIREBASE_CREDENTIALS_JSON ? process.env.FIREBASE_CREDENTIALS_JSON.length : 0,
      reactAppFirebaseProjectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'NOT SET',
    };

    // Try JSON parse without firebase-admin
    if (process.env.FIREBASE_CREDENTIALS_JSON) {
      try {
        const raw = process.env.FIREBASE_CREDENTIALS_JSON.trim();
        const sanitized = (raw.startsWith("'") && raw.endsWith("'")) ? raw.slice(1, -1) : raw;
        const parsed = JSON.parse(sanitized);
        report.jsonParse = { ok: true, project_id: parsed.project_id, keys: Object.keys(parsed) };
      } catch (e) {
        report.jsonParse = { ok: false, error: e.message };
      }
    }

    res.status(200).json(report);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, stack: e.stack });
  }
};
