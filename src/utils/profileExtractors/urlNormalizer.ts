
/**
 * Normalizes LinkedIn URLs to use www.linkedin.com regardless of country-specific subdomains
 */
export const normalizeLinkedInUrl = (url: string): string => {
  if (!url) return '';
  
  // Normalize country-specific subdomains to www
  let normalized = url.replace(/^https:\/\/[a-z]{2}\.linkedin\.com/, 'https://www.linkedin.com');
  
  // Ensure URLs start with https://
  if (!normalized.startsWith('http')) {
    normalized = `https://${normalized}`;
  }
  
  // Remove trailing slashes
  normalized = normalized.replace(/\/$/, '');
  
  return normalized;
};

export default normalizeLinkedInUrl;
