
import { extractLinkedInUsername } from "./profileExtractors/extractUsername";
import { convertToProfileLink } from "./profileExtractors/convertToProfileLink";

/**
 * Simplified profile extractor (no AI dependency)
 * @param searchResults Array of search results from Google API
 * @returns Array of formatted profile data
 */
export const extractProfileDataFromSearchResults = (
  searchResults: { title: string; snippet: string; link: string }[]
) => {
  console.log(`Extracting profile data from ${searchResults.length} search results`);
  
  const profiles = searchResults.map((result, index) => {
    return {
      name: `Profile ${index + 1}`,
      title: "",
      company: "",
      location: "",
      link: result.link || "",
      confidence: 0
    };
  });
  
  console.log(`Extracted ${profiles.length} profiles with basic extraction`);
  
  return profiles;
};

/**
 * Creates a profile object from a search result item
 */
export const createProfileFromSearchResult = (
  result: any,
  index: number,
  url: string
) => {
  return {
    id: `profile-${index}`,
    url,
    name: `Profile ${index + 1}`,
    title: "",
    company: "",
    score: 0,
    rawSnippet: result.snippet || "",
    confidence: 0
  };
};

/**
 * Extract profile info from snippet text
 * @param snippet Text snippet from search result
 * @param language Detected language (defaults to 'en')
 * @returns Object with title and company
 */
export const extractProfileInfo = (snippet: string, language: 'sv' | 'en' = 'en') => {
  if (!snippet) return { title: 'Not available', company: 'Not available' };
  
  try {
    // Try to extract title and company information from the snippet
    const atPattern = language === 'sv' 
      ? snippet.match(/^([^-·]+)\s+(?:på|hos|i|vid|med)\s+([^-·]+)/i)
      : snippet.match(/^([^-·]+)\s+(?:at|with|for|in)\s+([^-·]+)/i);
      
    const dashPattern = snippet.match(/^([^-·]+)\s*[-·]\s*([^-·]+)/i);
    
    if (atPattern) {
      return {
        title: atPattern[1].trim(),
        company: atPattern[2].trim()
      };
    } else if (dashPattern) {
      return {
        title: dashPattern[1].trim(),
        company: dashPattern[2].trim()
      };
    } else {
      const firstSentence = snippet.split(/[.!?]/).filter(Boolean)[0] || '';
      
      if (firstSentence.includes(' at ') || firstSentence.includes(' på ')) {
        const parts = firstSentence.includes(' at ') 
          ? firstSentence.split(' at ') 
          : firstSentence.split(' på ');
          
        return {
          title: parts[0].trim(),
          company: parts.length > 1 ? parts[1].trim() : 'Not available'
        };
      } else if (firstSentence.includes(' - ')) {
        const parts = firstSentence.split(' - ');
        return {
          title: parts[0].trim(),
          company: parts.length > 1 ? parts[1].trim() : 'Not available'
        };
      }
    }
  } catch (error) {
    console.error("Error extracting profile info:", error);
  }
  
  return { title: 'Not available', company: 'Not available' };
};

/**
 * Detect language of a text (simplified implementation)
 */
export const detectLanguage = (text: string): 'sv' | 'en' => {
  // Simple language detection based on Swedish-specific words
  const swedishPatterns = [
    /\boch\b/i, /\bpå\b/i, /\bför\b/i, /\bmed\b/i, /\batt\b/i,
    /\bär\b/i, /\beller\b/i, /\bav\b/i, /\btill\b/i, /\bhar\b/i
  ];
  
  const swedishMatchCount = swedishPatterns.reduce((count, pattern) => {
    return count + (pattern.test(text) ? 1 : 0);
  }, 0);
  
  return swedishMatchCount >= 2 ? 'sv' : 'en';
};

// Export the username extractor and link converter for convenience
export { extractLinkedInUsername, convertToProfileLink };

/**
 * Formatter functions for various outputs
 */
export const formatAsProfileJSON = (searchResults: any[]) => {
  const profiles = searchResults.map((result, index) => ({
    name: `Profile ${index + 1}`,
    title: "",
    company: "",
    url: result.link || ""
  }));
  
  return JSON.stringify(profiles, null, 2);
};

export const formatAsSwedishContactJSON = (result: { title: string; snippet: string }) => {
  return {
    namn: result.title?.split(' - ')[0] || '',
    titel: result.title?.split(' - ')[1] || '',
    företag: result.title?.split(' - ')[2] || ''
  };
};
