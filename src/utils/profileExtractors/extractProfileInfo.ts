
import { separateProfileComponents } from './separateProfileComponents';

/**
 * Extract profile info from snippet text
 * @param snippet Text snippet from search result
 * @param language Detected language
 * @returns Object with title and company
 */
export const extractProfileInfo = (snippet: string, language: 'sv' | 'en' = 'sv') => {
  if (!snippet) return { title: '', company: '' };
  
  let title = '';
  let company = '';
  
  try {
    // First try to use the separator utility
    const { title: extractedTitle, company: extractedCompany } = separateProfileComponents(snippet);
    
    if (extractedTitle) {
      title = extractedTitle;
    }
    
    if (extractedCompany) {
      company = extractedCompany;
    }
    
    // If we couldn't extract using the separator, try the older patterns
    if (!title || !company) {
      const atPattern = language === 'sv' 
        ? snippet.match(/^([^-·]+)\s+(?:på|hos|i|vid|med)\s+([^-·]+)/i)
        : snippet.match(/^([^-·]+)\s+(?:at|with|for|in)\s+([^-·]+)/i);
        
      const dashPattern = snippet.match(/^([^-·]+)\s*[-·]\s*([^-·]+)/i);
      
      if (atPattern) {
        if (!title) title = atPattern[1].trim();
        if (!company) company = atPattern[2].trim();
      } else if (dashPattern) {
        if (!title) title = dashPattern[1].trim();
        if (!company) company = dashPattern[2].trim();
      } else {
        const firstSentence = snippet.split(/[.!?]/).filter(Boolean)[0] || '';
        
        if (firstSentence.includes(' at ') || firstSentence.includes(' på ')) {
          const parts = firstSentence.includes(' at ') 
            ? firstSentence.split(' at ') 
            : firstSentence.split(' på ');
            
          if (!title) title = parts[0].trim();
          if (!company && parts.length > 1) company = parts[1].trim();
        } else if (firstSentence.includes(' - ')) {
          const parts = firstSentence.split(' - ');
          if (!title) title = parts[0].trim();
          if (!company && parts.length > 1) company = parts[1].trim();
        } else if (firstSentence.includes(' · ')) {
          const parts = firstSentence.split(' · ');
          if (!title) title = parts[0].trim();
          if (!company && parts.length > 1) company = parts[1].trim();
        }
      }
    }
  } catch (error) {
    console.error("Error extracting profile info:", error);
  }
  
  return { 
    title: title || 'Not available', 
    company: company || 'Not available'
  };
};

export default extractProfileInfo;
