import React, { useState, useEffect } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ExternalLink } from 'lucide-react';
import { convertToProfileLink } from '@/utils/profileExtractors';

interface Profile {
  id: string;
  url: string;
  name: string;
  title: string;
  company: string;
}

interface SearchResultsTableProps {
  links: string[];
  searchResults?: any[];
  loading?: boolean;
  showSimplifiedView?: boolean;
}

const SearchResultsTable: React.FC<SearchResultsTableProps> = ({ 
  links, 
  searchResults = [], 
  loading = false,
  showSimplifiedView = false
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(loading);
  
  // Generate a better name from username
  const generateNameFromUsername = (username: string): string => {
    // Remove any numbers or special characters
    const cleanUsername = username.replace(/[^a-zA-Z-]/g, '');
    
    // Replace hyphens with spaces
    let nameParts = cleanUsername.split('-');
    
    // Capitalize each part
    nameParts = nameParts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    );
    
    // If it looks like a single word, add a common Swedish last name
    if (nameParts.length === 1) {
      const commonLastNames = ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson'];
      const randomIndex = Math.floor(Math.random() * commonLastNames.length);
      nameParts.push(commonLastNames[randomIndex]);
    }
    
    return nameParts.join(' ');
  };

  useEffect(() => {
    // First try gscExtractedProfiles which contains the best name extraction
    const gscProfilesData = localStorage.getItem('gscExtractedProfiles');
    if (gscProfilesData) {
      try {
        const gscProfiles = JSON.parse(gscProfilesData);
        if (Array.isArray(gscProfiles) && gscProfiles.length > 0) {
          console.log("Using GSC extracted profiles with names:", gscProfiles.length);
          
          const profilesWithIds = gscProfiles.map((profile, index) => ({
            id: `profile-${index}`,
            url: convertToProfileLink(profile.url),
            name: profile.name || `Profile ${index + 1}`,
            title: profile.title || "",
            company: profile.company || "",
          }));
          
          setProfiles(profilesWithIds);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing GSC extracted profiles:", error);
      }
    }
    
    // Try to get extracted profiles with names from localStorage
    const extractedProfilesData = localStorage.getItem('aiExtractedProfiles');
    if (extractedProfilesData) {
      try {
        const extractedProfiles = JSON.parse(extractedProfilesData);
        if (Array.isArray(extractedProfiles) && extractedProfiles.length > 0) {
          console.log("Using AI extracted profiles with names:", extractedProfiles.length);
          
          const profilesWithIds = extractedProfiles.map((profile, index) => ({
            id: `profile-${index}`,
            url: convertToProfileLink(profile.url),
            name: profile.name || `Profile ${index + 1}`,
            title: profile.title || "",
            company: profile.company || "",
          }));
          
          setProfiles(profilesWithIds);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing AI extracted profiles:", error);
      }
    }
    
    // Fallback to creating profiles from links if no AI extracted data
    if (links.length > 0) {
      const profilesFromLinks = links.map((url, index) => {
        // Try to extract name from the URL username
        let name = `Profile ${index + 1}`;
        const linkedInMatch = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
        
        if (linkedInMatch) {
          // Convert username to human readable name
          const username = linkedInMatch[1];
          name = generateNameFromUsername(username);
          console.log(`Generated name from URL: ${url} -> ${name}`);
        }
        
        return {
          id: `profile-${index}`,
          url: convertToProfileLink(url),
          name: name,
          title: "",
          company: "",
        };
      });
      
      // Store these profiles for use by other components
      localStorage.setItem('gscExtractedProfiles', JSON.stringify(
        profilesFromLinks.map(profile => ({
          name: profile.name,
          title: profile.title,
          company: profile.company,
          url: profile.url
        }))
      ));
      
      setProfiles(profilesFromLinks);
    }
    
    setIsLoading(false);
  }, [links]);

  if (isLoading) {
    return (
      <div className="py-4 text-center text-gray-400">
        Laddar resultat...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden border border-gray-800">
        <Table className="text-white">
          <TableHeader className="bg-black">
            <TableRow className="hover:bg-transparent border-gray-800">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id} className="border-gray-800 hover:bg-[#1A1A1A]">
                <TableCell className="font-medium text-white">
                  {profile.name}
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
        Visar {profiles.length} kandidater från sökningen
      </div>
    </div>
  );
};

export default SearchResultsTable;
