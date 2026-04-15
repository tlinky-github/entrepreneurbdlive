// GET /api/ai/logs - Get generation logs
const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('../_lib');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get Firebase instance (Initializes if needed)
    const db = initializeFirebase();

    // Authenticate user
    const user = await authenticateUser(req);
    const userId = user.uid;

    // Parse query params
    const { limit = 100, filter = 'all' } = req.query;
    const limitNum = Math.min(parseInt(limit) || 100, 500);

    // Get generation logs
    let query = db.collection('ai_logs').where('userId', '==', userId);

    if (filter !== 'all') {
      query = query.where('action', '==', filter);
    }

    const logsSnapshot = await query.orderBy('timestamp', 'desc').limit(limitNum).get();

    const logs = logsSnapshot.docs.map((doc) => {
      const data = doc.data();
      // Normalize timestamp
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        data.timestamp = data.timestamp.toDate().toISOString();
      } else if (data.timestamp && data.timestamp._seconds) {
        // Handle case where it's a plain object (common in Vercel/JSON)
        data.timestamp = new Date(data.timestamp._seconds * 1000).toISOString();
      }
      return {
        id: doc.id,
        ...data,
      };
    });

    return successResponse(res, { logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
