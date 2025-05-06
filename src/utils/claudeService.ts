import { ScoringResponse, LinkedInAnalysisResponse, MatchCriteria } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = process.env.SUPABASE_API_URL || "https://api.example.com";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || "";

// Helper function for API calls to add authorization header
async function callSupabaseFunction(endpoint: string, data: any) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke(endpoint, {
      body: data
    });

    if (error) {
      console.error(`API Error: ${error.message}`);
      throw new Error(`API call failed: ${error.message}`);
    }

    return responseData;
  } catch (err) {
    console.error(`API call error: ${err}`);
    throw err;
  }
}

// Function to check if LinkedIn API is available
export const checkLinkedInApiStatus = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("linkedin_status");
    
    if (error) {
      console.error("LinkedIn API status check failed:", error);
      return false;
    }
    
    return data?.available || false;
  } catch (error) {
    console.error("Error checking LinkedIn API status:", error);
    return false;
  }
};

// Generate intelligent requirement suggestions based on user input
const generateSuggestedRequirements = (userRequirements: string[]): string[] => {
  const requirementsByCategory: { [key: string]: string[] } = {
    technical: [
      "Experience with cloud platforms (AWS/Azure/GCP)",
      "Knowledge of CI/CD pipelines",
      "Proficiency in agile methodologies",
      "Experience with microservices architecture",
      "Database design and optimization skills",
      "DevOps experience",
      "API development expertise",
      "Mobile development experience",
      "Frontend framework mastery (React/Angular/Vue)",
      "Automated testing experience",
      "Cybersecurity knowledge",
      "Performance optimization skills",
      "UI/UX design principles",
      "Serverless architecture experience",
      "Containerization (Docker/Kubernetes)"
    ],
    sales: [
      "CRM software proficiency",
      "Experience closing enterprise deals",
      "Proven sales record exceeding quotas",
      "Solution selling experience",
      "Experience with B2B sales",
      "Account management skills",
      "Territory management experience", 
      "Sales presentation skills",
      "Pipeline management expertise",
      "Contract negotiation experience",
      "Sales forecasting abilities",
      "Customer relationship building",
      "Experience with consultative selling",
      "Channel partnership development",
      "Cold calling expertise"
    ],
    leadership: [
      "Team management experience",
      "Strategic planning capabilities",
      "Budget management experience",
      "Change management expertise",
      "Executive communication skills",
      "Cross-functional collaboration",
      "Project management certification",
      "Experience with distributed teams",
      "Conflict resolution skills",
      "Performance review experience",
      "Mentoring and coaching abilities",
      "Process improvement expertise",
      "Crisis management experience",
      "Vision setting and alignment",
      "Stakeholder management"
    ],
    marketing: [
      "Content marketing expertise",
      "SEO/SEM knowledge",
      "Social media campaign management",
      "Marketing automation experience",
      "Analytics and reporting skills",
      "Brand development experience",
      "A/B testing expertise",
      "Experience with marketing attribution",
      "Email marketing proficiency",
      "Product positioning skills",
      "Market research experience",
      "Competitive analysis abilities",
      "Event marketing management",
      "Marketing funnel optimization",
      "PR and media relations"
    ],
    financial: [
      "Financial modeling experience",
      "Budgeting and forecasting skills",
      "Audit experience",
      "Regulatory compliance knowledge",
      "Risk assessment expertise",
      "Experience with financial reporting",
      "Cost analysis skills",
      "M&A experience",
      "Investment analysis capabilities",
      "Cash flow management",
      "Tax planning knowledge",
      "Revenue recognition expertise",
      "Experience with ERP systems",
      "Financial controls implementation",
      "Capital structure optimization"
    ]
  };

  let categoryGuess = "leadership";
  
  const userText = userRequirements.join(" ").toLowerCase();
  
  if (userText.match(/\b(tech|developer|coding|software|engineering|architect)\b/)) {
    categoryGuess = "technical";
  } else if (userText.match(/\b(sales|selling|revenue|quota|prospect|lead|client|customer)\b/)) {
    categoryGuess = "sales";
  } else if (userText.match(/\b(lead|leadership|manager|executive|director|strategy)\b/)) {
    categoryGuess = "leadership";
  } else if (userText.match(/\b(marketing|brand|content|social media|campaign|seo)\b/)) {
    categoryGuess = "marketing";
  } else if (userText.match(/\b(finance|financial|accounting|budget|investment|audit)\b/)) {
    categoryGuess = "financial";
  }
  
  const userRequirementsSet = new Set(userRequirements.map(req => req.toLowerCase()));
  
  let allPossibleSuggestions: string[] = [];
  
  allPossibleSuggestions = [...requirementsByCategory[categoryGuess]];
  
  const otherCategories = Object.keys(requirementsByCategory).filter(cat => cat !== categoryGuess);
  
  for (const category of otherCategories) {
    allPossibleSuggestions = [...allPossibleSuggestions, ...requirementsByCategory[category]];
  }
  
  const filteredSuggestions = allPossibleSuggestions.filter(suggestion => {
    const suggestionLower = suggestion.toLowerCase();
    return !userRequirementsSet.has(suggestionLower) && 
           !userRequirements.some(userReq => {
             const userReqLower = userReq.toLowerCase();
             return suggestionLower.includes(userReqLower) || userReqLower.includes(suggestionLower);
           });
  });
  
  const shuffledSuggestions = [...filteredSuggestions].sort(() => 0.5 - Math.random());
  
  const neededCount = 10 - userRequirements.length;
  
  const uniqueSuggestions = new Set<string>();
  
  for (const suggestion of shuffledSuggestions) {
    if (uniqueSuggestions.size >= neededCount) break;
    
    const isDuplicate = Array.from(uniqueSuggestions).some(
      selected => {
        const selectedLower = selected.toLowerCase();
        const suggestionLower = suggestion.toLowerCase();
        return selectedLower.includes(suggestionLower) || suggestionLower.includes(selectedLower);
      }
    );
    
    if (!isDuplicate) {
      uniqueSuggestions.add(suggestion);
    }
  }
  
  return Array.from(uniqueSuggestions);
};

// Generate scoring based on criteria and optional files
export const generateScoring = async (criteria: string, files?: File[]): Promise<ScoringResponse> => {
  console.info("Generating scoring for criteria:", criteria);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const criteriaItems = criteria
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    const userCriteria = criteriaItems.slice(0, 10);
    
    const allCriteria: MatchCriteria[] = userCriteria.map(item => ({
      name: item,
      match: true,
      score: 1
    }));
    
    // Get all possible AI suggested requirements
    const suggestedRequirements = generateSuggestedRequirements(userCriteria);
    
    // Calculate how many more requirements we need
    const requiredCount = 10 - allCriteria.length;
    
    if (requiredCount > 0) {
      // How many suggestions we can provide from our generated list
      const availableSuggestionsCount = Math.min(requiredCount, suggestedRequirements.length);
      
      // Add as many AI suggested requirements as we have available
      for (let i = 0; i < availableSuggestionsCount; i++) {
        allCriteria.push({
          name: suggestedRequirements[i],
          match: true,
          score: 1,
          isAiSuggested: true
        });
      }
      
      // If we still need more requirements (unlikely), use generic fallbacks
      // but only as a last resort if we've exhausted all our intelligent suggestions
      const remainingCount = 10 - allCriteria.length;
      if (remainingCount > 0) {
        // Try to pull additional suggestions from other categories as backup
        const categoryNames = ["technical", "sales", "leadership", "marketing", "financial"];
        const backupSuggestions: string[] = [];
        
        for (let i = 0; backupSuggestions.length < remainingCount && i < 15; i++) {
          // Get suggestions from rotating categories that weren't already used
          const category = categoryNames[i % categoryNames.length];
          const tempRequirements = userCriteria.concat(suggestedRequirements);
          const mockUserReq = [`${category} role`]; // Hint to get suggestions from this category
          
          const additionalSuggestions = generateSuggestedRequirements(mockUserReq)
            .filter(suggestion => !tempRequirements.includes(suggestion) && 
                                 !backupSuggestions.includes(suggestion));
          
          if (additionalSuggestions.length > 0) {
            backupSuggestions.push(additionalSuggestions[0]);
          }
        }
        
        // Add any backup suggestions we found
        for (let i = 0; i < Math.min(backupSuggestions.length, remainingCount); i++) {
          allCriteria.push({
            name: backupSuggestions[i],
            match: true,
            score: 1,
            isAiSuggested: true
          });
        }
        
        // As absolute last resort, add more descriptive requirements if we still don't have enough
        const skillAreas = ["Communication", "Leadership", "Technical", "Strategic", "Project Management", 
                           "Analytical", "Sales", "Marketing", "Financial", "Operational"];
        const skillDescriptors = ["Advanced", "Professional", "Expert", "Specialized", "Proven"];
        
        const stillNeeded = 10 - allCriteria.length;
        for (let i = 0; i < stillNeeded; i++) {
          const area = skillAreas[i % skillAreas.length];
          const descriptor = skillDescriptors[Math.floor(i / skillAreas.length) % skillDescriptors.length];
          allCriteria.push({
            name: `${descriptor} ${area} Experience`,
            match: true,
            score: 1,
            isAiSuggested: true
          });
        }
      }
    }
    
    return {
      relevanceScore: 10,
      engagementPotential: 10,
      conversionLikelihood: 10,
      overallScore: 10,
      explanation: `Based on your criteria, we've created a profile with ${allCriteria.length} key requirements.`,
      criteria: allCriteria
    };
  } catch (error) {
    console.error("Error generating scoring:", error);
    throw error;
  }
};

// Analyze LinkedIn URL with criteria
export const analyzeLinkedInUrl = async (url: string, criteria: string): Promise<LinkedInAnalysisResponse> => {
  console.info("Analyzing LinkedIn URL:", url);
  console.info("Using criteria:", criteria);
  
  try {
    // Always try to use the real API, no fallback to mock data
    try {
      console.log("Calling LinkedIn data retrieval function for profile");
      const data = await callSupabaseFunction("linkedin_data_retrieval", { 
        url, 
        criteria,
        type: "profile"
      });
      
      if (data && data.matches) {
        data.matches = data.matches.map(m => ({
          ...m,
          score: m.match ? 1 : 0
        }));
        data.score = data.matches.filter(m => m.match).length;
      }
      
      console.log("LinkedIn profile data retrieved:", data);
      return data;
    } catch (apiError) {
      console.error("LinkedIn API error:", apiError);
      throw new Error("LinkedIn API is not available");
    }
  } catch (error) {
    console.error("Error analyzing LinkedIn:", error);
    throw error;
  }
};

// Analyze LinkedIn search with criteria
export const analyzeLinkedInSearch = async (url: string, criteria: string): Promise<LinkedInAnalysisResponse[]> => {
  console.info("Analyzing LinkedIn search:", url);
  console.info("Using criteria:", criteria);
  
  try {
    // Always try to use the real API, no fallback to mock data
    try {
      console.log("Calling LinkedIn data retrieval function for search");
      const data = await callSupabaseFunction("linkedin_data_retrieval", { 
        url, 
        criteria,
        type: "search"
      });
      
      if (!data || !Array.isArray(data.profiles)) {
        throw new Error("Invalid response format from LinkedIn API");
      }
      
      console.log(`LinkedIn search returned ${data.profiles.length} profiles`);
      
      return data.profiles.map(profile => {
        if (profile.matches) {
          profile.matches = profile.matches.map(m => ({
            ...m,
            score: m.match ? 1 : 0
          }));
          profile.score = profile.matches.filter(m => m.match).length;
        }
        return profile;
      });
    } catch (apiError) {
      console.error("LinkedIn API error:", apiError);
      throw new Error("LinkedIn API is not available");
    }
  } catch (error) {
    console.error("Error analyzing LinkedIn search:", error);
    throw error;
  }
};

// Function to perform a Google search using the Custom Search API
export async function performGoogleSearch(query: string) {
  try {
    console.log("Performing real Google search with query:", query);
    
    // Make sure the query always starts with site:linkedin.com/in
    let searchQuery = query;
    if (!searchQuery.startsWith("site:linkedin.com/in")) {
      searchQuery = "site:linkedin.com/in " + searchQuery;
    }
    
    // Clean the query - remove special characters that might cause issues
    const cleanedQuery = searchQuery.replace(/[^\w\s:]/g, ' ').trim();
    console.log("Cleaned query:", cleanedQuery);
    
    // Build the Google Custom Search API URL
    const baseUrl = "https://www.googleapis.com/customsearch/v1";
    const params = new URLSearchParams({
      key: GOOGLE_API_KEY,
      cx: GOOGLE_SEARCH_ENGINE_ID,
      q: cleanedQuery,
      num: "10" // Request 10 results
    });
    
    const apiUrl = `${baseUrl}?${params.toString()}`;
    console.log("API URL (without key):", apiUrl.replace(GOOGLE_API_KEY, "[REDACTED]"));
    
    // Make the API request
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", errorText);
      
      // Handle specific error types
      if (errorText.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
        throw new Error("API_KEY_HTTP_REFERRER_BLOCKED: Domain not allowed by API key");
      } else if (errorText.includes("API key not valid")) {
        throw new Error("Invalid API key. Please check your API key");
      } else if (errorText.includes("Daily Limit")) {
        throw new Error("Daily API quota exceeded. Please try again later");
      }
      
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Google search results received:", data.searchInformation?.totalResults || "0", "results");
    
    // Extract relevant information from search results
    if (data.items && data.items.length > 0) {
      return data.items.map(item => {
        // Extract name from title - typically "First Last - Title at Company | LinkedIn"
        let name = "";
        let title = "";
        let company = "";
        
        // Parse LinkedIn title format: "Name - Title at Company | LinkedIn"
        if (item.title) {
          const linkedinSplit = item.title.split(" | LinkedIn")[0];
          const nameTitleSplit = linkedinSplit.split(" - ");
          
          if (nameTitleSplit.length > 0) {
            name = nameTitleSplit[0].trim();
            
            if (nameTitleSplit.length > 1) {
              const titlePart = nameTitleSplit[1].trim();
              const titleCompanySplit = titlePart.split(" at ");
              
              if (titleCompanySplit.length > 0) {
                title = titleCompanySplit[0].trim();
                
                if (titleCompanySplit.length > 1) {
                  company = titleCompanySplit[1].trim();
                }
              } else {
                title = titlePart;
              }
            }
          }
        }
        
        return {
          id: item.cacheId || `result-${Math.random().toString(36).substring(2, 11)}`,
          name: name || "LinkedIn User",
          title: title || "Professional",
          company: company || "",
          snippet: item.snippet || "",
          url: item.link,
          searchTerms: query.split(/\s+AND\s+|\s+OR\s+/).map(term => term.replace(/"/g, "").trim())
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error("Error in Google search:", error);
    throw error;
  }
}

// Function to analyze search results against requirements
export function analyzeSearchResults(searchResults, requirements) {
  return searchResults.map(profile => {
    const activeRequirements = requirements.filter(req => req.score > 0);
    
    // For each requirement, determine if the profile matches
    const matchCriteria = activeRequirements.map(requirement => {
      const requirementText = requirement.description.toLowerCase();
      const profileText = [
        profile.name.toLowerCase(),
        profile.title.toLowerCase(),
        profile.company.toLowerCase(),
        profile.snippet.toLowerCase(),
        ...profile.searchTerms.map(term => term.toLowerCase())
      ].join(' ');
      
      // Check if requirement appears in profile text
      const isMatch = profileText.includes(requirementText) || 
                      profile.searchTerms.some(term => 
                        term.toLowerCase().includes(requirementText) || 
                        requirementText.includes(term.toLowerCase()));
      
      return {
        name: requirement.description,
        match: isMatch,
        score: isMatch ? 1 : 0
      };
    });
    
    // Calculate overall score (0-10)
    const rawScore = matchCriteria.filter(criterion => criterion.match).length;
    const maxScore = matchCriteria.length;
    const normalizedScore = Math.round((rawScore / maxScore) * 10);
    
    // Ensure score is between 1-10 (even if zero matches, minimum score is 1)
    const finalScore = Math.max(1, Math.min(10, normalizedScore || 1));
    
    return {
      id: profile.id,
      name: profile.name,
      title: profile.title,
      company: profile.company,
      snippet: profile.snippet,
      url: profile.url,
      score: finalScore,
      matchCriteria: matchCriteria
    };
  }).sort((a, b) => b.score - a.score); // Sort by score descending
}

// New function to search LinkedIn profiles using Google Custom Search - simplified
export const searchLinkedInProfiles = async (requirements: any[]): Promise<any[]> => {
  console.info("Searching LinkedIn profiles using requirements");
  
  try {
    // Build a search query from requirements
    const validRequirements = requirements
      .filter(req => req.score > 0 && req.description && req.description.trim().length > 0)
      .map(req => req.description.trim());
    
    // Simple search query building - USE ONLY AND OPERATORS
    let searchQuery = "site:linkedin.com/in";
    
    // Add first requirement
    if (validRequirements.length >= 1) {
      searchQuery += ` ${validRequirements[0]}`;
    }
    
    // Add all remaining requirements with AND
    if (validRequirements.length > 1) {
      for (let i = 1; i < validRequirements.length; i++) {
        searchQuery += ` AND ${validRequirements[i]}`;
      }
    }
    
    console.log("LinkedIn search query:", searchQuery);
    
    // Perform the search directly without fallback strategies
    const searchResults = await performGoogleSearch(searchQuery);
    
    if (searchResults && searchResults.length > 0) {
      // Analyze each search result against our requirements
      const analyzedProfiles = analyzeSearchResults(searchResults, requirements);
      return analyzedProfiles;
    } else {
      console.warn("No search results found");
      throw new Error("No LinkedIn profiles found matching your criteria");
    }
  } catch (error) {
    console.error("Error searching LinkedIn profiles:", error);
    throw error;
  }
};

// Helper function to format search terms properly
function formatSearchTerm(term: string): string {
  // Remove any existing quotes and other special characters that might cause issues
  return term.replace(/[^\w\s]/g, ' ').trim();
}

// Helper function to group similar requirements
function groupSimilarRequirements(requirements: any[]): any[][] {
  // This is a simplified grouping - in a real implementation, 
  // you'd want more sophisticated logic to identify related terms
  
  // For demo purposes, we'll group by keywords
  const groups: { [key: string]: any[] } = {
    roles: [],
    industries: [],
    locations: [],
    skills: [],
    other: []
  };
  
  // Keywords to identify category
  const categoryKeywords = {
    roles: ["manager", "director", "executive", "lead", "head", "chief", "ceo", "cto", "cfo", "vp", "president", "founder"],
    industries: ["saas", "software", "tech", "healthcare", "finance", "retail", "education", "manufacturing", "consulting"],
    locations: ["stockholm", "london", "new york", "san francisco", "berlin", "paris", "remote"],
    skills: ["sales", "marketing", "development", "engineering", "design", "product", "data", "analytics"]
  };
  
  // Categorize requirements
  requirements.forEach(req => {
    const term = req.description.toLowerCase();
    let assigned = false;
    
    // Check each category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (term.includes(keyword)) {
          groups[category].push(req);
          assigned = true;
          break;
        }
      }
      if (assigned) break;
    }
    
    // If not assigned to any category
    if (!assigned) {
      groups.other.push(req);
    }
  });
  
  // Convert the groups object to an array of arrays, filtering out empty groups
  return Object.values(groups).filter(group => group.length > 0);
}

// Function to create a relaxed version of the query
function createRelaxedQuery(requirements: any[]): string {
  // Always start with the LinkedIn site search
  let query = "site:linkedin.com/in";
  
  // Get the active requirements (score > 0)
  const activeRequirements = requirements.filter(req => req.score > 0);
  
  if (activeRequirements.length === 0) {
    return query;
  }
  
  console.log("Creating relaxed query with requirements:", activeRequirements.map(req => req.description));
  
  // Identify the most important requirement categories
  const groups: { [key: string]: any[] } = {
    roles: [],
    industries: [],
    locations: [],
    skills: [],
    other: []
  };
  
  // Keywords to identify category (same as in groupSimilarRequirements)
  const categoryKeywords = {
    roles: ["manager", "director", "executive", "lead", "head", "chief", "ceo", "cto", "cfo", "vp", "president", "founder"],
    industries: ["saas", "software", "tech", "healthcare", "finance", "retail", "education", "manufacturing", "consulting"],
    locations: ["stockholm", "london", "new york", "san francisco", "berlin", "paris", "remote"],
    skills: ["sales", "marketing", "development", "engineering", "design", "product", "data", "analytics"]
  };
  
  // Categorize requirements
  activeRequirements.forEach(req => {
    const term = req.description.toLowerCase();
    let assigned = false;
    
    // Check each category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (term.includes(keyword)) {
          groups[category].push(req);
          assigned = true;
          break;
        }
      }
      if (assigned) break;
    }
    
    // If not assigned to any category
    if (!assigned) {
      groups.other.push(req);
    }
  });
  
  // Prioritize categories: roles > industries > locations > skills > other
  const priorityOrder = ['roles', 'industries', 'locations', 'skills', 'other'];
  const relaxedTermGroups = [];
  
  // Take at most one term from each important category
  for (const category of priorityOrder) {
    if (groups[category].length > 0) {
      // For roles and industries, we might want to include more than one term with AND
      if (category === 'roles' || category === 'industries') {
        const terms = groups[category].slice(0, Math.min(2, groups[category].length))
          .map(req => formatSearchTerm(req.description));
        
        if (terms.length > 1) {
          relaxedTermGroups.push(`${terms.join(" AND ")}`);
        } else if (terms.length === 1) {
          relaxedTermGroups.push(terms[0]);
        }
      } else {
        // For other categories, just take the first term
        if (groups[category].length > 0) {
          relaxedTermGroups.push(formatSearchTerm(groups[category][0].description));
        }
      }
      
      // Limit to at most 3 term groups for a relaxed query
      if (relaxedTermGroups.length >= 3) break;
    }
  }
  
  // Add the terms to the query with AND logic between groups
  if (relaxedTermGroups.length > 0) {
    // Use AND between term groups
    query += ` ${relaxedTermGroups.join(" AND ")}`;
  }
  
  console.log("Relaxed boolean query:", query);
  return query;
}
