import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import LinksSheet from "@/components/LinksSheet";
import useGPTExtraction from "@/hooks/useGPTExtraction";
import { toast } from "@/hooks/use-toast";

const LinkedInGoogleExtractorPage = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(true);
  const { extractProfileData } = useGPTExtraction();

  // Clear localStorage function that can be reused
  const clearStorageData = () => {
    // Clear all profile and search related data
    localStorage.removeItem('aiExtractedProfiles');
    localStorage.removeItem('extractedProfileData');
    localStorage.removeItem('linkSheetRows');
    localStorage.removeItem('googleSearchResults');
    localStorage.removeItem('searchResultItems');
    localStorage.removeItem('profile_data');
    console.log("Cleared all profile and search related data from localStorage");
  };

  useEffect(() => {
    // Attempt to load search results from localStorage
    setIsLoading(true);
    
    const loadResults = async () => {
      try {
        console.log("LinkedIn Google Extractor - Starting to load search results...");
        
        // First try to load searchResultItems which contains title and snippet
        const searchItems = localStorage.getItem("searchResultItems");
        if (searchItems) {
          const parsedItems = JSON.parse(searchItems);
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            console.log(`Found ${parsedItems.length} search results in searchResultItems`);
            
            // Log first few results to see what we're working with
            console.log("Sample search results:", parsedItems.slice(0, 2).map(item => ({
              title: item.title,
              snippet: item.snippet?.substring(0, 50) + "...",
              link: item.link
            })));
            
            setSearchResults(parsedItems);
            
            // Extract links from results
            const extractedLinks = parsedItems
              .filter((r: any) => r.link && r.link.includes('linkedin.com'))
              .map((r: any) => r.link);
              
            console.log(`Extracted ${extractedLinks.length} LinkedIn links from search results`);
            setLinks(extractedLinks);
            
            // Process with extraction
            setIsExtracting(true);
            await processProfiles(parsedItems);
            setIsExtracting(false);
            
            setIsLoading(false);
            return;
          }
        }
        
        // Then check for googleSearchResults
        const googleResults = localStorage.getItem("googleSearchResults");
        if (googleResults) {
          const parsedResults = JSON.parse(googleResults);
          if (parsedResults.results && Array.isArray(parsedResults.results)) {
            console.log(`Found ${parsedResults.results.length} Google search results`);
            setSearchResults(parsedResults.results);
            
            // Extract links from results
            const extractedLinks = parsedResults.results
              .filter((r: any) => r.link && r.link.includes('linkedin.com'))
              .map((r: any) => r.link);
              
            setLinks(extractedLinks);
            
            // Process with extraction
            setIsExtracting(true);
            await processProfiles(parsedResults.results);
            setIsExtracting(false);
            
            setIsLoading(false);
            return;
          }
        }
        
        // If no results found, use demo results
        console.log("No search results found, using demo data");
        
        // Demo data to show functionality
        const demoResults = [
          {
            title: "Anna Karlsson | LinkedIn",
            snippet: "Account Executive på Klarna AB. Arbetar med försäljning och kundrelationer för e-handelsplattformen.",
            link: "https://www.linkedin.com/in/anna-karlsson-123456/"
          },
          {
            title: "Johan Andersson - LinkedIn",
            snippet: "Sales Manager hos Spotify. Johan har över 10 års erfarenhet av B2B-försäljning inom tech-industrin.",
            link: "https://www.linkedin.com/in/johan-andersson/"
          },
          {
            title: "Maria Johansson | Product Manager | LinkedIn",
            snippet: "Product Manager på IKEA Digital. Ansvarig för utveckling av e-handelsplattformen.",
            link: "https://www.linkedin.com/in/maria-johansson-pm/"
          },
          {
            title: "Erik Lindberg - LinkedIn",
            snippet: "Senior Software Developer at Ericsson working with 5G technologies and cloud solutions.",
            link: "https://www.linkedin.com/in/erik-lindberg/"
          },
          {
            title: "Lina Ekström | LinkedIn",
            snippet: "Head of Marketing på Volvo Cars. Ansvarig för digital marknadsföring och varumärkesstrategi.",
            link: "https://www.linkedin.com/in/lina-ekstrom/"
          }
        ];
        
        setSearchResults(demoResults);
        setLinks(demoResults.map(r => r.link));
        
        // Process profiles
        setIsExtracting(true);
        await processProfiles(demoResults);
        setIsExtracting(false);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading search results:", error);
        setIsLoading(false);
        setIsExtracting(false);
      }
    };
    
    loadResults();
  }, [extractProfileData]);

  const processProfiles = async (results: any[]) => {
    console.log(`Processing ${results.length} results for name extraction...`);
    
    // Check if we already have processed profiles
    const existingProfiles = localStorage.getItem('aiExtractedProfiles');
    if (existingProfiles) {
      try {
        const parsedProfiles = JSON.parse(existingProfiles);
        if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
          console.log(`Found ${parsedProfiles.length} already extracted profiles`);
          
          // Check if profiles have actual names (not just "Profile X")
          const profilesWithNames = parsedProfiles.filter(p => 
            p.name && !p.name.startsWith('Profile ')
          );
          
          if (profilesWithNames.length > 0) {
            console.log(`${profilesWithNames.length} profiles have real names, reusing them`);
            // Here we have profiles with names, so no need to extract again
            return;
          }
          
          console.log("No profiles with real names found, proceeding with extraction");
        }
      } catch (error) {
        console.error("Error parsing existing profiles:", error);
      }
    }
    
    try {
      // Extract profile data using GPT
      toast({
        title: "Extracting names",
        description: "Using AI to extract names from search results...",
      });
      
      const extractedProfiles = await extractProfileData(results);
      console.log("Extraction complete, extracted profiles with names:", 
        extractedProfiles.map(p => p.name));
      
      // Make sure we're storing complete profile data
      localStorage.setItem('aiExtractedProfiles', JSON.stringify(extractedProfiles));
      localStorage.setItem('extractedProfileData', JSON.stringify(extractedProfiles));
      
      // Also save in linkSheetRows format for backward compatibility
      const formattedProfiles = extractedProfiles.map((profile, index) => ({
        id: `profile-${index}`,
        url: profile.url,
        name: profile.name,
        title: profile.title || '',
        company: profile.company || ''
      }));
      
      console.log("Storing formatted profiles:", formattedProfiles.slice(0, 3));
      localStorage.setItem('linkSheetRows', JSON.stringify(formattedProfiles));
      
      // Verify that we can read back the data we just stored
      const storedData = localStorage.getItem('linkSheetRows');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log(`Verified storage: read back ${parsedData.length} profiles, first few names:`, 
          parsedData.slice(0, 3).map((p: {name: string}) => p.name));
      }
      
      toast({
        title: "Extraction complete",
        description: `Successfully extracted ${extractedProfiles.length} profile names`,
      });
    } catch (error) {
      console.error("Error in extraction:", error);
      toast({
        title: "Extraction error",
        description: "There was an error extracting profile data",
      });
    }
  };

  const handleRetryExtraction = async () => {
    setIsExtracting(true);
    toast({
      title: "Retrying extraction",
      description: "Attempting to extract names again...",
    });
    
    try {
      // First clear any previous extraction data
      localStorage.removeItem('aiExtractedProfiles');
      localStorage.removeItem('extractedProfileData');
      localStorage.removeItem('linkSheetRows');
      
      // Then perform extraction again
      await processProfiles(searchResults);
      
      toast({
        title: "Extraction retried",
        description: "Name extraction completed successfully",
      });
    } catch (error) {
      console.error("Error retrying extraction:", error);
      toast({
        title: "Extraction failed",
        description: "Could not extract names from search results",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Tillbaka
            </Button>
            <h1 className="text-2xl font-bold">LinkedIn-profiler</h1>
          </div>
          
          <Button
            variant="outline"
            className="text-blue-600 hover:bg-blue-400/10"
            onClick={handleRetryExtraction}
            disabled={isExtracting}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {isExtracting ? "Extracting..." : "Retry Name Extraction"}
          </Button>
        </div>
        
        <Alert className="mb-6 bg-card dark:bg-card border-border dark:border-border">
          <AlertTitle>Extraherad profildata</AlertTitle>
          <AlertDescription className="text-muted-foreground dark:text-muted-foreground">
            Nedan visas automatiskt extraherade profiler från Google-sökresultat. 
            Namn, titel och företag har extraherats med AI från sökresultatens titlar och beskrivningar.
            {isExtracting && " Extraherar namn..."}
          </AlertDescription>
        </Alert>
        
        <LinksSheet 
          links={links} 
          searchResults={searchResults} 
          isLoading={isLoading || isExtracting} 
        />
      </div>
    </div>
  );
};

export default LinkedInGoogleExtractorPage;
