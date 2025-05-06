import { corsHeaders, createJsonResponse, createErrorResponse } from "../utils/responseHelpers.ts";
import { extractWithOpenAI } from "../openaiExtractor.ts";

/**
 * Detekterar språk baserat på text
 * @param text Text att analysera
 * @returns 'sv' för svenska, 'en' för engelska
 */
const detectLanguage = (text: string): 'sv' | 'en' => {
  if (!text) return 'en';
  
  const text_lower = text.toLowerCase();
  
  // Svenska nyckelord och prepositioner
  const swedishIndicators = [
    'på', 'och', 'är', 'för', 'hos', 'med', 'som', 'att', 'den', 'ett',
    'sverige', 'stockholm', 'göteborg', 'malmö', 'uppsala',
    'ansvarig', 'chef', 'utvecklare', 'säljare', 'konsult',
    'jag', 'vi', 'de', 'han', 'hon', 'det', 'detta', 'dessa'
  ];
  
  // Engelska nyckelord och prepositioner
  const englishIndicators = [
    'at', 'and', 'is', 'for', 'with', 'as', 'to', 'the', 'a', 'an',
    'sweden', 'london', 'uk', 'usa', 'united states', 'europe',
    'responsible', 'manager', 'developer', 'sales', 'consultant',
    'i', 'we', 'they', 'he', 'she', 'it', 'this', 'these'
  ];
  
  let swedishCount = 0;
  let englishCount = 0;
  
  for (const word of swedishIndicators) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text_lower.match(regex);
    if (matches) {
      swedishCount += matches.length;
    }
  }
  
  for (const word of englishIndicators) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text_lower.match(regex);
    if (matches) {
      englishCount += matches.length;
    }
  }
  
  console.log(`Language detection: Swedish: ${swedishCount}, English: ${englishCount}`);
  
  return swedishCount > englishCount ? 'sv' : 'en';
};

/**
 * Extraherar titel och företagsinformation från snippet
 * @param snippet Textsnutt att extrahera från
 * @param language Språk ('sv' för svenska, 'en' för engelska)
 * @returns Objekt med titel och företag
 */
const extractProfileInfoFromSnippet = (snippet: string, language: 'sv' | 'en'): { title: string; company: string } => {
  if (!snippet) return { 
    title: language === 'sv' ? 'okänt' : 'unknown', 
    company: language === 'sv' ? 'okänt' : 'unknown' 
  };
  
  let title = '';
  let company = '';
  
  try {
    // Svenska och engelska prepositioner
    const svPrepositions = ['på', 'hos', 'i', 'vid', 'med', '@', 'för'];
    const enPrepositions = ['at', 'with', 'for', '@', 'in'];
    const prepositions = language === 'sv' ? svPrepositions : enPrepositions;
    
    // Vanliga titlar
    const commonTitles = language === 'sv' 
      ? [
          'vd', 'ceo', 'verkställande direktör', 'chef', 'direktör', 'manager', 'ledare', 
          'ansvarig', 'specialist', 'konsult', 'utvecklare', 'ingenjör', 'säljare', 
          'projektledare', 'koordinator', 'analytiker', 'strateg', 'handläggare',
          'head of', 'lead', 'senior', 'junior'
        ]
      : [
          'ceo', 'cto', 'cfo', 'coo', 'chief', 'director', 'head', 'vp', 'vice president',
          'manager', 'lead', 'senior', 'principal', 'staff', 'executive', 'specialist',
          'engineer', 'developer', 'consultant', 'analyst', 'strategist', 'coordinator',
          'sales', 'account', 'product', 'project', 'program', 'advisor'
        ];
    
    // Mönster 1: "Titel på/at Företag"
    const prepositionPattern = prepositions.join('|');
    const titleCompanyPattern = new RegExp(`^([^\\n.;:]+?)\\s+(?:${prepositionPattern})\\s+([^\\n.;:]+)`, 'i');
    
    const match = snippet.match(titleCompanyPattern);
    if (match && match.length >= 3) {
      title = match[1].trim();
      company = match[2].trim();
    } 
    
    // Mönster 2: "Title - Company" eller "Title · Company"
    if (!title || !company) {
      const separatorPattern = snippet.match(/^([^-·\n.;:]+)\s*[-·]\s*([^-·\n.;:]+)/i);
      if (separatorPattern && separatorPattern.length >= 3) {
        title = separatorPattern[1].trim();
        company = separatorPattern[2].trim();
      }
    }
    
    // Mönster 3: Leta efter prepositioner i första meningen
    if (!title || !company) {
      const firstSentence = snippet.split(/[.!?]/).filter(Boolean)[0] || '';
      
      for (const prep of prepositions) {
        const prepRegex = new RegExp(`([^\\n.;:]+?)\\s+${prep}\\s+([^\\n.;:]+)`, 'i');
        const sentenceMatch = firstSentence.match(prepRegex);
        
        if (sentenceMatch && sentenceMatch.length >= 3) {
          title = sentenceMatch[1].trim();
          company = sentenceMatch[2].trim();
          break;
        }
      }
    }
    
    // Mönster 4: Leta efter vanliga titlar
    if (!title) {
      for (const commonTitle of commonTitles) {
        const titleRegex = new RegExp(`\\b(\\w*\\s*${commonTitle}\\s+[^\\n.;:]{0,30})\\s+(?:${prepositionPattern})\\s+([^\\n.;:]+)`, 'i');
        const titleMatch = snippet.match(titleRegex);
        
        if (titleMatch && titleMatch.length >= 3) {
          title = titleMatch[1].trim();
          company = titleMatch[2].trim();
          break;
        }
      }
    }
    
    // Rensa upp resultaten
    if (title) {
      // Ta bort företagsnamn från titel om det av misstag togs med
      if (company && title.includes(company)) {
        title = title.replace(company, '').trim();
      }
      
      // Rensa bort eventuella avslutande prepositioner
      for (const prep of prepositions) {
        if (title.toLowerCase().endsWith(` ${prep}`)) {
          title = title.substring(0, title.toLowerCase().lastIndexOf(` ${prep}`)).trim();
        }
      }
    }
    
    if (company) {
      // Rensa företagsnamnet
      company = company
        .replace(/\s+\|.*$/, '')
        .replace(/\s+•.*$/, '')
        .replace(/\s*\(.*\)/, '')
        .replace(/,.*$/, '')
        .trim();
    }
  } catch (error) {
    console.error("Error extracting profile info:", error);
  }
  
  return { 
    title: title || (language === 'sv' ? 'okänt' : 'unknown'), 
    company: company || (language === 'sv' ? 'okänt' : 'unknown')
  };
};

/**
 * Hantera sökresultat-begäran
 * @param url LinkedIn-URL relaterad till sökningen
 * @param criteria Sökkriterier
 * @param searchResults Sökresultat (om tillgängliga)
 * @returns Response med berikade sökresultat
 */
export async function handleSearchResults(url: string, criteria: string, searchResults: any[] = []) {
  console.log(`Processing search results for criteria: ${criteria}`);
  console.log(`Number of search results: ${searchResults?.length || 0}`);
  
  try {
    // Om inga sökresultat tillhandahölls, returnera ett tomt svar
    if (!searchResults || searchResults.length === 0) {
      console.log("No search results provided");
      return createJsonResponse({
        source: "empty",
        results: [],
        criteria
      });
    }
    
    // Berika sökresultaten med extraherad data
    const enrichedResults = [];
    
    for (const result of searchResults) {
      try {
        console.log("Processing search result:", {
          title: result.title,
          snippet: result.snippet ? result.snippet.substring(0, 50) + "..." : "None"
        });
        
        // Detektera språk för bättre extraktion
        const language = detectLanguage((result.title || "") + " " + (result.snippet || ""));
        console.log(`Detected language: ${language}`);
        
        // Använd olika extraktion baserat på tillgängliga API-nycklar
        let extractedData;
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        
        if (openaiApiKey) {
          // IMPORTANT: Only pass title, snippet, and URL to the extractor - never include company
          extractedData = await extractWithOpenAI(
            result.title || "",
            result.snippet || "",
            result.link || "",
            language
          );
        } else {
          // Fallback till regel-baserad extraktion
          const manualExtraction = extractProfileInfoFromSnippet(result.snippet || "", language);
          
          // Försök extrahera namn från titeln
          let name = '';
          if (result.title) {
            const nameParts = result.title.split(/[-–|]/);
            if (nameParts.length > 0) {
              name = nameParts[0].trim();
            }
          }
          
          extractedData = {
            name: name || (language === 'sv' ? 'okänt' : 'unknown'),
            title: manualExtraction.title,
            company: manualExtraction.company,
            location: (language === 'sv' ? 'okänt' : 'unknown')
          };
        }
        
        // Logga extraherad data för felsökning
        console.log("Extracted data:", extractedData);
        
        // IMPORTANT: Store extracted data separately to avoid passing existing values back to extractor
        enrichedResults.push({
          ...result,
          extracted: {
            ...extractedData,
            language
          }
        });
        
      } catch (extractionError) {
        console.error("Error enriching search result:", extractionError);
        // Lägg till resultatet utan berikad data
        enrichedResults.push(result);
      }
    }
    
    return createJsonResponse({
      source: "enriched",
      results: enrichedResults,
      criteria
    });
    
  } catch (error) {
    console.error('Error processing search results:', error);
    return createErrorResponse(`Error processing search results: ${error.message}`, 500);
  }
}
