import { separateProfileComponents } from './separateProfileComponents';

/**
 * Extracts name from title or snippet using various patterns
 */
export const extractName = (title: string = '', snippet: string = '', extractedName?: string): string => {
  console.log("=== DIAGNOSTIK: extractName anropad ===");
  console.log("Input - title:", title);
  console.log("Input - snippet:", snippet?.substring(0, 50) + (snippet && snippet.length > 50 ? '...' : ''));
  console.log("Input - extractedName:", extractedName);
  
  // First use any pre-extracted name if available
  if (extractedName) {
    console.log("DIAGNOSTIK: Använder förhands-extraherat namn:", extractedName);
    return extractedName;
  }
  
  // Try all available methods and pick the best one
  let possibleNames = [];
  
  // First try to use the separator utility on title
  if (title) {
    const { name } = separateProfileComponents(title);
    if (name) {
      possibleNames.push({name, source: "title-separator", score: 5});
      console.log("DIAGNOSTIK: Möjligt namn från titel med separator:", name);
    }
  }
  
  // Then try to use separator on snippet
  if (snippet) {
    const { name } = separateProfileComponents(snippet);
    if (name) {
      possibleNames.push({name, source: "snippet-separator", score: 4});
      console.log("DIAGNOSTIK: Möjligt namn från snippet med separator:", name);
    }
  }
  
  // Common LinkedIn title patterns
  if (title) {
    const linkedInPattern = /^([^-|]+)(?:\s*[-|]\s*.+)?/;
    const titleMatch = title.match(linkedInPattern);
    if (titleMatch && titleMatch[1]) {
      const extractedName = titleMatch[1].trim();
      possibleNames.push({name: extractedName, source: "title-pattern", score: 3});
      console.log("DIAGNOSTIK: Möjligt namn från titel med LinkedIn-mönster:", extractedName);
    }
  }
  
  // First word pattern (assuming it's a name)
  if (snippet) {
    const firstWordPattern = /^([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+)?)/;
    const snippetMatch = snippet.match(firstWordPattern);
    if (snippetMatch && snippetMatch[1]) {
      const extractedName = snippetMatch[1].trim();
      possibleNames.push({name: extractedName, source: "snippet-first-word", score: 2});
      console.log("DIAGNOSTIK: Möjligt namn från snippet med första-ord-mönster:", extractedName);
    }
  }
  
  // URL-based extraction
  if (title && title.includes('linkedin.com/in/')) {
    const match = title.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (match && match[1]) {
      const username = match[1];
      const nameFromUrl = username
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      possibleNames.push({name: nameFromUrl, source: "url", score: 1});
      console.log("DIAGNOSTIK: Möjligt namn från URL:", nameFromUrl);
    }
  }
  
  // Sort by score (highest first) and pick the best option
  possibleNames.sort((a, b) => b.score - a.score);
  
  if (possibleNames.length > 0) {
    const bestMatch = possibleNames[0];
    console.log(`DIAGNOSTIK: Valde bästa namnet "${bestMatch.name}" från källa "${bestMatch.source}" med poäng ${bestMatch.score}`);
    return bestMatch.name;
  }
  
  console.log("DIAGNOSTIK: Kunde inte extrahera namn från någon källa");
  return '';
};

export default extractName; 