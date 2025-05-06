
import { LinkRow } from "../types";
import { normalizeLinkedInUrl } from "@/utils/profileExtractors/urlNormalizer";
import { extractProfileInfo } from "@/utils/profileExtractor";
import { parseName } from "@/utils/profileExtractors/nameParser";

export const useRowCreation = () => {
  const createLinkRows = async (
    existingRows: LinkRow[],
    links: string[]
  ): Promise<LinkRow[]> => {
    if (existingRows.length > 0) {
      return existingRows.map(row => ({
        ...row,
        url: normalizeLinkedInUrl(row.url)
      }));
    }

    // Use Promise.all to handle async operations inside map
    return Promise.all(links.map(async (link, index) => {
      // Get any search result data that might be in localStorage
      let searchResultData;
      try {
        const storedData = localStorage.getItem('searchResultItems');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          searchResultData = parsed.find((item: any) => 
            normalizeLinkedInUrl(item.link) === normalizeLinkedInUrl(link)
          );
        }
      } catch (error) {
        console.error('Error parsing search results:', error);
      }

      // Extract profile info for title and company
      const { title, company } = searchResultData ? 
        extractProfileInfo(searchResultData.snippet || '') : 
        { title: 'Not available', company: 'Not available' };

      // For name, try multiple strategies
      let name = '';
      
      // First attempt: Parse name from title using name parser
      if (searchResultData?.title) {
        name = parseName(searchResultData.title);
        console.log(`Parsed name from title: "${name}" (original: "${searchResultData.title}")`);
      }
      
      // Second attempt: If no valid name, try AI extraction
      if (!name || name === 'Unknown') {
        if (searchResultData) {
          try {
            console.log("Attempting AI extraction for name");
            const response = await fetch("https://ucofzcubtdgwcekdogxr.functions.supabase.co/linkedin_data_retrieval", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                title: searchResultData.title || "",
                snippet: searchResultData.snippet || ""
              })
            });

            if (response.ok) {
              const data = await response.json();
              
              if (data.name) {
                name = data.name;
                console.log("Using AI extracted name:", name);
              }
            }
          } catch (error) {
            console.error("Error getting name from AI:", error);
          }
        }
      }
      
      // Final fallback: If still no valid name, use default
      if (!name || name === 'Unknown') {
        name = `Profile ${index + 1}`;
        console.log("Using default profile name:", name);
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        url: normalizeLinkedInUrl(link),
        name,
        title,
        company
      };
    }));
  };

  return {
    createLinkRows
  };
};
