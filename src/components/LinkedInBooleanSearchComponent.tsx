import React, { useState } from "react";

const GOOGLE_API_KEY = "AIzaSyCiKZ7WPiGeZlFtlIa-lWarr4Esk-VWkhw";
const SEARCH_ENGINE_ID = "c05572c17c5eb4ca4";

const buildBooleanQuery = (requirements: string[]) => {
  const base = "site:linkedin.com/in";
  const boolean = requirements.map((r) => `\"${r}\"`).join(" AND ");
  return `${base} ${boolean}`;
};

// Ny funktion för att bygga query-variationer - ny direkt approach
const buildQueryVariations = (requirements: string[]): string[] => {
  console.log("=================== DIAGNOSTIK ===================");
  console.log("KÖRS: LinkedInBooleanSearchComponent.tsx::buildQueryVariations");
  console.log("Tidstämpel:", new Date().toISOString());
  console.log("Krav:", requirements);
  console.log("===================================================");
  
  console.log("============ NY DIREKT APPROACH ============");
  
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
  
  // Steg 1: Kategorisera söktermer
  const locations: string[] = [];
  const titles: string[] = [];
  const otherTerms: string[] = [];
  
  console.log("DETALJERAD LOGGNING: KATEGORISERING AV SÖKTERMER");
  console.log("------------------------------------------------");
  
  requirements.forEach(req => {
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
  
  // Steg 2: Säkerställ att vi har minst en location
  if (locations.length === 0) {
    const defaultLocation = "Sweden";
    locations.push(defaultLocation);
    console.log(`\n⚠️ KRITISKT: Lägger till default location "${defaultLocation}"`);
  }
  
  // Steg 2b: Säkerställ att vi har minst en titel
  if (titles.length === 0) {
    const defaultTitle = "Account Executive";
    titles.push(defaultTitle);
    console.log(`⚠️ KRITISKT: Lägger till default titel "${defaultTitle}"`);
  }
  
  // Steg 3: Generera enklare kombinationer
  console.log("\nDETALJERAD LOGGNING: GENERERING AV SÖKKOMBINATIONER");
  console.log("------------------------------------------------");
  
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
        
        // 3. Om det finns tillräckligt många termer, skapa begränsat antal kombinationer
        if (otherTermsOnly.length >= 2) {
          console.log(`\nGENERERAR KOMBINATIONER MED 2 EXTRA TERMER:`);
          for (let i = 0; i < otherTermsOnly.length; i++) {
            for (let j = i+1; j < otherTermsOnly.length && j < i+5; j++) { // Begränsa till max 5 termer per kombination
              const query = `${base} \"${location}\" AND \"${title}\" AND \"${otherTermsOnly[i]}\" AND \"${otherTermsOnly[j]}\"`;
              searchQueries.push(query);
              console.log(`➕ Sökning (location+titel+2 termer): ${query}`);
            }
          }
        }
        
        // 4. Om det finns fler termer, testa några kombinationer med 3 termer
        if (otherTermsOnly.length >= 3) {
          // Begränsa antalet kombinationer (om många termer)
          const maxCombos = Math.min(3, otherTermsOnly.length);
          
          console.log(`\nGENERERAR ${maxCombos} KOMBINATIONER MED 3 EXTRA TERMER:`);
          
          for (let i = 0; i < maxCombos; i++) {
            // Slumpa fram 3 olika termer
            const indices: number[] = [];
            while (indices.length < 3 && indices.length < otherTermsOnly.length) {
              const idx = Math.floor(Math.random() * otherTermsOnly.length);
              if (!indices.includes(idx)) {
                indices.push(idx);
              }
            }
            
            const selectedTerms = indices.map(idx => otherTermsOnly[idx]);
            const query = `${base} \"${location}\" AND \"${title}\" AND ${selectedTerms.map(term => `\"${term}\"`).join(" AND ")}`;
            searchQueries.push(query);
            console.log(`➕ Sökning (location+titel+3 termer): ${query}`);
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

const fetchLinkedInProfiles = async (requirements: string[]) => {
  console.log("=================== DIAGNOSTIK ===================");
  console.log("KÖRS: LinkedInBooleanSearchComponent.tsx::fetchLinkedInProfiles");
  console.log("Tidstämpel:", new Date().toISOString());
  console.log("Använder API-nyckel:", GOOGLE_API_KEY.substring(0, 8) + "...");
  console.log("===================================================");
  
  // Använd multi-query approach för fler resultat
  const queries = buildQueryVariations(requirements);
  const seenLinks = new Set<string>();
  const allItems: any[] = [];

  console.log(`Kör ${queries.length} olika query-variationer för att maximera resultaten`);

  for (const query of queries) {
    console.log(`Söker med query: ${query} (${queries.indexOf(query) + 1}/${queries.length})`);
    
    try {
      // För varje query, hämta upp till 10 sidor (100 resultat), inte 20
      for (let page = 1; page <= 10; page++) {
        const startIndex = (page - 1) * 10 + 1;
        
        // Google begränsar till max 100 resultat per sökning, så avbryt om vi försöker gå över det
        if (startIndex > 91) {
          console.log(`Når Googles max-gräns på 100 resultat (10 sidor) för query: ${query}`);
          break;
        }
        
        console.log(`Hämtar sida ${page} för query: ${query} (startIndex: ${startIndex})`);
        
        // Logga API-anropets URL (dölj nyckeln för säkerhet)
        const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=10&start=${startIndex}`;
        console.log("API-anrop URL (nyckel dold):", apiUrl.replace(GOOGLE_API_KEY, "API_KEY_HIDDEN"));
        
        const res = await fetch(
          apiUrl
        );

        // Utökad felhantering
        if (!res.ok) {
          console.error(`API-anrop misslyckades för query: ${query}, sida ${page}, status: ${res.status}`);
          
          // Hantera specifikt 429-fel (för många anrop)
          if (res.status === 429) {
            console.error(`Nått API-kvot gräns (429). Avbryter denna kombination och går vidare.`);
            break;
          }
          
          // Hantera 400-fel som kommer när man försöker gå över 100 resultat
          if (res.status === 400 && startIndex > 10) {
            console.error(`400-fel vid försök att gå över 100 resultat. Avbryter denna kombination.`);
            break;
          }
          
          // För andra fel, försök igen med nästa kombination
          break;
        }

        const data = await res.json();
        
        if (!data.items || data.items.length === 0) {
          console.log(`Inga fler resultat för query: ${query} efter sida ${page-1}`);
          break;
        }

        // Lägg till resultaten om de inte redan finns
        for (const item of data.items) {
          if (!seenLinks.has(item.link)) {
            seenLinks.add(item.link);
            allItems.push(item);
          }
        }
        
        // Avbryt när vi nått 4000 resultat
        if (allItems.length >= 4000) {
          console.log(`Nått maxgränsen på 4000 resultat, avbryter hämtning`);
          break;
        }
        
        // Kort paus mellan anrop för att undvika rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Logga framsteg i sökprocessen
      console.log(`Slutfört sökning med query: ${query} (${queries.indexOf(query) + 1}/${queries.length})`);
      
      // Avbryt om vi redan nått maxgränsen för alla queries
      if (allItems.length >= 4000) {
        break;
      }
      
    } catch (error) {
      console.error(`Error with query ${query}:`, error);
    }
  }

  console.log(`Totalt antal unika resultat efter alla queries: ${allItems.length}`);
  
  // Store raw search results for later use in other components
  localStorage.setItem('searchResultItems', JSON.stringify(allItems));
  
  // Ta bara de första 4000 resultaten
  const limitedItems = allItems.slice(0, 4000);

  return limitedItems.map((item: any) => {
    const snippet = item.snippet || "";
    
    // Extract title and company from snippet
    let title = "Unknown";
    let company = "Unknown";
    
    // Improved company extraction - using more comprehensive patterns
    
    // 1. First try title format patterns
    if (item.title) {
      // Clean title by removing LinkedIn suffix
      const cleanTitle = item.title
        .replace(/\s*[|\-–]\s*LinkedIn\s*$/, '')
        .replace(/\s+LinkedIn\s*$/, '')
        .trim();
      
      // Try separator patterns: "Name | Title | Company" or "Name - Title - Company"
      const separators = ["|", "-", "–", "—"];
      let foundCompany = false;
      
      for (const separator of separators) {
        const parts = cleanTitle.split(new RegExp(`\\s*${separator}\\s*`));
        
        if (parts.length === 3) {
          // Format: "Name | Title | Company"
          company = parts[2].trim();
          title = parts[1].trim();
          foundCompany = true;
          break;
        }
      }
      
      // Try "Title at/på Company" pattern if we didn't find a company yet
      if (!foundCompany) {
        const prepositions = ['at', 'på', 'hos', 'with', 'för', 'i', 'in', 'from'];
        for (const prep of prepositions) {
          const pattern = new RegExp(`\\b${prep}\\s+([A-Z][A-Za-z0-9\\s&\\.,']+)$`, 'i');
          const match = cleanTitle.match(pattern);
          if (match && match[1]) {
            company = match[1].trim();
            // Extract title - everything before the preposition
            title = cleanTitle.split(new RegExp(`\\s+${prep}\\s+`))[0].trim();
            foundCompany = true;
            break;
          }
        }
      }
    }
    
    // 2. If we still don't have a company, try snippet patterns
    if (company === "Unknown" && snippet) {
      // Try common LinkedIn snippet formats
      
      // Pattern 1: "Title at Company"
    if (snippet.includes(" at ")) {
      const parts = snippet.split(" at ");
      title = parts[0].trim();
        // Don't break at first period - can remove sentences but preserve company name
        company = parts[1].trim().split(/\.\s+/)[0].trim();
      } 
      // Pattern 2: "Title - Company"
      else if (snippet.includes(" - ")) {
      const parts = snippet.split(" - ");
      title = parts[0].trim();
        company = parts[1].trim().split(/\.\s+/)[0].trim();
      }
      // Pattern 3: "X years at Company as Title"
      else if (snippet.match(/\d+\s+(?:years?|months?|år)\s+at\s+/i)) {
        const match = snippet.match(/\d+\s+(?:years?|months?|år)\s+at\s+([^.]+)(?:\s+as\s+|\.\s+|$)/i);
        if (match && match[1]) {
          company = match[1].trim();
          // Try to find title
          const titleMatch = snippet.match(/\s+as\s+([^.]+)/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }
        }
      }
      // Pattern 4: Swedish "X år på Company som Title"
      else if (snippet.match(/\d+\s+år\s+på\s+/i)) {
        const match = snippet.match(/\d+\s+år\s+på\s+([^.]+)(?:\s+som\s+|\.\s+|$)/i);
        if (match && match[1]) {
          company = match[1].trim();
          // Try to find title
          const titleMatch = snippet.match(/\s+som\s+([^.]+)/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }
        }
      }
    }
    
    // 3. Clean up company name - remove common issues
    if (company !== "Unknown") {
      // Remove trailing text
      company = company
        .replace(/\s*\([^)]*\)/g, '') // Remove parentheticals
        .replace(/\s*[,;:]\s*.*$/, '') // Remove everything after a comma/semicolon
        .replace(/\s*-\s*.*$/, '')     // Remove everything after a dash
        .replace(/\s*\|.*$/, '')       // Remove everything after a pipe
        .trim();
        
      // Fix common LinkedIn format issues  
      if (company.includes("...")) {
        company = company.split("...")[0].trim();
      }
    }

    return {
      name: item.title?.replace(" | LinkedIn", "").replace(" - LinkedIn", "") || "Unknown",
      profileUrl: item.link,
      title,
      company,
      snippet: item.snippet // Include the raw snippet
    };
  });
};

const LinkedInBooleanSearchComponent = () => {
  const [requirements, setRequirements] = useState([
    "5 years in sales",
    "SaaS experience",
    "Fluent in Swedish",
    "Account Executive"
  ]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  
  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };
  
  const addRequirement = () => {
    if (requirements.length < 5) {
      setRequirements([...requirements, ""]);
    }
  };
  
  const removeRequirement = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
  };

  const handleSearch = async () => {
    console.log("=================== DIAGNOSTIK ===================");
    console.log("KÖRS: LinkedInBooleanSearchComponent.tsx::handleSearch");
    console.log("Tidstämpel:", new Date().toISOString());
    console.log("Sökvillkor:", requirements.filter(req => req.trim() !== ""));
    console.log("===================================================");
    
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const filteredRequirements = requirements.filter(req => req.trim() !== "");
      if (filteredRequirements.length === 0) {
        setError("Please add at least one requirement");
        setLoading(false);
        return;
      }
      
      // Clear all previous search-related localStorage data
      console.log("Clearing previous search data from localStorage");
      const keysToRemove = [
        'searchRequirements', 
        'searchTerms', 
        'requirementSourceMap', 
        'originalRequirements',
        'searchCriteria',
        'aiExtractedProfiles',
        'requirements',
        'searchResultItems',
        'approvedRequirements',
        'cachedProfiles',
        'extractedProfiles',
        'preservedPhrases'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Simple approach: Store the exact requirements as entered by the user
      // without any processing or splitting
      localStorage.setItem('searchRequirements', JSON.stringify(filteredRequirements));
      localStorage.setItem('searchTerms', JSON.stringify(filteredRequirements));
      localStorage.setItem('originalRequirements', JSON.stringify(filteredRequirements));
      localStorage.setItem('approvedRequirements', JSON.stringify(filteredRequirements));
      localStorage.setItem('searchCriteria', filteredRequirements.join(' AND '));
      
      console.log("Original requirements stored directly:", filteredRequirements);
      
      // Progressuppdatering för UI
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return newProgress;
        });
      }, 1000);
      
      const results = await fetchLinkedInProfiles(filteredRequirements);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setCandidates(results);
      
      if (results.length === 0) {
        setError("No candidates found. Try different requirements.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#161B28] rounded-xl border border-[#2A2F3C]">
      <h2 className="text-xl font-bold mb-4 text-white">Boolean LinkedIn Search</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2 text-gray-200">Search Requirements</h3>
        <div className="space-y-2">
          {requirements.map((req, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={req}
                onChange={(e) => handleRequirementChange(i, e.target.value)}
                className="flex-1 p-2 rounded bg-[#1D212E] border border-[#2A2F3C] text-white"
                placeholder="Add requirement"
              />
              <button
                onClick={() => removeRequirement(i)}
                className="p-2 rounded bg-[#2A2F3C] text-red-300 hover:bg-[#3A3F4C]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        
        {requirements.length < 5 && (
          <button
            onClick={addRequirement}
            className="mt-2 p-2 rounded bg-[#2A2F3C] text-blue-300 hover:bg-[#3A3F4C]"
          >
            + Add Requirement
          </button>
        )}
      </div>
      
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700 transition-colors"
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? "Searching..." : "Start Search"}
      </button>
      
      {loading && (
        <div className="mb-4">
          <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-400 text-center mt-1 text-sm">
            {progress < 100 
              ? `Söker LinkedIn-profiler... ${progress}%` 
              : 'Bearbetar resultat...'}
          </p>
        </div>
      )}
      
      {error && (
        <div className="p-3 mb-4 bg-[#2D1E24] border border-[#7D2231] text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {candidates.length > 0 && (
        <>
          <div className="p-3 mb-4 bg-[#1D2A20] border border-[#254D2F] text-green-200 rounded-lg">
            Hittade {candidates.length} kandidater som matchar dina kriterier.
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-[#2A2F3C] rounded">
              <thead className="bg-[#1D212E]">
                <tr>
                  <th className="p-3 text-gray-300">Name</th>
                  <th className="p-3 text-gray-300">Title</th>
                  <th className="p-3 text-gray-300">Company</th>
                  <th className="p-3 text-gray-300">LinkedIn Profile</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => {
                  const filteredRequirements = requirements.filter(req => req.trim() !== "");
                  const matchScore = filteredRequirements.filter((req) =>
                    (c.title + c.company).toLowerCase().includes(req.toLowerCase())
                  ).length;

                  const bg =
                    matchScore >= 3
                      ? "bg-[#1D2A20] border-b border-[#254D2F]"
                      : matchScore === 2
                      ? "bg-[#2A291D] border-b border-[#4D4A2F]"
                      : "bg-[#2D1E24] border-b border-[#4D2F3F]";

                  return (
                    <tr key={i} className={bg}>
                      <td className="p-3 text-white">{c.name}</td>
                      <td className="p-3 text-white">{c.title}</td>
                      <td className="p-3 text-white">{c.company}</td>
                      <td className="p-3">
                        <a
                          href={c.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          View Profile
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default LinkedInBooleanSearchComponent;
