/**
 * Converts various LinkedIn URL formats to a normalized profile link
 */
export const convertToProfileLink = (url: string): string => {
  if (!url) return '';
  
  // If it's already a LinkedIn profile URL, normalize it
  if (url.includes('linkedin.com/in/')) {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/');
      const usernameIndex = pathParts.indexOf('in') + 1;
      
      if (usernameIndex > 0 && usernameIndex < pathParts.length) {
        const username = pathParts[usernameIndex];
        return `https://www.linkedin.com/in/${username}`;
      }
    } catch (e) {
      console.error("Error parsing LinkedIn URL:", e);
    }
  }
  
  // If we couldn't parse it or it's not a LinkedIn URL, return the original
  return url;
};

export default convertToProfileLink;
