import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, AlertCircle, Link as LinkIcon, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { 
  generateScoring, 
  analyzeLinkedInUrl, 
  analyzeLinkedInSearch, 
  checkLinkedInApiStatus,
  searchLinkedInProfiles 
} from '@/utils/claudeService';
import { toast } from '@/hooks/use-toast';
import SearchBox from './SearchBox';
import RequirementsProfile from './RequirementsProfile';
import CandidateResults from './CandidateResults';
import GoogleCustomSearch from './GoogleCustomSearch';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import SearchResultsTable from './SearchResultsTable';
import { extractRequirements } from '@/utils/requirementExtractor';
import { v4 as uuidv4 } from 'uuid';

// Define Requirement interface
interface Requirement {
  id: string;
  description: string;
  score: number;
  isAiSuggested?: boolean;
  category?: string;
}

// Define RequirementsProfileData interface
interface RequirementsProfileData {
  title: string;
  description: string;
  requirements: Requirement[];
  overallScore: number;
  explanation?: string;
}

const SacoreMinimal = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [requirementsProfile, setRequirementsProfile] = useState<RequirementsProfileData | null>(null);
  const [criteria, setCriteria] = useState('');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<"checking" | "available" | "unavailable">("checking");
  const [apiError, setApiError] = useState<string | null>(null);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);
  const [savedProjects, setSavedProjects] = useState<{id: string; name: string}[]>([]);
  
  const [links, setLinks] = useState<string[]>([]);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved projects
    const projectsFromStorage = localStorage.getItem('savedProjects');
    if (projectsFromStorage) {
      try {
        const projects = JSON.parse(projectsFromStorage);
        setSavedProjects(projects.map((p: any) => ({ id: p.id, name: p.name })));
      } catch (error) {
        console.error('Error parsing saved projects:', error);
      }
    }
    
    const checkApiStatus = async () => {
      try {
        const isAvailable = await checkLinkedInApiStatus();
        setApiStatus(isAvailable ? "available" : "unavailable");
        if (!isAvailable) {
          setApiError("LinkedIn API is currently unavailable. You can continue using the search functionality.");
        }
      } catch (error) {
        console.error("Error checking API status:", error);
        setApiStatus("unavailable");
        setApiError("Could not connect to LinkedIn API. You can continue using the search functionality.");
      }
    };
    
    checkApiStatus();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (inputValue: string, uploadedFiles: File[]) => {
    setIsSearching(true);
    setHasSearched(false);
    
    const exactRequirement = inputValue.trim();
    let updatedCriteria;
    
    if (criteria) {
      updatedCriteria = criteria + ", " + exactRequirement;
    } else {
      updatedCriteria = exactRequirement;
    }
    
    setCriteria(updatedCriteria);
    
    try {
      const scoringResponse = await generateScoring(updatedCriteria, uploadedFiles);
      
      // Store the original input text for auto-categorization
      localStorage.setItem('originalInputText', updatedCriteria);
      
      // Auto-categorize the input text
      const categorized = extractRequirements(updatedCriteria);
      console.log('Auto-categorized requirements:', categorized);
      
      // We're only interested in skills that were explicitly recognized by the extractRequirements function
      // The skills in categorized.skills have already been validated against our predefined lists
      
      // Ensure terms don't appear in multiple categories
      // Remove any skills that are already in titles or industries
      categorized.skills = categorized.skills.filter(skill => {
        const skillLower = skill.toLowerCase();
        return !categorized.titles.some(title => title.toLowerCase() === skillLower) &&
               !categorized.industries.some(industry => industry.toLowerCase() === skillLower);
      });
      
      // Filter out skills that are likely sentences (too many words)
      categorized.skills = categorized.skills.filter(skill => {
        // Count words in the skill
        const wordCount = skill.split(/\s+/).length;
        
        // Accept only skills that are 1-3 words (reasonable skill length)
        return wordCount >= 1 && wordCount <= 3;
      });
      
      // Clean up locations by removing prefixes and standardizing format
      categorized.locations = categorized.locations.map(location => {
        // Remove common prefixes and phrases
        let cleanedLocation = location
          .replace(/^(located? in |location |in |from |based in |work in |working in )/i, '')
          .replace(/ area$| region$| city$| country$/i, '')
          .trim();
          
        return cleanedLocation;
      });
      
      // Clean up titles by removing articles and other common prefixes
      categorized.titles = categorized.titles.map(title => {
        // Remove articles and common prefixes
        let cleanedTitle = title
          .replace(/^(a |an |the |is |as |for |looking for |need |want |find |seeking |searching for )/i, '')
          .replace(/^(someone with|people with|person with|candidate with|applicant with|professional with|individual with)/i, '')
          .replace(/^(profile for|searching for|role for|position for|job for|title for|someone who is)/i, '')
          .trim();
          
        // Also remove common phrases anywhere in the title
        cleanedTitle = cleanedTitle
          .replace(/ with experience( in)?$/i, '')
          .replace(/ who can/i, '')
          .replace(/ that has/i, '')
          .replace(/ position$/i, '')
          .replace(/ role$/i, '')
          .trim();
          
        // Make the first character uppercase for consistency
        if (cleanedTitle.length > 0) {
          cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
        }
          
        return cleanedTitle;
      });
      
      // Clean up industries by removing prefixes
      categorized.industries = categorized.industries.map(industry => {
        // Remove common prefixes and phrases
        let cleanedIndustry = industry
          .replace(/^(industry |sector |in the |within the |works in |working in )/i, '')
          .replace(/ industry$| sector$| market$| field$/i, '')
          .trim();
          
        return cleanedIndustry;
      });
      
      // Clean up skills by removing prefixes
      categorized.skills = categorized.skills.map(skill => {
        // Remove common prefixes and phrases
        let cleanedSkill = skill
          .replace(/^(skills? in |expertise in |knowledge of |experience with |proficient in |experienced in )/i, '')
          .replace(/^(with |has |possessing |having |shows |demonstrates |exhibits |displays )/i, '')
          .replace(/^(great |good |excellent |strong |advanced |expert |proficient |competent )/i, '')
          .replace(/ skills?$| expertise$| experience$| abilities$| competenc(y|ies)$/i, '')
          .replace(/^(able to|ability to|capacity to|capable of) /i, '')
          .trim();
        
        // If the skill is still a sentence (contains verbs like "can", "is", "has", etc.), skip it
        if (/\b(is|are|was|were|be|being|been|have|has|had|do|does|did|can|could|will|would|should|may|might|must|shall)\b/i.test(cleanedSkill)) {
          // This is likely a sentence, not a skill
          return ""; // Will be filtered out later
        }
        
        // If skill is too long (more than 3 words), it's likely not a proper skill
        if (cleanedSkill.split(/\s+/).length > 3) {
          return ""; // Will be filtered out later
        }
        
        // Special handling for sales-specific terms
        if (/sales/i.test(cleanedSkill) && !/management|strategy|analytics|training|enablement|leadership|forecasting/i.test(cleanedSkill)) {
          cleanedSkill = cleanedSkill.replace(/^(sales\s+)/i, '');
          cleanedSkill = "Sales - " + cleanedSkill.charAt(0).toUpperCase() + cleanedSkill.slice(1);
        }
        
        // Handle Swedish sales terms
        if (/försäljning/i.test(cleanedSkill) && !/ledning|strategi|analys|träning|ledarskap/i.test(cleanedSkill)) {
          cleanedSkill = cleanedSkill.replace(/^(försäljning\s+)/i, '');
          cleanedSkill = "Försäljning - " + cleanedSkill.charAt(0).toUpperCase() + cleanedSkill.slice(1);
        }
        
        // Handle specific sales methodologies
        if (/SPIN|Challenger|MEDDIC|BANT|CHAMP|GAP|Sandler|Conceptual|Strategic|SNAP|Value/i.test(cleanedSkill)) {
          if (!/selling|sales|method/i.test(cleanedSkill)) {
            cleanedSkill += " Selling";
          }
        }
        
        // Ensure common sales terms are well-formatted
        if (/^B2B$/i.test(cleanedSkill)) cleanedSkill = "B2B Sales";
        if (/^B2C$/i.test(cleanedSkill)) cleanedSkill = "B2C Sales";
        if (/^KAM$/i.test(cleanedSkill)) cleanedSkill = "Key Account Management";
        if (/^CRM$/i.test(cleanedSkill)) cleanedSkill = "CRM";
        if (/^SEO$/i.test(cleanedSkill)) cleanedSkill = "SEO";
        if (/^SEM$/i.test(cleanedSkill)) cleanedSkill = "SEM";
        
        // Handle Swedish equivalents
        if (/^B2B-försäljning$/i.test(cleanedSkill)) cleanedSkill = "B2B-försäljning";
        if (/^B2C-försäljning$/i.test(cleanedSkill)) cleanedSkill = "B2C-försäljning";
        if (/^nyckelkundshantering$/i.test(cleanedSkill)) cleanedSkill = "Nyckelkundshantering";
        
        // Common soft skills cleanup
        if (/communication/i.test(cleanedSkill) && !/skills?/i.test(cleanedSkill)) {
          cleanedSkill = "Communication skills";
        }
        if (/problem.?solving/i.test(cleanedSkill) && !/skills?/i.test(cleanedSkill)) {
          cleanedSkill = "Problem-solving skills";
        }
        if (/teamwork/i.test(cleanedSkill) && !/skills?/i.test(cleanedSkill)) {
          cleanedSkill = "Teamwork";
        }
        if (/leadership/i.test(cleanedSkill) && !/skills?/i.test(cleanedSkill)) {
          cleanedSkill = "Leadership";
        }
        
        // Swedish equivalents
        if (/kommunikation/i.test(cleanedSkill) && !/färdigheter|förmåga/i.test(cleanedSkill)) {
          cleanedSkill = "Kommunikationsförmåga";
        }
        if (/problemlösning/i.test(cleanedSkill) && !/färdigheter|förmåga/i.test(cleanedSkill)) {
          cleanedSkill = "Problemlösningsförmåga";
        }
        if (/teamwork|lagarbete/i.test(cleanedSkill) && !/färdigheter|förmåga/i.test(cleanedSkill)) {
          cleanedSkill = "Lagarbete";
        }
        if (/ledarskap/i.test(cleanedSkill) && !/färdigheter|förmåga/i.test(cleanedSkill)) {
          cleanedSkill = "Ledarskap";
        }
        
        // Make the first character uppercase for consistency
        if (cleanedSkill.length > 0) {
          cleanedSkill = cleanedSkill.charAt(0).toUpperCase() + cleanedSkill.slice(1);
        }
          
        return cleanedSkill;
      });
      
      // Remove empty skills and duplicates
      categorized.skills = categorized.skills
        .filter(skill => skill.trim() !== "")
        .filter((skill, index, self) => 
          index === self.findIndex(s => s.toLowerCase() === skill.toLowerCase())
        );
      
      // Remove duplicates from all categories and convert to lowercase for case-insensitive comparison
      const uniqueLocations = new Map();
      const uniqueTitles = new Map();
      const uniqueIndustries = new Map();
      const uniqueSkills = new Map();
      
      // För locations - behåll originalvärdet men jämför case insensitive
      categorized.locations.forEach(loc => {
        const lowerLoc = loc.toLowerCase();
        if (!uniqueLocations.has(lowerLoc)) {
          uniqueLocations.set(lowerLoc, loc);
        }
      });
      
      // För titles - behåll originalvärdet men jämför case insensitive
      categorized.titles.forEach(title => {
        const lowerTitle = title.toLowerCase();
        if (!uniqueTitles.has(lowerTitle)) {
          uniqueTitles.set(lowerTitle, title);
        }
      });
      
      // För industries - behåll originalvärdet men jämför case insensitive
      categorized.industries.forEach(industry => {
        const lowerIndustry = industry.toLowerCase();
        if (!uniqueIndustries.has(lowerIndustry)) {
          uniqueIndustries.set(lowerIndustry, industry);
        }
      });
      
      // För skills - behåll originalvärdet men jämför case insensitive
      categorized.skills.forEach(skill => {
        const lowerSkill = skill.toLowerCase();
        if (!uniqueSkills.has(lowerSkill)) {
          uniqueSkills.set(lowerSkill, skill);
        }
      });
      
      // Uppdatera de kategoriserade värdena med de unika värdena
      categorized.locations = Array.from(uniqueLocations.values());
      categorized.titles = Array.from(uniqueTitles.values());
      categorized.industries = Array.from(uniqueIndustries.values());
      categorized.skills = Array.from(uniqueSkills.values());
      
      // Check uncategorized terms to see if they might be job titles or skills
      const remainingUncategorized: string[] = [];
      
      categorized.uncategorized.forEach(term => {
        // Check for common job title suffixes
        if (
          /manager$|director$|specialist$|engineer$|developer$|analyst$|designer$|consultant$|coordinator$|administrator$|assistant$|adviser$|advisor$|supervisor$|lead$|expert$/i.test(term) ||
          /\b(?:senior|junior|principal|chief|head|lead|associate)\b/i.test(term)
        ) {
          // This is likely a job title
          const cleanedTitle = term
            .replace(/^(a |an |the |is |as |for |looking for |need |want |find |seeking |searching for )/i, '')
            .replace(/^(someone with|people with|person with|candidate with|applicant with|professional with|individual with)/i, '')
            .replace(/^(profile for|searching for|role for|position for|job for|title for|someone who is)/i, '')
            .trim();
          
          // Only add if not already in titles
          if (!categorized.titles.some(title => title.toLowerCase() === cleanedTitle.toLowerCase())) {
            // Make the first character uppercase for consistency
            const formattedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
            categorized.titles.push(formattedTitle);
          }
        }
        // Check for sales, marketing, or business development specific terms
        else if (
          /\b(?:sales|selling|lead generation|prospecting|negotiation|closing|customer|account|client|CRM|pipeline|forecast|quota|target|deal|contract|proposal|presentation|pitch|KAM|key account|booking|meeting|telesales|inside sales|field sales|inbound|outbound|cold call|revenue|commission|B2B|B2C)\b/i.test(term) ||
          /\b(?:försäljning|sälj|kundhantering|avslut|kund|affär|kontrakt|förhandling|prospektering|lead|mötesbokning|telesälj|intäkt|provision|kundvård|offert|presentations|pitch)\b/i.test(term)
        ) {
          // This is likely a sales skill
          const cleanedSkill = term
            .replace(/^(skills? in |expertise in |knowledge of |experience with |proficient in |experienced in )/i, '')
            .replace(/^(with |has |possessing |having |shows |demonstrates |exhibits |displays )/i, '')
            .replace(/^(great |good |excellent |strong |advanced |expert |proficient |competent )/i, '')
            .replace(/ skills?$| expertise$| experience$| abilities$| competenc(y|ies)$/i, '')
            .replace(/^(able to|ability to|capacity to|capable of) /i, '')
            .trim();
            
          // Only add if it's a reasonable skill (not a sentence) and not already in skills
          const wordCount = cleanedSkill.split(/\s+/).length;
          if (wordCount >= 1 && wordCount <= 3 && 
              !categorized.skills.some(skill => skill.toLowerCase() === cleanedSkill.toLowerCase())) {
            // Make the first character uppercase for consistency
            const formattedSkill = cleanedSkill.charAt(0).toUpperCase() + cleanedSkill.slice(1);
            categorized.skills.push(formattedSkill);
          }
        }
        // Check for technical skills or other relevant terms
        else if (
          /skill(s|ed)?$|ability$|proficiency$|competenc(y|ies)$|\bknowledge\b|\bexperience\b/i.test(term) ||
          /communication|teamwork|leadership|problem.?solving|creativity|innovation|time.?management|organization|adaptability/i.test(term) ||
          /software|programming|coding|development|design|analysis|research|marketing|sales|customer/i.test(term) ||
          /\b(java|python|javascript|typescript|html|css|sql|react|angular|vue|node|express|django|flask)\b/i.test(term) ||
          /\b(aws|azure|gcp|docker|kubernetes|git|jenkins|ci\/cd|devops|agile|scrum)\b/i.test(term)
        ) {
          // This is likely a skill
          const cleanedSkill = term
            .replace(/^(skills? in |expertise in |knowledge of |experience with |proficient in |experienced in )/i, '')
            .replace(/^(with |has |possessing |having |shows |demonstrates |exhibits |displays )/i, '')
            .replace(/^(great |good |excellent |strong |advanced |expert |proficient |competent )/i, '')
            .replace(/ skills?$| expertise$| experience$| abilities$| competenc(y|ies)$/i, '')
            .replace(/^(able to|ability to|capacity to|capable of) /i, '')
            .trim();
          
          // Only add if it's a reasonable skill (not a sentence) and not already in skills
          const wordCount = cleanedSkill.split(/\s+/).length;
          if (wordCount >= 1 && wordCount <= 3 && 
              !categorized.skills.some(skill => skill.toLowerCase() === cleanedSkill.toLowerCase())) {
            // Make the first character uppercase for consistency
            const formattedSkill = cleanedSkill.charAt(0).toUpperCase() + cleanedSkill.slice(1);
            categorized.skills.push(formattedSkill);
          }
        }
        else {
          remainingUncategorized.push(term);
        }
      });
      
      // Update uncategorized with remaining terms
      categorized.uncategorized = remainingUncategorized;
      
      // Log filtered out uncategorized words
      if (categorized.uncategorized.length > 0) {
        console.log('Filtered out uncategorized words:', categorized.uncategorized);
      }
      
      // Create the default requirements list
      let defaultRequirements: Requirement[] = [];

      // Add the first item from each category if available
      if (categorized.locations.length > 0) {
        let description = categorized.locations[0];
        if (description.toLowerCase().startsWith("location")) {
          description = description.replace(/^location\s*:?\s*/i, '');
        }
        
        defaultRequirements.push({
          id: uuidv4(),
          description: description,
          score: 3,
          category: "Location"
        });
      } else {
        defaultRequirements.push({
          id: uuidv4(),
          description: "Any Location",
          score: 0,
          category: "Location"
        });
      }

      if (categorized.titles.length > 0) {
        let description = categorized.titles[0];
        if (description.toLowerCase().startsWith("title") || description.toLowerCase().startsWith("titles")) {
          description = description.replace(/^titles?\s*:?\s*/i, '');
        }
        
        defaultRequirements.push({
          id: uuidv4(),
          description: description,
          score: 5,
          category: "Titles"
        });
      } else {
        defaultRequirements.push({
          id: uuidv4(),
          description: "Any Title",
          score: 0,
          category: "Titles"
        });
      }

      if (categorized.industries.length > 0) {
        let description = categorized.industries[0];
        if (description.toLowerCase().startsWith("industr")) {
          description = description.replace(/^industr(y|ies)\s*:?\s*/i, '');
        }
        
        defaultRequirements.push({
          id: uuidv4(),
          description: description,
          score: 4,
          category: "Industries"
        });
      } else {
        defaultRequirements.push({
          id: uuidv4(),
          description: "Any Industry",
          score: 0,
          category: "Industries"
        });
      }

      if (categorized.skills.length > 0) {
        let description = categorized.skills[0];
        if (description.toLowerCase().startsWith("skill")) {
          description = description.replace(/^skill\s*:?\s*/i, '');
        }
        
        defaultRequirements.push({
          id: uuidv4(),
          description: description,
          score: 2,
          category: "Skill"
        });
        
        // Remove the first skill from the array since we've already added it as a default requirement
        categorized.skills.shift();
      } else {
        defaultRequirements.push({
          id: uuidv4(),
          description: "Any Skill",
          score: 0,
          category: "Skill"
        });
      }
      
      // Create additional requirements for additional keywords in each category
      let additionalRequirements: Requirement[] = [];
      
      // For locations, skip the first one as it's already in default requirements
      for (let i = 1; i < categorized.locations.length; i++) {
        // Make sure the location doesn't start with the word "Location"
        let description = categorized.locations[i];
        if (description.toLowerCase().startsWith("location")) {
          description = description.replace(/^location\s*:?\s*/i, '');
        }
        
        additionalRequirements.push({
          id: uuidv4(),
          description: description,
          score: 3,
          category: "Location"
        });
      }
      
      // For titles, skip the first one as it's already in default requirements
      for (let i = 1; i < categorized.titles.length; i++) {
        // Make sure the title doesn't start with the word "Title" or "Titles"
        let description = categorized.titles[i];
        if (description.toLowerCase().startsWith("title") || description.toLowerCase().startsWith("titles")) {
          description = description.replace(/^titles?\s*:?\s*/i, '');
        }
        
        additionalRequirements.push({
          id: uuidv4(),
          description: description,
          score: 5,
          category: "Titles"
        });
      }
      
      // For industries, skip the first one as it's already in default requirements
      for (let i = 1; i < categorized.industries.length; i++) {
        // Make sure the industry doesn't start with the word "Industry" or "Industries"
        let description = categorized.industries[i];
        if (description.toLowerCase().startsWith("industr")) {
          description = description.replace(/^industr(y|ies)\s*:?\s*/i, '');
        }
        
        additionalRequirements.push({
          id: uuidv4(),
          description: description,
          score: 4,
          category: "Industries"
        });
      }
      
      // Add additional skills
      categorized.skills.forEach(skill => {
        // Make sure the skill doesn't start with the word "Skill"
        let description = skill;
        if (description.toLowerCase().startsWith("skill")) {
          description = description.replace(/^skill\s*:?\s*/i, '');
        }
        
        additionalRequirements.push({
          id: uuidv4(),
          description: description,
          score: 1,
          category: "Skill"
        });
      });
      
      // Combine default and additional requirements
      const allRequirements = [...defaultRequirements, ...additionalRequirements];
      
      // Set predefined requirements to localStorage
      localStorage.setItem('requirements', JSON.stringify(allRequirements.map(req => req.description)));
      
      // Calculate overall score based on unique categories only
      // Each category (Location, Titles, Industries) counts as 1 point max
      // Skills no longer add points to max score
      const categoryCount = new Set();
      
      // Count unique categories only
      if (allRequirements.some(req => req.category === 'Location' && req.score > 0)) {
        categoryCount.add('Location');
      }
      
      if (allRequirements.some(req => req.category === 'Titles' && req.score > 0)) {
        categoryCount.add('Titles');
      }
      
      if (allRequirements.some(req => req.category === 'Industries' && req.score > 0)) {
        categoryCount.add('Industries');
      }
      
      // Total max score equals the number of categories only (max 3)
      const totalScore = categoryCount.size;
      
      console.log(`SacoreMinimal calculated totalScore: ${totalScore} (categories: ${Array.from(categoryCount).join(', ')})`);
      
      // Display requirements profile with auto-categorized requirements
      setRequirementsProfile({
        title: "Requirements Profile",
        description: `Based on your search for "${updatedCriteria.length > 30 ? `${updatedCriteria.substring(0, 30)}...` : updatedCriteria}"`,
        requirements: allRequirements,
        overallScore: totalScore,
        explanation: ""
      });
      
      setFollowUpQuestions([]);
      setIsSearching(false);
    } catch (error) {
      console.error("Error in search:", error);
      toast({
        title: "Search Error",
        description: "There was a problem processing your search. Please try again.",
        variant: "destructive"
      });
      setIsSearching(false);
    }
  };
  
  const handleFollowUpClick = (question: string) => {
    handleSearch(question, []);
  };
  
  const handleRequirementsApproval = async () => {
    if (!requirementsProfile || !requirementsProfile.requirements) {
      toast({
        title: "Error",
        description: "No requirements profile found.",
        variant: "destructive"
      });
      return;
    }
    
    const requirements = requirementsProfile.requirements;
    
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
    
    // Spara kraven för sökning (dessa kommer att kombineras med AND mellan kategorierna)
    localStorage.setItem('requirements', JSON.stringify(validRequirements));
    
    // Spara också metadata om vilka krav som är titlar (för särskild hantering i sheet view)
    if (groupedRequirements.titles.length > 0) {
      localStorage.setItem('titlesRequirements', JSON.stringify(groupedRequirements.titles));
    }
    
    // Spara metadata om vilka krav som är industrier (för särskild hantering i sheet view)
    if (groupedRequirements.industries.length > 0) {
      localStorage.setItem('industriesRequirements', JSON.stringify(groupedRequirements.industries));
    }
    
    toast({
      title: "Starting Search",
      description: "Searching for profiles based on your requirements...",
    });
  };

  const handleSearchResults = (results: any) => {
    if (results && results.items && results.items.length > 0) {
      const extractedLinks = results.items
        .map((item: any) => item.link)
        .filter((link: string) => !!link);
      
      console.log(`Found ${extractedLinks.length} links in search results`);
      
      if (extractedLinks.length > 0) {
        setLinks(extractedLinks);
        
        localStorage.setItem('searchResultLinks', JSON.stringify(extractedLinks));
        localStorage.setItem('googleSearchLinks', JSON.stringify(extractedLinks));
        
        toast({
          title: "Search Complete",
          description: `Found ${extractedLinks.length} results. Redirecting to results view.`,
        });
        
        setTimeout(() => {
          navigate('/sheet-view');
        }, 1000);
      } else {
        toast({
          title: "No Links Found",
          description: "The search completed but no valid links were found. Try different terms.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Search Failed",
        description: "No results found. Try different search terms.",
        variant: "destructive"
      });
    }
  };

  const handleAdvancedSearchClick = () => {
    toast({
      title: "Advanced Search",
      description: "Advanced search features will be available soon."
    });
  };

  return (
    <div className="relative min-h-screen bg-white text-black font-['SF Pro Display', 'SF Pro', 'Inter', 'Helvetica', 'Arial', 'sans-serif']">
      <div className="container mx-auto px-4 py-8">
        <div className="absolute top-6 left-6 z-40">
          <button 
            className="w-10 h-10 flex flex-col justify-center items-center space-y-1.5 focus:outline-none"
            onClick={() => setShowMenu(!showMenu)}
          >
            <span className={`block w-5 h-0.5 bg-black transition-transform duration-300 ${showMenu ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-black transition-opacity duration-300 ${showMenu ? 'opacity-0' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-black transition-transform duration-300 ${showMenu ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
          
          {showMenu && (
            <div ref={menuRef} className="absolute top-12 left-0 bg-white shadow-lg rounded-lg py-2 w-48 z-50 border border-gray-200">
              <div className="px-4 py-2 text-sm text-gray-700 font-medium">MENU</div>
              <Link to="/" className="block px-4 py-2 hover:bg-gray-100 text-gray-800 transition-colors">Home</Link>
              <Link to="/sheet-view" className="block px-4 py-2 hover:bg-gray-100 text-gray-800 transition-colors">View Results</Link>
              
              {savedProjects.length > 0 && (
                <Link 
                  to="/projects" 
                  className="block px-4 py-2 hover:bg-gray-100 text-gray-800 transition-colors flex items-center"
                  onClick={() => setShowMenu(false)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <span>Projects</span>
                </Link>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center min-h-screen p-6">
          <div className={`flex flex-col items-center justify-center ${hasSearched || requirementsProfile ? 'mt-16 mb-8' : 'min-h-[70vh] pt-[75px]'}`}>
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-black via-gray-700 to-gray-500 text-transparent bg-clip-text">SACORE AI</h1>
              <p className="text-gray-400 text-sm tracking-wide uppercase">Intelligent Sourcing</p>
            </div>
            
            {!requirementsProfile && (
              <SearchBox 
                onSearch={handleSearch} 
                isSearching={isSearching} 
                onLinkedInClick={handleAdvancedSearchClick}
                onAdvancedSearchClick={handleAdvancedSearchClick}
              />
            )}
            
            {requirementsProfile && !hasSearched && (
              <RequirementsProfile 
                title={requirementsProfile.title}
                description={requirementsProfile.description}
                requirements={requirementsProfile.requirements}
                overallScore={requirementsProfile.overallScore}
                explanation={requirementsProfile.explanation}
                followUpQuestions={followUpQuestions}
                onFollowUpClick={handleFollowUpClick}
                onApprove={handleRequirementsApproval}
              />
            )}
          </div>
          
          {hasSearched && (
            <div className="pt-4 w-full max-w-4xl">
              {apiError && (
                <Alert className="mb-6 bg-[#1A1A1A] border-[#333333]">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <AlertTitle className="text-white">Search Notice</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    {apiError}
                  </AlertDescription>
                </Alert>
              )}
              
              {showGoogleSearch && (
                <div className="mb-4 animate-fadeIn">
                  <GoogleCustomSearch onResultsReady={handleSearchResults} />
                </div>
              )}
              
              {links.length > 0 && (
                <div className="mt-4 animate-fadeIn">
                  <SearchResultsTable links={links} />
                </div>
              )}
              
              {candidates.length > 0 && <CandidateResults candidates={candidates} searchCriteria={criteria} />}
            </div>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 text-center p-4 text-xs text-gray-400">
          SACORE AI © {new Date().getFullYear()} <span className="mx-1">|</span> <Link to="/privacy-policy" className="hover:text-gray-300">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default SacoreMinimal;
