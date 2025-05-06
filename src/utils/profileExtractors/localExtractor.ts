
import { ExtractedProfile, SearchResultItem } from "./types";
import { normalizeLinkedInUrl } from "./urlNormalizer";

export const extractLocalProfiles = (searchResults: SearchResultItem[]): ExtractedProfile[] => {
  return searchResults.map(result => {
    const name = extractBasicName(result.title || "");
    const url = normalizeLinkedInUrl(result.link || "");
    
    return {
      name,
      title: "",
      company: "",
      location: "",
      url,
      confidence: 0.1
    };
  });
};

// Simple name extraction from title
function extractBasicName(title: string): string {
  // Remove LinkedIn suffix and clean
  const cleanTitle = title
    .replace(/ \| LinkedIn$/, '')
    .replace(/ - LinkedIn$/, '')
    .replace(/LinkedIn$/, '')
    .trim();
  
  // If title contains separator, take first part as name
  const separators = [' - ', ' | ', ' · '];
  for (const sep of separators) {
    if (cleanTitle.includes(sep)) {
      return cleanTitle.split(sep)[0].trim();
    }
  }
  
  return cleanTitle;
}
