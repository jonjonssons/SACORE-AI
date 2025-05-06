import React from "react";
import { Link } from "react-router-dom";
import { LinkedinIcon, InfoIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CandidateScore } from "@/lib/types";
import { SearchResults } from "@/components/SearchResults";
import LeadsResultsTable, { Lead } from "@/components/LeadsResultsTable";

interface LinkedInSearchResultsProps {
  hasAnalyzedData: boolean;
  searchSource: "profile" | "search";
  searchUrl: string;
  searchCriteria: string;
  isLoading: boolean;
  linkedinResults: CandidateScore[];
  leads: Lead[];
}

const LinkedInSearchResults: React.FC<LinkedInSearchResultsProps> = ({
  hasAnalyzedData,
  searchSource,
  searchUrl,
  searchCriteria,
  isLoading,
  linkedinResults,
  leads
}) => {
  if (!hasAnalyzedData) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">
          LinkedIn {searchSource === "search" ? "Search Results" : "Profile Analysis"}
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="ml-2 h-4 w-4 text-gray-400 inline-block cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-[#212636] text-white border-[#2A2F3C]">
              <p className="text-sm">
                {searchSource === "search" 
                  ? "These results are from a LinkedIn search URL analysis"
                  : "These results are from a single LinkedIn profile analysis"}
              </p>
            </TooltipContent>
          </Tooltip>
        </h2>
        <Link to="/linkedin-analysis">
          <Button variant="outline" size="sm" className="border-gray-700 bg-[#212636] hover:bg-[#262D42] text-gray-300">
            <LinkedinIcon className="mr-2 h-4 w-4 text-blue-400" />
            New LinkedIn Analysis
          </Button>
        </Link>
      </div>
      
      {searchUrl && (
        <Alert className="mb-4 bg-[#212636] border-[#2A2F3C]">
          <AlertTitle className="flex items-center text-white">
            <LinkedinIcon className="h-4 w-4 mr-2 text-blue-400" /> 
            LinkedIn {searchSource === "search" ? "Search" : "Profile"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="text-sm text-gray-400 truncate">
              <span className="font-medium text-gray-300">URL:</span> {searchUrl.substring(0, 80)}{searchUrl.length > 80 ? '...' : ''}
            </div>
            {searchCriteria && (
              <div className="text-sm text-gray-400 mt-1">
                <span className="font-medium text-gray-300">Criteria:</span> {searchCriteria.substring(0, 80)}{searchCriteria.length > 80 ? '...' : ''}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      ) : (
        <Tabs 
          defaultValue="table" 
          className="w-full" 
        >
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 p-1 rounded-xl bg-[#1A1F2C] mb-4">
            <TabsTrigger 
              value="table" 
              className="rounded-lg data-[state=active]:bg-[#212636] data-[state=active]:text-blue-400 data-[state=active]:shadow-sm text-gray-400"
            >
              Table View
            </TabsTrigger>
            <TabsTrigger 
              value="cards" 
              className="rounded-lg data-[state=active]:bg-[#212636] data-[state=active]:text-blue-400 data-[state=active]:shadow-sm text-gray-400"
            >
              Card View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-6">
            <LeadsResultsTable leads={leads} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="cards" className="mt-6">
            <SearchResults results={linkedinResults} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default LinkedInSearchResults;
