
import React, { useState, useEffect } from 'react';
import { AlertCircle, Info, Search } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface SearchAlertsProps {
  errorMessage: string | null;
  isRelaxedSearch: boolean;
  searchExecuted: boolean;
  searchUrl?: string;
  analysisStage: "idle" | "searching" | "analyzing" | "complete" | "error";
}

const SearchAlerts = ({
  errorMessage,
  isRelaxedSearch,
  searchExecuted,
  searchUrl,
  analysisStage
}: SearchAlertsProps) => {
  // State to track stable completion state with delay to prevent flashing
  const [stableComplete, setStableComplete] = useState(false);
  
  // Reset stable complete state whenever analysis stage changes
  useEffect(() => {
    if (analysisStage !== 'complete') {
      setStableComplete(false);
      return;
    }
    
    // Only set to true after a delay to prevent flashing
    const timer = setTimeout(() => {
      setStableComplete(true);
    }, 500); // 500ms delay to ensure sheet is fully loaded
    
    return () => clearTimeout(timer);
  }, [analysisStage]);
  
  // Don't show any alerts when searching or analyzing
  if (analysisStage === 'searching' || analysisStage === 'analyzing') {
    return null;
  }
  
  // Don't show anything if we don't have an error, relaxed search, or completed search
  if (!errorMessage && (!isRelaxedSearch || !searchExecuted) && !searchUrl) {
    return null;
  }

  // Check for specific error types
  const isApiKeyReferrerError = errorMessage && (
    errorMessage.includes("are blocked") || 
    errorMessage.includes("API_KEY_HTTP_REFERRER_BLOCKED") ||
    errorMessage.includes("referer") ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("CORS") ||
    errorMessage.includes("Origin") ||
    errorMessage.includes("network error")
  );
  
  const isAccessError = errorMessage && (
    errorMessage.includes("access") || 
    errorMessage.includes("permission") ||
    errorMessage.includes("Daily Limit") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("exceeded")
  );

  return (
    <div className="mt-6 animate-fadeIn">
      {errorMessage && errorMessage.includes("API key") && (
        <Alert variant="destructive" className="bg-[#2D1E24] border-[#7D2231]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Failed</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <div className="mt-2 text-sm">
              <p>Google API key problem. För att lösa problemet:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Kontrollera att API-nyckeln är giltig och inte har gått ut</li>
                <li>Kontrollera att API-nyckeln har rätt behörigheter</li>
                <li>Kontrollera att din domän är tillåten i API-nyckelns inställningar</li>
                <li>Överväg att använda en server-side proxy för API-anrop</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {isApiKeyReferrerError && errorMessage && (
        <Alert variant="destructive" className="bg-[#2D1E24] border-[#7D2231]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Failed</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <div className="mt-2 text-sm">
              <p>Google API referrer restriction problem. För att lösa problemet:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Gå till Google Cloud Console</li>
                <li>Välj ditt projekt</li>
                <li>Gå till "Credentials" under "APIs & Services"</li>
                <li>Redigera din API-nyckel</li>
                <li>Under "Application restrictions", välj antingen "None" eller lägg till din nuvarande domän 
                  ({window.location.origin}) under "HTTP referrers"</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {isAccessError && errorMessage && (
        <Alert variant="destructive" className="bg-[#2D1E24] border-[#7D2231]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Failed</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <div className="mt-2 text-sm">
              <p>Google API access limits exceeded. För att lösa problemet:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Kontrollera API-kvoten i Google Cloud Console</li>
                <li>Vänta en stund och försök igen senare</li>
                <li>Kontrollera att projektet har faktureringsuppgifter om det behövs</li>
                <li>Överväg att använda API-proxy för att hantera begränsningar</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {errorMessage && errorMessage.includes("invalid argument") && (
        <Alert variant="destructive" className="bg-[#2D1E24] border-[#7D2231]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Failed</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <div className="mt-2 text-sm">
              <p>The search query is too complex. Please try:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Using fewer requirements (1-2 max)</li>
                <li>Using simpler, more common terms</li>
                <li>Removing special characters and symbols</li>
                <li>Using single words instead of phrases</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {isRelaxedSearch && !errorMessage && searchExecuted && (
        <Alert className="bg-[#1E2738] border-[#3E4C6A]">
          <Info className="h-4 w-4" />
          <AlertTitle>Using Broader Search</AlertTitle>
          <AlertDescription>
            No exact matches found for your specific criteria. Showing broader results instead.
          </AlertDescription>
        </Alert>
      )}

      {/* Only show search query when analysis is explicitly complete for a reasonable amount of time */}
      {searchUrl && searchExecuted && stableComplete && (
        <Alert className="mt-2 bg-[#1A2233] border-[#334166]">
          <Search className="h-4 w-4" />
          <AlertTitle>Search Query</AlertTitle>
          <AlertDescription>
            <div className="text-sm overflow-x-auto whitespace-nowrap">
              <code className="p-1 bg-[#111827] rounded text-gray-300">{searchUrl}</code>
            </div>
            <div className="mt-2">
              <a 
                href={`https://www.google.com/search?q=${encodeURIComponent(searchUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Open in Google Search
              </a>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {!errorMessage && searchExecuted && stableComplete && (
        <Alert className="bg-[#192733] border-[#2E3F4A]">
          <Info className="h-4 w-4" />
          <AlertTitle>Search Complete</AlertTitle>
          <AlertDescription>
            Search executed successfully.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SearchAlerts;
