import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import RequirementsFooter from './requirements-profile/RequirementsFooter';
import SearchAlerts from './requirements-profile/SearchAlerts';
import SearchProgressOverlay from './requirements-profile/SearchProgressOverlay';
import useGoogleSearch from '@/hooks/useGoogleSearch';
import RequirementsList from './requirements/RequirementsList';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RawLinkList from './RawLinkList';
import { extractProfileDataFromSearchResults, ISearchResult } from '@/utils/profileExtractors/extractProfileDataFromSearchResults';
import { v4 as uuidv4 } from 'uuid';
import { extractRequirements } from '@/utils/requirementExtractor';

interface Requirement {
  id: string;
  description: string;
  score: number;
  isAiSuggested?: boolean;
  category?: string;
  placeholder?: string;
}

interface RequirementsProfileProps {
  title: string;
  description: string;
  requirements: Requirement[];
  overallScore: number;
  explanation?: string;
  followUpQuestions: string[];
  onFollowUpClick: (question: string) => void;
  onApprove: () => void;
}

const RequirementsProfile = ({
  title,
  description,
  requirements: initialRequirements,
  overallScore,
  explanation,
  followUpQuestions,
  onFollowUpClick,
  onApprove
}: RequirementsProfileProps) => {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>(
    initialRequirements
  );
  const [searchLinks, setSearchLinks] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  
  const GOOGLE_API_KEY = "AIzaSyCiKZ7WPiGeZlFtlIa-lWarr4Esk-VWkhw";
  const SEARCH_ENGINE_ID = "c05572c17c5eb4ca4";
  
  const {
    isSearching: isGoogleSearching,
    searchExecuted,
    analysisStage,
    links,
    errorMessage,
    isRelaxedSearch,
    handleApproveAndSearch,
    searchUrl
  } = useGoogleSearch({
    requirements,
    GOOGLE_API_KEY,
    SEARCH_ENGINE_ID,
    autoSearch: false // Set to false to prevent automatic search
  });

  // Add state variables to track search progress
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
  const [totalQueries, setTotalQueries] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);

  // Listen for search progress updates from localStorage
  useEffect(() => {
    const checkSearchProgress = () => {
      try {
        const searchProgressJson = localStorage.getItem('searchProgress');
        if (searchProgressJson) {
          const progress = JSON.parse(searchProgressJson);
          
          if (progress.currentQuery !== undefined) {
            setCurrentQueryIndex(progress.currentQuery);
          }
          
          if (progress.totalQueries !== undefined) {
            setTotalQueries(progress.totalQueries);
          }
          
          if (progress.currentPage !== undefined) {
            setCurrentPage(progress.currentPage);
          }
        }
      } catch (error) {
        console.error("Error reading search progress:", error);
      }
    };

    // Check immediately
    checkSearchProgress();

    // Set up more frequent polling for progress updates (every 100ms)
    const interval = setInterval(checkSearchProgress, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTriggered && analysisStage === 'complete' && !isGoogleSearching && !searchCompleted) {
      setSearchCompleted(true);
      
      // Always force a short delay before navigation to ensure the 100% progress is displayed
      console.log("RequirementsProfile: Search completed, preparing for navigation");
      
      const hasLinks = (links && links.length > 0) || (searchLinks && searchLinks.length > 0);
      
      if (hasLinks) {
        console.log("Search completed and links available, starting profile extraction");
        
        const allLinks = [...(links || []), ...(searchLinks || [])].filter(Boolean);
        
        if (allLinks.length > 0) {
          console.log(`Total of ${allLinks.length} unique links available`);
          localStorage.setItem('googleSearchLinks', JSON.stringify(allLinks));
          
          // Store search timestamp to mark this as a new search session
          localStorage.setItem('searchTimestamp', new Date().getTime().toString());
          
          // Process search results to extract profile data
          try {
            // Get the search result items from localStorage
            const searchResultItemsJson = localStorage.getItem('searchResultItems');
            if (searchResultItemsJson) {
              const searchResultItems = JSON.parse(searchResultItemsJson) as ISearchResult[];
              
              if (Array.isArray(searchResultItems) && searchResultItems.length > 0) {
                console.log(`Extracting profile data from ${searchResultItems.length} search result items`);
                
                // Extract profile data from search results
                const extractedProfiles = extractProfileDataFromSearchResults(searchResultItems);
                
                if (extractedProfiles.length > 0) {
                  console.log(`Successfully extracted ${extractedProfiles.length} profiles from search results`);
                  
                  // Save extracted profiles to localStorage for SheetView to use
                  localStorage.setItem('aiExtractedProfiles', JSON.stringify(extractedProfiles));
                  localStorage.setItem('gscExtractedProfiles', JSON.stringify(extractedProfiles));
                  
                  // Now navigate to sheet view after extraction is complete
                  // Use a longer delay to ensure the 100% is shown clearly
                  setTimeout(() => {
                    navigate('/sheet-view');
                  }, 800);
                } else {
                  console.warn("Extraction completed but no profiles were found");
                  // Navigate anyway, SheetView will fall back to creating profiles from links
                  // Use a longer delay to ensure the 100% is shown clearly
                  setTimeout(() => {
                    navigate('/sheet-view');
                  }, 800);
                }
              } else {
                console.warn("No valid search result items found in localStorage");
                // Navigate anyway, SheetView will fall back to creating profiles from links
                setTimeout(() => {
                  navigate('/sheet-view');
                }, 800);
              }
            } else {
              console.warn("No searchResultItems found in localStorage");
              // Navigate anyway, SheetView will fall back to creating profiles from links
              setTimeout(() => {
                navigate('/sheet-view');
              }, 800);
            }
          } catch (error) {
            console.error("Error extracting profile data:", error);
            // Navigate anyway, SheetView will fall back to creating profiles from links
            setTimeout(() => {
              navigate('/sheet-view');
            }, 800);
          }
        }
      } else {
        try {
          const storedLinks = localStorage.getItem('googleSearchLinks');
          if (storedLinks) {
            const parsedLinks = JSON.parse(storedLinks);
            if (Array.isArray(parsedLinks) && parsedLinks.length > 0) {
              console.log(`Found ${parsedLinks.length} links in localStorage`);
              setSearchLinks(parsedLinks);
              
              setTimeout(() => {
                navigate('/sheet-view');
              }, 800);
            }
          }
        } catch (e) {
          console.error("Error reading links from localStorage:", e);
        }
      }
    }
  }, [links, searchLinks, analysisStage, isGoogleSearching, searchCompleted, navigate, searchTriggered]);

  // Ensure we start with the four default requirements if none exist and attempt auto-categorization
  useEffect(() => {
    if (requirements.length === 0) {
      // Define default requirements structure
      const defaultRequirements = [
        {
          id: uuidv4(),
          description: "Location (City, country)",
          score: 1,
        },
        {
          id: uuidv4(),
          description: "Titles",
          score: 1,
        },
        {
          id: uuidv4(),
          description: "Industries",
          score: 1,
        },
        {
          id: uuidv4(),
          description: "Skill",
          score: 1,
        }
      ];
      
      // Try to auto-categorize if we have original input text
      const originalInputText = localStorage.getItem('originalInputText');
      if (originalInputText) {
        try {
          const categorized = extractRequirements(originalInputText);
          console.log('Auto-categorized requirements:', categorized);
          
          // Update default requirements with categorized values
          if (categorized.locations.length > 0) {
            defaultRequirements[0].description = `Location: ${categorized.locations[0]}`;
          }
          
          if (categorized.titles.length > 0) {
            defaultRequirements[1].description = `Titles: ${categorized.titles[0]}`;
          }
          
          if (categorized.industries.length > 0) {
            defaultRequirements[2].description = `Industries: ${categorized.industries[0]}`;
          }
          
          if (categorized.skills.length > 0) {
            defaultRequirements[3].description = `Skill: ${categorized.skills[0]}`;
          }
          
          // Add any additional values from each category as new requirements
          const additionalRequirements: Requirement[] = [];
          
          // Add additional locations
          categorized.locations.slice(1).forEach(location => {
            additionalRequirements.push({
              id: uuidv4(),
              description: `Location: ${location}`,
              score: 1,
            });
          });
          
          // Add additional titles
          categorized.titles.slice(1).forEach(title => {
            additionalRequirements.push({
              id: uuidv4(),
              description: `Titles: ${title}`,
              score: 1,
            });
          });
          
          // Add additional industries
          categorized.industries.slice(1).forEach(industry => {
            additionalRequirements.push({
              id: uuidv4(),
              description: `Industries: ${industry}`,
              score: 1,
            });
          });
          
          // Add additional skills
          categorized.skills.slice(1).forEach(skill => {
            additionalRequirements.push({
              id: uuidv4(),
              description: `Skill: ${skill}`,
              score: 1,
            });
          });
          
          // Add uncategorized items as skills
          categorized.uncategorized.forEach(item => {
            additionalRequirements.push({
              id: uuidv4(),
              description: `Skill: ${item}`,
              score: 1,
            });
          });
          
          // Set the requirements with default + additional
          setRequirements([...defaultRequirements, ...additionalRequirements]);
          return; // Skip setting just default requirements
        } catch (error) {
          console.error('Error auto-categorizing requirements:', error);
          // Fall back to default requirements if auto-categorization fails
        }
      }
      
      // Set default requirements if we didn't auto-categorize
      setRequirements(defaultRequirements);
    }
  }, []);

  const handleEditRequirement = (id: string, value: string) => {
    // Hämta aktuellt krav och dess kategori
    const currentRequirement = requirements.find(req => req.id === id);
    if (!currentRequirement) return;
    
    const category = currentRequirement.category;
    const trimmedValue = value.trim();
    
    // Validera kategorispecifikt innehåll
    if (category === 'Location') {
      // Validera att det endast är städer eller länder som tillåts
      const locationPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-',.]+$/;
      
      if (!locationPattern.test(trimmedValue)) {
        toast({
          title: "Ogiltig plats",
          description: "Endast städer och länder kan användas som plats.",
          variant: "destructive"
        });
        return;
      }
      
      // Förhindra platser med siffror eller som uppenbart inte är städer/länder
      if (/\d/.test(trimmedValue) || 
          /\b(skill|experience|proficient|javascript|python|java|react|software|developer|manager)\b/i.test(trimmedValue)) {
        toast({
          title: "Ogiltig plats",
          description: "Detta ser inte ut som en stad eller ett land.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (category === 'Skill') {
      // Validera att det endast är skills som tillåts, inte platser eller titlar
      
      // Förhindra städer och länder i skills
      const commonLocations = /\b(stockholm|gothenburg|malmö|göteborg|sweden|norge|norway|denmark|finland|berlin|london|paris|new york|usa|uk|amsterdam)\b/i;
      if (commonLocations.test(trimmedValue)) {
        toast({
          title: "Ogiltig skill",
          description: "Detta ser ut som en plats, inte en skill.",
          variant: "destructive"
        });
        return;
      }
      
      // Förhindra vanliga titlar i skills
      const commonTitles = /\b(ceo|cfo|cto|manager|director|executive|engineer|developer|consultant|analyst)\b/i;
      if (/^(senior|junior|principal|chief|head|lead|associate)?\s*(software|project|product)?\s*/.test(trimmedValue.toLowerCase()) && 
          commonTitles.test(trimmedValue)) {
        toast({
          title: "Ogiltig skill",
          description: "Detta ser ut som en titel, inte en skill.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Kontrollera om det redan finns en titel eller industri med samma värde
    if (trimmedValue) {
      const existingRequirement = requirements.find(req => 
        req.id !== id && 
        req.description.toLowerCase() === trimmedValue.toLowerCase() &&
        req.category === category
      );
      
      if (existingRequirement) {
        toast({
          title: "Duplicerat krav",
          description: "Det finns redan ett krav med exakt samma värde.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setRequirements(prevRequirements => 
      prevRequirements.map(req => 
        req.id === id ? { ...req, description: trimmedValue } : req
      )
    );
    
    toast({
      title: "Requirement Updated",
      description: "Your requirement has been successfully updated."
    });
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements(prevRequirements => 
      prevRequirements.filter(req => req.id !== id)
    );
    
    toast({
      title: "Requirement Deleted",
      description: "Your requirement has been successfully deleted."
    });
  };

  const handleAddRequirement = () => {
    // If there are less than 4 requirements, check if we need to add default ones
    if (requirements.length < 4) {
      const defaultCategories = [
        "Location (City, country)",
        "Titles",
        "Industries",
        "Skill"
      ];
      
      // Check which default categories are missing
      const existingCategories = requirements.map(req => {
        if (req.description.startsWith("Location")) return "Location (City, country)";
        if (req.description.startsWith("Titles")) return "Titles";
        if (req.description.startsWith("Industries")) return "Industries";
        if (req.description.startsWith("Skill")) return "Skill";
        return req.description;
      });
      
      // Find a missing category
      const missingCategory = defaultCategories.find(cat => !existingCategories.includes(cat));
      
      if (missingCategory) {
        // Add the missing default category
        setRequirements([
          ...requirements,
          {
            id: uuidv4(),
            description: missingCategory,
            score: 1,
            category: missingCategory === "Location (City, country)" ? "Location" : 
                      missingCategory === "Titles" ? "Titles" : 
                      missingCategory === "Industries" ? "Industries" : "Skill"
          }
        ]);
        return;
      }
    }
    
    // If all default categories exist or we have 4+ requirements already, add a generic one
    setRequirements([
      ...requirements,
      {
        id: uuidv4(),
        description: '',
        score: 1,
        category: "Skill" // Default to Skill for new requirements
      }
    ]);
  };

  // Handler för att lägga till krav för specifik kategori
  const handleAddCategoryRequirement = (category: string) => {
    // Kontrollera om vi redan har för många krav av denna kategori
    const categoryRequirements = requirements.filter(req => req.category === category);
    
    // Om det är Location, tillåt bara 1
    if (category === 'Location' && categoryRequirements.length > 0) {
      toast({
        title: "Kan inte lägga till fler",
        description: "Du kan endast ha en plats i din sökning.",
        variant: "destructive"
      });
      return;
    }
    
    // För Titles och Industries, visa en mer beskrivande placeholder
    let placeholderText = '';
    if (category === 'Location') {
      placeholderText = 'Stockholm, London, etc.';
    } else if (category === 'Titles') {
      placeholderText = 'Software Engineer, Product Manager, etc.';
    } else if (category === 'Industries') {
      placeholderText = 'Tech, Finance, Healthcare, etc.';
    } else if (category === 'Skill') {
      placeholderText = 'JavaScript, Project Management, etc.';
    }
    
    // För skills, ändra så att varje skill får egen rubrik och poäng
    if (category === 'Skill') {
      // Lägg till skill som separat krav med poäng 1
      setRequirements([
        ...requirements,
        {
          id: uuidv4(),
          description: '',
          score: 1,
          category: 'Skill',
          placeholder: placeholderText
        }
      ]);
    } else {
      setRequirements([
        ...requirements,
        {
          id: uuidv4(),
          description: '',
          score: 1,
          category: category,
          placeholder: placeholderText
        }
      ]);
    }
    
    toast({
      title: `Adding ${category} Requirement`,
      description: `A new ${category.toLowerCase()} requirement has been added.`
    });
  };

  const buildQuery = (): string => {
    // VIKTIGT: Ta med ALLA aktiva requirements
    const validRequirements = requirements
      .filter(r => r.description && r.description.trim().length > 0 && r.score > 0)
      .map(r => r.description.trim());
    
    if (validRequirements.length === 0) {
      return "";
    }
    
    console.log("ALL VALID REQUIREMENTS FOR QUERY:", validRequirements);
    
    // Skapa sökfrågan med alla requirements
    let query = validRequirements.join(" AND ");
    
    console.log("FINAL GOOGLE QUERY:", query);
    return query;
  };

  const performGoogleSearch = async (query: string) => {
    try {
      setIsSearching(true);
      
      const baseUrl = "https://www.googleapis.com/customsearch/v1";
      const params = new URLSearchParams({
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: query,
        num: "10"
      });
      
      const apiUrl = `${baseUrl}?${params.toString()}`;
      console.log("API URL (without key):", apiUrl.replace(GOOGLE_API_KEY, "[REDACTED]"));
      console.log("PERFORMING GOOGLE SEARCH WITH QUERY:", query);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log("Google search results:", data);
      
      if (data.items && data.items.length > 0) {
        const links = data.items.map((item: any) => item.link).filter(Boolean);
        console.log("Extracted links:", links);
        
        if (links.length > 0) {
          setSearchLinks(links);
          
          // Clear previous search data
          clearPreviousSearchData();
          
          // Set new links
          localStorage.setItem('googleSearchLinks', JSON.stringify(links));
          localStorage.setItem('linkedInSearchLinks', JSON.stringify(links));
          localStorage.setItem('searchResultLinks', JSON.stringify(links));
          
          // Save ALL requirements for this search - VERY IMPORTANT
          const allValidRequirements = requirements
            .filter(r => r.description && r.description.trim().length > 0 && r.score > 0)
            .map(r => r.description.trim());
          
          console.log("ALL requirements for localStorage:", allValidRequirements);
            
          localStorage.setItem('requirements', JSON.stringify(allValidRequirements));
          localStorage.setItem('approvedRequirements', JSON.stringify(allValidRequirements));
          localStorage.setItem('searchRequirements', JSON.stringify(allValidRequirements));
          localStorage.setItem('searchTerms', JSON.stringify(allValidRequirements));
          localStorage.setItem('originalRequirements', JSON.stringify(allValidRequirements));
          
          // Store search timestamp to mark this as a new search session
          localStorage.setItem('searchTimestamp', new Date().getTime().toString());
          
          // Process search results to extract profile data before navigating
          try {
            // Store search result items for extraction
            const searchItems = data.items.map((item: any) => ({
              title: item.title || '',
              snippet: item.snippet || '',
              link: item.link || '',
              htmlSnippet: item.htmlSnippet || ''
            }));
            
            localStorage.setItem('searchResultItems', JSON.stringify(searchItems));
            
            // Extract profile data from search results
            const extractedProfiles = extractProfileDataFromSearchResults(searchItems);
            
            if (extractedProfiles.length > 0) {
              console.log(`Successfully extracted ${extractedProfiles.length} profiles from search results`);
              
              // Save extracted profiles to localStorage for SheetView to use
              localStorage.setItem('aiExtractedProfiles', JSON.stringify(extractedProfiles));
              localStorage.setItem('gscExtractedProfiles', JSON.stringify(extractedProfiles));
            } else {
              console.warn("Extraction completed but no profiles were found");
            }
          } catch (error) {
            console.error("Error extracting profile data:", error);
          }
          
          // Comment out toast notification
          // toast({
          //   title: "Search Complete",
          //   description: `Found ${links.length} results.`
          // });
          
          navigate('/sheet-view');
        }
      } else {
        console.warn("No items found in search results");
        toast({
          title: "No Results",
          description: "No search results found. Try different terms.",
          variant: "destructive"
        });
      }
      
      setIsSearching(false);
      setSearchCompleted(true);
    } catch (error) {
      console.error("Error in Google search:", error);
      
      toast({
        title: "Search Error",
        description: "An error occurred during search. Please try again.",
        variant: "destructive"
      });
      
      setSearchLinks([]);
      setIsSearching(false);
    }
  };

  // Function to clear previous search data from localStorage
  const clearPreviousSearchData = () => {
    // Rensa alla sökresultat
    localStorage.removeItem('googleSearchLinks');
    localStorage.removeItem('linkedInSearchLinks');
    localStorage.removeItem('searchResultLinks');
    localStorage.removeItem('linkSheetRows');
    
    // Rensa alla tidigare krav
    localStorage.removeItem('searchRequirements');
    localStorage.removeItem('approvedRequirements');
    localStorage.removeItem('searchTerms');
    localStorage.removeItem('originalRequirements');
    localStorage.removeItem('searchCriteria');
    
    // Rensa alla tidigare profiler
    localStorage.removeItem('aiExtractedProfiles');
    localStorage.removeItem('extractedProfileData');
    localStorage.removeItem('gscExtractedProfiles');
    
    console.log("All previous search data cleared from localStorage");
  };

  const handleApproveAndSearchWrapper = async () => {
    console.log("Requirements in RequirementsProfile:", requirements);
    
    // Clear any existing search data
    clearPreviousSearchData();
    
    setSearchLinks([]);
    setSearchCompleted(false);
    setSearchTriggered(true);
    
    // Store the requirements for this search (endast aktiva requirements)
    const validRequirements = requirements
      .filter(r => r.description && r.description.trim().length > 0 && r.score > 0)
      .map(r => r.description.trim());
    
    console.log("FULL LIST OF VALID REQUIREMENTS:", validRequirements);
    console.log("Number of requirements:", validRequirements.length);
    
    // VIKTIGT: Logga alla krav innan de sparas för att se att alla kommer med
    for (let i = 0; i < validRequirements.length; i++) {
      console.log(`Requirement ${i+1}: "${validRequirements[i]}"`);
    }
    
    // Spara kraven i flera nycklar för säkerhets skull
    localStorage.setItem('requirements', JSON.stringify(validRequirements));
    localStorage.setItem('approvedRequirements', JSON.stringify(validRequirements));
    localStorage.setItem('searchRequirements', JSON.stringify(validRequirements));
    localStorage.setItem('searchTerms', JSON.stringify(validRequirements));
    localStorage.setItem('originalRequirements', JSON.stringify(validRequirements));
    
    // Spara även som searchCriteria för system som använder den
    localStorage.setItem('searchCriteria', validRequirements.join(' AND '));
    
    // Verify that requirements were saved correctly
    try {
      const savedReqs = localStorage.getItem('requirements');
      if (savedReqs) {
        const parsedReqs = JSON.parse(savedReqs);
        console.log("SAVED REQUIREMENTS:", parsedReqs);
        console.log("Number of saved requirements:", parsedReqs.length);
      }
    } catch (e) {
      console.error("Error verifying saved requirements:", e);
    }
    
    onApprove();
    
    // Comment out toast notification
    // toast({
    //   title: "Starting Search",
    //   description: "Searching for profiles based on your requirements...",
    // });
    
    try {
      setIsSearching(true);
      await handleApproveAndSearch();
    } catch (error) {
      console.error("Error in search:", error);
      setIsSearching(false);
      
      const query = buildQuery();
      if (query) {
        console.log("Trying fallback search method with query:", query);
        await performGoogleSearch(query);
      }
    }
  };

  const checkForStoredLinks = () => {
    try {
      const keys = ['googleSearchLinks', 'linkedInSearchLinks', 'searchResultLinks'];
      keys.forEach(key => {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          console.log(`Storage '${key}' contains ${parsed.length} links`);
          if (parsed.length > 0) {
            console.log(`First link from ${key}:`, parsed[0]);
          }
        } else {
          console.log(`Storage '${key}' is empty`);
        }
      });
    } catch (e) {
      console.error("Error checking localStorage:", e);
    }
  };

  const handleRequirementsApproval = async () => {
    if (!requirements || requirements.length === 0) {
      toast({
        title: "Error",
        description: "No requirements found.",
        variant: "destructive"
      });
      return;
    }
    
    // Gruppera krav efter kategori
    const groupedRequirements: Record<string, string[]> = {
      locations: [],
      titles: [],
      industries: [],
      skills: []
    };
    
    // Filtrera och gruppera kraven efter kategori
    requirements.forEach(r => {
      if (!r.description || !r.description.trim() || r.score <= 0) return;
      
      const value = r.description.trim();
      const category = r.category?.toLowerCase() || '';
      
      if (category === 'location') {
        groupedRequirements.locations.push(value);
      } 
      else if (category === 'titles') {
        groupedRequirements.titles.push(value);
      }
      else if (category === 'industries') {
        groupedRequirements.industries.push(value);
      }
      else if (category === 'skill') {
        groupedRequirements.skills.push(value);
      }
    });
    
    // Calculate max score based on unique categories (Location, Titles, Industries = 3 max)
    // Plus 0 points for any additional Skills
    let maxScore = 0;
    
    // Each category (Location, Titles, Industries) counts as 1 point only
    if (groupedRequirements.locations.length > 0) maxScore += 1;
    if (groupedRequirements.titles.length > 0) maxScore += 1;
    if (groupedRequirements.industries.length > 0) maxScore += 1;
    
    // Skills no longer add to max score, max is 3 if all categories are used
    
    console.log(`Calculated maxScore: ${maxScore} (${groupedRequirements.locations.length > 0 ? 1 : 0} Location + ${groupedRequirements.titles.length > 0 ? 1 : 0} Titles + ${groupedRequirements.industries.length > 0 ? 1 : 0} Industries)`);
    
    // Kontrollera om vi har minst en location, vilket nu är obligatoriskt
    if (groupedRequirements.locations.length === 0) {
      toast({
        title: "Error",
        description: "Location is required. Please add at least one location.",
        variant: "destructive"
      });
      return;
    }
    
    // Förbereda output för att spara
    const validRequirements: string[] = [];
    
    // Location är nu obligatoriskt i alla kombinationer
    const locationRequirement = groupedRequirements.locations[0]; // Använd den första platsen
    validRequirements.push(locationRequirement);
    
    // Hantera titlar - kombinera med OR istället för AND
    if (groupedRequirements.titles.length > 0) {
      // Använd OR-syntax: "Title1 OR Title2 OR Title3"
      const titlesRequirement = groupedRequirements.titles.join(" OR ");
      validRequirements.push(titlesRequirement);
    }
    
    // Hantera industrier - kombinera med OR istället för AND
    if (groupedRequirements.industries.length > 0) {
      // Använd OR-syntax: "Industry1 OR Industry2 OR Industry3"
      const industriesRequirement = groupedRequirements.industries.join(" OR ");
      validRequirements.push(industriesRequirement);
    }
    
    // För skills hanteras varje krav individuellt som tidigare
    [...groupedRequirements.skills].forEach(skill => {
      validRequirements.push(skill);
    });
    
    if (validRequirements.length === 0) {
      toast({
        title: "Error",
        description: "No valid requirements found. Please add some requirements.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Valid requirements:", validRequirements);
    console.log("Max score calculated:", maxScore);
    
    // Spara kraven för sökning (dessa kommer att kombineras med AND mellan kategorierna)
    localStorage.setItem('requirements', JSON.stringify(validRequirements));
    
    // Spara också max score för användning i sheet view
    localStorage.setItem('maxScore', maxScore.toString());
    
    // Spara också metadata om vilka krav som är titlar (för särskild hantering i sheet view)
    if (groupedRequirements.titles.length > 0) {
      localStorage.setItem('titlesRequirements', JSON.stringify(groupedRequirements.titles));
    }
    
    // Spara metadata om vilka krav som är industrier (för särskild hantering i sheet view)
    if (groupedRequirements.industries.length > 0) {
      localStorage.setItem('industriesRequirements', JSON.stringify(groupedRequirements.industries));
    }
    
    // Comment out toast notification
    // toast({
    //   title: "Starting Search",
    //   description: "Searching for profiles based on your requirements...",
    // });
  };

  return (
    <div className="w-full max-w-3xl p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2 text-black">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-black">Profile Requirements</h3>
        
        <RequirementsList
          requirements={requirements}
          onEdit={handleEditRequirement}
          onDelete={handleDeleteRequirement}
          isEditing={!searchTriggered}
          renderHeader={() => null}
          onAddRequirement={handleAddCategoryRequirement}
        />
        
        {explanation && (
          <div className="mt-6 p-3 bg-white border border-gray-200 rounded text-sm text-gray-700">
            {explanation}
          </div>
        )}
      </div>
      
      {followUpQuestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-black">Suggested Follow-up Questions</h3>
          <div className="space-y-2">
            {followUpQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => onFollowUpClick(question)}
                className="block w-full text-left p-3 bg-white hover:bg-gray-100 border border-gray-200 rounded text-black transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <RequirementsFooter 
        requirements={requirements}
        followUpQuestions={followUpQuestions}
        onFollowUpClick={onFollowUpClick}
        onAddRequirement={handleAddRequirement}
        onApprove={handleApproveAndSearchWrapper}
        isSearching={isSearching || isGoogleSearching}
        analysisStage={analysisStage}
        searchExecuted={searchExecuted}
        isRelaxedSearch={isRelaxedSearch}
        requirementsCount={requirements.length}
      />
      
      {/* SearchAlerts - temporarily disabled 
      {searchTriggered && (
        <SearchAlerts 
          errorMessage={errorMessage}
          isRelaxedSearch={isRelaxedSearch}
          searchExecuted={searchExecuted}
          searchUrl={searchUrl}
          analysisStage={analysisStage}
        />
      )}
      */}
      
      {/* Restore the SearchProgressOverlay to show the percentage in the middle */}
      <SearchProgressOverlay 
        analysisStage={analysisStage} 
        isRelaxedSearch={isRelaxedSearch}
        visible={isSearching || isGoogleSearching || analysisStage === 'complete'}
        searchTriggered={searchTriggered}
        currentQuery={currentQueryIndex}
        totalQueries={totalQueries}
        currentPage={currentPage}
      />
    </div>
  );
};

export default RequirementsProfile;
