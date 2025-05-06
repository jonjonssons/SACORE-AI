
import React, { useState, useEffect } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import { LinkRow, SearchResult, LinksSheetProps } from "./types";

const LinksSheet: React.FC<LinksSheetProps> = ({ 
  links = [], 
  searchResults = [], 
  isLoading = false,
  isOpen,
  onOpenChange 
}) => {
  const [extractedProfiles, setExtractedProfiles] = useState<LinkRow[]>([]);
  const [dataSource, setDataSource] = useState<string>("none");

  useEffect(() => {
    console.log("LinksSheet - Loading profiles data...");
    
    // First try to get AI extracted profiles with names
    const loadProfilesFromStorage = () => {
      // Try each storage location in order of preference
      const storageKeys = ['aiExtractedProfiles', 'extractedProfileData', 'linkSheetRows'];
      
      for (const key of storageKeys) {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log(`LinksSheet - Found ${parsedData.length} profiles in ${key}`);
              
              // Check if the data has names and isn't just generic "Profile X"
              const hasRealNames = parsedData.some(profile => 
                profile.name && !profile.name.startsWith('Profile ')
              );
              
              if (hasRealNames) {
                console.log(`LinksSheet - Using profiles from ${key} with real names`);
                console.log("LinksSheet - First few names:", 
                  parsedData.slice(0, 3).map(p => p.name));
                
                // Format data based on the source
                let formattedProfiles;
                if (key === 'linkSheetRows') {
                  // Already in correct format
                  formattedProfiles = parsedData;
                } else {
                  // Convert to LinkRow format
                  formattedProfiles = parsedData.map((profile, index) => ({
                    id: `profile-${index}`,
                    url: profile.url,
                    name: profile.name || `Profile ${index + 1}`,
                    title: profile.title || "",
                    company: profile.company || "",
                  }));
                }
                
                setExtractedProfiles(formattedProfiles);
                setDataSource(key);
                return true;
              }
            }
          } catch (error) {
            console.error(`LinksSheet - Error parsing ${key}:`, error);
          }
        }
      }
      return false;
    };
    
    const foundStoredProfiles = loadProfilesFromStorage();
    
    // If no stored profiles with names found, create from search results
    if (!foundStoredProfiles && searchResults.length > 0) {
      console.log("LinksSheet - Creating profiles from search results:", searchResults.length);
      
      const profiles = searchResults.map((result, index) => ({
        id: `profile-${index}`,
        url: result.link,
        name: result.title ? result.title.split(' | ')[0].trim() : `Profile ${index + 1}`,
        title: result.title || "",
        snippet: result.snippet || "",
      }));
      
      setExtractedProfiles(profiles);
      setDataSource('searchResults');
    } 
    // Final fallback: create from links if necessary
    else if (!foundStoredProfiles && links.length > 0) {
      console.log("LinksSheet - Creating profiles from links:", links.length);
      
      const linkRows: LinkRow[] = links.map((url, index) => ({
        id: `profile-${index}`,
        url: url,
        name: `Profile ${index + 1}` // Generic profile name with index
      }));
      
      setExtractedProfiles(linkRows);
      setDataSource('links');
    }
  }, [links, searchResults]);

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

  return (
    <div className="space-y-4">
      {dataSource !== "none" && (
        <div className="text-sm text-gray-400 mb-2">
          Data source: {dataSource} ({extractedProfiles.length} profiles)
        </div>
      )}
      
      <div className="rounded-lg overflow-hidden border border-gray-800">
        <Table className="text-white">
          <TableHeader className="bg-black">
            <TableRow className="hover:bg-transparent border-gray-800">
              <TableHead className="font-semibold">
                <div className="flex items-center">Name</div>
              </TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2 text-blue-400" /> URL
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extractedProfiles.map((profile) => (
              <TableRow key={profile.id} className="border-gray-800 hover:bg-[#1A1A1A]">
                <TableCell className="font-medium text-white">
                  {profile.name || `Profile`}
                </TableCell>
                <TableCell className="text-blue-400">
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
      
      <div className="text-center text-gray-400 text-sm">
        Visar {extractedProfiles.length} länkar från sökningen
      </div>
    </div>
  );
};

export default LinksSheet;
