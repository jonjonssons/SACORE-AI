
/**
 * Extracts LinkedIn username from URL
 * @param url LinkedIn profile URL
 * @returns Formatted name or empty string
 */
export const extractLinkedInUsername = (url: string): string => {
  if (!url) return '';
  
  try {
    const matched = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (matched && matched[1]) {
      // Format the username to a readable name
      const nameParts = matched[1]
        .split('-')
        .filter(part => 
          // Filter out parts that are only numbers or very short
          !/^\d+$/.test(part) && part.length > 1
        )
        .map(part => {
          // Capitalize first letter, lowercase rest
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        });
      
      // If we have at least 2 parts, ensure proper first and last name format
      if (nameParts.length >= 2) {
        // Always ensure space between first and last name
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

export default extractLinkedInUsername;
