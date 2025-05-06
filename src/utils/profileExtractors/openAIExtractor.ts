import { ExtractedProfile, SearchResultItem } from "./types";
import { normalizeLinkedInUrl } from "./urlNormalizer";
import { extractProfileInfo } from "../profileExtractor";

/**
 * Extract company name from text input using regular expressions
 */
function extractCompanyFromSnippet(input: string): string {
  if (!input) return "";
  
  console.log(`DIAGNOSTIK: Extraherar företag från: "${input}"`);
  
  // Lista över kända legitima företag som ska accepteras även om de ser ut att matcha ogiltiga mönster
  const knownCompanies = [
    "Microsoft", "IBM", "Apple", "Google", "Amazon", "Facebook", "Meta", "Tesla", "Volvo", 
    "ABB", "Ericsson", "Siemens", "General Electric", "GE", "Dell", "HP", "Oracle", 
    "SAP", "Salesforce", "Adobe", "Cisco", "Intel", "AMD", "NVIDIA", "Sony", "Samsung", 
    "LG", "Nokia", "Huawei", "Telia", "Telenor", "Tele2", "3M", "Spotify", "Netflix", 
    "Klarna", "Zalando", "H&M", "IKEA", "BMW", "Mercedes", "Audi", "Volkswagen", "Toyota", 
    "Honda", "Ford", "Chevrolet", "GM", "Shell", "BP", "Equinor", "Aker", "DNB", "SEB", 
    "Nordea", "KPMG", "EY", "PwC", "Deloitte", "McKinsey", "BCG", "Accenture", "Capgemini", 
    "TCS", "Infosys", "Wipro", "Cognizant", "HCL", "Tech Mahindra", "CGI", "Fujitsu", 
    "NEC", "Hitachi", "Mitsubishi", "Panasonic", "Philips", "Bosch", "Schneider Electric", 
    "ABB", "Schneider", "Honeywell", "Johnson Controls", "Schlumberger", "Sotera", "RiksTV", 
    "Enhanced Drilling", "Fluke", "Pumpeteknikk", "Morrow Batteries", "Planet", "Novenco Marine", 
    "Chromalox", "Scanjet", "Caldic", "Tandberg Television", "Kahoot", "Böhler Welding", 
    "Wilhelmsen Ships", "Bama", "Nippon Gases", "Radiocrafts", "Dynea", "Digiprom", "Coromatic", 
    "Melbye", "Convene", "Sony", "Dell Technologies", "Telenor Linx", "Varnish Software", 
    "Hanwha Vision", "Opera", "NRK", "Nemko", "TD SYNNEX", "GEA", "Siemens Energy",
    "The Well", "Schneider Electric", "Emerson", "CARLZENT", "Mooring", "SF Solution"
  ];
  
  // Svartlista med termer som aldrig kan vara företag
  const blacklistedTerms: string[] = [
    "end", "location", "place", "sted", "plats", "experience", "erfaring", "erfarenhet", 
    "experiencia", "expérience", "utdanning", "utbildning", "education", "free", "gratis", 
    "not available", "unknown", "over", "under", "using", "uses", "work", "working", "job", 
    "jobs", "technical", "sales", "distribution", "professional", "profile", "profil", 
    "formation", "background", "you", "they", "we", "us", "me", "my", "your", "their", 
    "i", "linkedin", "title", "role", "position", "assignment", "uppdrag", "project", 
    "projekt", "product", "produkt", "service", "tjänst", "avdelning", "department", 
    "team", "group", "division", "enhet", "unit", "none", "nothing", "part", "solutions", 
    "services", "n/a", "information", "info", "search", "sök", "homepage", "website", 
    "official", "page", "sida", "territory", "their", "easy", "efficient", "projects",
    "years", "months", "year", "month", "år", "månader", "sedan", "ago", "opps",
    "saas", "cybersecurity", "technology", "tech", "it", "fintech", "healthcare", "software", 
    "consulting", "konsulting", "marketing", "marknadsföring", "security", "showtagtv", 
    "foodtech", "digital", "television", "sjömat", "wheelme", "nutrition", "solution", 
    "data", "automotive", "retail", "finans", "finance", "bank", "banking", "transport", 
    "logistics", "logistik", "gdpr", "e-commerce", "ecommerce", "e-handel", "försäljning", 
    "media", "social media", "ai", "ml", "ux", "ui", "cloud", "b2b", "b2c", "platform", 
    "plattform", "internet", "web", "telecom", "telekom", "gaming", "pharma", "blockchain", 
    "safety", "suppling", "proffselger", "ilmoita", "national", "interim", "don", "det", "de"
  ];
  
  // Kontrollera först om det matchar något känt företag (positiv lista)
  for (const company of knownCompanies) {
    if (input.toLowerCase().includes(company.toLowerCase())) {
      console.log(`DIAGNOSTIK: Känt företag hittades: "${company}"`);
      return company;
    }
  }
  
  // Immediate check for common Norwegian terms that are often misclassified as companies
  const commonNorwegianTerms = ["erfaring", "erfarenhet", "sted", "det", "don", "jobb", "de"];
  
  for (const term of commonNorwegianTerms) {
    // Check if input consists only of this Norwegian term (case-insensitive)
    if (input.trim().toLowerCase() === term) {
      console.log(`DIAGNOSTIK: Norsk term avvisat direkt: "${input}"`);
      return "";
    }
  }
  
  // Company patterns to search for (i prioritetsordning)
  const patterns = [
    // Svenska specifika företagsmönster (företag med AB i namnet)
    /\b([A-Z][A-Za-z0-9.&\-]+(?:\s+[A-Za-z0-9.&\-]+){0,4})\s+AB\b/i,
    
    // LinkedIn company format with common prepositions
    /(?:hos|på|at|with|for)\s+([A-Z][A-Za-z0-9.&\-]+(?:\s+[A-Za-z0-9.&\-]+){0,5})\s*(?:AB|AS|ASA|Oy|Inc|LLC|Ltd|GmbH|SA|BV|NV|PLC|Co\.?|Group|Gruppen)?/i,
    
    // LinkedIn-format med punkt eller liknande
    /[·•]\s+([A-Z][A-Za-z0-9.&\-]+(?:\s+[A-Za-z0-9.&\-]+){0,4})\b/i,
    
    // Company with common endings
    /\b([A-Z][A-Za-z0-9.&\-]+(?:\s+[A-Za-z0-9.&\-]+){0,4})\s+(?:AB|AS|ASA|Oy|Inc|LLC|Ltd|GmbH|SA|BV|NV|PLC)\b/i,
    
    // Efter erfarenhet/anställning
    /(?:Experience|Erfarenhet|Erfaring|Employment|Anställning):\s+([A-Z][A-Za-z0-9.&\-]+(?:\s+[A-Za-z0-9.&\-]+){0,4})/i,
    
    // Company med datum
    /([A-Z][A-Za-z0-9.&\-]+(?:\s+[A-Za-z0-9.&\-]+){0,4})[.,]\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
    
    // Efter anställningslängd
    /(?:\d+\s+(?:year|month|år|månad)s?(?:\s+\d+\s+(?:year|month|år|månad)s?)?)\s+(?:at|på|hos)\s+([A-Z][A-Za-z0-9.&\-]+(?:\s+[A-Za-z0-9.&\-]+){0,4})/i,
    
    // Svenska jobbmönster
    /(?:arbetar på|jobbar hos|anställd på|anställd hos|arbetar för|jobbar för|konsult på|konsult hos)\s+([A-Z][A-Za-z0-9.&\-]+(?:\s+[A-Za-z0-9.&\-]+){0,4})/i
  ];
  
  // Första försöket - hitta med regex
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      console.log(`DIAGNOSTIK: Mönstermatchning hittade: "${company}"`);
      
      // Special check for exact matches against Norwegian terms
      if (commonNorwegianTerms.includes(company.toLowerCase())) {
        console.log(`DIAGNOSTIK: Avvisat företagsnamn "${company}" (norsk term)`);
        continue;
      }
      
      // Kontrollera om det matchar något i svartlistan
      if (isBlacklisted(company, blacklistedTerms)) {
        console.log(`DIAGNOSTIK: Avvisat företagsnamn "${company}" (svartlistad term)`);
        continue;
      }
      
      // Kontrollera om det är ett företag och inte en titel/plats
      if (!isLikelyJobTitle(company) && !isLikelyLocation(company) && !isLikelyIndustryOrDepartment(company) && 
          company !== "LinkedIn" && company.length > 2 && !company.includes("LinkedIn")) {
        const cleaned = cleanCompanyName(company);
        console.log(`DIAGNOSTIK: Validerat företagsnamn från regex: "${cleaned}"`);
        
        // Extra validering för korta företagsnamn (mindre än 4 tecken)
        if (cleaned.length < 4 && !isWellKnownShortCompany(cleaned)) {
          console.log(`DIAGNOSTIK: Avvisat kort företagsnamn "${cleaned}" (ej välkänt kort företag)`);
          continue;
        }
        
        // Dubbel validering - kontrollera svartlistan igen efter rengöring
        if (isBlacklisted(cleaned, blacklistedTerms)) {
          console.log(`DIAGNOSTIK: Avvisat företagsnamn "${cleaned}" (svartlistad term efter rengöring)`);
          continue;
        }
        
        // Do a final check for common Norwegian terms but with exact matching
        if (commonNorwegianTerms.some(term => cleaned.toLowerCase() === term)) {
          console.log(`DIAGNOSTIK: Avvisat företagsnamn "${cleaned}" (exakt match med norsk term)`);
          continue;
        }
        
        return cleaned;
      } else {
        console.log(`DIAGNOSTIK: Avvisat matchning "${company}" (troligen titel/plats/bransch)`);
      }
    }
  }
  
  console.log("DIAGNOSTIK: Ingen valid företagsmatchning hittades");
  return "";
}

/**
 * Check if a company name matches any blacklisted term
 */
function isBlacklisted(companyName: string, blacklistedTerms: string[]): boolean {
  const companyLower = companyName.toLowerCase();
  
  // Exakt match
  if (blacklistedTerms.some((term: string) => companyLower === term.toLowerCase())) {
    return true;
  }
  
  // Börjar med blacklisted term
  if (blacklistedTerms.some((term: string) => companyLower.startsWith(term.toLowerCase() + " "))) {
    return true;
  }
  
  // Slutar med blacklisted term
  if (blacklistedTerms.some((term: string) => companyLower.endsWith(" " + term.toLowerCase()))) {
    return true;
  }
  
  // Innehåller blacklisted term som ett eget ord
  if (blacklistedTerms.some((term: string) => companyLower.includes(" " + term.toLowerCase() + " "))) {
    return true;
  }
  
  // Extra kontroller för korta ord (mindre än 5 tecken)
  if (companyName.length < 5) {
    return !isWellKnownShortCompany(companyName);
  }
  
  return false;
}

/**
 * Extract potential company names using various heuristics
 */
function extractPotentialCompanies(input: string): string[] {
  if (!input) return [];
  
  const companies: string[] = [];
  
  // Split på vanliga skiljetecken
  const sentences = input.split(/[.,;:!?·•]/);
  
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    
    // Leta efter enheter med minst två ord där första ordet börjar med stor bokstav
    for (let i = 0; i < words.length - 1; i++) {
      if (/^[A-Z]/.test(words[i]) && words[i].length > 1) {
        // Kontrollera potentiella företagsnamn med 2-3 ord
        for (let length = 1; length <= 3 && i + length <= words.length; length++) {
          const potential = words.slice(i, i + length).join(" ");
          
          // Kontrollera om det ser ut som ett företagsnamn
          if (isPotentialCompanyName(potential)) {
            companies.push(potential);
          }
        }
      }
    }
    
    // Enskilda ord som kan vara företag (med stor bokstav, minst 4 tecken, inte vanliga ord)
    for (const word of words) {
      if (/^[A-Z][a-z]{3,}$/.test(word) && !isCommonWord(word) && isPotentialCompanyName(word)) {
        companies.push(word);
      }
    }
  }
  
  return companies;
}

/**
 * Check if a string is likely a company name based on heuristics
 */
function isPotentialCompanyName(text: string): boolean {
  if (!text || text.length < 2) return false;
  
  // Typiska företagsändelser
  const companyEndings = [
    "AB", "AS", "ASA", "Oy", "Inc", "LLC", "Ltd", "GmbH", "SA", "BV", "NV", "PLC", 
    "Company", "Group", "Gruppen", "Solutions", "Systems", "Technologies", "Tech",
    "Software", "Consulting", "Services", "Partners", "Networks", "Communications"
  ];
  
  // Kontrollera om texten slutar med en företagsändelse
  for (const ending of companyEndings) {
    if (text.endsWith(` ${ending}`)) return true;
  }
  
  // Kontrollera camelCase eller PascalCase (vanligt för tech-företag)
  if (/[a-z][A-Z]/.test(text)) return true;
  
  // Kontrollera företagsliknande ord i texten
  const companyWords = ["Tech", "Technologies", "Software", "Systems", "Digital", "Global", "Solutions", "Data"];
  for (const word of companyWords) {
    if (text.includes(word)) return true;
  }
  
  // Andra heuristiker som kan indikera företag
  return (
    // Inget företag är ett enda litet ord
    (text.length > 4 && /^[A-Z]/.test(text)) ||
    // Förkortningar i stora bokstäver (IBM, SAP, etc)
    /^[A-Z]{2,}$/.test(text) ||
    // Ord med siffror är ofta produktnamn eller företag
    /\d/.test(text) ||
    // Ord med & är ofta företag
    text.includes("&")
  );
}

/**
 * Check if a word is a common non-company word
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    "The", "And", "For", "With", "From", "About", "Through", "Between",
    "After", "Before", "Under", "Over", "During", "Within", "Without",
    "Experience", "Erfarenhet", "Erfaring", "Profile", "Profil", "Profile",
    "Education", "Utbildning", "Utdanning", "Skills", "Kompetens", "Ferdigheter",
    "Project", "Projekt", "Senior", "Junior", "Manager", "Director", "Engineer",
    "University", "Universitet"
  ];
  
  return commonWords.some(common => common.toLowerCase() === word.toLowerCase());
}

/**
 * Check if a string is likely a job title rather than a company
 */
function isLikelyJobTitle(text: string): boolean {
  const jobTitleIndicators = [
    /manager/i, /director/i, /executive/i, /developer/i, 
    /engineer/i, /consultant/i, /specialist/i, /chef/i, 
    /ceo/i, /cto/i, /cfo/i, /coo/i, /vd/i, /chief/i,
    /lead/i, /leader/i, /head/i, /advisor/i, /strategist/i,
    /analyst/i, /designer/i, /architect/i, /officer/i,
    /professional/i, /expert/i, /advisor/i, /consult/i,
    /koordinator/i, /samordnare/i, /ledare/i, /ansvarig/i,
    /projektledare/i, /säljare/i, /controller/i, /styrman/i,
    /utredare/i, /student/i, /praktikant/i, /trainee/i,
    /owner/i, /president/i, /grundare/i, /founder/i, /partner/i,
    /associate/i, /employment/i, /anställning/i, /position/i, 
    /tjänst/i, /uppdrag/i, /assignment/i, /project/i, /team/i,
    /konsult/i, /account/i, /sales/i, /marketing/i, /marknad/i,
    /product/i, /senior/i, /junior/i, /mid/i, /principal/i,
    /tech/i, /technical/i, /teknisk/i, /business/i, /utvecklare/i,
    /driver/i, /servicetekniker/i, /service/i, /support/i, /coach/i,
    /administrator/i, /administration/i, /program/i, /campaign/i,
    /security/i, /säkerhet/i, /development/i, /utveckling/i,
    /pre-sales/i, /presales/i, /försäljning/i, /responsibility/i,
    /compliance/i, /management/i, /enterprise/i, /clients/i, /smes/i
  ];
  
  // Common job title words as exact matches
  const exactTitleWords = [
    "Manager", "Director", "Engineer", "Developer", "Specialist", 
    "Consultant", "Advisor", "Lead", "President", "Owner", "Founder",
    "Partner", "Associate", "Analyst", "Designer", "Student", "Intern",
    "Trainee", "Praktikant", "Chef", "Ledare", "Utvecklare", "Säljare",
    "Konsult", "CTO", "CEO", "CFO", "COO", "CIO", "VD", "Experience",
    "Erfaring", "Erfarenhet", "Account", "Success", "Regional", "Enterprise",
    "Nordic", "Territory", "Sales", "Technical", "Responsibility", "Sr",
    "Senior"
  ];
  
  // Check for exact matches (case insensitive)
  if (exactTitleWords.some(word => text.toLowerCase() === word.toLowerCase())) {
    return true;
  }
  
  // Check for patterns
  return jobTitleIndicators.some(pattern => pattern.test(text));
}

/**
 * Check if text is likely a location instead of a company
 */
function isLikelyLocation(text: string): boolean {
  const commonLocations = [
    "Stockholm", "Göteborg", "Gothenburg", "Malmö", "Uppsala", "Västerås",
    "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund",
    "Umeå", "Gävle", "Borås", "Sundsvall", "Eskilstuna", "Södertälje",
    "Karlstad", "Växjö", "Luleå", "Östersund", "Borlänge", "Falun",
    "Sweden", "Sverige", "Norge", "Norway", "Denmark", "Danmark", "Finland",
    "Iceland", "Oslo", "Copenhagen", "Helsinki", "Reykjavik", "Europe", "Europa",
    "Nordic", "Nordics", "Norden", "Scandinavia", "Skandinavien", 
    "Remote", "Distans", "Remotely", "Anywhere", "Virtual", "Global", "Regional", "Local",
    "International", "Nationwide", "Worldwide", "US", "USA", "UK", "London", "Berlin",
    "Paris", "Amsterdam", "Brussels", "Madrid", "Rome", "Milan", "Frankfurt", "Munich",
    "Vienna", "Zürich", "Geneva", "Brussels", "Luxembourg", "Dublin", "Stockholm County",
    "Stockholms län", "Stockholmsområdet", "Greater Stockholm", "Area", "Region", "Greater",
    "County", "Län", "Kommun", "Municipality"
  ];
  
  // Check if text exactly matches any location (case insensitive)
  return commonLocations.some(
    location => text.toLowerCase() === location.toLowerCase() ||
    text.toLowerCase().includes(location.toLowerCase())
  );
}

/**
 * Check if text is likely an industry or department description
 */
function isLikelyIndustryOrDepartment(text: string): boolean {
  const industryTerms = [
    "Technology", "Teknologi", "Software", "IT", "Tech", "Hardware", 
    "Cybersecurity", "Security", "Säkerhet", "Finance", "Financial", "Banking", 
    "Finans", "Healthcare", "Healthcare", "Sjukvård", "Education", "Utbildning", 
    "Retail", "Detaljhandel", "Manufacturing", "Tillverkning", "Marketing", 
    "Marknadsföring", "Sales", "Försäljning", "Consulting", "Konsulting", 
    "Legal", "Juridik", "Telecommunications", "Telekom", "Automotive", "Fordon", 
    "Pharmaceutical", "Läkemedel", "Insurance", "Försäkring", "Energy", "Energi", 
    "Consumer Goods", "Konsumentvaror", "Media", "Entertainment", "Underhållning", 
    "Logistics", "Logistik", "Transport", "Aerospace", "Flyg", "Agriculture", 
    "Jordbruk", "Construction", "Bygg", "Defence", "Försvar", "Hospitality", 
    "Restaurang", "Hotel", "Hotell", "Electronics", "Elektronik", "Gaming", "Spel", 
    "Food", "Mat", "Beverage", "Dryck", "Dryckes", "University", "Universitet", 
    "School", "Skola", "College", "Institute", "Institut", "Academy", "Akademi",
    "Department", "Avdelning", "HR", "Human Resources", "Ekonomi", "Economics",
    "Research", "Forskning", "Development", "Utveckling", "R&D", "RnD", "FoU",
    "Customer Experience", "Kundupplevelse", "Customer Service", "Kundtjänst",
    "Project", "Projekt", "Product", "Produkt", "Experience", "Erfaring", "Erfarenhet",
    "Clients", "Kunder", "SMEs", "SMB", "Enterprise", "Account", "Success", "Regional", 
    "Territory", "Compliance", "Responsibility", "Management", "Digital", "Nordic",
    "Scandinavia", "Professional", "Services", "Area", "Region", "District", "Global"
  ];

  // Check if text exactly matches any industry term (case insensitive)
  return industryTerms.some(
    term => text.toLowerCase() === term.toLowerCase() ||
    text.toLowerCase().includes(term.toLowerCase())
  );
}

/**
 * Check if a short company name is a well-known abbreviation
 */
function isWellKnownShortCompany(name: string): boolean {
  const wellKnownShortCompanies = [
    "IBM", "SAP", "HP", "ABB", "BMW", "KFC", "CNN", "BBC", "CBS", "H&M", 
    "LG", "3M", "SNS", "AXA", "UBS", "RBC", "SEB", "BNP", "EY", "PwC",
    "GE", "GM"
  ];
  
  return wellKnownShortCompanies.includes(name.toUpperCase());
}

/**
 * Clean company name by removing irrelevant parts
 */
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
  
  // Remove vanliga icke-företagsord från slutet
  cleaned = cleaned.replace(/\s+(?:experience|erfarenhet|erfaring|experiencia|expérience)$/i, "").trim();
  cleaned = cleaned.replace(/\s+(?:in|i|at|på|hos|for|för|med|with)$/i, "").trim();
  cleaned = cleaned.replace(/\s+(?:location|plats|sted|area|region|district|territory)$/i, "").trim();
  
  // Standardize company suffixes (leave them in but standardize format)
  cleaned = cleaned.replace(/\s+(?:AB|Inc\.|LLC|Ltd\.|Limited|GmbH|AS|ASA|Oy|A\/S)$/, function(match) {
    return match.trim(); // Lämna suffixen men ta bort extra mellanslag
  }).trim();
  
  return cleaned;
}

/**
 * Extract a job title from input
 */
function extractTitleFromInput(input: string): string {
  if (!input) return "Unknown Title";
  
  // First, try to extract title from patterns
  const titlePatterns = [
    // "Name - Title at Company" pattern
    /\s+-\s+([^-]+?)\s+(?:at|@|hos|på)\s+/i,
    
    // "Title at Company" pattern
    /^([A-Za-z\s.,]+?)\s+(?:at|@|hos|på)\s+/i,
    
    // "Title in Location" pattern
    /^([A-Za-z\s.,]+?)\s+(?:in|i)\s+/i,
    
    // "Title | Company" pattern
    /^([^|]+?)\s+\|\s+/i,
    
    // "Title - Company" pattern
    /^([^-]+?)\s+-\s+/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = input.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      return match[1].trim();
    }
  }
  
  // If no patterns match, use a fallback approach
  const titleKeywords = [
    "Manager", "Director", "Engineer", "Developer", 
    "Consultant", "Specialist", "Executive", "Analyst",
    "Designer", "Advisor", "Coordinator", "Lead"
  ];
  
  const words = input.split(/\s+/);
  for (const keyword of titleKeywords) {
    const index = words.findIndex(word => 
      word.toLowerCase() === keyword.toLowerCase());
    
    if (index !== -1) {
      // Found a title keyword, try to extract a reasonable title around it
      const start = Math.max(0, index - 1);
      const end = Math.min(words.length, index + 2);
      const possibleTitle = words.slice(start, end).join(" ");
      if (possibleTitle.length > 0) {
        return possibleTitle;
      }
    }
  }
  
  // Last resort: take first few words if they're not a name
  const firstFewWords = words.slice(0, 3).join(" ");
  if (firstFewWords.length > 0 && !firstFewWords.includes("LinkedIn")) {
    return firstFewWords;
  }
  
  return "Unknown Title";
}

// Create a comprehensive list of Scandinavian terms that are commonly miscategorized as companies
const scandinavianPhrases = [
  // Norwegian terms
  'erfaring', 'sted', 'stilling', 'ansatt', 'ansattelse', 'deltid', 'nåværende', 
  'tidligere', 'utdanning', 'kompetanse', 'ferdigheter', 'språk', 'arbeidserfaring',
  'prosjekt', 'prosjekter', 'ansvar', 'lederansvar', 'fagområde', 'faglig', 'samarbeid',
  
  // Swedish terms
  'erfarenhet', 'plats', 'anställning', 'tidigare', 'nuvarande', 'utbildning', 'kompetens',
  'färdigheter', 'arbetslivserfarenhet', 'projekt', 'ansvar', 'ledarskap', 'område', 'samarbete',
  
  // Danish terms
  'erfaring', 'sted', 'stilling', 'ansat', 'uddannelse', 'tidligere', 'nuværende', 'kompetencer',
  'færdigheder', 'projekter', 'ansvar', 'ledelse', 'område', 'samarbejde'
];

// Define base blacklisted terms if not already defined
const baseBlacklistedTerms = [
  "not available", "n/a", "none", "null", "undefined", "unknown", "end", "start",
  "begin", "head", "bottom", "top", "introduction", "summary", "conclusion",
  "experience", "position", "location", "work", "education", "school", "university",
  "college", "distribution", "wheelme", "foodtech", "sjømat", "erfaring", "jobb",
  "det", "don", "sted", "plats", "de"
];

// Expand with additional terms
const additionalTerms = [
  // Basic invalid terms
  'not available', 'n/a', 'none', 'null', 'undefined', 'unknown', '-', '...',
  'no company', 'no information', 'tbd', 'pending', 'freelance', 'self-employed',
  
  // Linkedin profile components
  'profile', 'summary', 'experience', 'education', 'skills', 'recommendations',
  'accomplishments', 'interests', 'publications', 'certifications', 'volunteer',
  'courses', 'projects', 'languages', 'organizations', 'patents', 'test scores',
  'connections', 'following', 'activity', 'contact info', 'details', 'background',
  
  // Job descriptors
  'job title', 'position', 'role', 'occupation', 'profession', 'employment', 
  'work history', 'career', 'job description', 'responsibilities', 'duties',
  
  // Location terms
  'location', 'address', 'city', 'country', 'region', 'area', 'district', 'territory',
  'zone', 'locality', 'place', 'site', 'headquarters', 'hq', 'office', 'branch',
  'remote', 'hybrid', 'onsite', 'work from home', 'wfh', 'remote work',
  
  // Temporal terms
  'currently', 'previously', 'formerly', 'past', 'present', 'now', 'then',
  'current', 'former', 'ex', 'previous', 'recent', 'latest', 'last', 'next',
  
  // Common prefixes/suffixes that indicate non-companies
  'senior', 'junior', 'lead', 'chief', 'head of', 'director of', 'manager of',
  'specialist in', 'expert in', 'professional in', 'certified', 'licensed',
  'sr', 'jr', 'sme', 'executive', 'responsible for', 'focusing on', 'working with',
  'regional', 'national', 'international', 'global',
  
  // Descriptive phrases that appear in company field
  'years of experience', 'with experience in', 'specializes in', 'expert at',
  'responsible for', 'working with', 'driving innovation', 'creating value',
  'delivering solutions', 'passionate about', 'dedicated to', 'committed to',
  'results-oriented', 'goal-driven', 'customer-focused', 'solution-oriented',
  
  // Industry terms (expanded)
  'digital', 'analytics', 'marketing', 'sales', 'finance', 'accounting', 'legal',
  'hr', 'human resources', 'it', 'information technology', 'engineering', 'design',
  'product', 'project', 'program', 'portfolio', 'operations', 'logistics', 'supply chain',
  'procurement', 'purchasing', 'manufacturing', 'production', 'quality', 'compliance',
  'regulatory', 'safety', 'security', 'health', 'healthcare', 'medical', 'pharma',
  'pharmaceutical', 'biotech', 'biotechnology', 'research', 'development', 'r&d',
  'innovation', 'strategy', 'strategic', 'planning', 'business', 'management',
  'administration', 'executive', 'leadership', 'customer', 'client', 'service',
  'support', 'success', 'account', 'relationship', 'communication', 'media',
  'content', 'creative', 'brand', 'social', 'digital', 'online', 'web', 'mobile',
  'software', 'hardware', 'network', 'infrastructure', 'cloud', 'data', 'database',
  'ai', 'artificial intelligence', 'ml', 'machine learning', 'nl', 'natural language',
  'cv', 'computer vision', 'iot', 'internet of things', 'blockchain', 'crypto',
  'cryptocurrency', 'fintech', 'technology', 'tech', 'telecom', 'telecommunications',
  'retail', 'ecommerce', 'e-commerce', 'hospitality', 'travel', 'tourism', 'food',
  'beverage', 'restaurant', 'hotel', 'education', 'training', 'teaching', 'consulting',
  'consultancy', 'advisory', 'analyst', 'analytics', 'insights', 'reporting', 'bi',
  'business intelligence', 'real estate', 'property', 'construction', 'architecture',
  'interior', 'exterior', 'landscape', 'urban', 'civil', 'mechanical', 'electrical',
  'chemical', 'environmental', 'sustainability', 'green', 'renewable', 'energy',
  'oil', 'gas', 'petroleum', 'mining', 'metals', 'materials', 'automotive', 'aerospace',
  'aviation', 'transportation', 'logistics', 'shipping', 'freight', 'import', 'export',
  'international', 'global', 'local', 'regional', 'national', 'government', 'public',
  'private', 'ngo', 'non-profit', 'charity', 'foundation', 'organization', 'organisation',
  'cybersecurity', 'saas', 'software as a service', 'paas', 'platform as a service',
  'iaas', 'infrastructure as a service', 'devops', 'devsecops', 'agile', 'scrum',
  'kanban', 'waterfall', 'lean', 'six sigma', 'project management', 'program management',
  'portfolio management', 'change management', 'knowledge management', 'crm',
  'customer relationship management', 'erp', 'enterprise resource planning', 'hcm',
  'human capital management', 'scm', 'supply chain management', 'plm', 'product lifecycle management',
  
  ...scandinavianPhrases // Include all Scandinavian phrases
];

// Create a combined and deduplicated blacklist
const combinedBlacklistedTerms: string[] = [...new Set([...baseBlacklistedTerms, ...additionalTerms])];

// Function to check if a term should be blacklisted (additional checks)
function isAdditionallyBlacklisted(term: string): boolean {
  const lowerTerm = term.toLowerCase().trim();
  
  // Check if it's only consisting of common job descriptors
  const jobDescriptorTerms = ['manager', 'director', 'executive', 'specialist', 'consultant', 'lead', 'head', 'chief', 'officer', 'professional', 'analyst', 'coordinator', 'administrator', 'supervisor'];
  if (jobDescriptorTerms.some(descriptor => lowerTerm.includes(descriptor))) {
    // If the term only contains job descriptors and common words, it's likely not a company
    const wordsInTerm = lowerTerm.split(/\s+/);
    const nonJobWords = wordsInTerm.filter(word => 
      !jobDescriptorTerms.some(descriptor => word.includes(descriptor)) && 
      !['of', 'for', 'in', 'at', 'with', 'and', 'the', '&', '-'].includes(word)
    );
    if (nonJobWords.length === 0) {
      return true;
    }
  }
  
  // Check for long descriptive phrases (likely not a company name)
  if (lowerTerm.split(/\s+/).length > 4) {
    return true;
  }
  
  return false;
}

// The original isBlacklisted function, enhanced with our new checks
function isBlacklistedTerm(companyName: string): boolean {
  // First apply existing checks
  const companyLower = companyName.toLowerCase();
  
  // Exakt match
  if (combinedBlacklistedTerms.some(term => companyLower === term.toLowerCase())) {
    return true;
  }
  
  // Börjar med blacklisted term
  if (combinedBlacklistedTerms.some(term => companyLower.startsWith(term.toLowerCase() + " "))) {
    return true;
  }
  
  // Slutar med blacklisted term
  if (combinedBlacklistedTerms.some(term => companyLower.endsWith(" " + term.toLowerCase()))) {
    return true;
  }
  
  // Innehåller blacklisted term som ett eget ord
  if (combinedBlacklistedTerms.some(term => companyLower.includes(" " + term.toLowerCase() + " "))) {
    return true;
  }
  
  // Extra kontroller för korta ord (mindre än 5 tecken)
  if (companyName.length < 5) {
    return !isWellKnownShortCompany(companyName);
  }
  
  // Additional comprehensive checks
  return isAdditionallyBlacklisted(companyName);
}

// Update the processWithOpenAI function to use the enhanced blacklist and improved prompt
export const processWithOpenAI = async (
  profilesArray: SearchResultItem[],
): Promise<ExtractedProfile[]> => {
  console.log(
    `Processing batch of ${profilesArray.length} profiles with OpenAI...`,
  );

  // Delay function to avoid rate limits
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Process profiles in small batches to avoid OpenAI rate limits
  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < profilesArray.length; i += batchSize) {
    batches.push(profilesArray.slice(i, i + batchSize));
  }

  let extractedProfiles: ExtractedProfile[] = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1}/${batches.length}...`);

    const batchPromises = batch.map(async (profile, index) => {
      try {
        // Retry logic for OpenAI calls
        let retries = 0;
        const maxRetries = 3;
        while (retries < maxRetries) {
          try {
            const { title, snippet } = profile;
            
            // Create a comprehensive input that includes both title and snippet
            const combinedInput = `Title: ${title || ''}\nSnippet: ${snippet || ''}`;
            console.log(`DIAGNOSTIK: Profil ${index}, input för OpenAI: "${combinedInput.substring(0, 100)}..."`);

            // Enhanced prompt with more explicit examples and instructions
            const requestBody = {
              profileData: combinedInput,
              prompt: `
              Jag behöver extrahera ENDAST det riktiga företagsnamnet från denna LinkedIn-profilinformation.
              
              VIKTIGA REGLER:
              - Extrahera endast faktiska, legitima företagsnamn (t.ex. Microsoft, ABB, Ericsson, IBM, Volvo)
              - Extrahera INTE platser (Oslo, Stockholm, Sweden, Norway, Nordic, Regional)
              - Extrahera INTE utbildningsinstitutioner (University, School, College, Universitet)
              - Extrahera INTE generiska termer (Experience, Technical, Manager, Location, Regional)
              - Extrahera INTE ord som "end", "Free", "Erfarenhet", "over", "using", "Experiencia", "Erfaring", "you"
              - Extrahera INTE "FOODTECH", "Sjømat", "distribution", "sales", "technical", eller branschtermer
              - Extrahera INTE jobtitlar som företag
              - Extrahera INTE fraser som beskriver arbetsuppgifter eller prestationer
              - Extrahera INTE fraser som innehåller "responsibility for", "management of", "compliance with"
              - Extrahera INTE något längre än 3-4 ord - riktiga företagsnamn är oftast korta
              - Extrahera INTE fraser som "Sr Customer Success Account Manager" eller "Nordic Enterprise clients"
              - Extrahera INTE "Territory" eller "Regional" eller liknande geografiska beskrivningar
              - Om du inte kan identifiera ett tydligt företagsnamn, returnera en TOM sträng ""
              
              EXEMPEL PÅ FELAKTIGA EXTRAKTIONER (GÖR INTE DESSA):
              - "end" → INTE ett företag
              - "Erfaring" → INTE ett företag
              - "FOODTECH" → INTE ett företag
              - "Sales" → INTE ett företag
              - "Technical" → INTE ett företag
              - "distribution" → INTE ett företag
              - "wheelme" → INTE ett företag (det är en term)
              - "Sjømat" → INTE ett företag (det betyder "sjömat")
              - "Nutrition" → INTE ett företag (det är en bransch)
              - "regional responsibility for Stockholm" → INTE ett företag
              - "Nordic Enterprise clients on their" → INTE ett företag
              - "efficient operational management and easy compliance" → INTE ett företag
              - "Sr Customer Success Account Manager" → INTE ett företag (det är en jobtitel)
              - "Irish and UK SMEs" → INTE ett företag (det är en kategori av företag)
              - "Senior Account Executive" → INTE ett företag (det är en jobtitel)
              - "regional" → INTE ett företag (det är en beskrivning)
              - "experience" → INTE ett företag
              - "Erfarenhet" → INTE ett företag
              - "Experencia" → INTE ett företag
              - "free" → INTE ett företag
              - "over" → INTE ett företag
              - "Stockholm" → INTE ett företag
              - "Using Microsoft Office with Mike Tholfsen" → INTE ett företag
              - "produkter och tj" → INTE ett företag
              - "Projects" → INTE ett företag
              - "Sted" → INTE ett företag
              - "Opps" → INTE ett företag
              
              EXEMPEL PÅ KORREKTA EXTRAKTIONER:
              - "Ericsson" → Korrekt företag
              - "Microsoft" → Korrekt företag
              - "Volvo Cars" → Korrekt företag
              - "ICA Gruppen" → Korrekt företag
              - "H&M" → Korrekt företag
              - "IBM" → Korrekt företag
              - "Dell EMC" → Korrekt företag
              - "Telia" → Korrekt företag
              - "ABB" → Korrekt företag
              - "Schlumberger" → Korrekt företag
              - "Siemens" → Korrekt företag
              
              Svarsformatet måste vara ett JSON-objekt med company, name och title fält.
              Om du inte hittar ett tydligt företagsnamn, returnera en tom sträng ("") för company-fältet.
              `,
              title,
              snippet
            };

            const response = await fetch("/api/fetch-profile-data", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
              throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            let { name } = data;
            let company = data.company;
            
            console.log(`DIAGNOSTIK: OpenAI extraherade namn: "${name}", företag: "${company}"`);
            
            // Make sure name is a string
            name = name || "";

            // Extract title from input if not provided by API
            const extractedTitle = data.title || extractTitleFromInput(combinedInput);

            // First attempt: Use API result for company
            let extractedCompany = company;
            
            // Second attempt: Try to find company in snippet & title
            if (!extractedCompany || extractedCompany.trim() === "") {
              console.log("DIAGNOSTIK: OpenAI returnerade inget företag, använder snippet för extraktion");
              // First try with snippet which often contains company info
              if (snippet) {
                extractedCompany = extractCompanyFromSnippet(snippet);
              }
              
              // If no company found in snippet, try with title
              if ((!extractedCompany || extractedCompany.trim() === "") && title) {
                console.log("DIAGNOSTIK: Inget företag i snippet, provar med title");
                extractedCompany = extractCompanyFromSnippet(title);
              }
              
              // Last attempt: try with combined text
              if (!extractedCompany || extractedCompany.trim() === "") {
                console.log("DIAGNOSTIK: Inget företag i snippet eller title, provar med kombinerad text");
                extractedCompany = extractCompanyFromSnippet(combinedInput);
              }
            }

            // Enhanced validation including the expanded blacklist
            if (extractedCompany) {
              const cleanedCompany = cleanCompanyName(extractedCompany);
              
              // Use more aggressive validation
              if (isBlacklistedTerm(cleanedCompany) || 
                  isLikelyJobTitle(cleanedCompany) ||
                  isLikelyLocation(cleanedCompany) ||
                  isLikelyIndustryOrDepartment(cleanedCompany)) {
                console.log(`Rejecting extracted company "${cleanedCompany}" as invalid`);
                extractedCompany = '';
              } else {
                extractedCompany = cleanedCompany;
                console.log(`Final company extraction: "${extractedCompany}"`);
              }
            }

            return {
              name: name || "Unknown Profile",
              title: extractedTitle,
              company: extractedCompany || "",
              url: profile.link || "",
            };
          } catch (err) {
            console.error(`Retry ${retries + 1}/${maxRetries}:`, err);
            retries++;
            if (retries >= maxRetries) throw err;
            await sleep(1000 * retries); // Exponential backoff
          }
        }
        throw new Error("Max retries exceeded");
      } catch (error) {
        console.error(`Error processing profile ${index}:`, error);
        return {
          name: "Error Profile",
          title: "Error Processing",
          company: "",
          url: profile.link || "",
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    extractedProfiles = extractedProfiles.concat(batchResults);
  }

  return extractedProfiles;
};