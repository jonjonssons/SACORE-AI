
/**
 * Utilities for extracting profile data from URLs and search results
 */

/**
 * Extract LinkedIn username from URL
 * @param url LinkedIn profile URL
 * @returns Formatted name from URL or empty string
 */
export const extractLinkedInUsername = (url: string): string => {
  if (!url) return '';
  
  try {
    const matched = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (matched && matched[1]) {
      const nameParts = matched[1]
        .split('-')
        .filter(part => 
          !/^\d+$/.test(part) && part.length > 1
        )
        .map(part => {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        });
      
      if (nameParts.length >= 2) {
        return nameParts.slice(0, 2).join(' ');
      } else if (nameParts.length === 1) {
        return nameParts[0];
      }
    }
  } catch (error) {
    console.error('Error extracting LinkedIn username:', error);
  }
  return '';
};

/**
 * Extract title and company from snippet text
 * @param snippet Text snippet from search result
 * @returns Object with title and company fields
 */
export const extractProfileInfo = (snippet: string): { title: string; company: string } => {
  if (!snippet) return { title: '', company: '' };
  
  let title = '';
  let company = '';
  
  try {
    const atPattern = snippet.match(/^([^-·]+)\s+(?:at|@)\s+([^-·]+)/i);
    const dashPattern = snippet.match(/^([^-·]+)\s*[-·]\s*([^-·]+)/i);
    
    if (atPattern) {
      title = atPattern[1].trim();
      company = atPattern[2].trim();
    } else if (dashPattern) {
      title = dashPattern[1].trim();
      company = dashPattern[2].trim();
    } else {
      const firstSentence = snippet.split(/[.!?]/).filter(Boolean)[0] || '';
      
      if (firstSentence.includes(' at ')) {
        const parts = firstSentence.split(' at ');
        title = parts[0].trim();
        company = parts[1].trim();
      } else if (firstSentence.includes(' - ')) {
        const parts = firstSentence.split(' - ');
        title = parts[0].trim();
        company = parts[1].trim();
      } else if (firstSentence.includes(' · ')) {
        const parts = firstSentence.split(' · ');
        title = parts[0].trim();
        company = parts[1].trim();
      }
    }
  } catch (error) {
    console.error("Error extracting profile info:", error);
  }
  
  return { 
    title: title || 'Not specified', 
    company: company || 'Not specified'
  };
};

/**
 * Convert various LinkedIn URLs to profile URLs
 * @param link LinkedIn URL which might be a post or article
 * @returns LinkedIn profile URL
 */
export const convertToProfileLink = (link: string): string => {
  try {
    if (link.includes('linkedin.com/in/')) {
      return link;
    }
    
    if (link.includes('linkedin.com/posts/')) {
      const parts = link.split('linkedin.com/posts/');
      if (parts.length > 1) {
        const username = parts[1].split('_')[0];
        if (username) {
          return `https://www.linkedin.com/in/${username}`;
        }
      }
    }
    
    if (link.includes('linkedin.com/pulse/')) {
      const parts = link.split('linkedin.com/pulse/');
      if (parts.length > 1) {
        const lastSegment = parts[1].split('-').pop();
        if (lastSegment && !lastSegment.includes('?') && lastSegment.length > 2) {
          return `https://www.linkedin.com/in/${lastSegment}`;
        }
      }
    }
    
    return link;
  } catch (error) {
    console.error("Error converting link:", error);
    return link;
  }
};
