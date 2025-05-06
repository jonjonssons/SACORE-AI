import { useState, useEffect } from "react";
import { LinkRow, STORAGE_KEYS } from "../types";
import { useStorage } from "./useStorage";
import { useRowCreation } from "./useRowCreation";
import { toast } from "@/hooks/use-toast";

/**
 * Custom hook for handling link data in LinksSheet
 * @param initialLinks Initial array of links from props
 * @returns Object with link state and helper functions
 */
export const useLinksData = (initialLinks: string[] = []) => {
  const [internalLinks, setInternalLinks] = useState<string[]>([]);
  const [linkRows, setLinkRows] = useState<LinkRow[]>([]);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [searchResultItems, setSearchResultItems] = useState<any[]>([]);

  const { loadSearchResultItems, loadLinksFromStorage, saveLinks } = useStorage();
  const { createLinkRows } = useRowCreation();

  // Load search results from localStorage
  useEffect(() => {
    const items = loadSearchResultItems();
    if (items.length > 0) {
      setSearchResultItems(items);
    }
  }, []);

  // Process initial links or load from storage
  useEffect(() => {
    console.log("🔍 LinksSheet props RAW:", { links: initialLinks, linksLength: initialLinks?.length || 0 });
    console.log("🔍 Internal Links:", internalLinks);
    console.log("🔍 Search Result Items:", searchResultItems.length);
    
    if (initialLinks && initialLinks.length > 0) {
      console.log("✅ Using links from props:", initialLinks.length);
      
      const profileLinks = saveLinks(initialLinks);
      setInternalLinks(profileLinks);
    } else {
      console.log("⚠️ Links array is empty in LinksSheet component");
      loadLinksFromLocalStorage();
    }
  }, [initialLinks]);

  // Load links from localStorage
  const loadLinksFromLocalStorage = () => {
    const links = loadLinksFromStorage();
    if (links.length > 0) {
      setInternalLinks(links);
      return true;
    }
    return false;
  };

  // Convert links to row data
  useEffect(() => {
    console.log("Creating linkRows from internalLinks:", internalLinks.length);
    
    if (internalLinks.length > 0) {
      const savedRows = localStorage.getItem('linkSheetRows');
      if (savedRows) {
        try {
          const parsed = JSON.parse(savedRows);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log("Using saved link rows from localStorage:", parsed.length);
            
            createLinkRows(parsed, internalLinks)
              .then(updatedRows => {
                console.log("Updated rows from saved:", updatedRows.length);
                setLinkRows(updatedRows);
                localStorage.setItem('linkSheetRows', JSON.stringify(updatedRows));
              })
              .catch(error => {
                console.error("Error updating link rows:", error);
              });
            return;
          }
        } catch (e) {
          console.error("Error parsing saved link rows:", e);
        }
      }
      
      console.log("Creating new link rows from links:", internalLinks.length);
      
      createLinkRows([], internalLinks)
        .then(newRows => {
          console.log("Created new rows:", newRows.length);
          setLinkRows(newRows);
          localStorage.setItem('linkSheetRows', JSON.stringify(newRows));
        })
        .catch(error => {
          console.error("Error creating new link rows:", error);
        });
      
      setHasTriedFallback(false);
    }
  }, [internalLinks, searchResultItems]);

  // Attempt to recover links if none provided
  const tryRecoverLinks = () => {
    const savedRows = localStorage.getItem('linkSheetRows');
    if (savedRows) {
      try {
        const parsed = JSON.parse(savedRows);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLinkRows(parsed);
          
          const extractedLinks = parsed.map(row => row.url).filter(Boolean);
          if (extractedLinks.length > 0) {
            setInternalLinks(extractedLinks);
          }
          
          toast({
            title: "Links Recovered",
            description: `Found ${parsed.length} links from previous session.`,
          });
          setHasTriedFallback(true);
          return;
        }
      } catch (e) {
        console.error("Error recovering link rows from localStorage:", e);
      }
    }
    
    if (loadLinksFromLocalStorage()) {
      toast({
        title: "Links Recovered",
        description: `Recovered links from localStorage.`,
      });
      setHasTriedFallback(true);
      return;
    }

    console.warn("No links could be recovered from any source");
    setHasTriedFallback(true);
  };

  // Update a cell value in a row
  const handleCellChange = (id: string, field: keyof LinkRow, value: any) => {
    setLinkRows(prev => {
      const updated = prev.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      );
      localStorage.setItem('linkSheetRows', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Add a new row
  const addNewRow = () => {
    const newRow: LinkRow = {
      id: Math.random().toString(36).substring(2, 9),
      url: ""
    };
    
    setLinkRows(prev => {
      const updated = [...prev, newRow];
      localStorage.setItem('linkSheetRows', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Save all changes to localStorage
  const saveAllChanges = () => {
    localStorage.setItem('linkSheetRows', JSON.stringify(linkRows));
    toast({
      title: "Changes saved",
      description: `Saved ${linkRows.length} link rows successfully.`,
    });
  };

  const clearPreviousSearchData = () => {
    console.log("Clearing all previous search-related data");
    
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

    setInternalLinks([]);
    setLinkRows([]);
    setSearchResultItems([]);

    toast({
      title: "Search Data Cleared",
      description: "Previous search data has been reset.",
      variant: "default"
    });
  };

  return {
    internalLinks,
    linkRows,
    hasTriedFallback,
    setHasTriedFallback,
    tryRecoverLinks,
    handleCellChange,
    addNewRow,
    saveAllChanges,
    clearPreviousSearchData
  };
};
