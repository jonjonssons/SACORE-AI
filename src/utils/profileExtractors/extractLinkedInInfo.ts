
/**
 * Basic LinkedIn profile information extractor
 */

export interface LinkedInProfileInfo {
  name: string;
  title: string;
  company: string;
  location: string;
  confidence: number;
}

/**
 * Simple extraction function that returns empty data (AI extraction removed)
 */
export function extractLinkedInInfo(
  title: string, 
  snippet: string,
  url: string
): LinkedInProfileInfo {
  return {
    name: "",
    title: "",
    company: "",
    location: "",
    confidence: 0
  };
}

export default extractLinkedInInfo;
