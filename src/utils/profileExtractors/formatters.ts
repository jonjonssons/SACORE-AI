
/**
 * Formatter utilities for profile data
 */

interface ProfileData {
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  connections?: string;
  about?: string;
  snippet?: string; // Added for SwedishContactExtractor
}

/**
 * Format search results as profile JSON
 * @param searchResults Array of search results
 * @param language Language code (default: 'en')
 * @returns Formatted JSON string
 */
export const formatAsProfileJSON = (
  searchResults: any[],
  language: string = 'en'
): string => {
  const profiles = searchResults.map(result => ({
    name: result.name || "",
    title: result.title || "",
    company: result.company || "",
    url: result.link || ""
  }));
  
  return JSON.stringify(profiles, null, 2);
};

/**
 * Format profile data as Swedish contact JSON
 * @param data Title and snippet from search result
 * @returns Formatted JSON object with Swedish field names
 */
export const formatAsSwedishContactJSON = (
  data: { title: string; snippet: string }
): { namn: string; titel: string; företag: string } => {
  // Simple extraction logic without AI
  const namn = data.title?.split(/[-–|]/)[0]?.trim() || '';
  const titel = data.title?.split(/[-–|]/)[1]?.trim() || '';
  const företag = data.title?.split(/[-–|]/)[2]?.trim() || '';
  
  return {
    namn,
    titel,
    företag
  };
};
