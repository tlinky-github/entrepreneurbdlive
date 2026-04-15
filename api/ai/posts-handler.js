// Consolidated /api/ai/posts handler - handles all post operations
// Replaces: /api/ai/posts/index.js and /api/ai/posts/[id].js
const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('./_lib');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const user = await authenticateUser(req);
    const userId = user.uid;
    const db = initializeFirebase();
    const postId = req.query.id; // Get post ID from query param

    if (req.method === 'GET') {
      // GET /api/ai/posts-handler or GET /api/ai/posts-handler?id=postId
      if (postId) {
        // Get specific post
        const postDoc = await db.collection('ai_posts').doc(postId).get();

        if (!postDoc.exists) {
          return errorResponse(res, 'Post not found', 404);
        }

        if (postDoc.data().userId !== userId) {
          return errorResponse(res, 'Unauthorized: You can only view your own posts', 403);
        }

        return successResponse(res, {
          id: postDoc.id,
          ...postDoc.data(),
        });
      } else {
        // Get all posts with pagination
        const { status = 'all', limit = 10, page = 1 } = req.query;
        const limitNum = Math.min(parseInt(limit) || 10, 100);
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const offset = (pageNum - 1) * limitNum;

        let query = db.collection('ai_posts').where('userId', '==', userId);

        if (status && status !== 'all') {
          query = query.where('status', '==', status);
        }

        const totalSnapshot = await query.get();
        const totalCount = totalSnapshot.size;

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
      }
    } else if (req.method === 'PUT') {
      // PUT /api/ai/posts-handler?id=postId - Update post
      if (!postId) {
        return errorResponse(res, 'Post ID is required for update', 400);
      }

      const postRef = db.collection('ai_posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        return errorResponse(res, 'Post not found', 404);
      }

      if (postDoc.data().userId !== userId) {
        return errorResponse(res, 'Unauthorized: You can only update your own posts', 403);
      }

      const updates = req.body;
      updates.updatedAt = new Date();

      await postRef.update(updates);

      return successResponse(res, {
        id: postId,
        ...updates,
      });
    } else if (req.method === 'DELETE') {
      // DELETE /api/ai/posts-handler?id=postId - Delete post
      if (!postId) {
        return errorResponse(res, 'Post ID is required for deletion', 400);
      }

      const postRef = db.collection('ai_posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        return errorResponse(res, 'Post not found', 404);
      }

      if (postDoc.data().userId !== userId) {
        return errorResponse(res, 'Unauthorized: You can only delete your own posts', 403);
      }

      await postRef.delete();

      // Log deletion
      await db.collection('ai_logs').add({
        userId,
        postId,
        action: 'delete',
        status: 'success',
        timestamp: new Date(),
      });

      return successResponse(res, {
        success: true,
        message: 'Post deleted',
      });
    } else {
      return errorResponse(res, 'Method not allowed', 405);
    }
  } catch (error) {
    console.error('Error handling posts:', error);
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
