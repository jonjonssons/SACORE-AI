
/**
 * Extraherar profilinformation från Google Custom Search API-resultat
 * Funktionen är optimerad för att hantera olika format i title och snippet
 * 
 * @param title - Titeln från sökresultatet (t.ex. "Namn - Titel - Företag | LinkedIn")
 * @param snippet - Snippeten från sökresultatet (t.ex. "Plats · Titel · Företag")
 * @returns Objekt med namn, titel, företag och plats
 */
export function extractProfileInfo(title: string, snippet: string) {
  let name = '';
  let jobTitle = '';
  let company = '';
  let location = '';
  
  console.log("Processing title:", title);
  console.log("Processing snippet:", snippet);
  
  // ===== Steg 1: Extrahera information från titeln =====
  if (title) {
    // Rensa titeln från LinkedIn-suffix och normalisera mellanslag
    const cleanTitle = title
      .replace(/ \| LinkedIn$/, '')
      .replace(/ - LinkedIn$/, '')
      .replace(/LinkedIn$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Hantera vanliga titelformat i Google-resultat:
    // 1. "Namn - Titel - Företag"
    // 2. "Namn | Titel | Företag"
    // 3. "Namn - Titel på Företag"
    
    // Prova först "Namn - Titel - Företag" formatet
    const googleTitlePattern = /^(.+?)(?:\s+[-–|]\s+(.+?))?(?:\s+[-–|]\s+(.+?))?$/i;
    
    const titleMatch = cleanTitle.match(googleTitlePattern);
    if (titleMatch) {
      console.log("Matched Google title pattern", titleMatch);
      
      if (titleMatch.length >= 2 && titleMatch[1]) {
        name = titleMatch[1].trim();
      }
      
      if (titleMatch.length >= 3 && titleMatch[2]) {
        jobTitle = titleMatch[2].trim();
      }
      
      if (titleMatch.length >= 4 && titleMatch[3]) {
        company = titleMatch[3].trim();
      }
    }
    
    // Alternativt format: "Namn - Titel på/hos/at Företag"
    if (!company && jobTitle) {
      const titleCompanyPattern = /(.+?)\s+(?:på|hos|at|i|@)\s+(.+)$/i;
      const altMatch = jobTitle.match(titleCompanyPattern);
      
      if (altMatch && altMatch.length >= 3) {
        console.log("Matched title-at-company pattern", altMatch);
        jobTitle = altMatch[1].trim();
        company = altMatch[2].trim();
      }
    }
  }
  
  // ===== Steg 2: Extrahera ytterligare information från snippet =====
  if (snippet) {
    // Försök hitta plats/location först
    const locationPatterns = [
      /^([^,\.]+(?:,\s*[^,\.]+)?(?:,\s*[^,\.]+)?(?:,\s*Sverige|,\s*Sweden)?)/i,
      /\b(Stockholm(?:s län)?|Göteborg|Malmö|Uppsala|Västerås|Örebro|Linköping|Helsingborg|Jönköping|Norrköping|Lund|Umeå|Gävle|Borås|Eskilstuna|Södertälje|Karlstad|Täby|Växjö|Halmstad|Sundsvall)(?:,\s*[^,\.]+)?\b/i,
      /\b([^,\.]+(?:,\s*[^,\.]+)?)\s+(?:län|county|region)\b/i
    ];
    
    for (const pattern of locationPatterns) {
      const locationMatch = snippet.match(pattern);
      if (locationMatch && locationMatch[1]) {
        location = locationMatch[1].trim();
        console.log("Matched location pattern", location);
        break;
      }
    }
    
    // Vanligt snippet format: "Plats · Titel · Företag"
    // Vi söker efter mönstret efter platsdelen, eller i början om ingen plats hittades
    const locationTitleCompanyPattern = /(?:^|\b(?:Sverige|Sweden|County|Location|Region|Län)(?:[,.]\s+|\s+·\s+))([^·,]+?)(?:\s+·\s+|\s*$)([^·,]+?)(?:\s+·\s+|\s*$)/i;
    
    const snippetMatch = snippet.match(locationTitleCompanyPattern);
    if (snippetMatch && snippetMatch.length >= 3) {
      console.log("Matched location-title-company pattern", snippetMatch);
      
      // Endast uppdatera titel om den inte redan extraherats från titeln
      if (!jobTitle && snippetMatch[1]) {
        jobTitle = snippetMatch[1].trim();
      }
      
      // Endast uppdatera företag om det inte redan extraherats från titeln
      if (!company && snippetMatch[2]) {
        company = snippetMatch[2].trim();
      }
    }
    
    // Sök efter sekundärt format som innehåller "Titel · Företag"
    const titleCompanyPattern = /·\s+([^·]+?)\s+·\s+([^·]+?)(?:\s+·|\s*$)/i;
    const secondaryMatch = snippet.match(titleCompanyPattern);
    
    if (secondaryMatch && secondaryMatch.length >= 3) {
      console.log("Matched title-company pattern", secondaryMatch);
      
      if (!jobTitle && secondaryMatch[1]) {
        jobTitle = secondaryMatch[1].trim();
      }
      
      if (!company && secondaryMatch[2]) {
        company = secondaryMatch[2].trim();
      }
    }
    
    // Om ingen titel hittats, leta efter nyckelord i asterisker
    // Google markerar ofta relevanta termer med ***term***
    const highlightedTitlePattern = /\*\*\*([^*]+?)\*\*\*/i;
    const highlightMatch = snippet.match(highlightedTitlePattern);
    
    if (highlightMatch && highlightMatch.length >= 2) {
      console.log("Matched highlighted title pattern", highlightMatch);
      
      if (!jobTitle) {
        jobTitle = highlightMatch[1].trim();
      }
    }
    
    // Leta efter namn i "LinkedIn · [Namn]" formatet om inget namn hittats
    if (!name) {
      const linkedinNamePattern = /LinkedIn\s+·\s+([^·\n]+)/i;
      const nameMatch = snippet.match(linkedinNamePattern);
      
      if (nameMatch && nameMatch.length >= 2) {
        console.log("Matched LinkedIn name pattern", nameMatch);
        name = nameMatch[1].trim();
      }
    }
    
    // Leta efter tjänstetitel med vanliga fraser
    if (!jobTitle) {
      const jobPhrases = [
        /(?:works as|arbetar som|är|is an?|works at|jobbar som)\s+([^,\.]+?)(?:\s+(?:at|på|hos|@|i|med|with)\s+|$)/i,
        /(?:^|\s)([^,\.]+?)\s+(?:at|på|hos|@|i)\s+([^,\.]+)/i,
      ];
      
      for (const pattern of jobPhrases) {
        const jobMatch = snippet.match(pattern);
        if (jobMatch && jobMatch[1]) {
          if (!jobTitle) {
            jobTitle = jobMatch[1].trim();
            console.log("Matched job title phrase", jobTitle);
          }
          
          // Om företaget också matchades i samma mönster
          if (!company && jobMatch.length >= 3 && jobMatch[2]) {
            company = jobMatch[2].trim();
            console.log("Matched company from job phrase", company);
          }
          
          break;
        }
      }
    }
  }
  
  // ===== Steg 3: Rensa och formatera extraherad data =====
  if (name) {
    name = name
      .replace(/[^\w\s\-'åäöÅÄÖ]/g, ' ') // Bevara svenska tecken
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  if (jobTitle) {
    jobTitle = jobTitle
      .replace(/[^\w\s\-'&åäöÅÄÖ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  if (company) {
    company = company
      .replace(/[^\w\s\-'&åäöÅÄÖ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  if (location) {
    location = location
      .replace(/[^\w\s\-,åäöÅÄÖ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  console.log("Final extracted data:", { name, title: jobTitle, company, location });
  
  return {
    name: name || 'okänt',
    title: jobTitle || 'okänt',
    company: company || 'okänt',
    location: location || 'okänt'
  };
}

/**
 * Extraherar LinkedIn username från URL
 */
export const extractLinkedInUsername = (url: string): string => {
  if (!url) return '';
  
  try {
    const matched = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (matched && matched[1]) {
      // Format the username to a readable name
      const nameParts = matched[1]
        .split('-')
        .filter(part => 
          // Filter out parts that are only numbers or very short
          !/^\d+$/.test(part) && part.length > 1
        )
        .map(part => {
          // Capitalize first letter, lowercase rest
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        });
      
      // If we have at least 2 parts, ensure proper first and last name format
      if (nameParts.length >= 2) {
        // Always ensure space between first and last name
        return nameParts.slice(0, 2).join(' ');
      } else if (nameParts.length === 1) {
        return nameParts[0];
      }
    }
  } catch (error) {
    console.error('Error extracting LinkedIn username:', error);
  }
  return '';
};

// Import the enhanced profile extractor locally
import { extractLinkedInInfo } from "./extractLinkedInInfo.ts";
export { extractLinkedInInfo };

/**
 * Detta är den äldre extractProfileInfo-implementationen, bevarad för bakåtkompatibilitet.
 * Vi kan nu också använda den förbättrade extractLinkedInInfo-funktionen från importerad modul.
 */
