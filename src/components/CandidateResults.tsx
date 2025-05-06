
import React from 'react';
import { Check, X, Download, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface MatchCriteria {
  name: string;
  match: boolean;
  score: number;
}

interface Candidate {
  id: string;
  name: string;
  title?: string;
  company?: string;
  score: number;
  skills?: string[];
  highlights?: string[];
  matchCriteria?: MatchCriteria[];
  experience?: string;
  match?: boolean;
  snippet?: string;
  url?: string;
}

export interface CandidateResultsProps {
  candidates: Candidate[];
  searchCriteria: string;
}

const CandidateResults = ({ candidates, searchCriteria }: CandidateResultsProps) => {
  const { toast } = useToast();
  
  // Transform basic mock data to match expected UI format if needed
  const enhancedCandidates = candidates.map(candidate => {
    if (!candidate.title) {
      // Basic mock data needs to be enhanced
      return {
        ...candidate,
        title: candidate.experience?.split(' in ')[0] || 'Candidate',
        company: candidate.experience?.split(' in ')[1] || 'Company',
        skills: ['Skill 1', 'Skill 2'],
        highlights: [candidate.experience || ''],
        matchCriteria: [
          { name: 'Experience', match: candidate.match || false, score: candidate.match ? 1 : 0 }
        ]
      };
    }
    return candidate;
  });

  const handleExport = (format: 'csv' | 'sheets') => {
    toast({
      title: format === 'csv' ? "Exporting to CSV" : "Exporting to Google Sheets",
      description: "Your data export is being prepared.",
    });
    
    if (format === 'csv') {
      // Generate CSV content
      const headers = ['Name', 'Title', 'Company', 'Score', 'Snippet', 'Profile URL'];
      const csvContent = [
        headers.join(','),
        ...enhancedCandidates.map(candidate => 
          [
            `"${candidate.name}"`, 
            `"${candidate.title || ''}"`, 
            `"${candidate.company || ''}"`, 
            candidate.score,
            `"${candidate.snippet || ''}"`,
            `"${candidate.url || ''}"`
          ].join(',')
        )
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `linkedin-candidates-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: "Your data has been exported to CSV.",
      });
    } else {
      // For Google Sheets, we would typically send the data to a backend service
      // that handles the Google Sheets API integration. For this example, we'll simulate it.
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: "Your data has been exported to Google Sheets.",
        });
      }, 1500);
    }
  };

  // Helper function to get badge color based on score
  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 6) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 4) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium tracking-tight">Google Search Results</h2>
          <p className="text-sm text-gray-500">
            Showing LinkedIn profiles matching your requirements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500 mr-2">
            {candidates.length} profiles found
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('sheets')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Google Sheets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="space-y-4">
        {enhancedCandidates.map((candidate, index) => (
          <div key={candidate.id || index} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">{candidate.name}</h3>
                    <Badge className={`ml-2 ${getScoreBadgeColor(candidate.score)}`}>
                      {candidate.score}/10
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{candidate.title}</p>
                  <p className="text-sm text-gray-500">{candidate.company}</p>
                </div>
                {candidate.url && (
                  <a 
                    href={candidate.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 p-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                )}
              </div>
              
              {candidate.snippet && (
                <div className="mt-3 text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                  {candidate.snippet.length > 150 ? `${candidate.snippet.substring(0, 150)}...` : candidate.snippet}
                </div>
              )}
              
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4">
                  {candidate.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              
              {candidate.matchCriteria && candidate.matchCriteria.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Match Criteria</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {candidate.matchCriteria.map((criterion, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50">
                        <span className="text-gray-700 truncate flex-1">{criterion.name}</span>
                        <span className={`font-medium ml-2 ${criterion.match ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {criterion.match ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {criterion.score}/1
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {enhancedCandidates.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No candidates found matching your search criteria.</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your requirements to broaden your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateResults;
