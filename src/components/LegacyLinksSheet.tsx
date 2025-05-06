import React, { useEffect, useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { ExternalLink, Copy, X, AlertCircle, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LinksSheetProps {
  links: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LinkRow {
  id: string;
  url: string;
  name: string;
  company: string;
  title: string;
  score: number;
  notes: string;
  status: "new" | "contacted" | "responded" | "converted" | "rejected";
  priority: "high" | "medium" | "low";
}

const STORAGE_KEYS = [
  'googleSearchLinks',
  'linkedInSearchLinks',
  'searchResultLinks'
];

const extractLinkedInUsername = (url: string): string => {
  if (!url) return '';
  
  try {
    const matched = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (matched && matched[1]) {
      const nameParts = matched[1]
        .split('-')
        .filter(part => 
          !/^\d+$/.test(part) && part.length > 1
        )
        .map(part => {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        });
      
      if (nameParts.length >= 2) {
        return nameParts.slice(0, 2).join(' ');
      } else if (nameParts.length === 1) {
        return nameParts[0];
      }
    }
  } catch (error) {
    console.error('Error extracting LinkedIn username:', error);
  }
  return '';
};

const extractProfileInfo = (snippet: string): { title: string; company: string } => {
  if (!snippet) return { title: '', company: '' };
  
  let title = '';
  let company = '';
  
  try {
    const atPattern = snippet.match(/^([^-·]+)\s+(?:at|@)\s+([^-·]+)/i);
    const dashPattern = snippet.match(/^([^-·]+)\s*[-·]\s*([^-·]+)/i);
    
    if (atPattern) {
      title = atPattern[1].trim();
      company = atPattern[2].trim();
    } else if (dashPattern) {
      title = dashPattern[1].trim();
      company = dashPattern[2].trim();
    } else {
      const firstSentence = snippet.split(/[.!?]/).filter(Boolean)[0] || '';
      
      if (firstSentence.includes(' at ')) {
        const parts = firstSentence.split(' at ');
        title = parts[0].trim();
        company = parts[1].trim();
      } else if (firstSentence.includes(' - ')) {
        const parts = firstSentence.split(' - ');
        title = parts[0].trim();
        company = parts[1].trim();
      } else if (firstSentence.includes(' · ')) {
        const parts = firstSentence.split(' · ');
        title = parts[0].trim();
        company = parts[1].trim();
      }
    }
  } catch (error) {
    console.error("Error extracting profile info:", error);
  }
  
  return { 
    title: title || 'Not specified', 
    company: company || 'Not specified'
  };
};

const convertToProfileLink = (link: string): string => {
  try {
    if (link.includes('linkedin.com/in/')) {
      return link;
    }
    
    if (link.includes('linkedin.com/posts/')) {
      const parts = link.split('linkedin.com/posts/');
      if (parts.length > 1) {
        const username = parts[1].split('_')[0];
        if (username) {
          return `https://www.linkedin.com/in/${username}`;
        }
      }
    }
    
    if (link.includes('linkedin.com/pulse/')) {
      const parts = link.split('linkedin.com/pulse/');
      if (parts.length > 1) {
        const lastSegment = parts[1].split('-').pop();
        if (lastSegment && !lastSegment.includes('?') && lastSegment.length > 2) {
          return `https://www.linkedin.com/in/${lastSegment}`;
        }
      }
    }
    
    return link;
  } catch (error) {
    console.error("Error converting link:", error);
    return link;
  }
};

const LinksSheet: React.FC<LinksSheetProps> = ({ links = [], isOpen, onOpenChange }) => {
  const [internalLinks, setInternalLinks] = useState<string[]>([]);
  const [linkRows, setLinkRows] = useState<LinkRow[]>([]);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [searchResultItems, setSearchResultItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const storedResultItems = localStorage.getItem('searchResultItems');
      if (storedResultItems) {
        const parsedResults = JSON.parse(storedResultItems);
        if (Array.isArray(parsedResults) && parsedResults.length > 0) {
          console.log(`Loaded ${parsedResults.length} search result items from localStorage`);
          setSearchResultItems(parsedResults);
        }
      }
    } catch (error) {
      console.error("Error loading search result items:", error);
    }
    
    console.log("🔎 LinksSheet props RAW:", { links, isOpen, onOpenChange });
    console.log("🔍 LinksSheet props DETAILED:", { 
      links: links, 
      linksLength: links?.length || 0, 
      isOpen,
      isArray: Array.isArray(links),
      linkType: links ? typeof links : 'undefined',
      linkContents: links && links.length > 0 ? links.slice(0, 3) : 'empty',
      linksData: JSON.stringify(links)
    });
    
    if (links && links.length > 0) {
      console.log("✅ Using links from props:", links.length);
      
      const profileLinks = links.map(convertToProfileLink);
      setInternalLinks(profileLinks);
      
      localStorage.setItem('googleSearchLinks', JSON.stringify(profileLinks));
      localStorage.setItem('linkedInSearchLinks', JSON.stringify(profileLinks));
      localStorage.setItem('searchResultLinks', JSON.stringify(profileLinks));
    } else {
      console.log("⚠️ Links array is empty in LinksSheet component");
      loadLinksFromStorage();
    }
  }, [links, isOpen]);

  const loadLinksFromStorage = () => {
    console.log("Attempting to load links from localStorage");
    
    for (const key of STORAGE_KEYS) {
      const storedLinks = localStorage.getItem(key);
      if (storedLinks) {
        try {
          const parsedLinks = JSON.parse(storedLinks);
          if (Array.isArray(parsedLinks) && parsedLinks.length > 0) {
            console.log(`✅ Found ${parsedLinks.length} links in localStorage (${key})`);
            console.log("First 3 links:", parsedLinks.slice(0, 3));
            
            const profileLinks = parsedLinks.map(convertToProfileLink);
            setInternalLinks(profileLinks);
            
            localStorage.setItem(key, JSON.stringify(profileLinks));
            
            return true;
          }
        } catch (e) {
          console.error(`Error parsing ${key} from localStorage:`, e);
        }
      }
    }
    
    console.log("❌ Could not find any links in localStorage");
    return false;
  };

  useEffect(() => {
    console.log("Creating linkRows from internalLinks:", internalLinks.length);
    
    if (internalLinks.length > 0) {
      const savedRows = localStorage.getItem('linkSheetRows');
      if (savedRows) {
        try {
          const parsed = JSON.parse(savedRows);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log("Using saved link rows from localStorage:", parsed.length);
            
            const updatedRows = parsed.map(row => ({
              ...row,
              url: convertToProfileLink(row.url)
            }));
            
            setLinkRows(updatedRows);
            localStorage.setItem('linkSheetRows', JSON.stringify(updatedRows));
            return;
          }
        } catch (e) {
          console.error("Error parsing saved link rows:", e);
        }
      }
      
      console.log("Creating new link rows from links:", internalLinks.length);
      
      if (searchResultItems && searchResultItems.length > 0) {
        console.log("Using search result data to create rows");
        
        const newRows = internalLinks.map((link, index) => {
          const matchingResult = searchResultItems.find(item => 
            convertToProfileLink(item.link) === link
          );
          
          let name = extractLinkedInUsername(link);
          let title = "Not available";
          let company = "Not available";
          let snippet = "";
          
          if (matchingResult) {
            if (matchingResult.title) {
              name = matchingResult.title
                .replace(/ \| LinkedIn$/, '')
                .replace(/ - LinkedIn$/, '')
                .replace(/\d+/g, '')
                .trim();
              
              name = name.replace(/\s+/g, ' ');
            }
            
            snippet = matchingResult.snippet || '';
            const extractedInfo = extractProfileInfo(snippet);
            title = extractedInfo.title;
            company = extractedInfo.company;
          }
          
          const score = Math.max(60, 100 - (index % 40));
          
          return {
            id: Math.random().toString(36).substring(2, 9),
            url: link,
            name: name || `Profile ${index + 1}`,
            company,
            title,
            score,
            notes: snippet,
            status: "new" as const,
            priority: "medium" as const
          };
        });
        
        console.log("Created new link rows with actual data:", newRows.length);
        setLinkRows(newRows);
        localStorage.setItem('linkSheetRows', JSON.stringify(newRows));
      } else {
        console.log("No search result data available, creating basic rows");
        
        const newRows = internalLinks.map((link, index) => {
          const name = extractLinkedInUsername(link) || `Profile ${index + 1}`;
          
          return {
            id: Math.random().toString(36).substring(2, 9),
            url: link,
            name,
            company: "Not available",
            title: "Not available",
            score: Math.max(60, 100 - (index % 40)),
            notes: "",
            status: "new" as const,
            priority: "medium" as const
          };
        });
        
        console.log("Created new link rows:", newRows.length);
        setLinkRows(newRows);
        localStorage.setItem('linkSheetRows', JSON.stringify(newRows));
      }
      
      setHasTriedFallback(false);
    } else if (isOpen && internalLinks.length === 0 && !hasTriedFallback) {
      console.log("No internal links available, trying fallbacks");
      tryRecoverLinks();
    }
  }, [internalLinks, isOpen, searchResultItems]);

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
    
    if (loadLinksFromStorage()) {
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

  useEffect(() => {
    if (isOpen && linkRows.length === 0 && !hasTriedFallback) {
      console.log("Sheet opened but no rows available, trying recovery");
      tryRecoverLinks();
    }
  }, [isOpen]);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Link has been copied to clipboard",
    });
  };
  
  const handleCellChange = (id: string, field: keyof LinkRow, value: any) => {
    setLinkRows(prev => {
      const updated = prev.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      );
      localStorage.setItem('linkSheetRows', JSON.stringify(updated));
      return updated;
    });
  };
  
  const addNewRow = () => {
    const newRow: LinkRow = {
      id: Math.random().toString(36).substring(2, 9),
      url: "",
      name: "",
      company: "",
      title: "",
      score: 0,
      notes: "",
      status: "new",
      priority: "medium"
    };
    
    setLinkRows(prev => {
      const updated = [...prev, newRow];
      localStorage.setItem('linkSheetRows', JSON.stringify(updated));
      return updated;
    });
  };
  
  const saveAllChanges = () => {
    localStorage.setItem('linkSheetRows', JSON.stringify(linkRows));
    toast({
      title: "Changes saved",
      description: `Saved ${linkRows.length} link rows successfully.`,
    });
  };

  const downloadCSV = () => {
    try {
      const headers = ['Name', 'Company', 'Title', 'Profile URL', 'Score', 'Notes', 'Status', 'Priority'];
      
      const csvRows = [
        headers.join(','),
        ...linkRows.map(row => {
          return [
            `"${row.name.replace(/"/g, '""')}"`,
            `"${row.company.replace(/"/g, '""')}"`,
            `"${row.title.replace(/"/g, '""')}"`,
            `"${row.url.replace(/"/g, '""')}"`,
            row.score,
            `"${(row.notes || '').replace(/"/g, '""')}"`,
            `"${row.status}"`,
            `"${row.priority}"`
          ].join(',');
        })
      ];
      
      const csvContent = csvRows.join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `linkedin-profiles-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Downloaded",
        description: `Exported ${linkRows.length} profiles to CSV file.`,
      });
    } catch (error) {
      console.error("Error creating CSV:", error);
      toast({
        title: "Export Failed",
        description: "There was an error creating the CSV file.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet 
      open={isOpen} 
      onOpenChange={(value) => {
        console.log("Sheet onOpenChange called with:", value);
        onOpenChange(value);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-4xl bg-black border-gray-800 text-white p-0">
        <SheetHeader className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white">
              Search Results {linkRows.length > 0 ? `(${linkRows.length})` : ''}
            </SheetTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={downloadCSV} className="border-gray-700 text-white hover:bg-gray-800">
                Download CSV
              </Button>
              <Button variant="outline" size="sm" onClick={addNewRow} className="border-gray-700 text-white hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </Button>
              <Button variant="outline" size="sm" onClick={saveAllChanges} className="border-gray-700 text-white hover:bg-gray-800">
                <Save className="h-4 w-4 mr-1" /> Save All
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <div className="overflow-y-auto max-h-[80vh]">
          {linkRows.length === 0 ? (
            <div className="p-6 space-y-4">
              <div className="text-center py-8 text-gray-400">
                No profiles found. Please try again with different criteria.
              </div>
              
              <Alert variant="destructive" className="bg-[#2D1E24] border-[#7D2231]">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Links Available</AlertTitle>
                <AlertDescription>
                  No links were found in the search results. This could be due to:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>No matching results for your search criteria</li>
                    <li>A connection issue with the search service</li>
                    <li>Browser restrictions blocking external content</li>
                  </ul>
                  Try simplifying your search terms or check your connection.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onOpenChange(false);
                    toast({
                      title: "Search Failed",
                      description: "Please try your search again with simpler terms.",
                    });
                  }}
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  Close and Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="text-white border-collapse">
                <TableHeader className="bg-black">
                  <TableRow className="hover:bg-transparent border-gray-800">
                    <TableHead className="font-semibold w-1/6">Links</TableHead>
                    <TableHead className="font-semibold w-1/4">Name</TableHead>
                    <TableHead className="font-semibold w-1/4">Company</TableHead>
                    <TableHead className="font-semibold w-1/4">Title</TableHead>
                    <TableHead className="font-semibold text-right w-[8%]">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkRows.map((row) => (
                    <TableRow key={row.id} className="border-gray-800 hover:bg-[#1A1A1A]">
                      <TableCell className="text-blue-400 w-1/6">
                        <div className="flex items-center gap-2">
                          <a 
                            href={row.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline truncate max-w-[150px] flex-1"
                          >
                            {row.url}
                          </a>
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 hover:bg-gray-800" 
                              onClick={() => copyLink(row.url)}
                            >
                              <Copy className="h-3 w-3 text-gray-400" />
                            </Button>
                            {row.url && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 hover:bg-gray-800"
                                asChild
                              >
                                <a href={row.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 text-gray-400" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="font-medium text-white w-1/4">
                        <Input 
                          className="bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-white"
                          value={row.name}
                          onChange={(e) => handleCellChange(row.id, 'name', e.target.value)}
                          placeholder="Enter name"
                        />
                      </TableCell>
                      
                      <TableCell className="w-1/4">
                        <Input 
                          className="bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-white"
                          value={row.company}
                          onChange={(e) => handleCellChange(row.id, 'company', e.target.value)}
                          placeholder="Enter company"
                        />
                      </TableCell>
                      
                      <TableCell className="w-1/4">
                        <Input 
                          className="bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto text-white"
                          value={row.title}
                          onChange={(e) => handleCellChange(row.id, 'title', e.target.value)}
                          placeholder="Enter title"
                        />
                      </TableCell>
                      
                      <TableCell className="text-right font-bold text-lg w-[8%]">
                        {row.score}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LinksSheet;
