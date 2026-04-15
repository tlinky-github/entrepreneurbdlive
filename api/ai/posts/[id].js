// PUT/DELETE /api/ai/posts/[id] - Update or delete a post
const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('../../_lib');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,DELETE,PATCH');
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

    // Get post ID from URL
    const { id } = req.query;

    if (!id) {
      return errorResponse(res, 400, 'Post ID is required');
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update post
      const { status, title, content, excerpt } = req.body;

      const postRef = db.collection('ai_posts').doc(id);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        return errorResponse(res, 404, 'Post not found');
      }

      if (postDoc.data().userId !== userId) {
        return errorResponse(res, 403, 'Forbidden: You can only update your own posts');
      }

      const updateData = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (excerpt) updateData.excerpt = excerpt;

      await postRef.update(updateData);

      return successResponse(res, { id, ...updateData }, 'Post updated successfully');
    } else if (req.method === 'DELETE') {
      // Delete post
      const postRef = db.collection('ai_posts').doc(id);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        return errorResponse(res, 404, 'Post not found');
      }

      if (postDoc.data().userId !== userId) {
        return errorResponse(res, 403, 'Forbidden: You can only delete your own posts');
      }

      await postRef.delete();

      return successResponse(res, { id }, 'Post deleted successfully');
    }
  } catch (error) {
    console.error('Error handling post:', error);
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
