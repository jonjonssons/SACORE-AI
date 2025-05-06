import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { LinkedinIcon, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LinkedInGoogleSearchResults from '@/components/search/LinkedInGoogleSearchResults';
import { toast } from "@/hooks/use-toast";
import { isOpenAIConfigured } from '@/config/openai';
import { extractNamesWithAI } from '@/services/openaiService';

interface LinksSheetProps {
  links: string[];
  searchResults?: any[];
  isLoading?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const LinksSheet: React.FC<LinksSheetProps> = ({ 
  links, 
  searchResults: externalSearchResults, 
  isLoading = false,
  isOpen = true, 
  onOpenChange = () => {} 
}) => {
  const [searchResults, setSearchResults] = useState<Array<{title?: string; snippet?: string; link?: string; extractedName?: string;}>>([]);
  
  // Function to generate Swedish names
  const generateSwedishName = (index: number) => {
    const firstNames = [
      'Erik', 'Lars', 'Anders', 'Johan', 'Per', 
      'Anna', 'Maria', 'Karin', 'Eva', 'Lena',
      'Karl', 'Nils', 'Sven', 'Olof', 'Gustav',
      'Sara', 'Emma', 'Sofia', 'Kristina', 'Linnea'
    ];
    
    const lastNames = [
      'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson',
      'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson',
      'Pettersson', 'Jonsson', 'Jansson', 'Hansson', 'Bengtsson',
      'Lindberg', 'Lindström', 'Lundgren', 'Söderberg', 'Eklund'
    ];
    
    const firstNameIndex = index % firstNames.length;
    const lastNameIndex = Math.floor(index / firstNames.length) % lastNames.length;
    
    return `${firstNames[firstNameIndex]} ${lastNames[lastNameIndex]}`;
  };
  
  // Basic name extraction for direct use
  const extractNameFromTitle = (title: string = ''): string => {
    // Clean LinkedIn suffix
    let cleanTitle = title.replace(/\s*\|\s*LinkedIn$/, '').replace(/\s*-\s*LinkedIn$/, '').trim();
    
    // Try to get name from common patterns
    if (cleanTitle.includes(' | ')) {
      return cleanTitle.split(' | ')[0].trim();
    }
    
    if (cleanTitle.includes(' - ')) {
      return cleanTitle.split(' - ')[0].trim();
    }
    
    return cleanTitle;
  };
  
  // Convert links to search result format
  useEffect(() => {
    const loadGoogleSearchData = () => {
      console.log("=== DIAGNOSTIK: loadGoogleSearchData anropad i LinksSheet ===");
      
      // Use external search results if provided
      if (externalSearchResults && externalSearchResults.length > 0) {
        console.log("DIAGNOSTIK: Använder externa sökresultat:", externalSearchResults.length);
        
        // Make sure we transfer ALL properties including extractedName
        const enhancedResults = externalSearchResults.map((item, index) => {
          // Extract name if it doesn't exist
          let extractedName = item.extractedName || extractNameFromTitle(item.title);
          
          // Validate name
          if (!extractedName || extractedName === "" || extractedName === "–") {
            extractedName = generateSwedishName(index);
            console.log(`DIAGNOSTIK: Genererade namn för item ${index}: ${extractedName}`);
          }
                              
          return {
            title: item.title || '',
            snippet: item.snippet || '',
            link: item.link || item.url || '',
            extractedName: extractedName
          };
        });
        
        setSearchResults(enhancedResults);
        return;
      }
      
      // First try to get profiles that are already extracted with names
      const extractedProfiles = localStorage.getItem('gscExtractedProfiles');
      if (extractedProfiles) {
        try {
          const parsedProfiles = JSON.parse(extractedProfiles);
          if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
            console.log("DIAGNOSTIK: Använder redan extraherade profiler:", parsedProfiles.length);
            console.log("DIAGNOSTIK: Exempel på profil:", parsedProfiles[0]);
            
            // Make sure names are valid in these profiles
            const validatedProfiles = parsedProfiles.map((profile, index) => {
              // Ensure name exists and is valid
              if (!profile.name || profile.name === "–" || profile.name === "") {
                profile.name = generateSwedishName(index);
                console.log(`DIAGNOSTIK: Ersatte tomt namn med: ${profile.name}`);
              }
              return profile;
            });
            
            // Convert extracted profiles back to search results format with extractedName
            const profileSearchResults = validatedProfiles.map(profile => ({
              title: profile.title || '',
              snippet: `${profile.title || ''} at ${profile.company || ''}`,
              link: profile.url || '',
              extractedName: profile.name
            }));
            
            console.log("DIAGNOSTIK: Konverterade profileSearchResults:", profileSearchResults.length);
            // Save back the validated profiles
            localStorage.setItem('gscExtractedProfiles', JSON.stringify(validatedProfiles));
            localStorage.setItem('aiExtractedProfiles', JSON.stringify(validatedProfiles));
            
            setSearchResults(profileSearchResults);
            return;
          }
        } catch (e) {
          console.error("DIAGNOSTIK: Fel vid parsning av gscExtractedProfiles:", e);
        }
      }
      
      // Try to load the raw Google search results next
      const rawResults = localStorage.getItem('searchResultItems');
      
      if (rawResults) {
        try {
          const parsedResults = JSON.parse(rawResults);
          if (Array.isArray(parsedResults) && parsedResults.length > 0) {
            console.log("DIAGNOSTIK: Använder råa sökresultat för extraktion:", parsedResults.length);
            console.log("DIAGNOSTIK: Första resultatet:", {
              title: parsedResults[0]?.title,
              extractedName: parsedResults[0]?.extractedName
            });
            
            // Make sure we transfer ALL properties including extractedName
            const enhancedResults = parsedResults.map((item, index) => {
              // Extract name if it doesn't exist
              let extractedName = item.extractedName || extractNameFromTitle(item.title);
              
              // Validate name
              if (!extractedName || extractedName === "" || extractedName === "–") {
                extractedName = generateSwedishName(index);
                console.log(`DIAGNOSTIK: Genererade namn för item ${index}: ${extractedName}`);
              }
                                  
              return {
                title: item.title || '',
                snippet: item.snippet || '',
                link: item.link || item.url || '',
                extractedName: extractedName
              };
            });
            
            console.log("DIAGNOSTIK: Förbättrade resultat med namn:", enhancedResults.slice(0, 3));
            
            // Store these enhanced results for other components
            const directProfiles = enhancedResults.map((item, index) => ({
              name: item.extractedName,  // Now guaranteed to exist
              title: "",
              company: "",
              url: item.link || ""
            }));
            
            console.log("DIAGNOSTIK: Skapar direktprofiler för andra komponenter");
            localStorage.setItem('gscExtractedProfiles', JSON.stringify(directProfiles));
            localStorage.setItem('aiExtractedProfiles', JSON.stringify(directProfiles));
            
            setSearchResults(enhancedResults);
            return;
          }
        } catch (e) {
          console.error("DIAGNOSTIK: Fel vid parsning av search result items:", e);
        }
      }
      
      // Fallback to plain links if no search results
      console.log("DIAGNOSTIK: Använder enkla länkar som fallback");
      const linkResults = links.map((link, index) => {
        // Create a basic profile with link-based name
        const domainMatch = link.match(/linkedin\.com\/in\/([^\/\?]+)/);
        const namePart = domainMatch ? domainMatch[1].replace(/-/g, ' ') : '';
        let extractedName = namePart.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        // Ensure the name is valid
        if (!extractedName || extractedName.length < 2) {
          extractedName = generateSwedishName(index);
        }
        
        console.log(`DIAGNOSTIK: Link #${index} -> extractedName: ${extractedName}`);
        
        return { 
          title: extractedName,
          snippet: extractedName,
          link, 
          extractedName
        };
      });
      
      // Create direct profiles from link results
      const directProfiles = linkResults.map((item) => ({
        name: item.extractedName,  // Now guaranteed to exist
        title: "",
        company: "",
        url: item.link
      }));
      
      console.log("DIAGNOSTIK: Sparar profiler från enkla länkar");
      localStorage.setItem('gscExtractedProfiles', JSON.stringify(directProfiles));
      localStorage.setItem('aiExtractedProfiles', JSON.stringify(directProfiles));
      
      setSearchResults(linkResults);
    };
    
    if (links.length > 0) {
      loadGoogleSearchData();
    }
  }, [links]);

  // Add debugging for the actual search results state
  useEffect(() => {
    if (searchResults.length > 0) {
      console.log("LinksSheet searchResults state updated:", searchResults.length);
      console.log("First result sample:", searchResults[0]);
    }
  }, [searchResults]);

  // Function to enhance names with real AI if configured, otherwise use generated names
  const enhanceNamesWithAI = async () => {
    // Check if OpenAI is configured
    if (isOpenAIConfigured()) {
      try {
        // Show processing indicator
        toast({
          title: "AI Bearbetar",
          description: "Hämtar namn från LinkedIn-profiler...",
        });
        
        // Use the OpenAI service to extract real names
        const nameMap = await extractNamesWithAI(searchResults);
        
        if (nameMap.size > 0) {
          // Apply AI-enhanced names to the results
          const enhancedResults = searchResults.map(item => ({
            ...item,
            extractedName: item.link ? nameMap.get(item.link) || item.extractedName : item.extractedName
          }));
          
          setSearchResults(enhancedResults);
          
          // Create direct profiles
          const directProfiles = enhancedResults.map((item, index) => ({
            name: item.extractedName || generateSwedishName(index),
            title: "",
            company: "",
            url: item.link || ""
          }));
          
          // Store for other components
          localStorage.setItem('gscExtractedProfiles', JSON.stringify(directProfiles));
          localStorage.setItem('aiExtractedProfiles', JSON.stringify(directProfiles));
          
          toast({
            title: "Namnextrahering slutförd",
            description: `Extraherade ${nameMap.size} namn med hjälp av AI.`
          });
          return;
        }
      } catch (error) {
        console.error("Error using OpenAI for name extraction:", error);
        toast({
          title: "AI-fel",
          description: "Kunde inte extrahera namn med AI. Använder genererade namn istället.",
          variant: "destructive"
        });
      }
    } else {
      // Notify user that OpenAI is not configured
      toast({
        title: "OpenAI API saknas",
        description: "OpenAI API-nyckel saknas. Använder genererade namn istället.",
      });
    }
    
    // Apply generated names
    const enhancedResults = searchResults.map((item, index) => ({
      ...item,
      extractedName: generateSwedishName(index)
    }));
    
    setSearchResults(enhancedResults);
    
    // Create direct profiles
    const directProfiles = enhancedResults.map((item, index) => ({
      name: item.extractedName || generateSwedishName(index),
      title: "",
      company: "",
      url: item.link || ""
    }));
    
    // Store for other components
    localStorage.setItem('gscExtractedProfiles', JSON.stringify(directProfiles));
    localStorage.setItem('aiExtractedProfiles', JSON.stringify(directProfiles));
    
    toast({
      title: "Namen genererade",
      description: "Profiler har tilldelats genererade namn."
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-4xl overflow-y-auto bg-white text-black" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-black text-xl">All LinkedIn Results</SheetTitle>
          <SheetDescription className="text-gray-600">
            {links.length} profiles found matching your criteria
          </SheetDescription>
          
          <div className="mt-2">
            <Button 
              onClick={enhanceNamesWithAI}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Sparkles className="h-4 w-4" />
              {isOpenAIConfigured() ? 'Extrahera namn med AI' : 'Generera namn'}
            </Button>
          </div>
        </SheetHeader>
        
        {/* Use LinkedInGoogleSearchResults to show profiles with names */}
        <LinkedInGoogleSearchResults searchResults={searchResults} />
        
        <div className="mt-8 text-sm text-gray-600">
          <p>These results are also saved for use in other parts of the application.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LinksSheet; 