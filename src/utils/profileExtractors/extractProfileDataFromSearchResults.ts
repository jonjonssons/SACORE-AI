import { convertToProfileLink } from './convertToProfileLink';
import { separateProfileComponents, isLikelyJobTitle } from './separateProfileComponents';
import { normalizeLinkedInUrl } from "../normalizers";
import { extractName } from "./extractName";

export interface ISearchResult {
  title?: string;
  snippet?: string;
  link?: string;
  extractedName?: string;
}

export interface SearchResultItem {
  title?: string;
  snippet?: string;
  link?: string;
  extractedName?: string;
}

export interface ExtractedProfile {
  name: string;
  title: string;
  company: string;
  url: string;
}

interface IProfile {
  name: string;
  title: string;
  company: string;
  url: string;
  rawData?: any;
}

/**
 * Extracts basic profile data from search results
 */
export const extractProfileDataFromSearchResults = (searchResults: ISearchResult[]): IProfile[] => {
  const DEBUG = true;
  
  if (DEBUG) {
    console.log(`=== DIAGNOSTIK: extractProfileDataFromSearchResults anropad ===`);
    console.log(`Bearbetar ${searchResults.length} sökresultat`);
  }
  
  const extractedProfiles: IProfile[] = searchResults.map((result, index) => {
    if (DEBUG) {
      console.log(`\nDIAGNOSTIK: Bearbetar resultat #${index + 1}`);
    }
    
    // Normalize LinkedIn URL for consistency
    const url = normalizeLinkedInUrl(result.link);
    if (DEBUG) {
      console.log(`DIAGNOSTIK: Konverterad URL: ${result.link} -> ${url}`);
    }
    
    // Extract name from the search result using our specialized function
    const extractedName = extractName(result.title, result.snippet, result.extractedName);
    if (DEBUG) {
      console.log(`DIAGNOSTIK: Extraherat namn: ${extractedName}`);
    }
    
    // Extract job title from title or snippet
    let jobTitle = extractJobTitleFromResult(result);
    if (DEBUG) {
      console.log(`DIAGNOSTIK: Extraherad titel: ${jobTitle}`);
    }
    
    // Extract company from title or snippet
    let company = extractCompanyFromResult(result);
    if (DEBUG) {
      console.log(`DIAGNOSTIK: Extraherat företag: ${company}`);
    }
    
    const profile: IProfile = {
      name: extractedName,
      title: jobTitle,
      company: company,
      url: url,
      rawData: DEBUG ? result : undefined
    };
    
    if (DEBUG) {
      console.log(`DIAGNOSTIK: Slutlig profil för resultat #${index + 1}: ${profile}`);
    }
    
    return profile;
  });
  
  if (DEBUG) {
    console.log(`=== DIAGNOSTIK: extractProfileDataFromSearchResults slutförd ===`);
    console.log(`Antal extraherade profiler: ${extractedProfiles.length}`);
    
    if (extractedProfiles.length > 0) {
      console.log(`Första extraherade profilen: ${extractedProfiles[0]}`);
    }
  }
  
  return extractedProfiles;
};

// Helper function to extract job title from search result
function extractJobTitleFromResult(result: ISearchResult): string {
  const { title, snippet } = result;
  
  if (!title && !snippet) return "";
  
  // Log for debugging
  console.log("Extracting job title from:", { 
    title: title?.substring(0, 50) + (title && title.length > 50 ? '...' : ''), 
    snippet: snippet?.substring(0, 50) + (snippet && snippet.length > 50 ? '...' : '') 
  });
  
  // First use the separator utility on title
  if (title) {
    const { title: extractedTitle } = separateProfileComponents(title);
    if (extractedTitle && isLikelyJobTitle(extractedTitle)) {
      console.log("Found job title from separator utility on title:", extractedTitle);
      return cleanJobTitle(extractedTitle);
    }
  }
  
  // Then try separator utility on snippet
  if (snippet) {
    const { title: extractedTitle } = separateProfileComponents(snippet);
    if (extractedTitle && isLikelyJobTitle(extractedTitle)) {
      console.log("Found job title from separator utility on snippet:", extractedTitle);
      return cleanJobTitle(extractedTitle);
    }
  }
  
  // Title patterns to search for
  const titlePatterns = [
    // Match LinkedIn title pattern: "Name - Title - Company"
    /(?:[^-]+)\s+-\s+([^-]+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)[^-]*?)(?:\s+-\s+|$)/,
    
    // Match LinkedIn title pattern with "at": "Name - Title at Company"
    /(?:[^-]+)\s+-\s+(.+?)\s+(?:at|@)\s+.+/,
    
    // Match LinkedIn title pattern with position: "Name – Title – Company"
    /(?:[^–]+)\s+–\s+([^–]+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)[^–]*?)(?:\s+–\s+|$)/,
    
    // Match LinkedIn title pattern with pipe: "Name | Title | Company"
    /(?:[^|]+)\s+\|\s+([^|]+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)[^|]*?)(?:\s+\|\s+|$)/
  ];
  
  // Try to extract from title first
  for (const pattern of titlePatterns) {
    if (!title) continue;
    const match = title.match(pattern);
    if (match && match[1]) {
      const extractedTitle = match[1].trim();
      if (isLikelyJobTitle(extractedTitle)) {
        console.log("Found job title from title pattern:", extractedTitle);
        return cleanJobTitle(extractedTitle);
      }
    }
  }
  
  // Try to extract from snippet
  const snippetPatterns = [
    // Match position in snippet at beginning
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)[^.]*?)[.,]/,
    
    // Match position with "at" in snippet
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)[^.]*?)\s+(?:at|@)\s+/,
    
    // Match positions between bullets or dots
    /[.•·]\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)[^.•·]*?)(?:[.•·]|$)/,
    
    // Specific Account Executive pattern
    /\b((?:Senior |Enterprise |Strategic |Global |Key )?Account Executive(?:[^.]*?))\b/i,
    
    // Specific Sales pattern
    /\b((?:Senior |Head |Global |Regional |Key )?(?:Sales|Business Development)(?:\s+Manager|\s+Executive|\s+Director|\s+Lead|\s+Representative|\s+Agent)(?:[^.]*?))\b/i,
    
    // Work as pattern
    /(?:works as|working as|arbetar som)\s+(?:an?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)[^.]*?)(?:\s+at|\s+@|[.,]|$)/i,
    
    // LinkedIn experience section pattern
    /Experience[^:]*?:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)[^.]*?)(?:\s+at|\s+@|[.,]|$)/i,
    
    // Swedish patterns
    /\b((?:Senior |Global |Regional |Key )?(?:Säljchef|Säljare|Försäljningschef|Marknadschef|Projektledare|Konsult|Utvecklare)(?:[^.]*?))\b/i
  ];
  
  if (snippet) {
    for (const pattern of snippetPatterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        const extractedTitle = match[1].trim();
        if (isLikelyJobTitle(extractedTitle)) {
          console.log("Found job title from snippet pattern:", extractedTitle);
          return cleanJobTitle(extractedTitle);
        }
      }
    }
  }
  
  // Extract common job titles from the snippet
  if (snippet) {
    const commonTitles = [
      "Account Executive", "Sales Manager", "Business Development Manager",
      "Regional Sales Manager", "Regional Director", "Key Account Manager",
      "Sales Representative", "Marketing Manager", "Marketing Specialist",
      "Product Manager", "Project Manager", "Software Engineer",
      "Data Analyst", "Sales Director", "Business Development Director",
      "CEO", "CTO", "CFO", "COO", 
      "Vice President", "Senior Manager",
      // Swedish titles
      "Säljchef", "Försäljningschef", "Marknadschef", "Projektledare", 
      "Affärsutvecklare", "VD", "Konsult", "Teknisk Säljare"
    ];
    
    for (const title of commonTitles) {
      if (snippet.includes(title)) {
        console.log("Found common job title in snippet:", title);
        return title;
      }
      
      // Check for variant with "Senior" prefix
      const seniorTitle = "Senior " + title;
      if (snippet.includes(seniorTitle)) {
        console.log("Found senior job title in snippet:", seniorTitle);
        return seniorTitle;
      }
    }
  }
  
  // Extract SaaS-related titles
  if (snippet && snippet.includes("SaaS") && 
      (snippet.includes("sales") || snippet.includes("Sales") || 
       snippet.includes("account") || snippet.includes("Account"))) {
    return "Sales Professional";
  }
  
  // Look for LinkedIn specific format in snippet: Role · Company
  const roleCompanyPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Manager|Director|Executive|Engineer|Developer|Designer|Consultant|Specialist|Analyst|Advisor|Agent|Lead|Chief|Officer|Account|Sales|Marketing)))\s*[·•]/;
  if (snippet) {
    const match = snippet.match(roleCompanyPattern);
    if (match && match[1]) {
      const extractedTitle = match[1].trim();
      if (isLikelyJobTitle(extractedTitle)) {
        console.log("Found job title from LinkedIn format:", extractedTitle);
        return cleanJobTitle(extractedTitle);
      }
    }
  }
  
  // Last attempt: look for specific keywords in the snippet
  if (snippet) {
    const sales = /\b(?:sales|försäljning)\b/i.test(snippet);
    const business = /\b(?:business|affär)\b/i.test(snippet);
    const development = /\b(?:development|utveckling)\b/i.test(snippet);
    const manager = /\b(?:manager|chef)\b/i.test(snippet);
    const account = /\b(?:account|kund)\b/i.test(snippet);
    const executive = /\b(?:executive|chef)\b/i.test(snippet);
    const director = /\b(?:director|direktör)\b/i.test(snippet);
    const senior = /\b(?:senior|experienced)\b/i.test(snippet);
    const junior = /\b(?:junior|associate)\b/i.test(snippet);
    
    let extractedTitle = '';
    
    if (sales && account && executive) {
      extractedTitle = "Account Executive";
    } else if (sales && manager) {
      extractedTitle = "Sales Manager";
    } else if (sales && director) {
      extractedTitle = "Sales Director";
    } else if (business && development && manager) {
      extractedTitle = "Business Development Manager";
    } else if (business && development) {
      extractedTitle = "Business Developer";
    } else if (account && manager) {
      extractedTitle = "Account Manager";
    } else if (sales) {
      extractedTitle = "Sales Representative";
    } else if (manager) {
      extractedTitle = "Manager";
    } else if (director) {
      extractedTitle = "Director";
    } else if (executive) {
      extractedTitle = "Executive";
    }
    
    // Add seniority prefix if detected
    if (extractedTitle) {
      if (senior && !extractedTitle.includes("Senior")) {
        extractedTitle = "Senior " + extractedTitle;
      } else if (junior && !extractedTitle.includes("Junior")) {
        extractedTitle = "Junior " + extractedTitle;
      }
      
      return extractedTitle;
    }
  }
  
  console.log("No job title found");
  return "";
}

// Helper to clean and normalize job titles
function cleanJobTitle(title: string): string {
  if (!title) return "";
  
  // Check if title is "Not available" or similar
  if (/^not\s+available$/i.test(title)) {
    return ""; // Return empty string so we can try other extraction methods
  }
  
  // Remove LinkedIn specific suffixes
  let cleaned = title
    .replace(/\s+at\s+.+$/i, "")
    .replace(/\s+\|\s+.+$/i, "")
    .replace(/\s+-\s+.+$/i, "")
    .replace(/\s+–\s+.+$/i, "")
    .replace(/\s+•\s+.+$/i, "");
  
  // Remove any dates, e.g., "Jun 2020 - Present" or "May 2023"
  cleaned = cleaned.replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}(?:\s*[-–]\s*(?:Present|Current|Now|\d{4}))?/i, "");
  
  // Remove industry references
  cleaned = cleaned.replace(/\b(?:SaaS|Financials?|Technology|Tech|Software|Banking|Insurance|Healthcare|Manufacturing|Education|Retail|Finance|Marketing|IT|Telecommunications|Telecom|AI|Cloud|Automotive|Sales|Industry)\b(?:\s+Industry)?/i, "");
  
  // Remove location information (cities, countries, areas)
  cleaned = cleaned.replace(/\b(?:in|at|from|for)\s+(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i, "");
  cleaned = cleaned.replace(/\b(?:North|South|East|West|Central|Northern|Southern|Eastern|Western)\s+(?:Europe|America|Asia|Africa|Australia)\b/i, "");
  cleaned = cleaned.replace(/\b(?:Sweden|Stockholm|Gothenburg|Malmö|Oslo|Copenhagen|Finland|Norway|Denmark|USA|Europe|Nordic|EMEA|DACH|UK|London)\b/i, "");
  cleaned = cleaned.replace(/\b(?:Global|Regional|Local|International|National|Nationwide|Worldwide)\b/i, "");
  
  // Remove ellipses and periods at the end of the title
  cleaned = cleaned.replace(/\.{3,}|\…/g, "");
  cleaned = cleaned.replace(/\.\s*$/g, "");
  
  // Remove any parentheses and their content
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, " ");
  
  // Remove any bracket content
  cleaned = cleaned.replace(/\s*\[[^\]]*\]\s*/g, " ");
  
  // Remove common unnecessary words
  cleaned = cleaned.replace(/\b(?:experienced|certified|professional|qualified|skilled|dedicated|passionate|a|an|the|position|role|for|currently|previously|working|as)\b/i, "");
  
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // Remove any trailing symbols or commas
  cleaned = cleaned.replace(/[.,;:!\?]\s*$/, "").trim();
  
  // Apply some standardization for common job titles
  // This helps ensure consistency across different extraction methods
  if (/\baccount\s+executive\b/i.test(cleaned)) {
    cleaned = "Account Executive";
  } else if (/\bsales\s+manager\b/i.test(cleaned)) {
    cleaned = "Sales Manager";
  } else if (/\bbusiness\s+development\s+manager\b/i.test(cleaned)) {
    cleaned = "Business Development Manager";
  } else if (/\bregional\s+sales\s+manager\b/i.test(cleaned)) {
    cleaned = "Regional Sales Manager";
  } else if (/\bceo\b/i.test(cleaned)) {
    cleaned = "CEO";
  } else if (/\bcto\b/i.test(cleaned)) {
    cleaned = "CTO";
  } else if (/\bcfo\b/i.test(cleaned)) {
    cleaned = "CFO";
  } else if (/\bcoo\b/i.test(cleaned)) {
    cleaned = "COO";
  } else if (/\bvd\b/i.test(cleaned)) {
    cleaned = "VD";
  } else if (/\bsäljchef\b/i.test(cleaned)) {
    cleaned = "Säljchef";
  } else if (/\bsales\s+representative\b/i.test(cleaned) || /\bsales\s+rep\b/i.test(cleaned)) {
    cleaned = "Sales Representative";
  } else if (/\bproduct\s+manager\b/i.test(cleaned)) {
    cleaned = "Product Manager";
  } else if (/\bproject\s+manager\b/i.test(cleaned)) {
    cleaned = "Project Manager";
  } else if (/\bsoftware\s+engineer\b/i.test(cleaned)) {
    cleaned = "Software Engineer";
  } else if (/\baccount\s+manager\b/i.test(cleaned)) {
    cleaned = "Account Manager";
  } else {
    // If no standardization match, ensure proper capitalization
    cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase());
  }
  
  // If nothing is left, return empty string
  if (!cleaned || cleaned.length < 2) return "";
  
  return cleaned;
}

// Helper function to extract company from search result
function extractCompanyFromResult(result: ISearchResult): string {
  const { title = '', snippet = '' } = result;
  
  // Company patterns to search for in title
  const titlePatterns = [
    // Match LinkedIn title pattern: "Name - Title - Company"
    /(?:[^-]+)\s+-\s+(?:[^-]+)\s+-\s+([^-]+)/,
    
    // Match LinkedIn title pattern with "at": "Name - Title at Company"
    /(?:[^-]+)\s+-\s+.+?\s+(?:at|@)\s+(.+)/,
    
    // Match LinkedIn title pattern with position: "Name – Title – Company"
    /(?:[^–]+)\s+–\s+(?:[^–]+)\s+–\s+([^–]+)/,
    
    // Match LinkedIn title pattern with pipe: "Name | Title | Company"
    /(?:[^|]+)\s+\|\s+(?:[^|]+)\s+\|\s+([^|]+)/
  ];
  
  // Try to extract from title first
  for (const pattern of titlePatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (company !== "LinkedIn" && !company.includes("LinkedIn")) { // Avoid false matches with "| LinkedIn"
        return cleanCompanyName(company);
      }
    }
  }
  
  // Try to extract from snippet
  const snippetPatterns = [
    // Match company after position in snippet
    /(?:at|@|hos|på|med|with|for)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)/i,
    
    // Match company after "Experience:"
    /Experience:\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)/i,
    
    // Match company with date pattern
    /([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)[.,]\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
    
    // Match LinkedIn specific format: "Role · Company"
    /[·•]\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)/i,
    
    // Match company after employment duration
    /(?:\d+\s+(?:year|month)s?(?:\s+\d+\s+(?:year|month)s?)?)\s+at\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)/i,
    
    // Match common Swedish company patterns
    /(?:arbetar på|jobbar hos|anställd på|anställd hos)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)/i
  ];
  
  for (const pattern of snippetPatterns) {
    const match = snippet.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (!isLikelyJobTitle(company) && company !== "LinkedIn" && company.length > 1 && !company.includes("LinkedIn")) {
        return cleanCompanyName(company);
      }
    }
  }
  
  return "";
}

// Helper to clean and normalize company names
function cleanCompanyName(company: string): string {
  if (!company) return "";
  
  // Remove trailing punctuation
  let cleaned = company.replace(/[.,;:!?]\s*$/, "").trim();
  
  // Remove "LinkedIn" trailing text
  cleaned = cleaned.replace(/\s+LinkedIn$/, "").trim();
  
  // Remove any dates or numbers at the end
  cleaned = cleaned.replace(/\s+\d[\d\s\-–]*$/, "").trim();
  
  // Remove common endings
  cleaned = cleaned.replace(/\s+(?:homepage|website|official|page)$/, "").trim();
  
  return cleaned;
}

export default extractProfileDataFromSearchResults;
