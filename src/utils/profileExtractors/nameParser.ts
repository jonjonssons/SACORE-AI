
/**
 * Enhanced name parser for extracting names from strings
 * @param text Text containing a name
 * @returns Extracted name or empty string
 */
export const parseName = (text: string): string => {
  if (!text) return '';
  
  // Remove LinkedIn suffix
  const cleanText = text
    .replace(/ \| LinkedIn$/, '')
    .replace(/ - LinkedIn$/, '')
    .replace(/LinkedIn$/, '')
    .trim();
  
  // Extract name from common formats
  // Format: "Name - Title - Company" or "Name | Title | Company"
  const namePatterns = [
    /^([^-|]+)(?:[-|]|$)/,             // Name before first separator
    /^([^-|]+?)(?=\s+(?:at|på|hos|for|för|with|i|in)\s+)/i  // Name before "at/på/hos/for/with" etc.
  ];
  
  // Try each pattern
  for (const pattern of namePatterns) {
    const nameMatch = cleanText.match(pattern);
    if (nameMatch && nameMatch[1]) {
      // Clean the extracted name
      return cleanName(nameMatch[1], cleanText);
    }
  }
  
  // If no patterns match, clean the whole text
  return cleanName(cleanText, '');
};

/**
 * Cleans a name string by removing special characters, numbers, titles, and non-name words
 * @param name Name string to clean
 * @param fullText The full original text (used to detect company/title components)
 * @returns Cleaned name
 */
const cleanName = (name: string, fullText: string): string => {
  // Extended set of non-name words for better filtering
  const excludeWords = [
    // Common titles
    'dr', 'mr', 'mrs', 'ms', 'miss', 'sir', 'madam', 'prof', 'professor',
    
    // Common connecting words
    'at', 'for', 'in', 'of', 'on', 'the', 'with', 'and', 'or', 'as',
    
    // Common positions that appear at the start of LinkedIn titles
    'senior', 'junior', 'lead', 'chief', 'head', 'vp', 'ceo', 'cto', 'cfo', 'coo',
    'manager', 'director', 'executive', 'president', 'founder', 'owner', 'specialist',
    'consultant', 'analyst', 'engineer', 'developer', 'designer', 'coordinator',
    'administrator', 'assistant', 'associate', 'advisor', 'agent', 'partner',
    
    // Swedish titles
    'chef', 'ledare', 'ansvarig', 'konsult', 'expert', 'tekniker', 'ingenjör',
    'säljare', 'utvecklare', 'assistent', 'koordinator', 'projektledare',
    'försäljningschef', 'marknadschef', 'ekonomichef', 'personalchef',
    
    // Swedish connecting words
    'på', 'hos', 'för', 'med', 'och', 'eller', 'som', 'av', 'till', 'från'
  ];
  
  // Extract potential job titles and companies to prevent them from being in names
  const companyJobIndicators = [
    // Title/company patterns
    /(senior|lead|head|vp|chief|ceo|cto|cfo|coo|manager|director|executive|president|founder|owner)/i,
    /(specialist|consultant|analyst|engineer|developer|designer|coordinator|administrator|assistant)/i,
    /(projektledare|försäljningschef|marknadschef|ekonomichef|personalchef)/i,
    
    // Industry/company keywords
    /(technologies|tech|software|solutions|consulting|services|agency|corporation|group|ab|inc|ltd)/i,
    /(technologies|tech|software|solutions|consulting|services|agency|corporation|group|ab|inc|ltd)/i,
  ];
  
  // Check if the name contains obvious job title or company fragments
  let hasJobOrCompanyIndicators = false;
  if (fullText) {
    const parts = fullText.split(/[-|]/);
    if (parts.length >= 2) {
      // Get potential job title and company (parts after the name)
      const potentialJobTitle = parts[1]?.trim().toLowerCase() || '';
      const potentialCompany = parts[2]?.trim().toLowerCase() || '';
      
      // If the "name" part contains parts of the job title or company, it's likely mixed up
      if (potentialJobTitle && name.toLowerCase().includes(potentialJobTitle)) {
        hasJobOrCompanyIndicators = true;
      }
      
      if (potentialCompany && name.toLowerCase().includes(potentialCompany)) {
        hasJobOrCompanyIndicators = true;
      }
    }
  }
  
  // Process and clean the name
  let cleanedName = name
    // Keep only letters and spaces (including Nordic characters)
    .replace(/[^a-zA-ZåäöÅÄÖéèêëÉÈÊËüÜ\s]/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Split into words
    .split(' ')
    // Filter out common job titles and single letter words (except initial)
    .filter(word => {
      const lowercased = word.toLowerCase();
      // Filter out common non-name words and single letter words (except initial)
      return !excludeWords.includes(lowercased) && 
             (lowercased.length > 1 || (lowercased.length === 1 && word === word.toUpperCase()));
    })
    // Join back with spaces
    .join(' ');
  
  // Check for job title or company indicators
  if (!hasJobOrCompanyIndicators) {
    for (const pattern of companyJobIndicators) {
      if (pattern.test(cleanedName.toLowerCase())) {
        hasJobOrCompanyIndicators = true;
        break;
      }
    }
  }
  
  // If the name still contains job title or company indicators, it's probably not a clean name
  if (hasJobOrCompanyIndicators || cleanedName.split(' ').length > 4) {
    return 'Unknown';
  }
  
  // If nothing is left after filtering, return a default value
  return cleanedName || 'Unknown';
};

export default parseName;
