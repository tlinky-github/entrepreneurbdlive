// GET /api/ai/stats - Get generation statistics
const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('./_lib');

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
    // Initialize Firebase first
    const db = initializeFirebase();
    
    // Then authenticate user
    const user = await authenticateUser(req);
    const userId = user.uid;

    // Get generation logs for stats
    const logsSnapshot = await db
      .collection('ai_logs')
      .where('userId', '==', userId)
      .get();

    let totalGenerated = 0;
    let totalPublished = 0;
    let totalTokens = 0;
    let totalCost = 0;

    logsSnapshot.forEach((doc) => {
      const log = doc.data();
      totalGenerated++;
      
      if (log.status === 'published') {
        totalPublished++;
      }
      
      if (log.tokensUsed) {
        totalTokens += log.tokensUsed;
      }
      
      if (log.estimatedCost) {
        totalCost += log.estimatedCost;
      }
    });

    return successResponse(res, {
      totalGenerated,
      totalPublished,
      totalTokens,
      estimatedCost: totalCost.toFixed(4),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
