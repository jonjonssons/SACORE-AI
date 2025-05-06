
import { corsHeaders, createJsonResponse, createErrorResponse } from "../utils/responseHelpers.ts";
import { extractWithOpenAI } from "../openaiExtractor.ts";

/**
 * Hantera profilanalys-begäran
 * @param url LinkedIn-URL att analysera
 * @param criteria Sökkriterier
 * @param profileData Befintlig profildata (om tillgänglig)
 * @returns Response med profiledata
 */
export async function handleProfileAnalysis(url: string, criteria: string, profileData: any = null) {
  console.log(`Processing profile analysis for URL: ${url}`);
  
  try {
    // Om vi redan har profildata, returnera den
    if (profileData && Object.keys(profileData).length > 0) {
      console.log("Using provided profile data:", profileData);
      return createJsonResponse({
        source: "provided",
        profile: profileData,
        url
      });
    }
    
    // Simulera profildata för utvecklingssyfte
    // I produktion skulle denna data hämtas från LinkedIn genom en skrapningslösning
    // eller API
    const simulatedData = {
      name: "Example Person",
      title: "Senior Developer",
      experience: [
        { title: "Senior Developer", company: "Tech Company", duration: "2 years" },
        { title: "Developer", company: "Small Startup", duration: "3 years" }
      ],
      education: [
        { institution: "Stockholm University", degree: "Master's in Computer Science", years: "2015-2017" }
      ],
      skills: ["JavaScript", "React", "Node.js", "TypeScript", "Cloud Infrastructure"]
    };
    
    // I ett verkligt scenario skulle vi här anropa LinkedIn API eller en skrapningslösning
    console.log("Returning simulated profile data for development purposes");
    
    // Använd OpenAI för att extrahera data från Google sökresultat
    // Detta är en simulering - i produktion skulle vi använda faktiska sökresultat
    const simulatedTitle = "Example Person - Senior Developer at Tech Company | LinkedIn";
    const simulatedSnippet = "Stockholm, Sweden · Senior Developer · Tech Company";
    
    // CRITICAL: Only pass title, snippet, and URL to OpenAI - never pre-existing company data
    const extractedData = await extractWithOpenAI(
      simulatedTitle, 
      simulatedSnippet,
      url
    );
    
    return createJsonResponse({
      source: "extracted",
      profile: {
        ...simulatedData,
        company: extractedData.company, // Use the company from OpenAI extraction
        openai_extraction: extractedData
      },
      url
    });
    
  } catch (error) {
    console.error('Error in profile analysis:', error);
    return createErrorResponse(`Error analyzing profile: ${error.message}`, 500);
  }
}
