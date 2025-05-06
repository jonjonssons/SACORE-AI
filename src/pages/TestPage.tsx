
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { proxyRequest } from "@/utils/proxyService";

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
}

const TestPage = () => {
  const { toast } = useToast();
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    
    try {
      // Test data for Anna Andersson
      const testData = {
        name: "Anna Andersson",
        title: "Senior Product Manager at Spotify",
        company: "Spotify",
        location: "Stockholm, Sweden",
        connections: "500+",
        about: "Experienced product manager with expertise in music streaming technologies.",
        url: "https://www.linkedin.com/in/anna-andersson-123456/"
      };
      
      // Försök göra en riktig API-förfrågan via proxyn
      console.log("Sending test data via proxy:", testData);
      
      // Använd en riktig publik API för att testa proxyn
      const proxyTestResult = await proxyRequest(
        'https://jsonplaceholder.typicode.com/posts/1',  // Public test API
        'GET'
      );
      
      // Test även att skicka en POST-förfrågan med data
      const proxyPostResult = await proxyRequest(
        'https://jsonplaceholder.typicode.com/posts',
        'POST',
        {
          title: 'Test Post',
          body: 'This is a test post via proxy',
          userId: 1
        }
      );
      
      setResult({
        success: true,
        data: {
          testData,
          proxyGetTest: proxyTestResult,
          proxyPostTest: proxyPostResult
        }
      });
      
      toast({
        title: "Test successful",
        description: "Proxy test completed successfully",
      });
      
    } catch (error) {
      console.error("Test error:", error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
      
      toast({
        title: "Test failed",
        description: "Error during proxy test",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131722] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">LinkedIn Extractor Test Page</h1>
        
        <div className="bg-[#1A1F2C] border border-[#2A2F3C] rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Test Environment</h2>
          <Button 
            onClick={runTest} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Kör test..." : "Kör test"}
          </Button>
        </div>
        
        {result && (
          <div className="bg-[#1A1F2C] border border-[#2A2F3C] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Test Results</h2>
            <div className={`p-4 rounded-md ${result.success ? 'bg-[#1E3A8A]/20' : 'bg-[#7f1d1d]/20'}`}>
              <h3 className={`font-medium mb-2 ${result.success ? 'text-blue-400' : 'text-red-400'}`}>
                {result.success ? 'Success' : 'Error'}
              </h3>
              <pre className="text-sm overflow-x-auto p-4 bg-black/30 rounded-md">
                {JSON.stringify(result.success ? result.data : { error: result.error }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;
