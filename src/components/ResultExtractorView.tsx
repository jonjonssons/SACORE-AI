
import React, { useState, useEffect } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ExternalLink, Download, Clipboard, Check, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatAsProfileJSON } from '@/utils/profileExtractors/formatters';

interface SearchResult {
  link: string;
  title: string;
  snippet: string;
}

interface ExtractedResult {
  link: string;
  name: string;
  company: string;
  title: string;
}

interface ResultExtractorViewProps {
  searchResults: SearchResult[];
  isLoading?: boolean;
}

const ResultExtractorView: React.FC<ResultExtractorViewProps> = ({
  searchResults = [],
  isLoading = false
}) => {
  const [extractedData, setExtractedData] = useState<ExtractedResult[]>([]);
  const [jsonData, setJsonData] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  // Process search results when they change
  useEffect(() => {
    if (searchResults.length > 0) {
      // Simple extraction (no AI)
      const extracted = searchResults.map((result, index) => ({
        link: result.link || "",
        name: `Profile ${index + 1}`,
        company: "",
        title: ""
      }));
      
      console.log('Extracted profile data:', extracted);
      setExtractedData(extracted);
      
      // Store in localStorage for persistence across page refreshes
      localStorage.setItem('extractedProfileData', JSON.stringify(extracted));
      
      // Also store the original search results for reference
      localStorage.setItem('searchResultItems', JSON.stringify(searchResults));
      
      // Format as JSON according to the requested format
      const jsonString = formatAsProfileJSON(searchResults);
      setJsonData(jsonString);
    } else {
      // Try to load from localStorage if no results provided
      try {
        const storedData = localStorage.getItem('extractedProfileData');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExtractedData(parsed);
            
            // Try to load original search results to create JSON
            const storedSearchResults = localStorage.getItem('searchResultItems');
            if (storedSearchResults) {
              const parsedResults = JSON.parse(storedSearchResults);
              if (Array.isArray(parsedResults) && parsedResults.length > 0) {
                const jsonString = formatAsProfileJSON(parsedResults);
                setJsonData(jsonString);
              }
            }
            
            return;
          }
        }
      } catch (err) {
        console.error('Error loading stored profile data:', err);
      }
      
      setExtractedData([]);
      setJsonData('[]');
    }
  }, [searchResults]);

  // Convert data to CSV
  const downloadCSV = () => {
    const header = ['link', 'name', 'company', 'title'].join(',');
    const csvRows = extractedData.map(row => {
      return [
        `"${row.link.replace(/"/g, '""')}"`,
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.company.replace(/"/g, '""')}"`,
        `"${row.title.replace(/"/g, '""')}"`
      ].join(',');
    });
    
    const csvContent = [header, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'linkedin_profiles.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: `${extractedData.length} profiles exported to CSV.`,
    });
  };

  // Copy data to clipboard as markdown table
  const copyToClipboard = () => {
    const header = '| link | name | company | title |';
    const separator = '| --- | --- | --- | --- |';
    const rows = extractedData.map(row => {
      return `| ${row.link} | ${row.name} | ${row.company} | ${row.title} |`;
    });
    
    const markdownTable = [header, separator, ...rows].join('\n');
    navigator.clipboard.writeText(markdownTable).then(() => {
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "Data copied as markdown table.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Copy JSON data to clipboard
  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(jsonData).then(() => {
      setJsonCopied(true);
      toast({
        title: "JSON Copied to Clipboard",
        description: "Profile data copied as JSON format.",
      });
      
      setTimeout(() => setJsonCopied(false), 2000);
    });
  };

  // Download JSON data
  const downloadJSON = () => {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'linkedin_profiles.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "JSON Downloaded",
      description: `${extractedData.length} profiles exported to JSON.`,
    });
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="flex justify-center space-x-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="text-gray-400">Extraherar profildata...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="bg-[#161923] border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold flex items-center justify-between">
            <span>Extraherad Profildata</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs" 
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Clipboard className="h-4 w-4 mr-1" />}
                {copied ? "Kopierat" : "Kopiera"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={downloadCSV}
              >
                <Download className="h-4 w-4 mr-1" />
                Ladda ner CSV
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Extraherade {extractedData.length} profiler från sökresultaten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-gray-800">
            <Table className="text-white">
              <TableHeader className="bg-black">
                <TableRow className="hover:bg-transparent border-gray-800">
                  <TableHead className="font-semibold">Länk</TableHead>
                  <TableHead className="font-semibold">Namn</TableHead>
                  <TableHead className="font-semibold">Företag</TableHead>
                  <TableHead className="font-semibold">Titel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractedData.map((item, index) => (
                  <TableRow key={`extracted-${index}`} className="border-gray-800 hover:bg-[#1A1A1A]">
                    <TableCell className="text-blue-400">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:underline flex items-center gap-1 truncate"
                      >
                        {item.link}
                        <ExternalLink className="h-3 w-3 inline-block ml-1 flex-shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell className="font-medium text-white">{item.name}</TableCell>
                    <TableCell>{item.company}</TableCell>
                    <TableCell>{item.title}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {extractedData.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              Ingen profildata att visa. Vänligen lägg till några sökresultat.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* JSON output section */}
      <Card className="bg-[#161923] border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold flex items-center justify-between">
            <span>JSON-Formaterad Data</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs" 
                onClick={copyJsonToClipboard}
              >
                {jsonCopied ? <Check className="h-4 w-4 mr-1" /> : <Code className="h-4 w-4 mr-1" />}
                {jsonCopied ? "Kopierat" : "Kopiera JSON"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={downloadJSON}
              >
                <Download className="h-4 w-4 mr-1" />
                Ladda ner JSON
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            JSON-data enligt specificerat format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-gray-800 bg-black p-4">
            <pre className="text-gray-300 text-sm whitespace-pre-wrap overflow-x-auto">
              {jsonData}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultExtractorView;
