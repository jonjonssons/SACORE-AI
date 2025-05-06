import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { generateScoring } from "@/utils/claudeService";
import { ScoringResponse } from "@/lib/types";

import AppHeader from "@/components/index/AppHeader";
import StepInput from "@/components/index/StepInput";
import ScoringResults from "@/components/index/ScoringResults";
import LinkedInSearch from "@/components/index/LinkedInSearch";
import AppFooter from "@/components/index/AppFooter";
import StepIndicator from "@/components/index/StepIndicator";
import AIExtractorStatus from "@/components/AIExtractorStatus";
import OpenAIStatus from '@/components/OpenAIStatus';

type StepType = "input" | "scoring" | "search" | "linkedin";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [currentStep, setCurrentStep] = useState<StepType>("input");
  const [scoringData, setScoringData] = useState<ScoringResponse | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLinks, setSearchLinks] = useState<string[]>([]);
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [aiExtractionStatus, setAiExtractionStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [extractedProfilesCount, setExtractedProfilesCount] = useState(0);

  const handleInputSubmit = async () => {
    setIsProcessing(true);
    try {
      // Store the original input text in localStorage for later use in auto-categorization
      localStorage.setItem('originalInputText', inputValue);
      
      const result = await generateScoring(inputValue, files);
      setScoringData(result);
      setCurrentStep("scoring");
    } catch (error) {
      console.error("Error generating scoring:", error);
      toast({
        title: "Error",
        description: "Failed to generate scoring. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScoringApproval = () => {
    navigate('/linkedin-search');
  };

  const handleSearchResults = (results: GoogleCustomSearchResultCollection | null, isRelaxedSearch?: boolean) => {
    console.log("Google search completed, results received:", results);
    setSearchError(null);
    
    if (!searchInitiated) {
      console.log("Ignoring search results as search was not user-initiated");
      return;
    }
    
    if (results && results.results && results.results.length > 0) {
      console.log(`Found ${results.results.length} search results`);
      
      const searchResults = results.results.map(item => ({
        title: item.title || 'No Title',
        snippet: item.snippet || 'No Description',
        url: item.link || '',
      }));
      
      localStorage.setItem('googleSearchResults', JSON.stringify({
        results: searchResults,
        searchQuery: "",
        timestamp: new Date().toISOString()
      }));
      
      const extractedLinks = results.results.map(item => 
        item.link || item.url || item.formattedUrl || ''
      ).filter(Boolean);
      
      if (extractedLinks.length > 0) {
        setSearchLinks(extractedLinks);
        localStorage.setItem('googleSearchLinks', JSON.stringify(extractedLinks));
        
        toast({
          title: "Search Complete",
          description: `Found ${extractedLinks.length} results.`,
        });
      } else {
        setSearchError("Links were found but couldn't be extracted. Please try again.");
      }
      
      setTimeout(() => navigate('/sheet-view'), 1000);
    } else {
      console.log("No results found from Google search");
      setSearchError("No results were found. Please try different search terms.");
      
      toast({
        title: "No Results",
        description: "No results were found. Please try different search terms.",
        variant: "destructive"
      });
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "input":
        return (
          <StepInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            files={files}
            setFiles={setFiles}
            handleInputSubmit={handleInputSubmit}
            isProcessing={isProcessing}
          />
        );
      case "scoring":
        return (
          <ScoringResults
            scoringData={scoringData}
            inputValue={inputValue}
            handleScoringApproval={handleScoringApproval}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background">
      <AppHeader currentStep={currentStep} />
      
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-6">
        {/* OpenAI Status card - only visible in development */}
        {import.meta.env.DEV && (
          <div className="w-full max-w-4xl mb-6">
            <OpenAIStatus />
          </div>
        )}
        
        <div className="w-full max-w-4xl bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
          <div className="bg-white p-5 flex justify-between items-center">
            <div>
              <h2 className="text-black font-bold text-lg">Search Assistant</h2>
              <p className="text-black/70 text-sm">Powered by advanced search algorithms</p>
            </div>
            {currentStep === 'search' && (
              <AIExtractorStatus 
                status={aiExtractionStatus} 
                profilesCount={extractedProfilesCount}
                onReprocess={
                  aiExtractionStatus === 'error' ? 
                  () => {
                    const searchResultItems = localStorage.getItem('searchResultItems');
                    if (searchResultItems) {
                      try {
                        const parsedItems = JSON.parse(searchResultItems);
                        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                          //processSearchResultsWithAI(parsedItems);
                        }
                      } catch (e) {
                        console.error("Error parsing search result items:", e);
                      }
                    }
                  } : undefined
                }
              />
            )}
          </div>
          
          <div className="p-8 min-h-[450px] flex items-center justify-center">
            {renderCurrentStep()}
          </div>
          
          <StepIndicator currentStep={currentStep} />
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

export default Index;
