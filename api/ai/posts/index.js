// GET /api/ai/posts - Get AI generated posts
const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('../_lib');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    const userId = user.uid;

    // Get Firebase instance
    const db = initializeFirebase();

    if (req.method === 'GET') {
      // GET: Retrieve posts
      const { status = 'all', limit = 10, page = 1 } = req.query;
      const limitNum = Math.min(parseInt(limit) || 10, 100);
      const pageNum = Math.max(parseInt(page) || 1, 1);
      const offset = (pageNum - 1) * limitNum;

      let query = db.collection('ai_posts').where('userId', '==', userId);

      if (status && status !== 'all') {
        query = query.where('status', '==', status);
      }

      // Get total count
      const totalSnapshot = await query.get();
      const totalCount = totalSnapshot.size;

      // Get paginated results
      const postsSnapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limitNum + offset)
        .get();

      const posts = postsSnapshot.docs
        .slice(offset)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

      return successResponse(res, {
        posts,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        currentPage: pageNum,
      });
    } else if (req.method === 'POST') {
      // POST: Create new post (stub - full implementation in generate.js)
      return errorResponse(res, 405, 'Use /api/ai/generate to create posts');
    }
  } catch (error) {
    console.error('Error handling posts:', error);
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
