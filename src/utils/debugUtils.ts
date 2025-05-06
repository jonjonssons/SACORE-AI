/**
 * Utility functions for debugging search results and data extraction
 */

/**
 * Get search results with all metadata from localStorage
 * @param limit Optional limit of items to return
 * @returns Array of search result items with title, snippet, and URL
 */
export const getSearchResults = (limit?: number) => {
  try {
    const storedItems = localStorage.getItem('searchResultItems');
    if (!storedItems) {
      console.error('No search result items found in localStorage');
      return [];
    }
    
    const items = JSON.parse(storedItems);
    if (!Array.isArray(items)) {
      console.error('Search result items are not in expected array format');
      return [];
    }
    
    const results = items.map(item => ({
      title: item.title || '',
      snippet: item.snippet || '',
      url: item.link || item.url || '',
      hasSnippet: !!item.snippet
    }));
    
    console.log(`Found ${results.length} search result items in localStorage`);
    
    if (limit && results.length > limit) {
      return results.slice(0, limit);
    }
    
    return results;
  } catch (error) {
    console.error('Error parsing search result items from localStorage:', error);
    return [];
  }
};

/**
 * Define an interface to extend the stats object with extraction properties
 */
interface SearchResultStats {
  total: number;
  withTitle: number;
  withSnippet: number;
  withUrl: number;
  withAllFields: number;
  examples: {
    title: any;
    snippet: any;
    url: any;
    hasSnippet: boolean;
  }[];
  extraction?: {
    total: number;
    withName: number;
    withTitle: number;
    withCompany: number;
    withLocation: number;
    completeProfiles: number;
  };
  extractedExamples?: any[];
}

/**
 * Check search results quality and display extraction summary
 * @returns Object with counts of items with/without required fields and extraction details
 */
export const checkSearchResultsQuality = (): SearchResultStats => {
  const results = getSearchResults();
  const stats: SearchResultStats = {
    total: results.length,
    withTitle: results.filter(item => !!item.title).length,
    withSnippet: results.filter(item => !!item.snippet).length,
    withUrl: results.filter(item => !!item.url).length,
    withAllFields: results.filter(item => !!item.title && !!item.snippet && !!item.url).length,
    examples: results.slice(0, 3)
  };
  
  console.log('Search results quality check:', stats);
  console.table(stats.examples);
  
  // Also check if we have any extracted profiles
  try {
    const extractedData = localStorage.getItem('extractedProfileData');
    if (extractedData) {
      const parsedData = JSON.parse(extractedData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        console.log(`Found ${parsedData.length} extracted profiles in localStorage`);
        console.log('First 5 extracted profiles:');
        console.table(parsedData.slice(0, 5));
        
        // Check extraction quality
        const extractionStats = {
          total: parsedData.length,
          withName: parsedData.filter(item => !!item.name).length,
          withTitle: parsedData.filter(item => !!item.title).length,
          withCompany: parsedData.filter(item => !!item.company).length,
          withLocation: parsedData.filter(item => !!item.location).length,
          completeProfiles: parsedData.filter(item => !!item.name && !!item.title && !!item.company).length,
        };
        
        console.log('Extraction quality stats:', extractionStats);
        
        stats.extraction = extractionStats;
        stats.extractedExamples = parsedData.slice(0, 3);
      }
    }
  } catch (error) {
    console.error('Error checking extraction data:', error);
  }
  
  return stats;
};

/**
 * Test OpenAI extraction with a sample result
 * @returns The extracted profile data
 */
export const testOpenAIExtraction = async () => {
  try {
    const results = getSearchResults(1);
    if (results.length === 0) {
      console.error('No search results available for testing');
      return null;
    }
    
    const sampleResult = results[0];
    console.log('Testing OpenAI extraction with sample:', sampleResult);
    
    // Create JSON input for OpenAI
    const inputData = {
      title: sampleResult.title,
      snippet: sampleResult.snippet,
      url: sampleResult.url
    };
    
    console.log('Sending to OpenAI for extraction:', inputData);
    
    // Call the extraction endpoint
    const response = await fetch('/api/linkedin-data-retrieval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchResults: [inputData],
        action: 'extract_with_openai'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('OpenAI extraction result:', result);
    
    return result;
  } catch (error) {
    console.error('Error testing OpenAI extraction:', error);
    return null;
  }
};

/**
 * Extract data from a sample search result using the existing local extractor
 * @returns The extracted profile data using local methods
 */
export const testLocalExtraction = () => {
  try {
    const results = getSearchResults(1);
    if (results.length === 0) {
      console.error('No search results available for testing');
      return null;
    }
    
    const sampleResult = results[0];
    console.log('Testing local extraction with sample:', sampleResult);
    
    // Import the local extractor dynamically to avoid circular dependencies
    import('./profileExtractors/extractLinkedInInfo').then(module => {
      const { extractLinkedInInfo } = module;
      
      const extracted = extractLinkedInInfo(
        sampleResult.title,
        sampleResult.snippet,
        sampleResult.url
      );
      
      console.log('Local extraction result:', extracted);
      return extracted;
    }).catch(err => {
      console.error('Error importing local extractor:', err);
      return null;
    });
  } catch (error) {
    console.error('Error testing local extraction:', error);
    return null;
  }
};

/**
 * Show extraction results - compare local vs AI extraction
 * @returns Comparison of extraction methods
 */
export const showExtractionResults = () => {
  try {
    // Get local extraction results
    const extractedProfiles = localStorage.getItem('extractedProfileData');
    const parsedProfiles = extractedProfiles ? JSON.parse(extractedProfiles) : [];
    
    // Get AI-enhanced results
    const aiProfiles = localStorage.getItem('aiExtractedProfiles');
    const parsedAiProfiles = aiProfiles ? JSON.parse(aiProfiles) : [];
    
    const comparison = {
      localExtraction: {
        count: parsedProfiles.length,
        samples: parsedProfiles.slice(0, 5)
      },
      aiExtraction: {
        count: parsedAiProfiles.length,
        samples: parsedAiProfiles.slice(0, 5)
      }
    };
    
    console.log('Extraction methods comparison:');
    console.log(`Local extraction: ${comparison.localExtraction.count} profiles`);
    console.log(`AI extraction: ${comparison.aiExtraction.count} profiles`);
    
    if (comparison.localExtraction.samples.length > 0) {
      console.log('Local extraction samples:');
      console.table(comparison.localExtraction.samples);
    }
    
    if (comparison.aiExtraction.samples.length > 0) {
      console.log('AI extraction samples:');
      console.table(comparison.aiExtraction.samples);
    }
    
    return comparison;
  } catch (error) {
    console.error('Error showing extraction results:', error);
    return null;
  }
};

// Export global debug functions
window.getSearchResults = getSearchResults;
window.checkSearchResultsQuality = checkSearchResultsQuality;
window.testOpenAIExtraction = testOpenAIExtraction;
window.testLocalExtraction = testLocalExtraction;
window.showExtractionResults = showExtractionResults;

// Add TypeScript declarations for global functions
declare global {
  interface Window {
    getSearchResults: (limit?: number) => any[];
    checkSearchResultsQuality: () => any;
    testOpenAIExtraction: () => Promise<any>;
    testLocalExtraction: () => any;
    showExtractionResults: () => any;
  }
}
