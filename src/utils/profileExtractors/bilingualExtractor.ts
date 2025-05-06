
/**
 * Simple language detection for Swedish/English text
 * @param text Text to analyze
 * @returns 'sv' for Swedish, 'en' for English
 */
export const detectLanguage = (text: string): 'sv' | 'en' => {
  if (!text) return 'en';
  
  const swedishMarkers = ['på', 'och', 'för', 'med', 'eller', 'är', 'att', 'som', 'hos', 'av'];
  const lowercaseText = text.toLowerCase();
  
  for (const marker of swedishMarkers) {
    if (lowercaseText.includes(` ${marker} `)) {
      return 'sv';
    }
  }
  
  return 'en';
};

export default detectLanguage;
