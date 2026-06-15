/**
 * Intelligent Suggestion Engine for broken links.
 * Uses Levenshtein distance to find the best match between a dead path and live content.
 */

// Simple Levenshtein distance implementation
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * findBestMatches
 * @param {string} badPath - The 404 path (e.g., /blog/entreprenur-tips)
 * @param {string[]} livePaths - List of all currently valid URLs on the site
 * @returns {string[]} Top 3 suggestions
 */
export const findBestMatches = (badPath, livePaths) => {
  if (!badPath || !livePaths || livePaths.length === 0) return [];

  // Normalize path
  const target = badPath.toLowerCase().replace(/\/$/, '');
  const targetSlug = target.split('/').pop();

  const scores = livePaths.map(path => {
    const normalizedPath = path.toLowerCase().replace(/\/$/, '');
    const currentSlug = normalizedPath.split('/').pop();

    // 1. Check for exact slug match in different directory
    // (e.g., /blog/john -> /author/john)
    if (targetSlug === currentSlug) {
      return { path, score: 0 }; // Highest priority
    }

    // 2. Fuzzy match the full path
    const fullDist = getLevenshteinDistance(target, normalizedPath);
    
    // 3. Fuzzy match only the slug part (helps with deep links)
    const slugDist = getLevenshteinDistance(targetSlug, currentSlug);

    // Weighted score (slug similarity is more important)
    const finalScore = Math.min(fullDist, slugDist);

    return { path, score: finalScore };
  });

  // Sort by score (lower is better) and return top 3
  return scores
    .filter(s => s.score < 10) // Only return reasonably close matches
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(s => s.path);
};
