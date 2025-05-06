/**
 * Utility functions for normalizing data formats
 */

/**
 * Normalizes a LinkedIn URL to a consistent format
 * Removes tracking parameters and ensures the URL has a consistent structure
 */
export const normalizeLinkedInUrl = (url?: string): string => {
  if (!url) return "";
  
  // If it's not a LinkedIn URL, return as is
  if (!url.includes('linkedin.com')) {
    return url;
  }
  
  try {
    // Parse the URL
    const parsedUrl = new URL(url);
    
    // Keep only the pathname, removing all query parameters
    if (parsedUrl.pathname.includes('/in/')) {
      // For profile URLs, keep only the /in/{username} part
      const pathParts = parsedUrl.pathname.split('/');
      const username = pathParts[pathParts.indexOf('in') + 1];
      return `https://www.linkedin.com/in/${username}`;
    }
    
    // For other LinkedIn URLs, just return the original URL
    return url;
  } catch (e) {
    // If URL parsing fails, return the original URL
    return url;
  }
};

export default {
  normalizeLinkedInUrl
}; 