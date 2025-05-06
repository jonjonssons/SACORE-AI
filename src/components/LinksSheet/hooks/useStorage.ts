import { useState } from "react";
import { STORAGE_KEYS } from "../types";

/**
 * Hook for handling storage operations in LinksSheet
 * @returns Object with storage utility functions
 */
export const useStorage = () => {
  /**
   * Load search result items from localStorage
   * @returns Array of search result items
   */
  const loadSearchResultItems = (): any[] => {
    try {
      const storedResultItems = localStorage.getItem('searchResultItems');
      if (storedResultItems) {
        const parsedResults = JSON.parse(storedResultItems);
        if (Array.isArray(parsedResults) && parsedResults.length > 0) {
          console.log(`Loaded ${parsedResults.length} search result items from localStorage`);
          
          // Check if snippets are present
          const withSnippet = parsedResults.filter((item: any) => !!item.snippet).length;
          console.log(`Search results stats - Total: ${parsedResults.length}, With snippet: ${withSnippet}, Without: ${parsedResults.length - withSnippet}`);
          
          if (parsedResults.length > 0) {
            console.log("First search result item snippet example:", {
              title: parsedResults[0].title,
              snippet: parsedResults[0].snippet ? parsedResults[0].snippet.substring(0, 50) + '...' : 'NO SNIPPET',
              hasSnippet: !!parsedResults[0].snippet
            });
          }
          
          return parsedResults;
        }
      }
    } catch (error) {
      console.error("Error loading search result items:", error);
    }
    return [];
  };
  
  /**
   * Save search result items to localStorage
   * @param items Array of search result items to save
   * @returns Boolean indicating if the operation was successful
   */
  const saveSearchResultItems = (items: any[]): boolean => {
    try {
      if (Array.isArray(items) && items.length > 0) {
        localStorage.setItem('searchResultItems', JSON.stringify(items));
        console.log(`Saved ${items.length} search result items to localStorage`);
        
        // Check if snippets are present
        const withSnippet = items.filter(item => !!item.snippet).length;
        console.log(`Saved items stats - Total: ${items.length}, With snippet: ${withSnippet}, Without: ${items.length - withSnippet}`);
        
        if (items.length > 0) {
          console.log("First saved item snippet example:", {
            title: items[0].title,
            snippet: items[0].snippet ? items[0].snippet.substring(0, 50) + '...' : 'NO SNIPPET',
            hasSnippet: !!items[0].snippet
          });
        }
        return true;
      }
    } catch (error) {
      console.error("Error saving search result items:", error);
    }
    return false;
  };
  
  /**
   * Load AI-extracted profiles from localStorage
   * @returns Array of AI-extracted profiles
   */
  const loadAIExtractedProfiles = (): any[] => {
    try {
      const aiProfiles = localStorage.getItem('aiExtractedProfiles');
      if (aiProfiles) {
        const parsedProfiles = JSON.parse(aiProfiles);
        if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
          console.log(`Loaded ${parsedProfiles.length} AI-extracted profiles from localStorage`);
          return parsedProfiles;
        }
      }
      
      // Try extractedProfileData as fallback
      const extractedData = localStorage.getItem('extractedProfileData');
      if (extractedData) {
        const parsedData = JSON.parse(extractedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log(`Loaded ${parsedData.length} extracted profiles from localStorage`);
          return parsedData;
        }
      }
    } catch (error) {
      console.error("Error loading AI-extracted profiles:", error);
    }
    return [];
  };

  /**
   * Save links to localStorage
   * @param links Array of links to save
   * @returns The saved links after processing
   */
  const saveLinks = (links: string[]): string[] => {
    try {
      const processedLinks = links.map(link => {
        // Additional link processing if needed
        return link;
      });
      
      localStorage.setItem('searchResultLinks', JSON.stringify(processedLinks));
      localStorage.setItem('googleSearchLinks', JSON.stringify(processedLinks));
      
      return processedLinks;
    } catch (error) {
      console.error("Error saving links:", error);
      return links;
    }
  };
  
  /**
   * Load links from localStorage
   * @returns Array of links
   */
  const loadLinksFromStorage = (): string[] => {
    try {
      const storageKeys = ['googleSearchLinks', 'linkedInSearchLinks', 'searchResultLinks'];
      
      for (const key of storageKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Loaded ${parsed.length} links from ${key}`);
            return parsed;
          }
        }
      }
    } catch (error) {
      console.error("Error loading links from storage:", error);
    }
    return [];
  };

  const clearAllSearchData = () => {
    console.log("Clearing all search-related storage data");
    
    const searchRelatedKeys = [
      'searchResultItems',
      'searchResultLinks',
      'linkedInSearchLinks',
      'googleSearchLinks',
      'extractedProfileData',
      'aiExtractedProfiles',
      'linkSheetRows',
      'requirements',
      'searchTimestamp'
    ];

    searchRelatedKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed ${key} from localStorage`);
    });
  };

  return {
    clearAllSearchData,
    loadSearchResultItems,
    saveSearchResultItems,
    loadAIExtractedProfiles,
    saveLinks,
    loadLinksFromStorage
  };
};
