
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkedInUrlForm } from "@/components/LinkedInUrlForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CandidateResults from "@/components/CandidateResults";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

interface LinkedInAnalysisPageProps {
  // You can define props here if needed
}

export default function LinkedInAnalysisPage({}: LinkedInAnalysisPageProps) {
  const [results, setResults] = useState<any[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyzeLinkedIn = async (url: string, criteria: string) => {
    setIsLoading(true);
    setResults([]); // Clear previous results
    setSearchCriteria(criteria); // Store the search criteria
    
    // Simulate an API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    try {
      // Mock data for demonstration
      const mockResults = [
        { name: "John Doe", score: 85, experience: "10+ years in Sales", match: true },
        { name: "Jane Smith", score: 78, experience: "5 years in Marketing", match: false },
        { name: "Alice Johnson", score: 92, experience: "8 years in SaaS", match: true },
      ];
      
      setResults(mockResults);
      
      toast({
        title: "Analysis Complete",
        description: "Successfully analyzed LinkedIn data.",
      });
    } catch (error: any) {
      console.error("Error analyzing LinkedIn data:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze LinkedIn data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 -mt-[0.7cm] overflow-visible">
      <Card className="w-full max-w-4xl mx-auto bg-[#1A1F2C] border-[#2A2F3C] text-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">LinkedIn Analysis Tool</CardTitle>
          <CardDescription className="text-gray-400">
            Enter a LinkedIn Sales Navigator URL and scoring criteria to analyze potential candidates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="bg-[#212636] border-[#2A2F3C]">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertTitle className="text-white">Demo Mode</AlertTitle>
            <AlertDescription className="text-gray-300">
              Using demo data for demonstration purposes.
            </AlertDescription>
          </Alert>
          
          <LinkedInUrlForm onSubmit={analyzeLinkedIn} isLoading={isLoading} />
          
          {results.length > 0 && (
            <CandidateResults candidates={results} searchCriteria={searchCriteria} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
