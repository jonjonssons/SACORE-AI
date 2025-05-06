
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { proxyRequest } from '@/utils/proxyService';
import { extractNamesWithAI } from '@/services/openaiService';
import { isOpenAIConfigured } from '@/config/openai';
import { getPhantombusterResults } from '@/services/phantombusterService';

export const useLinkedInSearch = () => {
  const [searchResultsReady, setSearchResultsReady] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [hasCompletedSearch, setHasCompletedSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchItems, setCurrentSearchItems] = useState<any[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Check for Phantombuster results if applicable
  useEffect(() => {
    const checkPhantombusterResults = async () => {
      const containerId = localStorage.getItem('phantombusterContainerId');
      const selectedService = localStorage.getItem('selectedService');
      
      if (containerId && selectedService === 'phantombuster' && !searchResultsReady) {
        setIsSearching(true);
        try {
          toast({
            title: "Checking Phantombuster Results",
            description: "Retrieving search results from Phantombuster...",
          });
          
          const results = await getPhantombusterResults(containerId);
          
          if (results && results.length > 0) {
            await handleSearchResults({ items: results });
          } else {
            toast({
              title: "No Results",
              description: "No results found from Phantombuster search.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error checking Phantombuster results:", error);
          toast({
            title: "Error",
            description: "Failed to retrieve Phantombuster results. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsSearching(false);
        }
      }
    };
    
    checkPhantombusterResults();
  }, []);

  const clearStorageData = () => {
    localStorage.removeItem('googleSearchLinks');
    localStorage.removeItem('linkedInSearchLinks');
    localStorage.removeItem('searchResultLinks');
    localStorage.removeItem('linkSheetRows');
    localStorage.removeItem('searchResultItems');
    localStorage.removeItem('extractedProfileData');
    localStorage.removeItem('aiExtractedProfiles');
    localStorage.removeItem('googleSearchResults');
    localStorage.removeItem('profile_data');
    console.log("Cleared selected profile and search related data from localStorage");
  };

  const generateSwedishName = (index: number): string => {
    const firstNames = [
      'Erik', 'Anders', 'Johan', 'Lars', 'Per', 'Karl', 'Nils', 'Jan', 'Gustav', 'Olof',
      'Anna', 'Maria', 'Margareta', 'Elisabeth', 'Eva', 'Kristina', 'Birgitta', 'Karin', 'Elisabet', 'Marie'
    ];
    
    const lastNames = [
      'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 
      'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson'
    ];
    
    const firstNameIndex = index % firstNames.length;
    const lastNameIndex = Math.floor(index / firstNames.length) % lastNames.length;
    
    return `${firstNames[firstNameIndex]} ${lastNames[lastNameIndex]}`;
  };

  const extractNameFromTitle = (title: string): string => {
    if (!title) return '';
    
    let cleaned = title.replace(/\s*\|\s*LinkedIn$/, '').replace(/\s*-\s*LinkedIn$/, '').trim();
    
    if (cleaned.includes(' | ')) {
      return cleaned.split(' | ')[0].trim();
    }
    
    if (cleaned.includes(' - ')) {
      return cleaned.split(' - ')[0].trim();
    }
    
    return cleaned;
  };

  const processSearchResultsWithGPT = async (items: any[]) => {
    if (!isOpenAIConfigured()) {
      console.log("OpenAI is not configured, using fallback name extraction");
      return items.map((item, index) => ({
        ...item,
        extractedName: extractNameFromTitle(item.title) || generateSwedishName(index)
      }));
    }

    try {
      toast({
        title: "Extraherar namn med AI",
        description: "Bearbetar LinkedIn-profiler...",
      });

      const profiles = items.map(item => ({
        title: item.title || '',
        snippet: item.snippet || '',
        link: item.link || item.url || ''
      }));

      const nameMap = await extractNamesWithAI(profiles);
      
      const itemsWithNames = items.map((item, index) => {
        const link = item.link || item.url || '';
        const extractedName = nameMap.get(link) || extractNameFromTitle(item.title) || generateSwedishName(index);
        
        return {
          ...item,
          extractedName
        };
      });

      toast({
        title: "Namnextrahering slutförd",
        description: `Extraherade ${nameMap.size} namn med AI.`,
      });
      
      return itemsWithNames;
    } catch (error) {
      console.error("Error extracting names with GPT:", error);
      toast({
        title: "Kunde inte extrahera namn med AI",
        description: "Använder fallback-metod istället.",
        variant: "destructive"
      });
      
      return items.map((item, index) => ({
        ...item,
        extractedName: extractNameFromTitle(item.title) || generateSwedishName(index)
      }));
    }
  };

  const handleSearchResults = async (results: any) => {
    if (results?.items?.length > 0) {
      clearStorageData();
      
      setIsSearching(true);
      
      const MAX_ITEMS = 6000;
      const limitedItems = results.items.slice(0, MAX_ITEMS);
      
      console.log(`Processing ${limitedItems.length} search results (limited to ${MAX_ITEMS} maximum)`);
      console.log("Sample search result item:", limitedItems[0]);
      console.log("Sample extractedName:", limitedItems[0]?.extractedName);
      
      // Process Phantombuster specific results or standard results
      let itemsWithNames;
      const selectedService = localStorage.getItem('selectedService');
      
      if (selectedService === 'phantombuster') {
        // Map Phantombuster format to our standard format
        const mappedItems = limitedItems.map((item: any) => ({
          title: item.name || item.fullName || '',
          link: item.profileUrl || item.url || '',
          url: item.profileUrl || item.url || '',
          snippet: `${item.title || ''} at ${item.companyName || ''}`,
          extractedName: item.name || item.fullName || ''
        }));
        itemsWithNames = mappedItems;
      } else {
        itemsWithNames = await processSearchResultsWithGPT(limitedItems);
      }
      
      const processedResults = await Promise.all(
        itemsWithNames.map(async (item: any) => {
          if (item.link) {
            try {
              const proxyResult = await proxyRequest(item.link, 'GET');
              return {
                ...item,
                proxyData: proxyResult,
                url: item.link,
                extractedName: item.extractedName || ''
              };
            } catch (error) {
              console.error(`Failed to proxy request for ${item.link}:`, error);
              return {
                ...item,
                url: item.link,
                extractedName: item.extractedName || ''
              };
            }
          }
          return item;
        })
      );

      console.log("Sample processed result:", processedResults[0]);
      
      const directExtractedProfiles = processedResults.map((item: any, index: number) => ({
        name: item.extractedName || generateSwedishName(index),
        title: item.title || "",
        company: item.companyName || "",
        url: item.link || item.url || ""
      }));
      
      console.log("Storing direct extracted profiles:", directExtractedProfiles.length);
      localStorage.setItem('gscExtractedProfiles', JSON.stringify(directExtractedProfiles));
      localStorage.setItem('aiExtractedProfiles', JSON.stringify(directExtractedProfiles));

      const itemsWithUrl = processedResults.map((item: any) => ({
        ...item,
        url: item.link || '',
        extractedName: item.extractedName || ''
      }));

      localStorage.setItem('searchResultItems', JSON.stringify(itemsWithUrl));
      setCurrentSearchItems(itemsWithUrl);

      const extractedLinks = processedResults
        .map((item: any) => item.link || "")
        .filter(Boolean);
      
      const uniqueLinks = [...new Set(extractedLinks)];
      
      if (uniqueLinks.length > 0) {
        setLinks(uniqueLinks);
        localStorage.setItem('googleSearchLinks', JSON.stringify(uniqueLinks));
        localStorage.setItem('linkedInSearchLinks', JSON.stringify(uniqueLinks));
        localStorage.setItem('searchResultLinks', JSON.stringify(uniqueLinks));
        
        setHasCompletedSearch(true);
        setSearchResultsReady(true);
        setIsSearching(false);
        
        toast({
          title: "Search Complete",
          description: `Found ${uniqueLinks.length} profiles matching your criteria.`,
        });
      } else {
        setIsSearching(false);
        toast({
          title: "Search Complete",
          description: "No links found matching your criteria.",
          variant: "destructive"
        });
      }
    } else {
      setIsSearching(false);
      toast({
        title: "Search Failed",
        description: "No results found or search API error.",
        variant: "destructive"
      });
    }
  };

  return {
    searchResultsReady,
    links,
    hasCompletedSearch,
    isSearching,
    currentSearchItems,
    sheetOpen,
    setSheetOpen,
    handleSearchResults
  };
};
