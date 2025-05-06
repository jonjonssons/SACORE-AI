
/**
 * Utility to separate different components of a LinkedIn profile
 * (name, title, company) from text strings
 */

/**
 * Checks if a string is likely a job title based on common patterns
 */
export const isLikelyJobTitle = (text: string): boolean => {
  if (!text) return false;
  
  const jobTitleIndicators = [
    /(?:senior|lead|head|vp|chief|ceo|cto|cfo|coo)/i,
    /(?:manager|director|executive|president|founder|owner)/i,
    /(?:specialist|consultant|analyst|engineer|developer|designer)/i,
    /(?:coordinator|administrator|assistant|associate|advisor|agent)/i,
    /(?:projektledare|försäljningschef|marknadschef|ekonomichef)/i,
    /(?:personalchef|chef|ledare|ansvarig|konsult|expert)/i,
    /(?:tekniker|ingenjör|säljare|utvecklare|assistent)/i
  ];
  
  return jobTitleIndicators.some(pattern => pattern.test(text));
};

/**
 * Checks if a string is likely a company name based on common patterns
 */
export const isLikelyCompany = (text: string): boolean => {
  if (!text) return false;
  
  const companyIndicators = [
    /(?:technologies|technology|tech|software|solutions)/i,
    /(?:consulting|services|agency|corporation|group)/i,
    /(?:ab|inc|ltd|llc|gmbh|co|company|limited)/i,
    /(?:partners|associates|international|global|systems)/i,
    /(?:enterprises|industries|network|digital|media)/i
  ];
  
  return companyIndicators.some(pattern => pattern.test(text));
};

/**
 * Separates a string into name, title, and company parts
 * @param text Full text to separate
 * @returns Object with name, title and company
 */
export const separateProfileComponents = (text: string): { 
  name: string;
  title: string;
  company: string;
} => {
  if (!text) return { name: '', title: '', company: '' };
  
  // Remove LinkedIn suffix
  const cleanText = text
    .replace(/ \| LinkedIn$/, '')
    .replace(/ - LinkedIn$/, '')
    .replace(/LinkedIn$/, '')
    .trim();
  
  // Check for common LinkedIn title formats
  const dashSeparated = cleanText.split(/\s*[-–]\s*/);
  const pipeSeparated = cleanText.split(/\s*\|\s*/);
  
  // Use the format with most parts
  const parts = dashSeparated.length >= pipeSeparated.length 
    ? dashSeparated 
    : pipeSeparated;
  
  let name = '';
  let title = '';
  let company = '';
  
  if (parts.length >= 3) {
    // Format: "Name - Title - Company"
    name = parts[0].trim();
    title = parts[1].trim();
    company = parts[2].trim();
  } else if (parts.length === 2) {
    // Format: "Name - Title" or potentially "Title - Company"
    if (isLikelyJobTitle(parts[1]) && !isLikelyJobTitle(parts[0])) {
      name = parts[0].trim();
      title = parts[1].trim();
    } else if (isLikelyCompany(parts[1])) {
      name = parts[0].trim();
      company = parts[1].trim();
    } else {
      // Default assumption
      name = parts[0].trim();
      title = parts[1].trim();
    }
  } else if (parts.length === 1) {
    // Just a name or unknown format
    name = parts[0].trim();
  }
  
  // Check for "at" or "på" patterns
  if (!company && title) {
    const atPattern = / (?:at|på|hos|för|with|i|at) (.+)$/i;
    const match = title.match(atPattern);
    if (match && match[1]) {
      company = match[1].trim();
      title = title.replace(atPattern, '').trim();
    }
  }
  
  return { name, title, company };
};

export default separateProfileComponents;
