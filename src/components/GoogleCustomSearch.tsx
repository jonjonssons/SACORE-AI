import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface GoogleCustomSearchProps {
  className?: string;
  onResultsReady?: (results: GoogleCustomSearchResultCollection | null, isRelaxedSearch?: boolean) => void;
  executeSearch?: string;
  autoExecute?: boolean;
  maxPages?: number; // Prop to control how many pages to fetch
}

const GoogleCustomSearch = ({ 
  className = "", 
  onResultsReady,
  executeSearch,
  autoExecute = false,
  maxPages = 100 // Increased from 20 to 100 to match the limit in useGoogleSearch.tsx
}: GoogleCustomSearchProps) => {
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [allResults, setAllResults] = useState<any[]>([]);
  
  useEffect(() => {
    if (!document.querySelector('script[src="https://cse.google.com/cse.js?cx=c05572c17c5eb4ca4"]')) {
      const script = document.createElement("script");
      script.src = "https://cse.google.com/cse.js?cx=c05572c17c5eb4ca4";
      script.async = true;
      
      script.onload = () => {
        console.log("Google CSE script loaded successfully");
        scriptLoadedRef.current = true;
        
        // Only auto-execute if explicitly requested
        if (autoExecute && executeSearch && window.google && window.google.search) {
          performSearch(executeSearch);
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load Google CSE script");
        if (onResultsReady) {
          onResultsReady(null);
        }
      };
      
      document.head.appendChild(script);
    } else {
      scriptLoadedRef.current = true;
      
      // Only auto-execute if explicitly requested
      if (autoExecute && executeSearch && window.google && window.google.search) {
        performSearch(executeSearch);
      }
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [executeSearch, autoExecute]);

  const executeSearchQuery = (query: string) => {
    if (query && window.google?.search) {
      performSearch(query);
    } else {
      console.error("Cannot execute search - Google Search API not available or no query provided");
      if (onResultsReady) {
        onResultsReady(null);
      }
    }
  };

  const handleSearchResults = (results: any) => {
    console.log("Search results received in GoogleCustomSearch:", results);
    setIsLoading(false);
    
    if (results && results.items && results.items.length > 0) {
      console.log("🧪 FULL API response from Google:", results);
      console.log("🧪 items exists:", results.items && results.items.length);
      
      // Log sample item to check if extractedName is present
      if (results.items[0]) {
        console.log("Sample item extractedName:", results.items[0].extractedName);
      }
      
      console.log("🔬 Deep inspection of results.items in GoogleCustomSearch:");
      console.log("items is array:", Array.isArray(results.items));
      console.log("items length:", results.items.length);
      
      console.log("Link extraction testing - every item in results.items:");
      results.items.forEach((item: any, i: number) => {
        console.log(`Item ${i} structure:`, JSON.stringify(item, null, 2).substring(0, 500) + "...");
        console.log(`Item ${i} has link property:`, 'link' in item);
        console.log(`Item ${i} link property:`, item.link);
        console.log(`Item ${i} type of link:`, typeof item.link);
        console.log(`Item ${i} link truthy check:`, !!item.link);
      });
      
      // Process API results - enhance with extractedName if missing
      const enhancedApiResults = results.items.map((item: any, idx: number) => {
        let enhancedItem = { ...item };
        
        // Add extractedName if missing
        if (!enhancedItem.extractedName && enhancedItem.title) {
          // Extract name from title
          let extractedName = "";
          const title = enhancedItem.title;
          
          // Simple extraction logic for API results
          if (title.includes('|')) {
            const parts = title.split('|');
            extractedName = parts[0].trim();
          }
          
          if (extractedName.includes(' - ')) {
            const parts = extractedName.split(' - ');
            extractedName = parts[0].trim();
          }
          
          // Strip LinkedIn suffix
          extractedName = extractedName.replace(/\s*LinkedIn$/, '').trim();
          
          console.log(`API result ${idx}: Adding extractedName "${extractedName}" from title "${title}"`);
          enhancedItem.extractedName = extractedName;
        }
        
        return enhancedItem;
      });
      
      // Replace original items with enhanced ones
      const combinedResults = {
        ...results,
        items: [...allResults, ...enhancedApiResults]
      };
      
      console.log("Raw Google results:", combinedResults.items);
      
      // Direct array access test
      console.log("First item direct:", combinedResults.items[0]);
      console.log("First item link direct:", combinedResults.items[0]?.link);
      
      const extractedLinks = combinedResults.items.map((item: any) => {
        const possibleLink = item.link || item.formattedUrl || item.displayLink || 
               (item.pagemap && item.pagemap.metatags && item.pagemap.metatags[0] && 
                item.pagemap.metatags[0].url);
                
        console.log(`Extracted possible link:`, possibleLink);
        return possibleLink;
      }).filter(link => {
        console.log(`Filtering link: ${link}, type: ${typeof link}, truthy: ${!!link}`);
        return link && typeof link === 'string';
      });
      
      // Remove duplicate links
      const uniqueLinks = [...new Set(extractedLinks)];
      console.log("Enhanced link extraction result after removing duplicates:", uniqueLinks);
      
      if (uniqueLinks.length > 0) {
        console.log(`Found ${uniqueLinks.length} unique links via enhanced extraction`);
        localStorage.setItem('searchResultLinks', JSON.stringify(uniqueLinks));
        
        const enhancedResults = JSON.parse(JSON.stringify(combinedResults));
        
        enhancedResults.items = enhancedResults.items.map((item: any, i: number) => {
          const enhancedItem = { ...item };
          if (!enhancedItem.link && uniqueLinks[i]) {
            console.log(`Adding missing link to item ${i}:`, uniqueLinks[i]);
            enhancedItem.link = uniqueLinks[i];
          }
          return enhancedItem;
        });
        
        // Check if we have more pages to fetch and we haven't reached the maximum
        const hasNextPage = results.queries && 
                           results.queries.nextPage && 
                           results.queries.nextPage.length > 0 &&
                           currentPage < maxPages;
        
        if (hasNextPage) {
          console.log(`More results available. Fetching page ${currentPage + 1}...`);
          setAllResults(enhancedResults.items);
          setCurrentPage(currentPage + 1);
          
          // Show progress to user every 3 pages
          if (currentPage % 3 === 0 || currentPage === 1) {
            toast({
              title: "Search Progress",
              description: `Retrieved ${uniqueLinks.length} results so far. Continuing search...`,
            });
          }
          
          // Fetch the next page
          const startIndex = results.queries.nextPage[0].startIndex;
          fetchNextPage(executeSearch || "", startIndex);
          return;
        }
        
        console.log("Final enhanced results object being passed to parent:", enhancedResults);
        console.log("Links being passed:", enhancedResults.items.map((item: any) => item.link));
        
        if (onResultsReady) {
          onResultsReady(enhancedResults, false);
        }
        
        toast({
          title: "Search Complete",
          description: `Found ${uniqueLinks.length} links matching your criteria.`,
        });
        
        // Reset state for next search
        setAllResults([]);
        setCurrentPage(1);
        return;
      }
    }
    
    const savedLinks = localStorage.getItem('searchResultLinks');
    if (savedLinks) {
      try {
        const parsedLinks = JSON.parse(savedLinks);
        if (parsedLinks && parsedLinks.length > 0) {
          console.log("Using backup links from localStorage:", parsedLinks);
          
          toast({
            title: "Search Complete",
            description: `Found ${parsedLinks.length} links using backup method.`,
          });
          
          const syntheticResults = {
            kind: 'customsearch#search',
            items: parsedLinks.map((link: string) => ({
              link: link,
              title: link,
              snippet: "Retrieved from local storage"
            }))
          };
          
          // Reset state for next search
          setAllResults([]);
          setCurrentPage(1);
          
          onResultsReady(syntheticResults, false);
          return;
        }
      } catch (e) {
        console.error("Error parsing backup links:", e);
      }
    }
    
    // Reset state for next search
    setAllResults([]);
    setCurrentPage(1);
    
    toast({
      title: "No Results Found",
      description: "No results found matching your criteria. Try using simpler terms.",
      variant: "destructive"
    });
  };

  const fetchNextPage = async (query: string, startIndex: number) => {
    if (!query) return;
    
    try {
      const apiKey = "AIzaSyCiKZ7WPiGeZlFtlIa-lWarr4Esk-VWkhw";
      const cx = "c05572c17c5eb4ca4";
      const encodedQuery = encodeURIComponent(query);
      const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodedQuery}&num=10&start=${startIndex}`;
      
      console.log(`Fetching next page (start: ${startIndex})...`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Next page results (start: ${startIndex}):`, data);
      
      // Process next page results
      handleSearchResults(data);
    } catch (error) {
      console.error("Error fetching next page:", error);
      
      // In case of error, finish with what we have so far
      if (allResults.length > 0) {
        const finalResults = {
          kind: 'customsearch#search',
          items: allResults
        };
        
        console.log("Completing search with results collected so far:", finalResults);
        
        if (onResultsReady) {
          onResultsReady(finalResults, false);
        }
        
        // Reset state for next search
        setAllResults([]);
        setCurrentPage(1);
      } else {
        if (onResultsReady) {
          onResultsReady(null);
        }
      }
    }
  };

  const performSearch = async (query: string) => {
    if (window.google && window.google.search) {
      try {
        setIsLoading(true);
        setAllResults([]); // Reset any previous results
        setCurrentPage(1); // Reset to page 1
        
        console.log("Search triggered with query:", query);
        
        const cleanedQuery = query.replace(/[^\w\s:]/g, ' ').trim();
        console.log("Cleaned query for Google CSE:", cleanedQuery);
        
        try {
          const customSearchControl = new window.google.search.CustomSearchControl('c05572c17c5eb4ca4');
          console.log("Executing search directly with CustomSearchControl");
          
          customSearchControl.execute(cleanedQuery);
          console.log("Waiting for response...");
          
          const apiKey = "AIzaSyCiKZ7WPiGeZlFtlIa-lWarr4Esk-VWkhw";
          const cx = "c05572c17c5eb4ca4";
          const encodedQuery = encodeURIComponent(cleanedQuery);
          const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodedQuery}&num=10`;
          
          console.log("API URL (without key):", `https://www.googleapis.com/customsearch/v1?key=[REDACTED]&cx=${cx}&q=${encodedQuery}&num=10`);
          
          fetch(apiUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              console.log("Google search results:", data);
              console.log("🧪 Full Google API response:", JSON.stringify(data, null, 2));
              
              console.log("🧪 FULLT API-svar från Google:", data);
              console.log("🧪 items finns:", data.items && data.items.length);
              if (data.items) {
                data.items.forEach((item: any, i: number) => {
                  console.log(`🧩 Item #${i}:`, item);
                });
              }
              
              if (data && data.items && data.items.length > 0) {
                // Process the first page of results
                handleSearchResults(data);
                
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                  searchTimeoutRef.current = null;
                }
              } else {
                console.error("Search failed: No results found in API response");
                setIsLoading(false);
                
                setTimeout(() => {
                  const domResults = extractResultsFromDom();
                  if (domResults && domResults.items && domResults.items.length > 0) {
                    console.log("Extracted results from DOM:", domResults);
                    
                    if (onResultsReady) {
                      onResultsReady(domResults, false);
                    }
                  } else {
                    if (onResultsReady) {
                      onResultsReady(null);
                    }
                    
                    toast({
                      title: "No Results Found",
                      description: "No results match your criteria. Please try different requirements.",
                      variant: "destructive"
                    });
                  }
                }, 5000);
              }
            })
            .catch(error => {
              console.error("Error fetching search results:", error);
              
              setTimeout(() => {
                const domResults = extractResultsFromDom();
                if (domResults && domResults.items && domResults.items.length > 0) {
                  console.log("Extracted results from DOM as fallback:", domResults);
                  
                  if (onResultsReady) {
                    onResultsReady(domResults, false);
                  }
                } else {
                  setIsLoading(false);
                  
                  if (onResultsReady) {
                    onResultsReady(null);
                  }
                  
                  toast({
                    title: "Search Error",
                    description: "Error processing search results. Please try again.",
                    variant: "destructive"
                  });
                }
              }, 5000);
            });
          
          searchTimeoutRef.current = setTimeout(() => {
            console.error('Search timeout exceeded. No results fetched after 30 seconds.');
            setIsLoading(false);
            
            if (onResultsReady) {
              onResultsReady(null);
            }
            
            toast({
              title: "Search Timeout",
              description: "Couldn't connect to Google. Please try again.",
              variant: "destructive"
            });
          }, 30000);
          
        } catch (searchError) {
          console.error("Error with customSearchControl.execute:", searchError);
          setIsLoading(false);
          
          toast({
            title: "Search Error",
            description: "Couldn't execute search. Please try again.",
            variant: "destructive"
          });
          
          if (onResultsReady) {
            onResultsReady(null);
          }
        }
      } catch (error) {
        console.error("Error executing Google search:", error);
        setIsLoading(false);
        
        if (onResultsReady) {
          onResultsReady(null);
        }
        
        toast({
          title: "Search Error",
          description: "Couldn't connect to Google. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      console.error("Google Custom Search API not available");
      setIsLoading(false);
      
      if (onResultsReady) {
        onResultsReady(null);
      }
      
      toast({
        title: "Search Error",
        description: "Couldn't connect to Google. Please try again.",
        variant: "destructive"
      });
    }
  };

  const extractNameFromDomResult = (title: string, snippet: string): string => {
    if (!title) return '';
    
    let extractedName = '';
    
    // LinkedIn format typically has "Name - Title at Company | LinkedIn"
    if (title.includes('|')) {
      const parts = title.split('|');
      extractedName = parts[0].trim(); // Take the part before the pipe
    } else {
      extractedName = title;
    }
    
    // If it includes " - ", it's likely "Name - Title at Company"
    if (extractedName.includes(' - ')) {
      const parts = extractedName.split(' - ');
      extractedName = parts[0].trim(); // Take the part before the dash which is likely the name
    }
    
    // If the title contains "LinkedIn", strip it off
    extractedName = extractedName.replace(/\s*LinkedIn$/, '').trim();
    
    console.log(`DOM name extraction: "${title}" -> "${extractedName}"`);
    return extractedName;
  };

  const extractResultsFromDom = (): GoogleCustomSearchResultCollection | null => {
    const resultElements = document.querySelectorAll('.gsc-result');
    
    if (resultElements.length === 0) {
      console.log("No search results found in DOM");
      return null;
    }
    
    console.log(`Found ${resultElements.length} result elements in DOM`);
    
    const results: GoogleCustomSearchResultItem[] = Array.from(resultElements).map((el, idx) => {
      const titleEl = el.querySelector('.gs-title');
      const snippetEl = el.querySelector('.gs-snippet');
      const urlEl = el.querySelector('.gs-visibleUrl');
      const urlAnchorEl = titleEl?.querySelector('a[href]');
      
      const title = titleEl?.textContent?.trim() || `Result ${idx + 1}`;
      const snippet = snippetEl?.textContent?.trim() || '';
      const link = urlAnchorEl?.getAttribute('href') || '';
      
      console.log(`DOM result ${idx + 1} link:`, link);
      console.log(`DOM result ${idx + 1} title:`, title);
      console.log(`DOM result ${idx + 1} snippet:`, snippet.substring(0, 100) + (snippet.length > 100 ? '...' : ''));
      
      // Extract name using our helper function
      const extractedName = extractNameFromDomResult(title, snippet);
      
      // Log the name extraction attempt
      console.log(`Name extraction for result ${idx + 1}: "${extractedName}"`);
      
      if (!link) {
        console.warn(`No link found for result ${idx + 1}, title: ${title}`);
      }
      
      return {
        title: title,
        originalTitle: title,  // Keep the original title for reference
        extractedName: extractedName, // Store the extracted name
        snippet: snippet,
        link: link,
        url: link,
        formattedUrl: urlEl?.textContent?.trim() || link,
        htmlFormattedUrl: urlEl?.innerHTML || '',
        htmlTitle: titleEl?.innerHTML || '',
        htmlSnippet: snippetEl?.innerHTML || '',
        displayLink: urlEl?.textContent?.trim() || '',
        cacheId: `result-${idx}`
      };
    });
    
    console.log("All items extracted from DOM:", results);
    
    const validResults = results.filter(item => !!item.link);
    console.log(`Extracted ${results.length} search results, ${validResults.length} with valid links`);
    
    if (validResults.length === 0 && results.length > 0) {
      console.warn("Found search results but none had valid links - this might be a DOM structure issue");
    }
    
    return {
      kind: 'customsearch#search',
      url: {
        type: 'application/json',
        template: 'https://www.googleapis.com/customsearch/v1?q={searchTerms}&num={count?}&start={startIndex?}&cx={cx?}'
      },
      queries: {
        request: [
          {
            totalResults: validResults.length.toString(),
            searchTerms: '',
            count: validResults.length,
            startIndex: 1,
            inputEncoding: 'utf8',
            outputEncoding: 'utf8',
            safe: 'off',
            cx: 'c05572c17c5eb4ca4'
          }
        ]
      },
      context: {
        title: 'Google Custom Search'
      },
      searchInformation: {
        searchTime: 0.5,
        formattedSearchTime: '0.5',
        totalResults: validResults.length.toString(),
        formattedTotalResults: validResults.length.toString()
      },
      items: validResults,
      results: validResults
    };
  };

  return (
    <div className={`google-search-container ${className}`} ref={searchContainerRef}>
      {isLoading && (
        <div className="flex items-center justify-center my-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span className="ml-3 text-gray-400">
            {currentPage > 1 ? `Searching page ${currentPage} of ${maxPages}...` : "Searching..."}
          </span>
        </div>
      )}
      <div className="gcse-searchresults-only" data-queryparametername="q" style={{ display: 'none' }}></div>
    </div>
  );
};

export default GoogleCustomSearch;
