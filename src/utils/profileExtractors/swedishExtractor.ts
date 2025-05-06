
import { extractLinkedInUsername } from './extractUsername';

/**
 * Specialiserad funktion för att extrahera svenskt formaterade kontaktuppgifter
 * från Google-sökresultat för LinkedIn-profiler
 * 
 * @param title Titeln från sökresultatet
 * @param snippet Snippeten från sökresultatet
 * @returns JSON-formatterad data med namn, titel och företag
 */
export const extractSwedishContactInfo = (title: string, snippet: string): { namn: string; titel: string; företag: string } => {
  // Rensa titeln från LinkedIn-suffix och onödiga tecken
  const cleanTitle = title
    ? title
        .replace(/ \| LinkedIn$/, '')
        .replace(/ - LinkedIn$/, '')
        .replace(/LinkedIn$/, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
  
  // Deklarera variabler för extraherad information
  let namn = '';
  let titel = '';
  let företag = '';

  // Extrahera data från titeln först - vanliga format:
  // 1. "Namn – Titel – Företag"
  // 2. "Namn | Titel | Företag"
  // 3. "Namn – Titel på/hos/at Företag"
  const titleFormats = [
    /^(.+?)\s*[–\-]\s*(.+?)\s*[–\-]\s*(.+?)$/i,                      // Namn – Titel – Företag
    /^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)$/i,                           // Namn | Titel | Företag
    /^(.+?)\s*[–\-]\s*(.+?)\s+(?:på|hos|at|i|@)\s+(.+)$/i,          // Namn – Titel på/hos/at Företag
    /^(.+?)\s*[–\-]\s*(.+?)$/i,                                      // Namn – Titel (utan företag)
    /^(.+?)$/i,                                                      // Bara namn
  ];
  
  let matched = false;
  for (const pattern of titleFormats) {
    const match = cleanTitle.match(pattern);
    if (match) {
      matched = true;
      if (match.length >= 2) namn = match[1].trim();
      if (match.length >= 3) titel = match[2].trim();
      if (match.length >= 4) företag = match[3].trim();
      break;
    }
  }
  
  // Om inget mönster matchade, kanske titeln bara är ett namn
  if (!matched && cleanTitle) {
    namn = cleanTitle;
  }
  
  // Extrahera eller komplettera information från snippet
  if (snippet) {
    // Vanliga mönster för titel och företag i snippet
    const titleCompanyPatterns = [
      /(?:arbetar som|är|jobbar som)\s+([^,\.]+)\s+(?:på|hos|at|i|@)\s+([^,\.]+)/i,
      /^([^,\.]+)\s+(?:på|hos|at|i|@)\s+([^,\.]+)/i,
      /(?:nu|för närvarande)\s+(?:arbetar|jobbar)\s+(?:som)\s+([^,\.]+)\s+(?:på|hos|at|i|@)\s+([^,\.]+)/i,
    ];
    
    // Om vi inte kunde extrahera titel och företag från titeln, försök från snippet
    if (!titel || !företag) {
      for (const pattern of titleCompanyPatterns) {
        const match = snippet.match(pattern);
        if (match && match.length >= 3) {
          if (!titel) titel = match[1].trim();
          if (!företag) företag = match[2].trim();
          break;
        }
      }
    }
    
    // Ytterligare mönster för att hitta företag
    if (!företag) {
      const companyPatterns = [
        /(?:på|hos|at|i|@)\s+([A-Za-z0-9\s&åäöÅÄÖ]+)/i,
        /(?:arbetar för|anställd på|jobbar för)\s+([A-Za-z0-9\s&åäöÅÄÖ]+)/i
      ];
      
      for (const pattern of companyPatterns) {
        const match = snippet.match(pattern);
        if (match && match.length >= 2) {
          företag = match[1].trim();
          // Ta bort punkter eller kommatecken i slutet
          företag = företag.replace(/[,\.]\s*$/, '');
          break;
        }
      }
    }
    
    // Ytterligare mönster för att hitta titel
    if (!titel) {
      const titlePatterns = [
        /(?:är|arbetar som|jobbar som)\s+([^,\.]+)/i,
        /^([^,\.]+)\s+(?:med|with)\s+\d+\s+(?:års|years)/i
      ];
      
      for (const pattern of titlePatterns) {
        const match = snippet.match(pattern);
        if (match && match.length >= 2) {
          titel = match[1].trim();
          // Ta bort "på Företag" om det fångades
          titel = titel.replace(/\s+(?:på|hos|at|i|@)\s+[^,\.]+$/, '');
          break;
        }
      }
    }
    
    // Om vi fortfarande inte hittat namn, titta efter LinkedInUserName i snippet
    if (!namn && snippet.includes('linkedin.com/in/')) {
      const urlMatch = snippet.match(/linkedin\.com\/in\/([^\/\?\s]+)/);
      if (urlMatch && urlMatch[1]) {
        const extractedName = extractLinkedInUsername(urlMatch[0]);
        if (extractedName) {
          namn = extractedName;
        }
      }
    }
  }
  
  // Slutlig rensning av extraherad data
  if (namn) {
    namn = namn
      .replace(/[^\w\s\-åäöÅÄÖ]/g, ' ')  // Ersätt specialtecken med blanksteg
      .replace(/\s+/g, ' ')              // Normalisera blanksteg
      .trim();
  }
  
  if (titel) {
    titel = titel
      .replace(/[^\w\s\-åäöÅÄÖ]/g, ' ')  // Ersätt specialtecken med blanksteg
      .replace(/\s+/g, ' ')              // Normalisera blanksteg
      .trim();
  }
  
  if (företag) {
    företag = företag
      .replace(/[^\w\s\-&åäöÅÄÖ]/g, ' ') // Ersätt specialtecken med blanksteg
      .replace(/\s+/g, ' ')              // Normalisera blanksteg
      .trim();
  }
  
  return {
    namn: namn || "",
    titel: titel || "",
    företag: företag || ""
  };
};

/**
 * Konverterar Google-sökresultat till svenskt formaterad JSON för kontaktuppgifter
 * 
 * @param searchResult Ett sökresultat med title och snippet
 * @returns JSON-objekt med namn, titel och företag
 */
export const formatAsSwedishContactJSON = (
  searchResult: { title: string; snippet: string }
): { namn: string; titel: string; företag: string } => {
  return extractSwedishContactInfo(
    searchResult.title || '',
    searchResult.snippet || ''
  );
};

/**
 * Batch-konverterar flera Google-sökresultat till svenskt formaterad JSON för kontaktuppgifter
 * 
 * @param searchResults Array med Google-sökresultat (title, snippet)
 * @returns Array med JSON-objekt för varje sökresultat
 */
export const formatSearchResultsAsSwedishContactJSON = (
  searchResults: { title: string; snippet: string }[]
): { namn: string; titel: string; företag: string }[] => {
  return searchResults.map(result => formatAsSwedishContactJSON(result));
};
