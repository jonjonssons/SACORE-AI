
/**
 * Comprehensive LinkedIn profile information extractor
 * Analyzes title, snippet, and URL from Google Custom Search API results
 * to extract structured profile information
 */

export interface LinkedInProfileInfo {
  name: string;
  title: string;
  company: string;
  location: string;
  confidence: number; // Overall confidence score (0-1)
}

/**
 * Extracts LinkedIn profile information from Google Custom Search API results
 * @param title - The title field from Google Custom Search API result
 * @param snippet - The snippet field from Google Custom Search API result
 * @param url - The URL of the LinkedIn profile
 * @returns Object with extracted information and confidence scores
 */
export function extractLinkedInInfo(
  title: string, 
  snippet: string,
  url: string
): LinkedInProfileInfo {
  console.log("Extracting from:", { title, snippet, url });

  const result: LinkedInProfileInfo = {
    name: "",
    title: "",
    company: "",
    location: "",
    confidence: 0,
  };

  // ---- Clean and normalize inputs ---- //
  title = title || "";
  snippet = snippet || "";
  url = url || "";

  // ---- Extract Name ---- //
  const nameMatch = title.match(/^([^-–|]+?)(?=\s[-–|])/);
  if (nameMatch && nameMatch[1]) {
    result.name = nameMatch[1].trim();
  } else {
    // fallback från URL
    const urlMatch = url.match(/linkedin\.com\/in\/([^\/?]+)/);
    if (urlMatch && urlMatch[1]) {
      result.name = urlMatch[1].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // ---- Extract Title & Company ---- //
  const parts = title.split(/[-–|]+/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    result.title = parts[1];
    result.company = parts[2];
  } else if (parts.length === 2) {
    result.title = parts[1];
  }

  // ---- Extract Location (from snippet) ---- //
  // Vanligt format: "Account Manager på Spotify · Stockholm, Sverige"
  const locationMatch = snippet.match(/(?:·|\|)\s*([^·|,]+(?:, [^\d]+)?)/);
  if (locationMatch && locationMatch[1]) {
    result.location = locationMatch[1].trim();
  }

  // ---- Set confidence based on what was found ---- //
  let score = 0;
  if (result.name) score += 0.3;
  if (result.title) score += 0.25;
  if (result.company) score += 0.25;
  if (result.location) score += 0.2;

  result.confidence = Math.round(score * 100) / 100;

  return result;
}

/**
 * Helper function to clean text from HTML and special characters
 */
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Export the default function for backward compatibility
export default extractLinkedInInfo;
