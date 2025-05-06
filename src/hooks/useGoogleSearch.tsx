import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface Requirement {
  id: string;
  description: string;
  score: number;
  isAiSuggested?: boolean;
  category?: string;
}

interface UseGoogleSearchProps {
  requirements: Requirement[];
  GOOGLE_API_KEY: string;
  SEARCH_ENGINE_ID: string;
  autoSearch?: boolean;
}

interface UseGoogleSearchReturn {
  isSearching: boolean;
  searchExecuted: boolean;
  analysisStage: "idle" | "searching" | "analyzing" | "complete" | "error";
  links: string[];
  errorMessage: string | null;
  isRelaxedSearch: boolean;
  handleApproveAndSearch: () => Promise<void>;
  searchUrl: string;
}

const LINKS_STORAGE_KEY = 'googleSearchLinks';
const MAX_PAGES = 600; // Increased from 300 to 600 for more results
const SEARCH_RESULTS_KEY = 'searchResultItems'; // Added constant for clarity

export default function useGoogleSearch({
  requirements,
  GOOGLE_API_KEY,
  SEARCH_ENGINE_ID,
  autoSearch = false
}: UseGoogleSearchProps): UseGoogleSearchReturn {
  const [isSearching, setIsSearching] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<"idle" | "searching" | "analyzing" | "complete" | "error">("idle");
  const [links, setLinks] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRelaxedSearch, setIsRelaxedSearch] = useState(false);
  const [searchUrl, setSearchUrl] = useState<string>("");
  const [showingSearchUrl, setShowingSearchUrl] = useState(false);
  
  useEffect(() => {
    if (analysisStage !== 'complete') {
      setShowingSearchUrl(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setShowingSearchUrl(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [analysisStage]);

  const getDisplaySearchUrl = () => {
    if (!showingSearchUrl || !searchExecuted || analysisStage !== 'complete') {
      return "";
    }
    return searchUrl;
  };

  useEffect(() => {
    if (links.length > 0) {
      console.log("Links in useGoogleSearch updated:", links.length);
      console.log("First few links:", links.slice(0, 3));
      
      localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
      localStorage.setItem('linkedInSearchLinks', JSON.stringify(links));
      localStorage.setItem('searchResultLinks', JSON.stringify(links));
      
      localStorage.setItem('searchTimestamp', new Date().getTime().toString());
      
      if (analysisStage === 'complete') {
        // Comment out search complete toast
        /*
        toast({
          title: "Search Complete",
          description: `Found ${links.length} results. Click to view.`,
        });
        */
      }
    } else {
      console.log("⚠️ Links array is empty in useGoogleSearch");
    }
  }, [links, analysisStage]);

  const buildQuery = (): string => {
    const baseQuery = "site:linkedin.com/in";
    
    const validRequirements = requirements
      .filter(r => r.description && r.description.trim().length > 0 && r.score > 0)
      .map(r => r.description.trim());
    
    if (validRequirements.length === 0) {
      return baseQuery;
    }
    
    let query = `${baseQuery} ${validRequirements.join(" AND ")}`;
    
    console.log("Search query with site:linkedin.com/in prefix:", query);
    return query;
  };

  const buildQueryVariations = (): string[] => {
    console.log("=================== DIAGNOSTIK ===================");
    console.log("KÖRS: useGoogleSearch.tsx::buildQueryVariations");
    console.log("Tidstämpel:", new Date().toISOString());
    console.log("Requirements:", requirements.map(r => r.description));
    console.log("===================================================");
    
    const base = "site:linkedin.com/in";
    const locationKeywords: string[] = ["stockholm", "göteborg", "gothenburg", "malmö", "uppsala", 
      "linköping", "sweden", "sverige", "danmark", "norway", "norge", "finland", 
      "nordic", "scandinavia", "skandinavien", "oslo", "copenhagen", "köpenhamn", 
      "helsinki", "helsingfors", "lund", "umeå", "västerås", "örebro", "norrköping", "europe", "europa"];

    const titleKeywords: string[] = ["manager", "executive", "developer", "engineer", "director", 
      "consultant", "account", "sales", "product", "chief", "cto", "ceo", "lead", 
      "head", "specialist", "architect", "analyst", "associate", "adviser", "advisor", 
      "officer", "vp", "president", "principal", "projektledare", "utvecklare", "chef", 
      "ledare", "konsult", "tekniker", "ingenjör", "säljare", "administratör"];
    
    // Steg 1: Samla giltiga söktermer
    const validRequirements = requirements
      .filter(r => r.description && r.description.trim().length > 0 && r.score > 0)
      .map(r => r.description.trim());
    
    if (validRequirements.length === 0) {
      console.log("❌ Inga giltiga söktermer hittades. Använder default-sökning.");
      return [base + " Sweden"];
    }
    
    // Steg 2: Kategorisera söktermer
    console.log("\nDETALJERAD LOGGNING: KATEGORISERING AV SÖKTERMER");
    console.log("---------------------------------------------------");
    
    const locations: string[] = [];
    const titles: string[] = [];
    const otherTerms: string[] = [];
    
    validRequirements.forEach(req => {
      const lowerReq = req.toLowerCase();
      if (locationKeywords.some(keyword => lowerReq.includes(keyword))) {
        locations.push(req);
        console.log(`✅ Location identifierad: "${req}"`);
      } 
      else if (titleKeywords.some(keyword => lowerReq.includes(keyword))) {
        titles.push(req);
        console.log(`✅ Titel identifierad: "${req}"`);
      } 
      else {
        otherTerms.push(req);
        console.log(`✅ Övrig term identifierad: "${req}"`);
      }
    });
    
    console.log("\nSAMMANFATTNING KATEGORISERING:");
    console.log(`Locations (${locations.length}): ${locations.join(", ") || "INGA"}`);
    console.log(`Titlar (${titles.length}): ${titles.join(", ") || "INGA"}`);
    console.log(`Övriga termer (${otherTerms.length}): ${otherTerms.join(", ") || "INGA"}`);
    
    // Steg 3: Säkerställ att vi har minst en location
    if (locations.length === 0) {
      const defaultLocation = "Sweden";
      locations.push(defaultLocation);
      console.log(`\n⚠️ KRITISKT: Lägger till default location "${defaultLocation}"`);
    }
    
    // Steg 3b: Säkerställ att vi har minst en titel
    if (titles.length === 0) {
      const defaultTitle = "Account Executive";
      titles.push(defaultTitle);
      console.log(`⚠️ KRITISKT: Lägger till default titel "${defaultTitle}"`);
    }
    
    // Steg 4: Generera sökfrågor med location OCH titel
    console.log("\nDETALJERAD LOGGNING: GENERERING AV SÖKKOMBINATIONER");
    console.log("---------------------------------------------------");
    
    const searchQueries: string[] = [];
    
    // Vi skapar nu kombinationer manuellt för att ha maximal kontroll
    const otherTermsOnly = [...otherTerms];
    
    // Loopa över alla locations och titlar - båda måste finnas i varje sökning
    console.log(`\nGENERERAR KOMBINATIONER FÖR ${locations.length} LOCATIONS OCH ${titles.length} TITLAR:`);
    
    for (const location of locations) {
      for (const title of titles) {
        // 1. Grundläggande kombination: Location + Titel
        const baseQuery = `${base} \"${location}\" AND \"${title}\"`;
        searchQueries.push(baseQuery);
        console.log(`➕ Sökning (location+titel): ${baseQuery}`);
        
        // 2. Om det finns andra termer, lägg till dessa en och en
        if (otherTermsOnly.length > 0) {
          for (const term of otherTermsOnly) {
            const query = `${base} \"${location}\" AND \"${title}\" AND \"${term}\"`;
            searchQueries.push(query);
            console.log(`➕ Sökning (location+titel+term): ${query}`);
          }
          
          // 3. Om det finns tillräckligt många termer, skapa begränsat antal kombinationer med location+titel+flera termer
          if (otherTermsOnly.length >= 2) {
            const maxCombos = Math.min(5, otherTermsOnly.length); // Begränsa till max 5 kombinationer
            
            console.log(`\nGENERERAR KOMBINATIONER MED 2 EXTRA TERMER:`);
            
            // Skapa några kombinationer med 2 övriga termer
            for (let i = 0; i < otherTermsOnly.length; i++) {
              for (let j = i+1; j < otherTermsOnly.length && j < i+maxCombos; j++) {
                const query = `${base} \"${location}\" AND \"${title}\" AND \"${otherTermsOnly[i]}\" AND \"${otherTermsOnly[j]}\"`;
                searchQueries.push(query);
                console.log(`➕ Sökning (location+titel+2 termer): ${query}`);
              }
            }
          }
          
          // 4. Om det finns fler termer, testa några kombinationer med 3 övriga termer
          if (otherTermsOnly.length >= 3) {
            const randomCombos = Math.min(3, otherTermsOnly.length-2); // Begränsa till max 3 slumpmässiga kombinationer
            
            console.log(`\nGENERERAR ${randomCombos} KOMBINATIONER MED 3 EXTRA TERMER:`);
            
            for (let c = 0; c < randomCombos; c++) {
              const randomIndices = getRandomIndices(otherTermsOnly.length, 3);
              const selectedTerms = randomIndices.map(idx => otherTermsOnly[idx]);
              
              const query = `${base} \"${location}\" AND \"${title}\" AND ${selectedTerms.map(term => `\"${term}\"`).join(" AND ")}`;
              searchQueries.push(query);
              console.log(`➕ Sökning (location+titel+3 slumpmässiga termer): ${query}`);
            }
          }
        }
      }
    }
    
    // Slutlig verifiering - ALLA sökningar måste innehålla både location OCH titel
    console.log("\nDETALJERAD LOGGNING: VERIFIERING AV SÖKKOMBINATIONER");
    console.log("-----------------------------------------------------");
    
    let locationsOK = 0;
    let titlesOK = 0;
    let failed = 0;
    
    const finalVerifiedQueries = searchQueries.filter(query => {
      const hasLocation = locations.some(location => query.includes(`\"${location}\"`));
      const hasTitle = titles.some(title => query.includes(`\"${title}\"`));
      
      if (!hasLocation) {
        console.error(`❌ KRITISKT FEL: Sökning utan location hittades: ${query}`);
        failed++;
      } else {
        locationsOK++;
      }
      
      if (!hasTitle) {
        console.error(`❌ KRITISKT FEL: Sökning utan titel hittades: ${query}`);
        failed++;
      } else {
        titlesOK++;
      }
      
      return hasLocation && hasTitle;
    });
    
    console.log("\nSTATISTIK VERIFIERING:");
    console.log(`Sökningar med location: ${locationsOK}/${searchQueries.length} (${(locationsOK/searchQueries.length*100).toFixed(1)}%)`);
    console.log(`Sökningar med titel: ${titlesOK}/${searchQueries.length} (${(titlesOK/searchQueries.length*100).toFixed(1)}%)`);
    console.log(`Felaktiga sökningar: ${failed}`);
    
    console.log(`\n✅ SLUTRESULTAT: ${finalVerifiedQueries.length} verifierade sökningar, ALLA med location OCH titel`);
    console.log("=================================================================");
    
    return finalVerifiedQueries;
  };
  
  // Hjälpfunktion för att få slumpmässiga index för kombinationer
  const getRandomIndices = (max: number, count: number): number[] => {
    const indices: number[] = [];
    while (indices.length < count && indices.length < max) {
      const idx = Math.floor(Math.random() * max);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices;
  };

  const clearPreviousSearchData = () => {
    console.log("Clearing all previous search-related data");
    const searchRelatedKeys = [
      'googleSearchLinks',
      'linkedInSearchLinks',
      'searchResultLinks',
      'linkSheetRows',
      'searchResultItems',
      'extractedProfileData',
      'aiExtractedProfiles',
      'profile_data',
      'googleSearchResults',
      'searchProgress'  // Add searchProgress to the list of keys to clear
    ];

    searchRelatedKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed ${key} from localStorage`);
    });
  };

  const fetchSearchResultsPage = async (query: string, startIndex: number = 1) => {
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodedQuery}&num=10&start=${startIndex}`;
    
    console.log(`Fetching search results page ${Math.ceil(startIndex / 10)} (start index: ${startIndex})`);
    
    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching search results page (start: ${startIndex}):`, error);
      return null;
    }
  };

  const extractLinksFromResults = (data: any): string[] => {
    if (!data || !data.items || !Array.isArray(data.items)) {
      console.log("No valid items found in search results");
      return [];
    }
    
    console.log(`Extracting links from ${data.items.length} items`);
    
    const extractedLinks = [];
    
    // Also store the full item data for extraction later
    const fullSearchItems = [];
    
    for (const item of data.items) {
      if (item && item.link) {
        extractedLinks.push(item.link);
        
        // Store the complete item with all metadata
        fullSearchItems.push({
          title: item.title || '',
          snippet: item.snippet || '',
          link: item.link || '',
          url: item.link || '',  // Adding url field for compatibility
          formattedUrl: item.formattedUrl || '',
          displayLink: item.displayLink || ''
        });
        
        console.log(`✅ Added link: ${item.link}`);
      } else {
        console.log(`❌ Skipped invalid link from item:`, item);
      }
    }
    
    // Store the full search items with all metadata
    if (fullSearchItems.length > 0) {
      localStorage.setItem(SEARCH_RESULTS_KEY, JSON.stringify(fullSearchItems));
      console.log(`Stored ${fullSearchItems.length} full search result items in localStorage`);
    }
    
    return extractedLinks;
  };

  const handleApproveAndSearch = async () => {
    // Clear all previous data before starting a new search
    clearPreviousSearchData();
    
    setErrorMessage(null);
    setLinks([]);
    setIsRelaxedSearch(false);
    setSearchExecuted(true);
    setAnalysisStage('searching');
    setIsSearching(true);
    setShowingSearchUrl(false);
    
    const searchQueries = buildQueryVariations();
    setSearchUrl(searchQueries[0]);
    
    console.log(`Generated ${searchQueries.length} search query variations`);
    
    // Initialize search progress data in localStorage with starting values
    const initialProgress = {
      currentQuery: 0,
      totalQueries: searchQueries.length,
      currentPage: 0,
      totalPages: MAX_PAGES,
      progress: 0
    };
    localStorage.setItem('searchProgress', JSON.stringify(initialProgress));
    
    // Function to update search progress with more granular updates
    const updateSearchProgress = (data: any) => {
      const currentProgress = JSON.parse(localStorage.getItem('searchProgress') || '{}');
      localStorage.setItem('searchProgress', JSON.stringify({
        ...currentProgress,
        ...data,
        timestamp: Date.now() // Add timestamp for freshness
      }));
    };
    
    // Start progress at 0
    updateSearchProgress({ progress: 0 });
    
    // Simulate early progress steps before actual search starts
    setTimeout(() => updateSearchProgress({ progress: 3 }), 300);
    setTimeout(() => updateSearchProgress({ progress: 5 }), 600);
    
    if (searchQueries.length === 0 || searchQueries[0] === "site:linkedin.com/in") {
      setErrorMessage("No valid search terms found. Please add some requirements.");
      setAnalysisStage('error');
      setIsSearching(false);
      return Promise.resolve();
    }
    
    try {
      const allLinks: string[] = [];
      const allResultItems: any[] = [];
      const seenLinks = new Set<string>();
      let totalResultsFound = 0;
      
      for (let queryIndex = 0; queryIndex < searchQueries.length; queryIndex++) {
        const currentQuery = searchQueries[queryIndex];
        console.log(`Processing query ${queryIndex + 1}/${searchQueries.length}: ${currentQuery}`);
        
        let hasMoreResults = true;
        let currentPage = 1;
        
        while (hasMoreResults && currentPage <= MAX_PAGES) {
          const startIndex = (currentPage - 1) * 10 + 1;
          
          // Update search progress with current page and finer-grained progress
          const queryProgress = queryIndex / searchQueries.length;
          const pageProgress = (currentPage - 1) / Math.min(10, MAX_PAGES); 
          const combinedProgress = Math.floor(10 + (queryProgress * 40) + (pageProgress * 10)); // 10-60% range
          
          updateSearchProgress({
            currentQuery: queryIndex,
            totalQueries: searchQueries.length,
            currentPage: currentPage,
            totalPages: Math.min(10, MAX_PAGES),
            progress: combinedProgress
          });
          
          // Comment out search progress toast
          /*
          toast({
            title: "Search Progress",
            description: `Searching with query variation ${queryIndex + 1}/${searchQueries.length}...`,
          });
          */
          
          // Google begränsar sökning till max 100 resultat (10 sidor)
          if (startIndex > 91) {
            console.log(`Når max tillåtna 100 resultat (10 sidor) för Google Search API för query: ${currentQuery}`);
            break;
          }
          
          const pageResults = await fetchSearchResultsPage(currentQuery, startIndex);
          
          // Hantera API-fel
          if (!pageResults) {
            console.log(`Misslyckades med att hämta sida ${currentPage} för query: ${currentQuery}`);
            
            // Om vi når daglig kvot (429-fel) gör längre paus och fortsätt med nästa kombination
            if (startIndex > 1) {
              console.log("Möjlig 429 Too Many Requests. Avbryter denna kombination och går vidare.");
              break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Längre paus vid fel
            hasMoreResults = false;
            break;
          }
          
          if (currentPage % 5 === 0) {
            // Comment out page progress toast
            /*
            toast({
              title: "Search Progress",
              description: `Processing page ${currentPage} for query ${queryIndex + 1}...`,
            });
            */
          }
          
          if (!pageResults || !pageResults.items || pageResults.items.length === 0) {
            console.log(`No more results found on page ${currentPage} for query ${queryIndex + 1}`);
            hasMoreResults = false;
            break;
          }
          
          const pageLinks = extractLinksFromResults(pageResults);
          console.log(`Found ${pageLinks.length} links on page ${currentPage} for query ${queryIndex + 1}`);
          
          if (pageLinks.length === 0) {
            console.log(`No valid links found on page ${currentPage} for query ${queryIndex + 1}`);
            hasMoreResults = false;
            break;
          }
          
          // Debug log first item in results to check for snippet
          if (pageResults.items && pageResults.items.length > 0 && currentPage === 1) {
            const sampleItem = pageResults.items[0];
            console.log("Search result item example with snippet:", {
              title: sampleItem.title,
              link: sampleItem.link,
              snippet: sampleItem.snippet ? sampleItem.snippet.substring(0, 50) + '...' : 'NO SNIPPET',
              hasSnippet: !!sampleItem.snippet,
              htmlSnippet: sampleItem.htmlSnippet ? 'Present' : 'Missing'
            });
          }
          
          for (let i = 0; i < pageResults.items.length; i++) {
            const item = pageResults.items[i];
            const link = item.link;
            
            if (link && !seenLinks.has(link)) {
              seenLinks.add(link);
              allLinks.push(link);
              
              // Make sure we capture the snippet
              allResultItems.push({
                title: item.title || '',
                link: item.link || '',
                snippet: item.snippet || '',
                htmlSnippet: item.htmlSnippet || '',
                formattedUrl: item.formattedUrl || '',
                displayLink: item.displayLink || ''
              });
              
              totalResultsFound++;
            }
          }
          
          if (!pageResults.queries || !pageResults.queries.nextPage) {
            console.log("No more pages available");
            hasMoreResults = false;
          }
          
          currentPage++;
          
          if (totalResultsFound >= 4000) {
            console.log("Reached maximum of 4000 results, stopping search");
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        console.log(`Completed query variation ${queryIndex + 1}/${searchQueries.length}: ${currentQuery}`);
        
        if (queryIndex < searchQueries.length - 1 && totalResultsFound < 4000) {
          // Show analyzing phase progress (60-90% range)
          const analyzingProgress = 60 + Math.floor((queryIndex / searchQueries.length) * 30);
          updateSearchProgress({
            currentQuery: queryIndex + 1,
            totalQueries: searchQueries.length,
            progress: analyzingProgress
          });
          
          // Comment out search progress toast
          /*
          toast({
            title: "Search Progress",
            description: `Found ${totalResultsFound} results so far. Proceeding with next query variation...`,
          });
          */
        }
        
        if (totalResultsFound >= 4000) {
          console.log("Reached maximum of 4000 results, stopping search");
          break;
        }
      }
      
      console.log(`Total unique links found across all queries:`, allLinks.length);
      
      if (allLinks.length > 0) {
        // Store all links without limiting them
        const allItems = allResultItems;
        
        // Store full search results including title and snippet
        localStorage.setItem('searchResultItems', JSON.stringify(allItems));
        console.log('Stored search results with title and snippet:', allItems.length);

        // Store links in various storage keys
        localStorage.setItem('googleSearchLinks', JSON.stringify(allLinks));
        localStorage.setItem('linkedInSearchLinks', JSON.stringify(allLinks));
        localStorage.setItem('searchResultLinks', JSON.stringify(allLinks));
        
        setLinks(allLinks);
        setAnalysisStage('complete');
        
        localStorage.setItem('requirements', JSON.stringify(
          requirements.filter(r => r.score > 0).map(r => r.description)
        ));
        
        localStorage.setItem('searchTimestamp', new Date().getTime().toString());
        
        setAnalysisStage('complete');
        setIsSearching(false);
        
        // Update search progress to 100% complete
        updateSearchProgress({
          currentQuery: searchQueries.length,
          totalQueries: searchQueries.length,
          currentPage: MAX_PAGES,
          totalPages: MAX_PAGES,
          progress: 100,
          complete: true
        });
        
        // Comment out search complete toast
        /*
        toast({
          title: "Search Complete",
          description: `Found ${allLinks.length} LinkedIn profiles matching your search.`,
        });
        */
        
        return Promise.resolve();
      } else {
        console.log("No valid links found across all queries");
        setErrorMessage("No links found in search results. Try different search terms.");
        setAnalysisStage('error');
        setIsSearching(false);
      }
    } catch (error) {
      console.error("Error with search API calls:", error);
      setErrorMessage("An error occurred during search. Please try again.");
      setAnalysisStage('error');
      setIsSearching(false);
    }
    
    return Promise.resolve();
  };

  const processSearchResults = (response: any) => {
    if (!response || !response.items) {
      setErrorMessage("No search results found");
      setAnalysisStage('error');
      return;
    }
    
    const rawLinks = response.items.map((item: any) => item.link).filter(Boolean);
    
    if (!rawLinks || rawLinks.length === 0) {
      console.log("❌ No results found.");
      setErrorMessage("No links found in search results");
      setAnalysisStage('error');
    } else {
      console.log("✅ Links found:", rawLinks);
      setLinks(rawLinks);
      setAnalysisStage('complete');
      
      localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(rawLinks));
      localStorage.setItem('linkedInSearchLinks', JSON.stringify(rawLinks));
      localStorage.setItem('searchResultLinks', JSON.stringify(rawLinks));
      
      localStorage.setItem('searchTimestamp', new Date().getTime().toString());
    }
  };

  return {
    isSearching,
    searchExecuted,
    analysisStage,
    links,
    errorMessage,
    isRelaxedSearch,
    handleApproveAndSearch,
    searchUrl: getDisplaySearchUrl()
  };
}
