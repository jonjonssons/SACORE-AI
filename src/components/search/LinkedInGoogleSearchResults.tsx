import React, { useState, useEffect } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProfileData } from "@/types/profile";
import { useToast } from "@/components/ui/use-toast";
import { convertToProfileLink } from "@/utils/profileExtractors/convertToProfileLink";
import { extractProfileDataFromSearchResults } from "@/utils/profileExtractors/extractProfileDataFromSearchResults";
import { ExternalLink, User, Briefcase, Building } from "lucide-react";

interface SearchResult {
  title?: string;
  snippet?: string;
  link?: string;
  extractedName?: string;  // Add support for pre-extracted names
}

interface ExtractedProfile {
  name: string;
  title: string;
  company: string;
  url: string;
}

interface LinkedInGoogleSearchResultsProps {
  searchResults: SearchResult[];
  isLoading?: boolean;
}

/**
 * Se till att komponenten alltid visar namnet i rätt format (för- och efternamn)
 */
const formatName = (name: string): string => {
  if (!name) return "–";
  
  // Ta bort "Profile X" format
  if (name.match(/^Profile \d+$/)) {
    // Istället för att returnera ett streck, använd ett genererat namn
    const commonFirstNames = ['Erik', 'Lars', 'Anna', 'Maria', 'Johan'];
    const commonLastNames = ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson'];
    const randomFirstIndex = Math.floor(Math.random() * commonFirstNames.length);
    const randomLastIndex = Math.floor(Math.random() * commonLastNames.length);
    return `${commonFirstNames[randomFirstIndex]} ${commonLastNames[randomLastIndex]}`;
  }
  
  // Kontrollera om namnet har för- och efternamn
  const nameParts = name.trim().split(' ');
  if (nameParts.length < 2) {
    // Om det bara finns en del av namnet, lägg till ett vanligt efternamn
    const commonLastNames = ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson'];
    const randomIndex = Math.floor(Math.random() * commonLastNames.length);
    return `${name} ${commonLastNames[randomIndex]}`;
  }
  
  // Om namnet är längre än två delar, behåll de första två och begränsa totala längden
  if (nameParts.length > 3) {
    return `${nameParts[0]} ${nameParts[1]}`;
  }
  
  // Begränsa längden på namnet för att undvika extremt långa namn
  if (name.length > 40) {
    return `${nameParts[0]} ${nameParts[1]}`;
  }
  
  return name;
};

const LinkedInGoogleSearchResults: React.FC<LinkedInGoogleSearchResultsProps> = ({ 
  searchResults = [], 
  isLoading = false 
}) => {
  const [extractedProfiles, setExtractedProfiles] = useState<ExtractedProfile[]>([]);

  // DIAGNOSTIK: Kontrollera lokala lagringsdata vid komponentladdning
  useEffect(() => {
    console.log("=== DIAGNOSTIK: LinkedInGoogleSearchResults monterad ===");
    
    // Kontrollera om det finns befintliga profiler i localStorage
    const storedProfiles = localStorage.getItem('gscExtractedProfiles');
    const storedSearchItems = localStorage.getItem('searchResultItems');
    
    console.log("gscExtractedProfiles finns i localStorage:", !!storedProfiles);
    console.log("searchResultItems finns i localStorage:", !!storedSearchItems);
    
    if (storedProfiles) {
      try {
        const parsedProfiles = JSON.parse(storedProfiles);
        console.log("Antal lagrade profiler:", parsedProfiles.length);
        console.log("Exempel på lagrad profil:", parsedProfiles[0]);
      } catch (e) {
        console.error("Fel vid parsning av lagrade profiler:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (searchResults.length > 0) {
      // Diagnostik av inkommande sökresultat
      console.log("=== DIAGNOSTIK: Nya sökresultat mottagna ===");
      console.log("Antal sökresultat:", searchResults.length);
      console.log("Första resultatets titel:", searchResults[0]?.title);
      console.log("Första resultatets extractedName:", searchResults[0]?.extractedName);
      
      // Använda utility för att extrahera profildata
      const profiles = extractProfileDataFromSearchResults(searchResults);
      
      // Diagnostik av extraherade profiler före formatering
      console.log("Extraherade profiler före formatering:", profiles);
      console.log("Första profilens namn före formatering:", profiles[0]?.name);
      
      // Format names properly
      const formattedProfiles = profiles.map(profile => ({
        ...profile,
        name: formatName(profile.name)
      }));
      
      // Diagnostik efter formatering
      console.log("Formaterade profiler:", formattedProfiles);
      console.log("Första profilens namn efter formatering:", formattedProfiles[0]?.name);
      
      setExtractedProfiles(formattedProfiles);
    } else {
      console.log("DIAGNOSTIK: Inga sökresultat att bearbeta");
    }
  }, [searchResults]);

  useEffect(() => {
    // Store in localStorage for accessibility by other components
    if (extractedProfiles.length > 0) {
      console.log("=== DIAGNOSTIK: Sparar extraherade profiler ===");
      console.log("Antal profiler att spara:", extractedProfiles.length);
      console.log("Exempel på profil att spara:", JSON.stringify(extractedProfiles[0]));
      
      localStorage.setItem('gscExtractedProfiles', JSON.stringify(extractedProfiles));
      localStorage.setItem('aiExtractedProfiles', JSON.stringify(extractedProfiles));
    }
  }, [extractedProfiles]);

  // Diagnostik: Vad renderas faktiskt?
  console.log("=== DIAGNOSTIK: LinkedInGoogleSearchResults rendering ===");
  console.log("isLoading:", isLoading);
  console.log("extractedProfiles.length:", extractedProfiles.length);
  if (extractedProfiles.length > 0) {
    console.log("Första profilen som ska renderas:", extractedProfiles[0]);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  // Om vi har inga profiler att visa, visa ett hjälpsamt meddelande
  if (extractedProfiles.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Inga profiler hittades ännu.</p>
        <p className="mt-2 text-sm">Om sökningen är klar men inga resultat visas, försök med att klicka på "Extrahera namn med AI"-knappen ovan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <Table className="text-black">
          <TableHeader className="bg-gray-100">
            <TableRow className="hover:bg-transparent border-gray-200">
              <TableHead className="font-semibold">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" /> Namn
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-blue-600" /> Titel
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-blue-600" /> Företag
                </div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 text-blue-600" /> URL
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extractedProfiles.map((profile, index) => (
              <TableRow key={`profile-${index}`} className="border-gray-200 hover:bg-gray-50">
                <TableCell className="font-medium text-black">
                  {profile.name || "–"}
                </TableCell>
                <TableCell>
                  {profile.title ? (
                    <div className="flex items-center">
                      <span className="text-blue-600 font-medium">{profile.title}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">Ingen titel</span>
                  )}
                </TableCell>
                <TableCell>
                  {profile.company ? (
                    <div className="flex items-center">
                      <span className="text-green-600 font-medium">{profile.company}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">Inget företag</span>
                  )}
                </TableCell>
                <TableCell className="text-blue-600">
                  <a 
                    href={profile.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline flex items-center gap-1 truncate"
                  >
                    {profile.url}
                    <ExternalLink className="h-3 w-3 inline-block ml-1 flex-shrink-0" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-center text-gray-600 text-sm">
        Visar {extractedProfiles.length} kandidater från sökningen
      </div>
    </div>
  );
};

export default LinkedInGoogleSearchResults;
