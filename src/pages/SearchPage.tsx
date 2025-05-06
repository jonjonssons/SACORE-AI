
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CandidateScore, LinkedInSearchResult, LinkedInAnalysisResponse } from "@/lib/types";
import { Lead } from "@/components/LeadsResultsTable";
import SearchHeader from "@/components/search/SearchHeader";
import SearchLinks from "@/components/search/SearchLinks";
import LinkedInSearchResults from "@/components/search/LinkedInSearchResults";
import SearchTabsContainer from "@/components/search/SearchTabsContainer";

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [linkedinResults, setLinkedinResults] = useState<CandidateScore[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzedData, setHasAnalyzedData] = useState(false);
  const [searchSource, setSearchSource] = useState<"profile" | "search">("profile");
  const [searchUrl, setSearchUrl] = useState<string>("");
  const [searchCriteria, setSearchCriteria] = useState<string>("");
  const [links, setLinks] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check for LinkedIn analysis data for a single profile
    const analysisData = localStorage.getItem('linkedinAnalysis');
    
    if (analysisData) {
      try {
        const parsedData = JSON.parse(analysisData);
        setHasAnalyzedData(true);
        setSearchUrl(parsedData.searchUrl || "");
        setIsLoading(true);
        
        setTimeout(() => {
          const result = parsedData.result;
          if (result) {
            // Create a candidate from a single profile analysis
            const candidate: CandidateScore = {
              id: result.profileId || 'profile-1',
              name: result.name || 'LinkedIn Profile',
              title: result.title || 'Professional',
              company: result.company || 'Company',
              location: result.location || 'Location',
              profileImage: undefined,
              score: result.score,
              matchCriteria: result.matches
            };
            
            setLinkedinResults([candidate]);
            setIsLoading(false);
            setSearchSource("profile");
            
            // Also create a lead for the table view
            setLeads([{
              name: result.name || 'LinkedIn Profile',
              title: result.title || 'Professional',
              company: result.company || 'Company',
              industry: 'Technology', // Default industry
              location: result.location || 'Location',
              scoring: result.score
            }]);
            
            toast({
              title: "Analysis Complete",
              description: "We've analyzed the LinkedIn profile data.",
            });
          }
        }, 1000);
      } catch (error) {
        console.error("Error parsing LinkedIn analysis data:", error);
        toast({
          title: "Error",
          description: "Failed to load LinkedIn analysis data.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    }
    
    // Check for LinkedIn search results
    const searchResultsData = localStorage.getItem('linkedinSearchResults');
    
    if (searchResultsData) {
      try {
        const parsedData = JSON.parse(searchResultsData);
        setHasAnalyzedData(true);
        setSearchUrl(parsedData.searchUrl || "");
        setSearchCriteria(parsedData.criteria || "");
        setIsLoading(true);
        
        setTimeout(() => {
          // Convert LinkedIn search results to candidate scores
          if (parsedData.profiles && Array.isArray(parsedData.profiles)) {
            const candidates: CandidateScore[] = parsedData.profiles.map((profile: LinkedInAnalysisResponse, index: number) => ({
              id: profile.profileId || `search-result-${index}`,
              name: profile.name || `Candidate ${index + 1}`,
              title: profile.title || `Title ${index + 1}`,
              company: profile.company || `Company ${index + 1}`,
              location: profile.location || "Location not specified",
              profileImage: undefined,
              score: profile.score,
              matchCriteria: profile.matches || []
            }));
            
            setLinkedinResults(candidates);
            
            // Also create leads for the table view
            const newLeads: Lead[] = parsedData.profiles.map((profile: LinkedInAnalysisResponse, index: number) => ({
              name: profile.name || `Candidate ${index + 1}`,
              title: profile.title || `Title ${index + 1}`,
              company: profile.company || `Company ${index + 1}`,
              industry: 'Technology', // Default industry
              location: profile.location || "Location not specified",
              scoring: profile.score
            }));
            
            setLeads(newLeads);
            setIsLoading(false);
            setSearchSource("search");
            
            toast({
              title: "Search Analysis Complete",
              description: `Found ${candidates.length} profiles matching your criteria.`,
            });
          } else {
            setIsLoading(false);
            toast({
              title: "No Results",
              description: "No matching profiles were found.",
              variant: "destructive"
            });
          }
        }, 1000);
      } catch (error) {
        console.error("Error parsing LinkedIn search results:", error);
        toast({
          title: "Error",
          description: "Failed to load LinkedIn search results.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    }
    
    // Check for Google search links
    const googleLinks = localStorage.getItem('googleSearchLinks');
    if (googleLinks) {
      try {
        const parsedLinks = JSON.parse(googleLinks);
        if (Array.isArray(parsedLinks) && parsedLinks.length > 0) {
          setLinks(parsedLinks);
          console.log("Loaded links from localStorage:", parsedLinks);
        }
      } catch (error) {
        console.error("Error parsing Google search links:", error);
      }
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      <SearchHeader />
      <SearchLinks links={links} />
      <LinkedInSearchResults 
        hasAnalyzedData={hasAnalyzedData}
        searchSource={searchSource}
        searchUrl={searchUrl}
        searchCriteria={searchCriteria}
        isLoading={isLoading}
        linkedinResults={linkedinResults}
        leads={leads}
      />
      <SearchTabsContainer activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default SearchPage;
