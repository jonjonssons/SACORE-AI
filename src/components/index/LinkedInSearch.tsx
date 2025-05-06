import React from "react";
import { ArrowRight, LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GoogleCustomSearch from "@/components/GoogleCustomSearch";
import { useLinkedInSearch } from "@/hooks/useLinkedInSearch";
import SearchResults from "@/components/search/SearchResults";

interface LinkedInSearchProps {
  inputValue: string;
  linkedinUrl: string;
  setLinkedinUrl: (url: string) => void;
  handleLinkedinSubmit: () => void;
  isProcessing: boolean;
  searchError: string | null;
  executeGoogleSearch: string;
  setExecuteGoogleSearch: (query: string) => void;
  onSearchResults: (results: any | null, isRelaxedSearch?: boolean) => void;
  autoSearch?: boolean;
  onSearchInitiated?: () => void;
}

const LinkedInSearch = ({
  inputValue,
  linkedinUrl,
  setLinkedinUrl,
  handleLinkedinSubmit,
  isProcessing,
  searchError,
  executeGoogleSearch,
  setExecuteGoogleSearch,
  onSearchResults,
  autoSearch = false,
  onSearchInitiated = () => {}
}: LinkedInSearchProps) => {
  const {
    searchResultsReady,
    links,
    hasCompletedSearch,
    sheetOpen,
    setSheetOpen,
    handleSearchResults
  } = useLinkedInSearch();

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div className="mb-6 animate-fadeIn">
        <h3 className="text-xl font-bold mb-4 text-black">Find LinkedIn Profiles</h3>
        <p className="text-gray-600 mb-4">Search for LinkedIn profiles matching your criteria:</p>
        
        <GoogleCustomSearch 
          executeSearch={executeGoogleSearch} 
          onResultsReady={(results) => {
            handleSearchResults(results);
            onSearchResults(results);
          }}
          maxPages={20}
        />

        <div className="mt-3 flex justify-center">
          <Button
            onClick={() => {
              onSearchInitiated();
              setExecuteGoogleSearch(inputValue);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              "Search LinkedIn Profiles"
            )}
          </Button>
        </div>
      </div>

      <SearchResults
        links={links}
        hasCompletedSearch={hasCompletedSearch}
        searchResultsReady={searchResultsReady}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        apiError={searchError}
      />

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
          Connect to LinkedIn
        </h3>
        <p className="text-center text-gray-600 mb-6">
          Enter your LinkedIn Sales Navigator URL to find matching leads
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
            <Input
              placeholder="https://www.linkedin.com/sales/..."
              className="pl-12 py-6 text-base border-gray-300 bg-white text-black rounded-full"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
          <Button
            onClick={handleLinkedinSubmit}
            disabled={!linkedinUrl || isProcessing}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white rounded-full py-2 px-8 font-bold shadow-md hover:shadow-lg transition-all"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                Find Leads
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LinkedInSearch;
