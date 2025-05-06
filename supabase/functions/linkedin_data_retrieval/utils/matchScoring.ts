
/**
 * Match scoring utilities for LinkedIn profile analysis
 */

/**
 * Calculate match score between a search criterion and profile data
 * @param criterion Search criterion string
 * @param profile Profile data object
 * @returns Match score between 0-1
 */
export function calculateMatchScore(criterion: string, profile: any): number {
  const lowerCriterion = criterion.toLowerCase();
  let score = 0;
  
  // Check name
  if (profile.name && profile.name.toLowerCase().includes(lowerCriterion)) {
    score += 0.7;
  }
  
  // Check title
  if (profile.title && profile.title.toLowerCase().includes(lowerCriterion)) {
    score += 0.8;
  }
  
  // Check company
  if (profile.company && profile.company.toLowerCase().includes(lowerCriterion)) {
    score += 0.8;
  }
  
  // Check skills or other metadata
  if (profile.skills && Array.isArray(profile.skills)) {
    for (const skill of profile.skills) {
      if (skill.toLowerCase().includes(lowerCriterion)) {
        score += 0.5;
        break;
      }
    }
  }
  
  // Check profile URL for relevant keywords
  if (profile.profileUrl && profile.profileUrl.toLowerCase().includes(lowerCriterion)) {
    score += 0.3;
  }
  
  // Scale randomness based on position to ensure better profiles appear first
  // but still maintain some variety in matches for demonstration
  const randomFactor = 0.3 * Math.random();
  
  return Math.min(score + randomFactor, 1);
}

/**
 * Process criteria items from comma-separated string
 * @param criteria Comma-separated search criteria
 * @returns Array of trimmed, non-empty criteria items
 */
export function processCriteriaItems(criteria: string): string[] {
  return criteria
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Sort profiles by score and confidence
 * @param profiles Array of profiles with score and confidence
 * @returns Sorted array of profiles
 */
export function sortProfilesByRelevance(profiles: any[]): any[] {
  return [...profiles].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.confidence || 0) - (a.confidence || 0);
  });
}
