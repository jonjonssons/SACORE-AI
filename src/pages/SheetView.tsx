import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Download, 
  Edit, 
  Save, 
  X, 
  RefreshCcw, 
  Filter, 
  Check, 
  RotateCw, 
  Trash2, 
  FileDown, 
  FileOutput, 
  FileQuestion, 
  FileSpreadsheet, 
  Calculator, 
  FileText, 
  Search, 
  Sparkles, 
  Settings as SettingsIcon, 
  Loader2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { normalizeLinkedInUrl } from "@/utils/profileExtractors/urlNormalizer";
import { toast } from "@/hooks/use-toast";
import { extractProfileDataFromSearchResults } from "@/utils/profileExtractors/extractProfileDataFromSearchResults";
import { isLikelyJobTitle, separateProfileComponents } from "@/utils/profileExtractors/separateProfileComponents";
import { ErrorBoundary } from "react-error-boundary";
import { cleanupCompanyName, extractCompanyName } from "@/utils/companyUtils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider";
import { Settings } from "@/components/Settings";

interface LinkRow {
  id: string;
  url: string;
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  score: number;
  metadata?: {
    matchedRequirements?: string[];
    unmatchedRequirements?: string[];
    snippet?: string;
    categoriesInSearch?: {
      location: boolean;
      title: boolean;
      industry: boolean;
    };
  };
}

const cleanupJobTitle = (title: string): string => {
  if (!title) return '';
  
  // Basic cleanup
  let cleaned = title
    .replace(/\./g, '')  // Ta bort punkter
    .trim();
  
  // Om det är för kort, avvisa
  if (cleaned.length <= 2) return '';
  
  // Handle unbalanced parentheses - first remove opening parenthesis without closing one
  cleaned = cleaned.replace(/\(\s*$/, '').trim();
  
  // Remove all parentheses with content - especially problematic ones with "And"
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  
  // Additional check for any remaining unmatched parentheses
  cleaned = cleaned.replace(/\(/g, '').replace(/\)/g, '').trim();
  
  // Remove leading "And" at the beginning of the title
  cleaned = cleaned.replace(/^[Aa]nd\s+/, '').trim();
  
  // Detect and remove education-related sections
  if (/\b(?:utbildning|education|studies|studied at)\b/i.test(cleaned)) {
    // If we find education keyword, split and take only the part before it
    const parts = cleaned.split(/\b(?:utbildning|education|studies|studied at)\b/i);
    if (parts.length > 1) {
      cleaned = parts[0].trim();
    }
  }
  
  // Detect and remove location sections with multiple formats
  // Common pattern: "Title, Stockholm, Sverige"
  if (/,\s*(?:stockholm|göteborg|malmö|uppsala|brighton|london)/i.test(cleaned)) {
    const parts = cleaned.split(/,\s*(?:stockholm|göteborg|malmö|uppsala|brighton|london)/i);
    if (parts.length > 1) {
      cleaned = parts[0].trim();
    }
  }
  
  // Detect and handle time periods like "11 Months"
  if (/\b\d+\s+(?:month|months|år|years|year)\b/i.test(cleaned)) {
    const parts = cleaned.split(/\b\d+\s+(?:month|months|år|years|year)\b/i);
    if (parts.length > 1) {
      // If time period is at the beginning, take what comes after
      if (parts[0].trim() === '') {
        cleaned = parts[1].trim();
      } else {
        // Otherwise take what comes before
        cleaned = parts[0].trim();
      }
    }
  }
  
  // Direct fixes - these should be checked early for exact matches
  const directTitleFixes: Record<string, string> = {
    'Senior Portfolio Representative (': 'Senior Portfolio Representative',
    'Senior Portfolio Representative ( And': 'Senior Portfolio Representative',
    'Senior Portfolio Representative (And': 'Senior Portfolio Representative',
    'Senior Portfolio Representative': 'Senior Portfolio Representative'
  };
  
  // Apply direct fixes if they match exactly
  for (const [pattern, fix] of Object.entries(directTitleFixes)) {
    if (cleaned === pattern) {
      return fix; // Return early for these specific cases
    }
  }
  
  // Detect and remove location sections that start with a city or have comma-separated location format
  if (/(?:göteborg|stockholm|malmö|uppsala|västra götaland|sverige|sweden)/i.test(cleaned)) {
    // If we find a Swedish location, see if it's part of a location pattern
    const locationPattern = /(?:\s|,)(?:göteborg|stockholm|malmö|uppsala)(?:,\s*(?:västra götaland|stockholms län|skåne|uppsala län))?(?:,\s*(?:sweden|sverige))?/i;
    if (locationPattern.test(cleaned)) {
      // Split by the location pattern and take only the part before it
      cleaned = cleaned.replace(locationPattern, '').trim();
    }
  }
  
  // Reject patterns som tydligt inte är jobbtitlar
  const rejectPatterns = [
    // Tidsperioder (t.ex. "2019 - Present", "11 Months.")
    /^\d{1,4}\s*[-–]\s*(?:present|now|\d{4})$/i,
    /^\d+\s+(?:month|months|år|years|year)s?\.?$/i,
    /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s|\b)/i,
    /^(?:january|february|march|april|may|june|july|august|september|october|november|december)(?:\s|\b)/i,
    
    // Datumformat
    /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i,
    
    // Stad-land-format
    /^[A-Z][a-z]+,\s+[A-Z][a-z]+$/,
    /\b[A-Z][a-z]+,\s+(?:United Kingdom|UK|Sweden|Sverige|Norge|Denmark|Finland)\b/i,
    /\b(?:göteborg|stockholm|malmö),\s+(?:västra götaland|stockholms län|skåne)/i,
    
    // Address or URL format
    /^https?:\/\//i,
    
    // Common LinkedIn phrases that aren't job titles
    /see who you know/i,
    /^\d+ others like this$/i,
    /^\d+ connections?$/i,
    /^about$/i,
    
    // Geographical regions that aren't job titles
    /^(?:emea|europe|nordic|dach|region|nordics|area)$/i,
    /\beurope\b/i,
    /north(?:ern)?\s+europe/i,
    /south(?:ern)?\s+europe/i,
    /west(?:ern)?\s+europe/i,
    /east(?:ern)?\s+europe/i,
    /region\s+(?:north|south|east|west)/i,
    
    // Non-title prefixes
    /^an\s+accomplished/i,
    /^accomplished/i,
    /^successful/i,
    /^experienced/i,
    /^professional/i,
    /^seasoned/i,
    /^rooted/i,
    /^and\s+/i,
    
    // Month names as standalone words
    /^jan$/i, /^feb$/i, /^mar$/i, /^apr$/i, /^may$/i, /^jun$/i,
    /^jul$/i, /^aug$/i, /^sep$/i, /^oct$/i, /^nov$/i, /^dec$/i,
    
    // Location specific
    /sweden/i,
    /sverige/i,
    /stockholm/i,
    /gothenburg/i,
    /malmö/i,
    /brighton/i,
    /united kingdom/i,
    /göteborg/i,
    /västra götaland/i,
    
    // Too generic
    /^(?:the|this|that|and|when|what|who|how)$/i,
    /^(?:am|is|are|was|were)$/i,
    
    // Education institutions
    /\buniversitet\b/i,
    /\buniversity\b/i,
    /\bcollege\b/i,
    /\bschool\b/i,
    /\bhögskola\b/i,
    /\butbildning\b/i,
    /uppsala universitet/i,
    /stockholm university/i
  ];
  
  // Kontrollera mot reject patterns
  for (const pattern of rejectPatterns) {
    if (pattern.test(cleaned)) {
      // If it's a location pattern, try to save the part before it
      if (pattern.source.includes('United Kingdom') || 
          pattern.source.includes('Sweden') || 
          pattern.source.includes('Sverige') || 
          pattern.source.includes('brighton') ||
          pattern.source.includes('göteborg') ||
          pattern.source.includes('västra götaland') ||
          pattern.source.includes('europe') ||
          /,[^,]+$/.test(cleaned)) {
        // Split by comma and take first part
        const parts = cleaned.split(',');
        if (parts.length > 1 && parts[0].trim().length > 2) {
          cleaned = parts[0].trim();
          continue; // Skip the return ''; and continue processing
        }
      }
      return '';
    }
  }
  
  // Kontrollera om det bara är en plats
  const locations = [...verifiedLocations.cities, ...verifiedLocations.countries];
  for (const loc of locations) {
    if (cleaned.toLowerCase() === loc.toLowerCase()) {
      return '';
    }
  }
  
  // Kontrollera om det bara är ett företag
  for (const company of verifiedCompanies) {
    if (cleaned.toLowerCase() === company.toLowerCase()) {
      return '';
    }
  }
  
  // Filter out company names with geographical indicators
  if (/\b(?:import|export)\s+(?:europe|nordic|sweden|españa|germany)\b/i.test(cleaned)) {
    const parts = cleaned.split(/\s+(?:europe|nordic|sweden|españa|germany)\b/i);
    if (parts.length > 0) {
      cleaned = parts[0].trim();
    }
  }
  
  // Dela upp titeln om den innehåller separatorer
  const parts = cleaned.split(/\s*[\|\/–—@:,·]\s*/);
  
  // Välj den del som mest troligt är en jobtitel
  if (parts.length > 1) {
    // Filtrera bort delar som innehåller platsnamn
    const filteredParts = parts.filter(part => {
      const partLower = part.toLowerCase();
      // Kolla om delen innehåller en känd plats
      return !locations.some(loc => partLower.includes(loc.toLowerCase()));
    });
    
    if (filteredParts.length > 0) {
      // Filtrera bort delar som inte är troliga jobbtitlar
      const titleCandidates = filteredParts.filter(part => isLikelyJobTitle(part));
      if (titleCandidates.length > 0) {
        cleaned = titleCandidates[0];
      } else {
        cleaned = filteredParts[0];
      }
    }
  }
  
  // Ta bort icke-titel ord och fraser
  const nonTitleTerms = [
    'linkedin', 
    'profile', 
    'cv', 
    'resume', 
    'page',
    'professional', 
    'over',
    'and',
    'an accomplished',
    'accomplished',
    'successful',
    'experienced',
    'seasoned',
    'qualified',
    'certified',
    'rooted', 
    'emea', 
    'europe', 
    'nordics', 
    'nordic',
    'dach',
    'northern',
    'southern',
    'eastern',
    'western',
    'north',
    'south',
    'east',
    'west',
    'region',
    'sweden',
    'sverige',
    'stockholm',
    'brighton',
    'united kingdom',
    'area',
    'utbildning',
    'universitet',
    'göteborg',
    'västra götaland',
    'easy',
    'import',
    'export',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  
  // Ta bort utbildningsmässiga termer
  const educationTerms = [
    'phd', 'ph.d', 'doctor', 'doctorate', 
    'msc', 'master', 'masters', 'ma', 'mba',
    'bsc', 'bachelor', 'bachelors', 'ba',
    'university', 'college', 'school',
    'student', 'graduate', 'professor', 'lecturer',
    'högskolan', 'universitet', 'utbildning',
    'education', 'studies', 'studied', 'kurser',
    'uppsala universitet', 'stockholms universitet'
  ];
  
  // Filtrera bort icke-titel och utbildningstermer
  let words = cleaned.split(/\s+/);
  words = words.filter(word => {
    const wordLower = word.toLowerCase();
    return !nonTitleTerms.some(term => wordLower === term.toLowerCase()) &&
           !educationTerms.some(term => wordLower === term.toLowerCase() || term.toLowerCase().includes(wordLower));
  });
  
  cleaned = words.join(' ');
  
  // Direct fixes for specific patterns
  const directFixes: Record<string, string> = {
    'Chief Executive Officer CEO': 'Chief Executive Officer',
    'Chief Financial Officer CFO': 'Chief Financial Officer',
    'Chief Operating Officer COO': 'Chief Operating Officer',
    'Chief Technology Officer CTO': 'Chief Technology Officer',
    'Vice President VP': 'Vice President',
    'Senior Project Manager': 'Senior Project Manager',
    'Senior Solutions Architect': 'Senior Solutions Architect',
    'Sr Software Engineer': 'Senior Software Engineer',
    'Sr Software Developer': 'Senior Software Developer',
    'Sr Project Manager': 'Senior Project Manager',
    'Senior Vice President SVP': 'Senior Vice President',
    'Solutions Consultant · Over': 'Solutions Consultant',
    'Senior Director of': 'Senior Director',
    'Marketing Manager': 'Marketing Manager',
    'And Marketing Manager': 'Marketing Manager', 
    'Senior Portfolio Representative And': 'Senior Portfolio Representative',
    'Senior Portfolio Representative ( And': 'Senior Portfolio Representative',
    'Senior Portfolio Representative (And': 'Senior Portfolio Representative',
    'Senior Portfolio Representative (': 'Senior Portfolio Representative',
    'Easy Import Europe': 'Import'
  };
  
  // Apply direct fixes if they match
  for (const [pattern, fix] of Object.entries(directFixes)) {
    if (cleaned.toLowerCase() === pattern.toLowerCase()) {
      cleaned = fix;
      break;
    }
  }
  
  // Remove geographical regions that might still be part of the cleaned title
  cleaned = cleaned.replace(/\b(?:emea|europe|nordic|nordics|dach|northern europe|southern europe)\b/i, '').trim();
  cleaned = cleaned.replace(/\bnorth(?:ern)?\s+europe\b/i, '').trim();
  cleaned = cleaned.replace(/\bsouth(?:ern)?\s+europe\b/i, '').trim();
  cleaned = cleaned.replace(/\beast(?:ern)?\s+europe\b/i, '').trim();
  cleaned = cleaned.replace(/\bwest(?:ern)?\s+europe\b/i, '').trim();
  cleaned = cleaned.replace(/\bsweden\b/i, '').trim();
  cleaned = cleaned.replace(/\bsverige\b/i, '').trim();
  cleaned = cleaned.replace(/\bstockholm\b/i, '').trim();
  cleaned = cleaned.replace(/\bbrightono\b/i, '').trim();
  cleaned = cleaned.replace(/\bunited kingdom\b/i, '').trim();
  cleaned = cleaned.replace(/\bgöteborg\b/i, '').trim();
  cleaned = cleaned.replace(/\bvästra götaland\b/i, '').trim();
  
  // Additional check for education-related content
  cleaned = cleaned.replace(/\b(?:university|college|school|utbildning|universitet)\b/i, '').trim();
  
  // Check for month abbreviations
  const monthAbbreviations = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (const month of monthAbbreviations) {
    cleaned = cleaned.replace(new RegExp(`\\b${month}\\b`, 'i'), '').trim();
  }
  
  // Remove standalone "And" that might remain
  cleaned = cleaned.replace(/\b[Aa]nd\b/, '').trim();
  
  // Remove parentheses with "And" that might remain
  cleaned = cleaned.replace(/\(\s*[Aa]nd\s*\)/, '').trim();
  
  // One final cleanup of any remaining parentheses
  cleaned = cleaned.replace(/\(/g, '').replace(/\)/g, '').trim();
  
  // Avvisa om titeln nu har blivit för kort eller för generisk
  if (cleaned.length <= 2) return '';
  
  // Check again for Easy Import Europe pattern
  if (/\beasy\b.*\bimport\b.*\beurope\b/i.test(cleaned)) {
    return '';
  }
  
  // Incomplete/generic titles without context
  const incompleteGenericTitles = [
    'head of', 'manager of', 'director of', 'vice president of',
    'chief', 'head', 'manager', 'director', 'vp', 'coordinator',
    'officer', 'specialist', 'consultant', 'executive', 'partner',
    'associate', 'advisor', 'adviser', 'analyst',
    'senior', 'junior'
  ];
  
  if (incompleteGenericTitles.includes(cleaned.toLowerCase())) {
    return '';
  }
  
  // Final check to ensure it's not just a title ending with a preposition
  // This catches incomplete titles like "Senior Director of"
  if (/^(?:head|manager|director|senior director|lead|senior|chief|vp|vice president|president)\s+(?:of|for|in|at|and)$/i.test(cleaned) ||
      /\s(?:of|for|in|at|and)$/i.test(cleaned)) {
    
    // Try to fix by removing the final preposition
    const fixedTitle = cleaned.replace(/\s(?:of|for|in|at|and)$/i, '').trim();
    if (fixedTitle.length > 3 && !incompleteGenericTitles.includes(fixedTitle.toLowerCase())) {
      return fixedTitle;
    }
    return '';
  }
  
  return cleaned;
};

// Lista över verifierade företagsnamn - endast riktiga företag
const verifiedCompanies = [
  // Tech Giants
  'Microsoft', 'Google', 'Amazon', 'Apple', 'Meta', 'Facebook', 'IBM', 'Oracle', 'Dell', 'HP', 'Cisco',
  'Intel', 'AMD', 'NVIDIA', 'SAP', 'Salesforce', 'Adobe', 'Autodesk', 'Atlassian', 'Zoom', 'Slack',
  
  // Swedish Tech
  'Spotify', 'Klarna', 'Ericsson', 'Sinch', 'Tobii', 'iZettle', 'Mynewsdesk', 'Truecaller', 'Northvolt',
  'Voi', 'Funnel', 'Paradox Interactive', 'King', 'DICE', 'Mojang', 'Tink', 'Storytel', 'Magine',
  'Einride', 'Storykit', 'Pleo', 'Acast', 'Detectify', 'Epidemic Sound', 'Mentimeter', 'Instabox',
  
  // SaaS and Cloud
  'Amazon Web Services', 'Microsoft Azure', 'Google Cloud', 'Twilio', 'Zendesk', 'HubSpot', 'Shopify',
  'Square', 'Stripe', 'Box', 'Dropbox', 'Asana', 'Basecamp', 'Miro', 'Mailchimp', 'ServiceNow',
  'Workday', 'NetSuite', 'Anaplan', 'Coupa', 'DocuSign', 'Intercom', 'New Relic', 'Datadog', 'Okta',
  
  // Consulting
  'Accenture', 'McKinsey', 'Boston Consulting Group', 'Deloitte', 'PwC', 'EY', 'KPMG', 'Bain', 'Capgemini',
  'Cognizant', 'TCS', 'Infosys', 'Wipro', 'HCL', 'Thoughtworks', 'Slalom', 'EPAM', 'Gartner',
  
  // Swedish Enterprises and Services
  'Ikea', 'H&M', 'Volvo', 'Scania', 'ABB', 'Atlas Copco', 'Electrolux', 'Sandvik', 'SEB', 'Swedbank', 
  'Nordea', 'Handelsbanken', 'Telia', 'Tele2', 'TeliaSonera', 'Securitas', 'SKF', 'Vattenfall', 'SAS',
  
  // Others
  'Canon', 'Nestlé', 'Unilever', 'Procter & Gamble', 'Johnson & Johnson', 'Pfizer', 'Novartis', 'AstraZeneca',
  'Siemens', 'GE', 'Philips', 'Tesla', 'BMW', 'Mercedes-Benz', 'Toyota', 'Honda', 'Ford', 'GM', 'Volkswagen',
  
  // Tech Startups and Specific Companies from the data
  'Questback', 'ThingLink', 'iVi', 'Zaver', 'Setupad', 'Valeresverige', 'Ignyto', 'Hailey HR',
  'DigitalRestaurant', 'Findwise', 'OneLab', 'Absorb Software', 'Payhawk', 'Pipl', 'ZignSec',
  'Spectrum', 'Comintelli', 'ComplyLog', 'Route', 'Neurons', 'Netlify',
  'Jobylon', 'Ingrid', 'One Click Contractor', 'HandCloud', 'Multisoft', 'Bentley Systems',
  'Cetopo', 'Dixa', 'Weave', 'OpenText', 'Compass Investigations', 'Semantix', 'SPCE',
  'SDR Quality Group', 'Hotel Kung Carl', 'Origin Zero', 'Collibra', 'Prenax', 'Vendavo', 'Solute',
  'Securus Technologies', 'EZAIX', 'Kanari', 'Verified Global', 'Tungsten Automation', 
  'Capgemini', 'Sveriges Radio', 'Position Green', 'Vattenfall', 'EMC', 'Madison Square Garden Sports',
  'UNC Health', 'Camphouse', 'Premier', 'HandCloud'
];

// Specifika teknik- och systemtermer som inte är företag
const nonCompanyTerms = [
  'CRM', 'ERP', 'SQL', 'API', 'SaaS', 'PaaS', 'IaaS', 'IoT', 'AI', 'ML', 'DevOps', 'BI',
  'Agile', 'SCRUM', 'Kanban', 'SEO', 'SEM', 'SMM', 'PPC', 'UX', 'UI', 'HR', 'R&D', 'IT'
];

// Lista över verifierade städer och länder - används för strikt verifiering av platser
const verifiedLocations = {
  // Städer i Sverige
  cities: [
    'Stockholm', 'Göteborg', 'Gothenburg', 'Malmö', 'Uppsala', 'Linköping', 'Lund', 'Umeå', 
    'Västerås', 'Örebro', 'Helsingborg', 'Norrköping', 'Jönköping', 'Sundsvall', 'Gävle',
    'Borås', 'Södertälje', 'Eskilstuna', 'Karlstad', 'Halmstad', 'Växjö', 'Solna',
    
    // Nordiska städer
    'Copenhagen', 'Oslo', 'Helsinki', 'Reykjavik', 'Tampere', 'Aarhus', 'Bergen', 'Odense',
    'Aalborg', 'Trondheim', 'Turku', 'Espoo', 'Vantaa',
    
    // Europeiska storstäder
    'London', 'Paris', 'Berlin', 'Amsterdam', 'Brussels', 'Madrid', 'Rome', 'Vienna',
    'Munich', 'Zurich', 'Dublin', 'Warsaw', 'Prague', 'Barcelona', 'Milan', 'Frankfurt',
    'Hamburg', 'Lisbon', 'Athens', 'Budapest', 'Vienna', 'Copenhagen',
    
    // Amerikanska storstäder
    'New York', 'San Francisco', 'Seattle', 'Boston', 'Austin', 'Chicago', 'Los Angeles',
    'Toronto', 'Vancouver', 'Montreal', 'Atlanta', 'Miami', 'Dallas', 'Houston', 'Portland',
    'Washington DC', 'Philadelphia', 'San Diego', 'Denver', 'Phoenix', 'Nashville'
  ],
  
  // Länder och regioner
  countries: [
    'Sweden', 'Norge', 'Norway', 'Denmark', 'Danmark', 'Finland', 'Iceland', 'Island',
    'Germany', 'United Kingdom', 'UK', 'France', 'Italy', 'Spain', 'Netherlands', 
    'Belgium', 'Poland', 'Switzerland', 'Ireland', 'Austria', 'Portugal', 'Greece',
    'USA', 'United States', 'Canada', 'Japan', 'China', 'India', 'Australia',
    'Brasil', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'South Africa'
  ],
  
  // Regioner - accepteras men är lägre prioritet
  regions: [
    'EMEA', 'APAC', 'LATAM', 'Nordic', 'Nordics', 'Europe', 'European Union', 'EU',
    'Scandinavia', 'North America', 'Latin America', 'Middle East', 'Asia', 'Africa',
    'Stockholm County', 'Skåne', 'Västra Götaland', 'Östergötland', 'Västerbotten',
    'Silicon Valley', 'Bay Area', 'New England', 'Greater London', 'Greater Manchester'
  ],
  
  // Vanliga termer som indikerar en plats men som inte själva är platser
  placePrefixes: ['Greater', 'Central', 'Metropolitan', 'East', 'West', 'North', 'South'],
  placeSuffixes: ['Area', 'Region', 'County', 'District', 'Metropolitan Area', 'Län', 'Kommune']
};

// Extraktorfunktioner för att få data från sökresultat
const extractNameFromUrl = (url: string, fallbackIndex?: number): string => {
  try {
    // Clean the URL and extract the username portion
    const cleanUrl = normalizeLinkedInUrl(url);
    const usernameMatch = cleanUrl.match(/linkedin\.com\/in\/([^\/]+)/);
    
    if (usernameMatch && usernameMatch[1]) {
      // Convert the username to a readable name
      const username = usernameMatch[1];
      
      // Remove language suffix if present (e.g., /en, /sv)
      const cleanUsername = username.replace(/\/[a-z]{2}$/, '');
      
      // Clean up URL encoding and special characters
      const nameFromUrl = cleanUsername
        .replace(/-/g, ' ')
        .replace(/%[0-9A-F]{2}/g, ' ')
        .replace(/[0-9]+$/, '')
        .trim();
      
      // Capitalize each word
      const capitalized = nameFromUrl.split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
      
      return capitalized;
    }
  } catch (error) {
    console.error("Error extracting name from URL:", error);
  }
  
  // Fallback if extraction fails
  return fallbackIndex !== undefined ? `Profile ${fallbackIndex + 1}` : '';
};

// Funktion för att extrahera jobbtitel från sökresultat
const extractJobTitle = (searchItem: any): string => {
  if (!searchItem) return '';
  
  // Första försöket: kolla hela titeln
  if (searchItem.title) {
    // LinkedIn-titlar innehåller ofta jobtitel | Företag | LinkedIn
    const parts = searchItem.title.split(/\s*[|\-–]\s*/);
    if (parts.length > 1) {
      const potentialTitle = parts[0].trim();
      if (isLikelyJobTitle(potentialTitle)) {
        return potentialTitle;
      }
    }
  }
  
  // Andra försöket: kolla i beskrivningen/snippet
  if (searchItem.snippet) {
    // Använd separateProfileComponents för att plocka ut jobtitel om möjligt
    const components = separateProfileComponents(searchItem.snippet);
    if (components && components.title) {
      return components.title;
    }
    
    // Leta efter vanliga titelfraser i beskrivningen
    const commonPatterns = [
      /(?:is|as|works as)\s+(?:a|an|the)\s+([^,.]+)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:at|in|for|with)/i
    ];
    
    for (const pattern of commonPatterns) {
      const match = searchItem.snippet.match(pattern);
      if (match && match[1]) {
        if (isLikelyJobTitle(match[1])) {
          return match[1];
        }
      }
    }
  }
  
  return '';
};

// Funktion för att extrahera location från sökresultat
const extractLocation = (searchItem: any): string => {
  if (!searchItem) return '';
  
  // Samla potentiella locations från olika källor
  const potentialLocations: string[] = [];
  
  // 1. Kolla efter city, country format (föredragen format)
  if (searchItem.snippet) {
    // Leta efter "City, Country" formatet som är mest pålitligt
    const cityCountryPattern = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/ig;
    let match;
    while ((match = cityCountryPattern.exec(searchItem.snippet)) !== null) {
      if (match[1] && match[1].trim().length > 3) {
        potentialLocations.push(match[1].trim());
      }
    }
    
    // Vanliga location-mönster i LinkedIn snippets
    const locationPatterns = [
      // "Location: Stockholm, Sweden" / "Located in Stockholm, Sweden"
      /(?:locat(?:ed|ion)(?:\s+in|\s*:\s*))([A-Za-z\s,]+?)(?:[\.\s]|$)/i,
      
      // "based in Stockholm"
      /(?:based|working|living)\s+in\s+([A-Z][a-zA-Z\s,]+?)(?:[\.\s]|$)/i,
      
      // Specific to LinkedIn: "Location Stockholm, Sweden"
      /\bLocation\s+([A-Za-z\s,]+?)(?:[\.\s]|$)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = searchItem.snippet.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        if (location.length > 2) {
          potentialLocations.push(location);
        }
      }
    }
    
    // 2. Kolla efter specifika städer och länder i snippets
    const words = searchItem.snippet.split(/[\s,\.\(\)]+/);
    for (const word of words) {
      const cleanWord = word.trim();
      // Kontrollera om ordet matchar en stad eller ett land i våra listor
      if (cleanWord.length > 2 && /^[A-Z]/.test(cleanWord)) {
        if (verifiedLocations.cities.some(city => 
          city.toLowerCase() === cleanWord.toLowerCase()) ||
          verifiedLocations.countries.some(country => 
            country.toLowerCase() === cleanWord.toLowerCase())
        ) {
          potentialLocations.push(cleanWord);
        }
      }
    }
  }
  
  // 3. Kolla i title efter location
  if (searchItem.title) {
    // "City, Country" i title är ofta pålitligt
    const cityCountryMatch = searchItem.title.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/);
    if (cityCountryMatch && cityCountryMatch[1]) {
      potentialLocations.push(cityCountryMatch[1].trim());
    }
    
    // Kolla om title slutar med en location
    const titleParts = searchItem.title.split(/\s*[|\-–—]\s*/);
    if (titleParts.length > 2) {
      const lastPart = titleParts[titleParts.length - 1].replace(/\s+LinkedIn$/, '').trim();
      
      // Verifiera mot våra listor
      if (verifiedLocations.cities.some(city => 
          city.toLowerCase() === lastPart.toLowerCase()) ||
          verifiedLocations.countries.some(country => 
            country.toLowerCase() === lastPart.toLowerCase())
      ) {
        potentialLocations.push(lastPart);
      }
    }
  }
  
  // 4. Om vi har potentiella locations, välj den bästa genom vår cleanup-funktion
  if (potentialLocations.length > 0) {
    // Prioritera "City, Country" format
    const locationWithComma = potentialLocations.find(loc => loc.includes(','));
    if (locationWithComma) {
      const cleaned = cleanupLocation(locationWithComma);
      if (cleaned) return cleaned;
    }
    
    // Testa andra kandidater
    for (const location of potentialLocations) {
      const cleaned = cleanupLocation(location);
      if (cleaned) return cleaned;
    }
  }
  
  return '';
};

// Funktion för att rensa och standardisera location - endast städer och länder är tillåtna
const cleanupLocation = (location: string): string => {
  if (!location) return '';
  
  // Ta bort "area", "region", andra suffix och prefix
  let cleaned = location.trim();
  
  // Ta bort placeSuffixes
  for (const suffix of verifiedLocations.placeSuffixes) {
    const suffixPattern = new RegExp(`\\s+${suffix}$`, 'i');
    cleaned = cleaned.replace(suffixPattern, '');
  }
  
  // Ta bort placePrefixes
  for (const prefix of verifiedLocations.placePrefixes) {
    const prefixPattern = new RegExp(`^${prefix}\\s+`, 'i');
    cleaned = cleaned.replace(prefixPattern, '');
  }
  
  cleaned = cleaned.trim();
  
  // Hantera "City, Country" format - preferred
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(part => part.trim());
    if (parts.length === 2) {
      const city = parts[0];
      const country = parts[1];
      
      // Validera staden
      const validCity = verifiedLocations.cities.find(
        vc => vc.toLowerCase() === city.toLowerCase() || 
             city.toLowerCase().includes(vc.toLowerCase())
      );
      
      // Validera landet
      const validCountry = verifiedLocations.countries.find(
        vc => vc.toLowerCase() === country.toLowerCase() ||
             country.toLowerCase().includes(vc.toLowerCase())
      );
      
      // Om både stad och land är valida, standardisera formatet
      if (validCity && validCountry) {
        return `${validCity}, ${validCountry}`;
      }
      
      // Om bara staden är valid, kolla om vi kan lägga till land
      if (validCity) {
        // För svenska städer, lägg till Sweden
        if (['Stockholm', 'Gothenburg', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping', 
             'Lund', 'Umeå', 'Västerås', 'Örebro', 'Helsingborg', 'Norrköping', 
             'Jönköping', 'Sundsvall', 'Gävle', 'Borås', 'Södertälje', 'Eskilstuna', 
             'Karlstad', 'Halmstad', 'Växjö'].includes(validCity)) {
          return `${validCity}, Sweden`;
        }
      }
      
      // Om bara landet är valid, använd det
      if (validCountry) {
        return validCountry;
      }
    }
  }
  
  // Hantera known cities (lägg till landet)
  for (const city of verifiedLocations.cities) {
    if (cleaned.toLowerCase() === city.toLowerCase()) {
      // För svenska städer, lägg till Sweden
      if (['Stockholm', 'Gothenburg', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping', 
           'Lund', 'Umeå', 'Västerås', 'Örebro', 'Helsingborg', 'Norrköping', 
           'Jönköping', 'Sundsvall', 'Gävle', 'Borås', 'Södertälje', 'Eskilstuna', 
           'Karlstad', 'Halmstad', 'Växjö'].includes(city)) {
        return `${city}, Sweden`;
      }
      
      // För städer i andra länder, använd bara staden
      return city;
    }
  }
  
  // Hantera known countries
  for (const country of verifiedLocations.countries) {
    if (cleaned.toLowerCase() === country.toLowerCase()) {
      return country;
    }
  }
  
  // Hantera specialfall - Göteborg/Gothenburg
  if (/^g[öo]teborg$/i.test(cleaned)) {
    return 'Gothenburg, Sweden';
  }
  
  // Standardisera svenska städer
  if (/^stockholm$/i.test(cleaned)) return 'Stockholm, Sweden';
  if (/^malm[öo]$/i.test(cleaned)) return 'Malmö, Sweden';
  
  // Om vi inte kunde matcha en stad eller ett land, kolla regioner som sista utväg
  for (const region of verifiedLocations.regions) {
    if (cleaned.toLowerCase() === region.toLowerCase()) {
      return region;
    }
  }
  
  // Om vi inte kunde matcha någon valid plats, returnera tom sträng
  return '';
};

// Extra hjälpfunktioner för att extrahera titlar och företag
const tryExtractMissingTitle = (url: string, searchResultItems: any[]): string => {
  // Hitta matchande sökresultat för denna URL
  const matchingItem = searchResultItems.find(item => {
    const itemUrl = item.link || item.url || '';
    return normalizeLinkedInUrl(itemUrl) === normalizeLinkedInUrl(url);
  });
  
  if (matchingItem) {
    return extractJobTitle(matchingItem);
  }
  
  return '';
};

const tryExtractMissingCompany = (url: string, searchResultItems: any[]): string => {
  console.log(`Trying to extract company for URL: ${url}`);
  
  // Hitta matchande sökresultat för denna URL
  const matchingItem = searchResultItems.find(item => {
    const itemUrl = item.link || item.url || '';
    return normalizeLinkedInUrl(itemUrl) === normalizeLinkedInUrl(url);
  });
  
  if (!matchingItem) {
    console.log(`No matching search item found for URL: ${url}`);
    return '';
  }
  
  console.log(`Found matching search item: ${matchingItem.title}`);
  
  // Vanliga platser att filtrera bort - används för att undvika att platser visas som företag
  const commonLocations = [
    'stockholm', 'göteborg', 'malmö', 'sweden', 'sverige', 'remote', 'hybrid', 
    'scandinavia', 'nordics', 'europe', 'europa', 'copenhagen', 'oslo', 'denmark',
    'denmark', 'finland', 'nordic', 'scandinavian', 'helsingfors', 'finland',
    'remote work', 'distansarbete', 'distans', 'hemarbete', 'lund', 'uppsala', 
    'örebro', 'jönköping', 'linköping', 'umeå', 'västeras', 'norrköping', 'helsingborg',
    'norway', 'norge', 'norwegian', 'sweden', 'swedish', 'dansk', 'danish', 'finsk',
    'finnish', 'iceland', 'icelandic', 'island', 'isländsk', 'bergen', 'trondheim',
    'stavanger', 'aarhus', 'odense', 'tampere', 'turku', 'espoo', 'vantaa',
    'reykjavik', 'akureyri', 'north', 'south', 'east', 'west', 'central',
    'northern', 'southern', 'eastern', 'western', 'region', 'city', 'county',
    'länsstyrelsen', 'kommun', 'län', 'fylke', 'amt', 'maakunta', 'location'
  ];
  
  // Lista över utbildningsinstitutioner för att filtrera bort
  const educationKeywords = [
    'university', 'universitet', 'college', 'school', 'skola', 'academy', 
    'akademi', 'institute', 'högskola', 'gymnasium', 'education', 'school'
  ];
  
  // Kontrollera om AI redan har extraherat företagsnamn (matchingItem.company från OpenAI API)
  if (matchingItem.company) {
    const companyName = matchingItem.company.trim();
    
    // Kontrollera att det extraherade företagsnamnet inte är en plats
    const isLocation = commonLocations.some(location => 
      companyName.toLowerCase().includes(location)
    );
    
    // Kontrollera att det inte är en utbildningsinstitution
    const isEducation = educationKeywords.some(edu => 
      companyName.toLowerCase().includes(edu)
    );
    
    // Returnera det AI-extraherade företagsnamnet om det verkar giltigt
    if (companyName && companyName.length > 2 && !isLocation && !isEducation) {
      console.log(`Using AI-extracted company name: "${companyName}"`);
      return companyName;
    }
    
    console.log(`AI-extracted company name "${companyName}" rejected (location: ${isLocation}, education: ${isEducation})`);
  }
  
  // Fallback till den vanliga extraktionsmetoden med extractCompanyName
  console.log("Falling back to regular company name extraction");
  if (typeof extractCompanyName === 'function') {
    const extractedCompany = extractCompanyName(matchingItem);
    
    // Verifiera även detta mot platser och utbildning
    if (extractedCompany) {
      const isLocation = commonLocations.some(location => 
        extractedCompany.toLowerCase().includes(location)
      );
      
      const isEducation = educationKeywords.some(edu => 
        extractedCompany.toLowerCase().includes(edu)
      );
      
      if (!isLocation && !isEducation) {
        console.log(`Using extractCompanyName result: "${extractedCompany}"`);
        return extractedCompany;
      } else {
        console.log(`extractCompanyName result "${extractedCompany}" rejected (location: ${isLocation}, education: ${isEducation})`);
      }
    }
  }
  
  console.log('Failed to extract company name');
  return '';
};

const tryExtractMissingLocation = (url: string, searchResultItems: any[]): string => {
  // Hitta matchande sökresultat för denna URL
  const matchingItem = searchResultItems.find(item => {
    const itemUrl = item.link || item.url || '';
    return normalizeLinkedInUrl(itemUrl) === normalizeLinkedInUrl(url);
  });
  
  if (matchingItem) {
    return extractLocation(matchingItem);
  }
  
  return '';
};

// Funktion för att avgöra om ett företag är SaaS-företag baserat på namn och data
const isSaaSCompany = (companyName: string): boolean => {
  if (!companyName) return false;
  
  const companyLower = companyName.toLowerCase();
  
  // Lista över kända SaaS-företag
  const knownSaaSCompanies = [
    'salesforce', 'hubspot', 'zendesk', 'servicenow', 'workday', 'netsuite',
    'shopify', 'slack', 'zoom', 'twilio', 'atlassian', 'stripe', 'square',
    'mailchimp', 'dropbox', 'docusign', 'asana', 'airtable', 'monday',
    'intercom', 'freshworks', 'clickup', 'notion', 'segment', 'figma',
    'amplitude', 'miro', 'zapier', 'canva', 'datadog', 'okta', 'box',
    'gong', 'outreach', 'salesloft', 'gainsight', 'pendo', 'zuora', 'chargify',
    'chargebee', 'recurly', 'paddle', 'fastspring', 'revenuecat', 'pipe',
    'klaviyo', 'braze', 'iterable', 'omnisend', 'sendgrid', 'postmark',
    'customer.io', 'drift', 'qualified', 'clearbit', 'zoominfo', 'apollo',
    'contentful', 'sanity', 'prismic', 'strapi', 'netlifycms', 'contentstack',
    'optimizely', 'mixpanel', 'fullstory', 'hotjar', 'logrocket', 'heap',
    'posthog', 'microsoft dynamics', 'netvisor', 'visma', 'sage', 'xero',
    'quickbooks', 'fortnox', 'zoho', 'oracle netsuite', 'exact', 'mamut', 
    'briobox', 'upsales', 'lime', 'lundalogik', 'superoffice', 'pipedrive',
    'paligo', 'teamtailor', 'oneflow', 'scrive', 'planhat',
    // Svenska SaaS-företag
    'lime technologies', 'fortnox', 'xenit', 'upsales', 'easypark', 'apsis',
    'quickchannel', 'signicat', 'teamtailor', 'giosg', 'oneflow', 'infobaleen',
    'sirona', 'litium', 'billogram', 'planhat', 'albacross', 'voyado', 'funnel',
    'nordcloud', 'snowfall', 'zimpler', 'briqpay', 'mentimeter', 'fieldly',
    'dooer', 'billecta', 'formulate', 'normative', 'storykit', 'modulai', 
    'sparta', 'taiga', 'digpro', 'boardeaser', 'upsales', 'learnifier', 'leeroy',
    'cenito', 'trippus', 'easit', 'companyexpense', 'telavox', 'qbtech', 'kivra',
    'compilator', 'timezynk', 'schoolsoft', 'learnware', 'hogia', 'pagero', 
    'tietoevry', 'visma', 'microsoft', 'oracle', 'google', 'amazon', 'adobe',
    'elastic', 'gitlab', 'github', 'hashicorp', 'new relic', 'splunk', 'pagerduty',
    'cloudflare', 'fastly', 'servicenow', 'palantir', 'snowflake', 'databricks',
    'sumo logic', 'alteryx', 'talend', 'informatica', 'microstrategy', 'tableau',
    'power bi', 'qlik', 'domo', 'looker', 'sap', 'ibm', 'cisco', 'dell', 'vmware',
    'netapp', 'nutanix', 'pure storage', 'commvault', 'veeam', 'carbonite',
    'backblaze', 'dropbox', 'box', 'rackspace', 'digital ocean', 'linode',
    'hubspot', 'marketo', 'pardot', 'mailchimp', 'constant contact', 'campaign monitor',
    'sendgrid', 'twilio', 'vonage', 'ringcentral', 'zendesk', 'salesforce',
    'workday', 'peoplesoft', 'kronos', 'adp', 'ceridian', 'bamboohr', 'docusign',
    'formstack', 'trello', 'asana', 'monday.com', 'wrike', 'smartsheet', 'jira',
    'clickup', 'basecamp', 'podio', 'paypal', 'stripe', 'braintree', 'cybersource',
    'adyen', 'square', 'shopify', 'woocommerce', 'magento', 'bigcommerce',
    'freshbooks', 'quickbooks', 'xero', 'sage', 'netsuite', 'zuora', 'recurly',
    'chargify', 'chargebee', 'paddle', 'fastspring', 'onebill', 'aria systems',
    'gotransverse', 'zoho', 'odoo',
    // Cybersecurity companies
    'crowdstrike', 'palo alto networks', 'fortinet', 'checkpoint', 'symantec',
    'mcafee', 'trend micro', 'sophos', 'kaspersky', 'cyberark', 'rapid7', 'tenable',
    'darktrace', 'carbon black', 'fireeye', 'qualys', 'f-secure', 'avast', 'avg',
    'bitdefender', 'eset', 'imperva', 'forcepoint', 'proofpoint', 'mimecast',
    'zscaler', 'sentinelone', 'cylance', 'varonis', 'netskope', 'illumio', 
    'armis', 'tanium', 'cybereason', 'recorded future', 'securityscorecard',
    'radware', 'vectra', 'barracuda', 'lastpass', '1password', 'bitwarden',
    'okta', 'ping identity', 'onelogin', 'duo security', 'auth0', 'thales', 'forgerock',
    'beyond identity', 'dashlane', 'keeper', 'bugcrowd', 'hackerone', 'synack',
    'kenna security', 'corelight', 'lacework', 'wiz', 'snyk', 'contrast security',
    'abnormal security', 'exabeam', 'arctic wolf', 'secureworks', 'lookout',
    'veracode', 'white hat security', 'coalfire', 'mandiant', 'trustwave', 'ncc group',
    'securonix', 'sift', 'auth0', 'sailpoint', 'saviynt', 'secureauth', 'beyondtrust',
    'dragos', 'claroty', 'attivo networks', 'morphisec', 'threatquotient', 'anomali',
    'digital guardian', 'appgate', 'tufin', 'forescout', 'appsealing', 'guardsquare',
    'wallarm', 'signal sciences', 'fastly', 'akamai', 'cloudflare', 'f5 networks',
    'cisco', 'juniper networks', 'forcepoint', 'trendmicro', 'checkpoint', 'watchguard',
    'sonicwall', 'netgear', 'citrix', 'pulse secure', 'vmware', 'ibm security',
    'microsoft security', 'google security', 'aws security', 'oracle security',
    'splunk', 'sumo logic', 'logrhythm', 'alienvault', 'solarwinds', 'manageengine',
    'eset', 'rsanetwitness', 'rsa security', 'ibm qradar', 'ibm security', 'symantec'
  ];
  
  // Direkt kontroll mot kända SaaS-företag
  if (knownSaaSCompanies.some(saasCompany => companyLower.includes(saasCompany))) {
    return true;
  }
  
  // SaaS-indikatorer i företagsnamn
  const saasNameIndicators = [
    'tech', 'software', 'cloud', 'digital', 'solutions', 'systems', 'platform',
    'data', 'app', 'apps', 'web', 'online', 'cyber', 'net', 'saas', 'technologies',
    'analytics', 'ai', 'ml', 'automation', 'service', 'it service', 'computing',
    'information technology', 'crm', 'erp', 'api', 'iaas', 'paas', 'daas',
    'cybersecurity', 'security', 'secure', 'protection', 'defend', 'defense',
    'firewall', 'antivirus', 'anti-virus', 'encryption', 'vpn', 'network security',
    'endpoint security', 'threat', 'vulnerability', 'penetration', 'pentest',
    'password', 'authentication', 'identity', 'access management', 'iam',
    'compliance', 'soc', 'security operations', 'monitoring', 'detection',
    'response', 'incident', 'forensic', 'risk', 'governance', 'siem'
  ];
  
  // Kolla om företagsnamnet innehåller SaaS-indikatorer
  if (saasNameIndicators.some(indicator => companyLower.includes(indicator))) {
    return true;
  }
  
  // Företagsnamn med SaaS-indikator suffix
  const saasSuffixes = [
    'soft', 'sys', 'tech', 'cloud', 'ware', 'data', 'logic', 'code', 'app',
    'apps', 'labs', 'works', 'solutions', 'technologies', 'systems', 'networks',
    'digital', 'analytics', 'intelligence', 'compute', 'bit', 'byte', 'hub',
    'forge', 'iq', 'hq', 'base', 'space', 'ware', 'point', 'ify'
  ];
  
  // Kontrollera om företagsnamnet slutar med någon av de listade indikatorerna
  const words = companyLower.split(/\s+/);
  if (words.length > 0) {
    const lastWord = words[words.length - 1];
    if (saasSuffixes.some(suffix => lastWord.endsWith(suffix))) {
      return true;
    }
  }
  
  return false;
};

// Funktion för att kontrollera om en profil har en säljroll baserat på titel och snippet
const hasSalesRole = (title: string, snippet?: string): boolean => {
  if (!title && !snippet) return false;
  
  const titleLower = title.toLowerCase();
  const snippetLower = snippet ? snippet.toLowerCase() : '';
  
  const salesRoleTitles = [
    'sales', 'account executive', 'account manager', 'business development',
    'sales representative', 'försäljningschef', 'sales manager', 'sales director',
    'chief revenue officer', 'cro', 'sdr', 'bdr', 'sales development', 
    'business development representative', 'customer success', 'enterprise account',
    'account manager', 'key account', 'sales engineer', 'solutions consultant',
    'pre-sales', 'presales', 'sales specialist', 'sales consultant',
    'regional sales', 'territory manager', 'channel manager', 'channel sales',
    'partner manager', 'partnership', 'alliances', 'revenue operations',
    'revenue manager', 'sales operations', 'försäljare', 'säljare', 'sälj',
    'account director', 'client director', 'head of sales', 'commercial',
    'new business', 'business manager', 'client manager', 'customer acquisition',
    'growth manager', 'growth hacker', 'revenue growth', 'outbound', 'inbound',
    'inside sales', 'outside sales', 'field sales', 'client success',
    'customer manager', 'relationship manager', 'technical sales manager', 
    'technical sales representative', 'technical account manager', 'technical sales',
    'pre-sales engineer', 'presales engineer', 'sales engineer', 'solutions engineer',
    'technical pre-sales', 'technical presales', 'sales solutions', 'solutions sales',
    'technical solutions', 'sales engineering', 'technical specialist', 'solutions specialist',
    'application engineer', 'solution architect', 'presales consultant', 'pre-sales consultant'
  ];
  
  // Kontrollera titel mot säljroller
  if (salesRoleTitles.some(role => titleLower.includes(role))) {
    return true;
  }
  
  // Säljtermer att leta efter i snippet
  const salesTerms = [
    'quota', 'pipeline', 'prospecting', 'closing deals', 'revenue generation',
    'leads', 'hunters', 'farming', 'upselling', 'cross-selling', 'deal',
    'outbound', 'inbound', 'sales cycle', 'territory', 'customer acquisition',
    'revenue growth', 'sales target', 'sales goal', 'överträffat budget',
    'hit targets', 'meet quota', 'over achieved', 'sales funnel', 'leads',
    'prospects', 'cold calling', 'closing business', 'negotiation',
    'sales experience', 'account management', 'client relations',
    'stakeholder management', 'sales strategy', 'revenue forecast',
    'revenue responsibility', 'sales numbers', 'new contracts',
    'retained contracts', 'sales performance', 'top performer',
    'enterprise sales', 'b2b sales', 'client contracts'
  ];
  
  // Kontrollera snippet mot säljtermer
  if (snippetLower && salesTerms.some(term => snippetLower.includes(term))) {
    return true;
  }
  
  return false;
};

const calculateProfileScore = (profile: LinkRow, searchTerms: string[]): number => {
  if (!searchTerms || searchTerms.length === 0) return 0;
    
    let score = 0;
    const matchedRequirements: string[] = [];
    const unmatchedRequirements: string[] = [];
  
  // Track which categories have been matched
  const categoryMatches = {
    location: false,
    title: false,
    industry: false
  };
  
  // Track which categories were in the search terms
  const categoriesInSearch = {
    location: false,
    title: false,
    industry: false
  };

  // Get keyword arrays for detection
  const locationKeywords: string[] = [
    'stockholm', 'göteborg', 'malmö', 'sweden', 'sverige', 'remote', 'hybrid',
    'oslo', 'norway', 'norge', 'copenhagen', 'denmark', 'danmark', 'helsinki',
    'finland', 'iceland', 'reykjavik', 'nordic', 'scandinavia', 'europe', 'europa',
    'location', 'country', 'city', 'region', 'area'
  ];
  const titleKeywords: string[] = [
    'developer', 'engineer', 'manager', 'consultant', 'specialist', 'director', 'lead',
    'technical', 'sales', 'pre-sales', 'presales', 'account executive', 'account manager',
    'executive', 'officer', 'coordinator', 'administrator', 'analyst', 'architect',
    'head of', 'chief', 'ceo', 'cto', 'cio', 'cfo', 'vp', 'vice president', 'president'
  ];
  const industryKeywords: string[] = [
    'saas', 'software', 'tech', 'it', 'fintech', 'edtech', 'healthtech', 'telecom', 
    'e-commerce', 'retail', 'cybersecurity', 'security', 'cloud', 'ai', 'ml', 'iot',
    'data', 'analytics', 'blockchain', 'crypto', 'web3', 'mobile', 'digital', 'platform',
    'enterprise', 'b2b', 'b2c', 'consulting', 'professional services', 'healthcare',
    'finance', 'banking', 'insurance', 'automotive', 'manufacturing', 'energy', 'media',
    'entertainment', 'gaming', 'travel', 'hospitality', 'pharma', 'biotech', 'agriculture'
  ];

  // Convert profile data to lowercase for case-insensitive matching
    const profileData = {
      name: (profile.name || '').toLowerCase(),
      title: (profile.title || '').toLowerCase(),
      company: (profile.company || '').toLowerCase(),
    location: (profile.location || '').toLowerCase(),
    snippet: (profile.metadata?.snippet || '').toLowerCase(),
  };
  
  console.log(`Scoring profile: ${profile.name} / ${profile.title} / ${profile.company}`);
  
  // First pass: identify which categories are in the search
  console.log("Analyzing search terms to identify categories...");
  for (const term of searchTerms) {
    const termLower = term.toLowerCase().trim();
    if (!termLower) continue;
    
    // Determine which category this term belongs to
    const isLocationTerm = termLower.includes('location') || 
                          locationKeywords.some(k => termLower.includes(k));
    const isTitleTerm = termLower.includes('title') || 
                        titleKeywords.some(k => termLower.includes(k));
    const isIndustryTerm = termLower.includes('industry') || 
                          industryKeywords.some(k => termLower.includes(k));
    
    console.log(`Search term "${term}": location=${isLocationTerm}, title=${isTitleTerm}, industry=${isIndustryTerm}`);
    
    // Mark the categories present in search terms
    if (isLocationTerm) {
      categoriesInSearch.location = true;
    }
    if (isTitleTerm) {
      categoriesInSearch.title = true;
    }
    if (isIndustryTerm) {
      categoriesInSearch.industry = true;
    }
    
    // If no specific category is detected, default to all categories
    if (!isLocationTerm && !isTitleTerm && !isIndustryTerm) {
      // Generic term - mark all categories as potentially relevant
      categoriesInSearch.location = true;
      categoriesInSearch.title = true;
      categoriesInSearch.industry = true;
      console.log(`  Generic term not matching any category - marking all categories as relevant`);
    }
  }
  
  console.log("Categories in search:", categoriesInSearch);
  
  // Check each term for a match
  for (const term of searchTerms) {
    const termLower = term.toLowerCase().trim();
    if (!termLower) continue;
    
    let isMatched = false;
    
    // Check for matches in each profile field
      const nameMatch = profileData.name.includes(termLower);
      const titleMatch = profileData.title.includes(termLower);
      const companyMatch = profileData.company.includes(termLower);
      const locationMatch = profileData.location.includes(termLower);
    const snippetMatch = profileData.snippet && profileData.snippet.includes(termLower);
    
    // Determine which category this term belongs to (for categorizing matches)
    const isLocationTerm = termLower.includes('location') || 
                           locationKeywords.some(k => termLower.includes(k));
    const isTitleTerm = termLower.includes('title') || 
                        titleKeywords.some(k => termLower.includes(k));
    const isIndustryTerm = termLower.includes('industry') || 
                          industryKeywords.some(k => termLower.includes(k));
    
    // Basic field matches
    if (nameMatch || titleMatch || companyMatch || locationMatch || snippetMatch) {
      isMatched = true;
      console.log(`Direct match found for "${term}" in profile data`);
      
      // Update category matches based on term type and match location
      if (isLocationTerm || locationMatch) {
        categoryMatches.location = true;
        console.log(`Categorized "${term}" as a Location match`);
      }
      if (isTitleTerm || titleMatch) {
        categoryMatches.title = true;
        console.log(`Categorized "${term}" as a Title match`);
      }
      if (isIndustryTerm || companyMatch) {
        categoryMatches.industry = true;
        console.log(`Categorized "${term}" as an Industry match`);
      }
      
      // Check for specific matches that don't follow the standard pattern
      if (locationMatch && !categoryMatches.location && !categoryMatches.title && !categoryMatches.industry) {
        categoryMatches.location = true;
        console.log(`Forced "${term}" as a Location match based on location field match`);
      }
      if (titleMatch && !categoryMatches.location && !categoryMatches.title && !categoryMatches.industry) {
        categoryMatches.title = true;
        console.log(`Forced "${term}" as a Title match based on title field match`);
      }
      if (companyMatch && !categoryMatches.location && !categoryMatches.title && !categoryMatches.industry) {
        categoryMatches.industry = true;
        console.log(`Forced "${term}" as an Industry match based on company field match`);
      }
      
      // If we still haven't categorized this term, put it in all categories
      if (!categoryMatches.location && !categoryMatches.title && !categoryMatches.industry) {
        // Generic match - could be anything
        categoryMatches.location = categoriesInSearch.location;
        categoryMatches.title = categoriesInSearch.title;
        categoryMatches.industry = categoriesInSearch.industry;
        console.log(`Generic match for "${term}" - applied to all active categories`);
      }
    }
    
    // Special handling for common industry terms like "SaaS"
    if (!isMatched && (termLower === "saas" || termLower === "software as a service")) {
      console.log(`Checking for SaaS attributes in: ${profile.company}`);
      
      // Check if company is in our SaaS database
      if (profile.company && isSaaSCompany(profile.company)) {
        isMatched = true;
        console.log(`SaaS company match: ${profile.company}`);
        categoryMatches.industry = true;
      }
      
      // Match if title or snippet mentions SaaS related terms
      const saasIndicators = [
        'saas', 'cloud', 'platform', 'software', 'service', 'subscription',
        'api', 'integration', 'digital transformation', 'digital solutions',
        'enterprise software', 'b2b software', 'product management',
        'solution architect', 'implementation specialist', 'customer success',
        'client success', 'onboarding specialist', 'cloud services',
        'cloud solutions', 'tech stack', 'tech solution', 'b2b saas',
        'sass', 'iaas', 'paas', 'daas', 'software-as-a-service'
      ];
      
      if (!isMatched && saasIndicators.some(indicator => 
          profileData.title.includes(indicator) || 
          (profileData.snippet && profileData.snippet.includes(indicator)))) {
        isMatched = true;
        console.log(`SaaS indicator match in title/snippet`);
        categoryMatches.industry = true;
      }
      
      // Match if title indicates a product/technical role at a tech company
      const techRoles = [
        'product owner', 'product manager', 'solution architect', 
        'implementation specialist', 'technical account manager',
        'customer success manager', 'integration specialist',
        'solutions consultant', 'solutions engineer', 'technical consultant',
        'devops', 'developer', 'developer advocate', 'engineering manager',
        'cto', 'chief technology', 'vp engineering', 'head of engineering',
        'software engineer', 'software developer', 'full stack', 'backend',
        'frontend', 'qa', 'quality assurance', 'scrum master', 'tech lead',
        'it manager', 'system admin', 'sysadmin', 'database admin', 'dba',
        'network admin', 'cloud architect', 'data scientist'
      ];
      
      if (!isMatched && techRoles.some(role => profileData.title.includes(role))) {
        isMatched = true;
        console.log(`Technical role match for SaaS: ${profileData.title}`);
        categoryMatches.industry = true;
      }
    }
    
    // Special handling for "sales" - automatically match if person has a sales role
    else if (!isMatched && (termLower === "sales" || termLower === "försäljning")) {
      if (hasSalesRole(profileData.title, profileData.snippet)) {
        isMatched = true;
        console.log(`Sales role match: ${profileData.title}`);
        categoryMatches.title = true;
      }
    }
    
    // Special handling for "account executive" - match variations
    else if (!isMatched && (termLower === "account executive" || termLower === "ae")) {
      const aeVariations = [
        'account executive', 'ae', 'enterprise account executive', 'senior account executive',
        'sr account executive', 'sr. account executive', 'key account executive',
        'strategic account executive', 'global account executive', 'junior account executive',
        'jr account executive', 'national account executive', 'regional account executive',
        'territory account executive', 'commercial account executive', 'key account manager',
        'account manager', 'client executive', 'major account executive'
      ];
      
      // Match if title includes any account executive variation
      if (aeVariations.some(variation => profileData.title.includes(variation))) {
        isMatched = true;
        console.log(`Account Executive variation match: ${profileData.title}`);
        categoryMatches.title = true;
      }
    }
    
    // If matched, count it for requirements display
    if (isMatched) {
      matchedRequirements.push(term);
      console.log(`Matched requirement: ${term}`);
    } else {
      unmatchedRequirements.push(term);
      console.log(`Unmatched requirement: ${term}`);
    }
  }
  
  // Calculate final score based on category matches (1 point per category)
  if (categoryMatches.location && categoriesInSearch.location) score += 1;
  if (categoryMatches.title && categoriesInSearch.title) score += 1;
  if (categoryMatches.industry && categoriesInSearch.industry) score += 1;
  
  // Store matched and unmatched requirements in profile metadata
  if (!profile.metadata) {
    profile.metadata = {};
  }
  profile.metadata.matchedRequirements = matchedRequirements;
  profile.metadata.unmatchedRequirements = unmatchedRequirements;
  
  // Store which categories were in search for display purposes
  profile.metadata.categoriesInSearch = categoriesInSearch;
  
  // Log category classifications for debugging
  console.log("Categories in search:", categoriesInSearch);
  console.log("Categories matched:", categoryMatches);
  console.log("Matched requirements:", matchedRequirements);
  
  // Get maximum score based on categories
  const maxScore = getMaxScore();
  
  console.log(`Final score for ${profile.name}: ${score}/${maxScore} (${matchedRequirements.join(', ')})`);
  
  return score;
};

// Function to extract search terms from local storage
const getSearchTerms = (): string[] => {
  // Try to get search terms from local storage
  try {
    // First, check for approved requirements
    const approvedRequirementsStr = localStorage.getItem('approvedRequirements');
    if (approvedRequirementsStr) {
      const approvedRequirements = JSON.parse(approvedRequirementsStr);
      if (Array.isArray(approvedRequirements) && approvedRequirements.length > 0) {
        console.log("Using approved requirements:", approvedRequirements);
        return approvedRequirements;
      }
    }
    
    // Check for boolean search requirements
    const storedRequirements = localStorage.getItem('searchRequirements');
    if (storedRequirements) {
      const requirements = JSON.parse(storedRequirements);
      if (Array.isArray(requirements) && requirements.length > 0) {
        return requirements.filter(term => term && term.trim() !== '');
      }
    }
    
    // Check for search criteria string
    const searchCriteria = localStorage.getItem('searchCriteria');
    if (searchCriteria) {
      return searchCriteria
        .split(/\s*(?:AND|,|;|\|)\s*/i) // Split by common separators
        .map(term => term.trim().replace(/^"(.*)"$/, '$1')) // Remove quotes
        .filter(term => term && term.trim() !== '');
    }
    
    // As a fallback, check generic search terms
    const searchTerms = localStorage.getItem('searchTerms');
    if (searchTerms) {
      return JSON.parse(searchTerms);
    }
  } catch (error) {
    console.error("Error parsing search terms:", error);
  }
  
  return [];
};

// Function to get the maximum score from localStorage (based on categories)
const getMaxScore = (): number => {
  try {
    // First check if we have a saved maxScore value
    const maxScoreStr = localStorage.getItem('maxScore');
    if (maxScoreStr) {
      const maxScore = parseInt(maxScoreStr, 10);
      if (!isNaN(maxScore)) {
        console.log("Using saved maxScore from localStorage:", maxScore);
        return maxScore;
      }
    }
    
    // Use a fixed maximum score of 3 to represent the three main categories:
    // 1. Location
    // 2. Job Title
    // 3. Skills (regardless of how many skills are specified)
    return 3;
  } catch (error) {
    console.error("Error getting max score:", error);
    return 3; // Default to 3 even in case of error
  }
};

// Define the interfaces needed for profile enrichment and analysis
interface Profile {
  id: string;
  linkedin: string;
}

interface ProfileData {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  experience: any[];
  education: any[];
  linkedInUrl: string;
}

interface ProfileEvaluation {
  score: number;
  reasoning: string;
  timestamp: string;
  enrichedData: ProfileData | null;
}

interface AnalysisCriteria {
  requirements: string[];
}

// Define the function to analyze profiles with AI
const analyzeProfileWithAI = async (
  profileData: ProfileData, 
  criteria: AnalysisCriteria,
  abortController?: AbortController
): Promise<ProfileEvaluation> => {
  // This is a simple placeholder implementation
  // In the real implementation, this would call the AI service
  console.log('Analyzing profile with criteria:', criteria);
  
  // Return a basic evaluation
  return {
    score: 2, // Default score
    reasoning: "Evaluated based on provided criteria",
    timestamp: new Date().toISOString(),
    enrichedData: profileData
  };
};

export function SheetView() {
  const navigate = useNavigate();
  const [linkRows, setLinkRows] = useState<LinkRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>("");
  const [editingCell, setEditingCell] = useState<{id: string, field: 'name' | 'title' | 'company' | 'location' | 'score' | null}>({id: '', field: null});
  const [editValue, setEditValue] = useState<string>("");
  
  // Requirement breakdown dialog state
  const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<LinkRow | null>(null);
  
  // AI Analyze dialog state
  const [aiAnalyzeDialogOpen, setAiAnalyzeDialogOpen] = useState(false);
  const [criteriaFields, setCriteriaFields] = useState([
    { id: 1, placeholder: "Years of experience in..." },
    { id: 2, placeholder: "Graduation year..." },
    { id: 3, placeholder: "Key Skills and Certifications..." }
  ]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<number[]>([]);
  
  // Credits state
  const [userCredits, setUserCredits] = useState<number>(100); // Default to 100 credits for demo
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [enrichedProfiles, setEnrichedProfiles] = useState<{[id: string]: any}>({});
  
  // Evaluation detail dialog state
  const [evaluationDetailOpen, setEvaluationDetailOpen] = useState(false);
  const [selectedEvaluationProfile, setSelectedEvaluationProfile] = useState<any>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    title: "",
    company: "",
    location: "",
    minScore: 0
  });
  
  // Keywords to identify category matches
  const locationKeywords: string[] = ['stockholm', 'göteborg', 'malmö', 'sweden', 'sverige', 'remote', 'hybrid'];
  const titleKeywords: string[] = ['developer', 'engineer', 'manager', 'consultant', 'specialist', 'director', 'lead'];
  const industryKeywords: string[] = ['saas', 'software', 'tech', 'it', 'fintech', 'edtech', 'healthtech', 'telecom', 'e-commerce', 'retail'];
  
  const [activeRequirements, setActiveRequirements] = useState<string[]>([]);
  const [allRequirements, setAllRequirements] = useState<string[]>([]);
  const [tempActiveRequirements, setTempActiveRequirements] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Selection state
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  // Project state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<{id: string; name: string; profiles: LinkRow[]}[]>([]);
  
  // State for tracking the maximum score
  const [maxScoreValue, setMaxScoreValue] = useState<number>(getMaxScore());
  
  // Log the max score when component mounts
  useEffect(() => {
    console.log("Initial maxScoreValue set to:", maxScoreValue);
    
    // Force re-read from localStorage in case it changes
    const maxScore = getMaxScore();
    if (maxScore !== maxScoreValue) {
      console.log("Updating maxScoreValue from localStorage:", maxScore);
      setMaxScoreValue(maxScore);
    }
  }, [maxScoreValue]);
  
  // Load projects on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('savedProjects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);
  
  // Get all requirements on mount
  useEffect(() => {
    const requirements = getSearchTerms();
    setAllRequirements(requirements);
    // Start with no requirements selected
    setActiveRequirements([]);
    setTempActiveRequirements([]);
  }, []);
  
  // Initialize temp requirements on dropdown open
  useEffect(() => {
    if (isFilterOpen) {
      // When opening the dropdown, initialize temp requirements based on active ones
      setTempActiveRequirements([...activeRequirements]);
    }
  }, [isFilterOpen, activeRequirements]);
  
  // Toggle a requirement in the filter
  const toggleRequirement = (requirement: string) => {
    setTempActiveRequirements(prev => {
      if (prev.includes(requirement)) {
        // Remove the requirement if it's already active
        return prev.filter(req => req !== requirement);
      } else {
        // Add the requirement if it's not active
        return [...prev, requirement];
      }
    });
  };
  
  // Apply the selected requirements from temp state to active state
  const applyFilters = () => {
    console.log("Applying filters. Selected requirements:", tempActiveRequirements);
    setActiveRequirements(tempActiveRequirements);
    setIsFilterOpen(false); // Close the dropdown after applying
  };
  
  // Reset filters and close dropdown
  const resetFilters = () => {
    setFilters({
      title: "",
      company: "",
      location: "",
      minScore: 0
    });
    // Reset to no requirements selected
    setActiveRequirements([]);
    setTempActiveRequirements([]);
    setIsFilterOpen(false); // Close the dropdown after resetting
  };
  
  // Apply requirement filtering
  const filteredByRequirements = useMemo(() => {
    console.log("Filtering by requirements. Active requirements:", activeRequirements);
    
    // If no active requirements, show all rows
    if (activeRequirements.length === 0) {
      console.log("No active requirements, showing all profiles");
      return linkRows;
    }
    
    // Separate category requirements from specific requirements
    const categoryRequirements = activeRequirements.filter(req => 
      ["Location", "Title", "Industry"].includes(req)
    );
    
    const specificRequirements = activeRequirements.filter(req => 
      !["Location", "Title", "Industry"].includes(req)
    );
    
    console.log("Category requirements:", categoryRequirements);
    console.log("Specific requirements:", specificRequirements);
    
    // Filter to show only profiles that match ALL selected requirements
    const filtered = linkRows.filter(row => {
      // If profile has no matchedRequirements, it can't match any filter
      if (!row.metadata?.matchedRequirements) {
        return false;
      }
      
      // For category filters, use same logic as scoring
      // A profile with score 3/3 must match all categories
      if (categoryRequirements.includes("Location") && row.score === 3) {
        // All 3/3 profiles match Location category
      } 
      else if (categoryRequirements.includes("Location") && !row.metadata.categoriesInSearch?.location) {
        return false;
      }
      else if (categoryRequirements.includes("Location") && 
          !row.metadata.matchedRequirements.some(req => 
            req.toLowerCase().includes('location') || 
            locationKeywords.some(k => req.toLowerCase().includes(k))
          )) {
        return false;
      }
      
      if (categoryRequirements.includes("Title") && row.score === 3) {
        // All 3/3 profiles match Title category  
      }
      else if (categoryRequirements.includes("Title") && !row.metadata.categoriesInSearch?.title) {
        return false;
      }
      else if (categoryRequirements.includes("Title") && 
          !row.metadata.matchedRequirements.some(req => 
            req.toLowerCase().includes('title') || 
            titleKeywords.some(k => req.toLowerCase().includes(k))
          )) {
        return false;
      }
      
      if (categoryRequirements.includes("Industry") && row.score === 3) {
        // All 3/3 profiles match Industry category
      }
      else if (categoryRequirements.includes("Industry") && !row.metadata.categoriesInSearch?.industry) {
        return false;
      }
      else if (categoryRequirements.includes("Industry") && 
          !row.metadata.matchedRequirements.some(req => 
            req.toLowerCase().includes('industry') || 
            industryKeywords.some(k => req.toLowerCase().includes(k))
          )) {
        return false;
      }
      
      // Check specific requirements
      for (const requirement of specificRequirements) {
        if (!row.metadata.matchedRequirements.includes(requirement)) {
          // As soon as we find a requirement that doesn't match, exclude this profile
          return false;
        }
      }
      
      // Profile matches all active requirements
      return true;
    });
    
    console.log(`Filtered from ${linkRows.length} to ${filtered.length} profiles`);
    return filtered;
  }, [linkRows, activeRequirements]);

  // Apply other filters (title, company, location, score)
  const filteredRows = useMemo(() => {
    return filteredByRequirements.filter(row => {
      if (filters.title && row.title && !row.title.toLowerCase().includes(filters.title.toLowerCase())) {
        return false;
      }
      
      if (filters.company && row.company && !row.company.toLowerCase().includes(filters.company.toLowerCase())) {
        return false;
      }
      
      if (filters.location && row.location && !row.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      
      if (typeof filters.minScore === 'number' && row.score < filters.minScore) {
        return false;
      }
      
      return true;
    });
  }, [filteredByRequirements, filters]);
  
  // Hantera filterändringar
  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Clear all profile-related localStorage
  const clearProfileData = () => {
    localStorage.removeItem('aiExtractedProfiles');
    localStorage.removeItem('extractedProfileData');
    localStorage.removeItem('profile_data');
    setLinkRows([]);
    toast({
      title: "All profile data cleared"
    });
  };

  // Flyttar loadLinks utanför useEffect för att göra den tillgänglig över hela komponenten
  const loadLinks = (useFallback: boolean = false) => {
    setIsLoading(true);
    console.log("SheetView - Beginning profile data load process...");
    
    // Debug: Check what's in localStorage
    console.log("SheetView - Available localStorage keys:", 
      Object.keys(localStorage).filter(key => 
        key.includes('profile') || 
        key.includes('link') || 
        key.includes('search')
      )
    );
    
    // Get search terms for scoring
    const searchTerms = getSearchTerms();
    console.log("SheetView - Search terms for scoring:", searchTerms);

    // Get the latest maxScore and update state
    const currentMaxScore = getMaxScore();
    console.log("SheetView - Max score for loading:", currentMaxScore);
    setMaxScoreValue(currentMaxScore);

    // Try all potential storage locations in order of preference
    const storageKeys = [
      'aiExtractedProfiles',
      'extractedProfileData',
      'linkSheetRows'
    ];
    
    let loadedProfiles: any[] = [];
    let sourceKey = '';
    
    for (const key of storageKeys) {
      const storedData = localStorage.getItem(key);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log(`SheetView - Found ${parsedData.length} profiles in ${key}`);
            
            if (parsedData[0].name) {
              console.log(`SheetView - First few names from ${key}:`, 
                parsedData.slice(0, 3).map(p => p.name));
              
              // Check if names are more than just "Profile X"
              const nonGenericNames = parsedData.filter(p => 
                p.name && !p.name.startsWith('Profile ')
              );
              
              if (nonGenericNames.length > 0) {
                console.log(`SheetView - Found ${nonGenericNames.length} non-generic names in ${key}`);
                loadedProfiles = parsedData;
                sourceKey = key;
                setDataSource(key);
                break;
              } else {
                console.log(`SheetView - All names in ${key} are generic "Profile X" format`);
                // Only use this data if we haven't found anything better
                if (loadedProfiles.length === 0) {
                  loadedProfiles = parsedData;
                  sourceKey = key;
                  setDataSource(key);
                }
              }
            } else {
              console.log(`SheetView - No name field in profiles from ${key}`);
            }
          }
        } catch (e) {
          console.error(`SheetView - Error parsing ${key}:`, e);
        }
      } else {
        console.log(`SheetView - No data found in ${key}`);
      }
    }
    
    if (loadedProfiles.length > 0) {
      console.log(`SheetView - Using ${loadedProfiles.length} profiles from ${sourceKey}`);
      
      // Format the rows correctly based on the data structure
      let formattedRows: LinkRow[];
      
      if (sourceKey === 'linkSheetRows') {
        // Already in the right format
        formattedRows = loadedProfiles;
      } else {
        // Convert to LinkRow format
        formattedRows = loadedProfiles.map((profile, index) => ({
          id: `profile-${index}`,
          url: normalizeLinkedInUrl(profile.url || ''),
          name: profile.name || `Profile ${index + 1}`,
          title: profile.title || '',
          company: profile.company || '',
          location: profile.location || '',
          score: profile.score || 0,
          metadata: profile.metadata || { matchedRequirements: [], unmatchedRequirements: [] }
        }));
      }
  
      // After loading, check for search results to enhance missing data
      const searchItems = tryLoadSearchResultItems();
      if (searchItems && searchItems.length > 0) {
        console.log(`SheetView - Found ${searchItems.length} search result items to enhance profiles`);

        // Enhance profiles with missing data
        formattedRows = formattedRows.map(row => {
          let enhancedRow = { ...row };
          
          // Try to fill missing data
          if (!enhancedRow.title || enhancedRow.title === 'Not available') {
            const extractedTitle = tryExtractMissingTitle(enhancedRow.url, searchItems);
            if (extractedTitle) {
              enhancedRow.title = extractedTitle;
            }
          }
          
          if (!enhancedRow.company || enhancedRow.company === 'Not available') {
            const extractedCompany = tryExtractMissingCompany(enhancedRow.url, searchItems);
            if (extractedCompany) {
              enhancedRow.company = extractedCompany;
            }
          }
          
          if (!enhancedRow.location || enhancedRow.location === 'Not available') {
            const extractedLocation = tryExtractMissingLocation(enhancedRow.url, searchItems);
            if (extractedLocation) {
              enhancedRow.location = extractedLocation;
            }
          }
          
          return enhancedRow;
        });
        
        console.log("SheetView - Profiles enhanced with search result data");
      }
      
      // Calculate scores for profiles based on search terms if we have terms
      if (searchTerms.length > 0) {
        console.log(`SheetView - Calculating scores based on ${searchTerms.length} search terms`);
        formattedRows = formattedRows.map(row => {
          // Only calculate a new score if one doesn't already exist
          if (row.score === 0) {
            const score = calculateProfileScore(row, searchTerms);
            return { ...row, score };
          }
          return row;
        });
        
        // Sort by score (highest first) if we have scores
        formattedRows.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        console.log("SheetView - Profiles scored and sorted by relevance");
      }
      
      console.log("SheetView - Final formatted rows:", formattedRows.slice(0, 3));
      console.log("DEBUG - formattedRows created:", formattedRows.slice(0, 5));
      setLinkRows(formattedRows);
      // Save the formatted rows to localStorage for persistence
      try {
        localStorage.setItem('linkSheetRows', JSON.stringify(formattedRows));
        console.log("DEBUG - Saved formattedRows to localStorage");
      } catch (e) {
        console.error("DEBUG - Error saving to localStorage:", e);
      }
      console.log("DEBUG - setLinkRows called with formattedRows");
      setIsLoading(false);
      console.log("DEBUG - setIsLoading(false) called");
      return formattedRows;
    }
    
    // Function to try loading search result items
    function tryLoadSearchResultItems(): any[] | null {
      try {
        const searchItems = localStorage.getItem('searchResultItems');
        if (searchItems) {
          return JSON.parse(searchItems);
        }
      } catch (e) {
        console.error('Error loading search result items:', e);
      }
      return null;
    }
    
    // If we got here, try using links directly as a last resort
    const linkSources = ['googleSearchLinks', 'linkedInSearchLinks', 'searchResultLinks'];
    let links: string[] = [];
    
    for (const key of linkSources) {
      const storedLinks = localStorage.getItem(key);
      if (storedLinks) {
        try {
          const parsedLinks = JSON.parse(storedLinks);
          if (Array.isArray(parsedLinks) && parsedLinks.length > 0) {
            console.log(`SheetView - Found ${parsedLinks.length} links in ${key}`);
            links = parsedLinks;
            setDataSource(`links from ${key}`);
            break;
          }
        } catch (e) {
          console.error(`SheetView - Error parsing links from ${key}:`, e);
        }
      }
    }
    
    if (links.length > 0) {
      console.log(`SheetView - Creating ${links.length} generic profiles from links`);
      
      // Försök ladda sökresultat för att berika profiler
      const searchItems = tryLoadSearchResultItems();
      let genericRows: LinkRow[] = [];
        
      // Create generic profiles from links
      genericRows = links.map((link, index) => {
        const baseRow = {
          id: `profile-${index}`,
          url: normalizeLinkedInUrl(link),
          name: extractNameFromUrl(link, index) || `Profile ${index + 1}`,
          title: '',
          company: '',
          location: '',
          score: 0,
          metadata: { matchedRequirements: [], unmatchedRequirements: [] }
        };
          
        // Berika med data från sökresultat om tillgängligt
        if (searchItems && searchItems.length > 0) {
          const matchingItem = searchItems.find(item => {
            const itemUrl = item.link || item.url || '';
            return normalizeLinkedInUrl(itemUrl) === normalizeLinkedInUrl(link);
          });
            
          if (matchingItem) {
            baseRow.title = extractJobTitle(matchingItem) || baseRow.title;
            baseRow.company = extractCompanyName(matchingItem) || baseRow.company;
            baseRow.location = extractLocation(matchingItem) || baseRow.location;
          }
        }
          
        return baseRow;
      });
        
      setLinkRows(genericRows);
      // Save the generic rows to localStorage for persistence
      try {
        localStorage.setItem('linkSheetRows', JSON.stringify(genericRows));
        console.log("DEBUG - Saved genericRows to localStorage");
      } catch (e) {
        console.error("DEBUG - Error saving genericRows to localStorage:", e);
      }
      setIsLoading(false);
      return genericRows;
    }
    
    // Only use fallback sample data if specifically requested or no other data found
    if (useFallback) {
      // If we got here, try using sample data as a fallback
      const sampleData = [
        {
          id: "sample-1",
          name: "John Doe",
          title: "Account Manager",
          company: "Microsoft",
          location: "Stockholm, Sweden",
          url: "https://www.linkedin.com/in/johndoe/",
          score: 0,
          metadata: { matchedRequirements: [], unmatchedRequirements: [] }
        },
        {
          id: "sample-2",
          name: "Jane Smith",
          title: "Sales Executive",
          company: "Google",
          location: "Gothenburg, Sweden",
          url: "https://www.linkedin.com/in/janesmith/",
          score: 0,
          metadata: { matchedRequirements: [], unmatchedRequirements: [] }
        },
        {
          id: "sample-3",
          name: "Alex Johnson",
          title: "Business Developer",
          company: "Spotify",
          location: "Malmö, Sweden",
          url: "https://www.linkedin.com/in/alexjohnson/",
          score: 0,
          metadata: { matchedRequirements: [], unmatchedRequirements: [] }
        }
      ];
      
      console.log("SheetView - No profile data or links found in localStorage, creating sample data");
      
      // If we have search terms, calculate scores for the sample data
      if (searchTerms.length > 0) {
        console.log(`Calculating scores for sample data using ${searchTerms.length} search terms:`, searchTerms);
        for (const profile of sampleData) {
          const score = calculateProfileScore(profile, searchTerms);
          console.log(`Profile ${profile.name} scored ${score}/${searchTerms.length}, matched: ${profile.metadata?.matchedRequirements?.length || 0}, unmatched: ${profile.metadata?.unmatchedRequirements?.length || 0}`);
        }
        // Sort by score
        sampleData.sort((a, b) => b.score - a.score);
      } else {
        console.log("No search terms available for scoring sample data");
      }
      
      setLinkRows(sampleData);
      // Save the sample data to localStorage for persistence
      try {
        localStorage.setItem('linkSheetRows', JSON.stringify(sampleData));
        console.log("DEBUG - Saved sampleData to localStorage");
      } catch (e) {
        console.error("DEBUG - Error saving sampleData to localStorage:", e);
      }
      setDataSource("sample data");
      setIsLoading(false);
      return sampleData;
    }
    
    setIsLoading(false);
    return [];
  };

  useEffect(() => {
    // Log all localStorage keys and values for debugging
    console.log("DEBUG - ALL LOCALSTORAGE KEYS:", Object.keys(localStorage));
    
    // Log specific content of important keys
    const debugKeys = ['searchResultItems', 'aiExtractedProfiles', 'extractedProfileData', 'linkSheetRows'];
    debugKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          console.log(`DEBUG - ${key} exists with length:`, data.length);
          try {
            const parsed = JSON.parse(data);
            console.log(`DEBUG - ${key} parsed successfully, type:`, Array.isArray(parsed) ? 'array' : typeof parsed);
            console.log(`DEBUG - ${key} contains:`, parsed);
          } catch (e) {
            console.error(`DEBUG - Failed to parse ${key}:`, e);
          }
        } else {
          console.log(`DEBUG - ${key} does not exist in localStorage`);
        }
      } catch (e) {
        console.error(`DEBUG - Error accessing ${key}:`, e);
      }
    });
    
    // Anropa loadLinks för att ladda data vid komponentmontering
    loadLinks(false);
  }, []);

  // Lägg till en useEffect-hook för att spåra förändringar i linkRows
  useEffect(() => {
    console.log("DEBUG - linkRows state changed:", linkRows.length > 0 ? `${linkRows.length} rows` : "empty");
    if (linkRows.length > 0) {
      console.log("DEBUG - First 3 linkRows:", linkRows.slice(0, 3));
    }
  }, [linkRows]);

  // Lägg till en useEffect-hook för att spåra förändringar i isLoading
  useEffect(() => {
    console.log("DEBUG - isLoading state changed to:", isLoading);
  }, [isLoading]);

  useEffect(() => {
    console.log("Active requirements changed:", activeRequirements);
  }, [activeRequirements]);

  useEffect(() => {
    console.log("Filtered rows length:", filteredRows.length);
  }, [filteredRows]);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Link has been copied to clipboard",
    });
  };

  const downloadCSV = () => {
    try {
      const headers = ['Name', 'Title', 'Company', 'Location', 'Score', 'Profile URL'];
      
      const csvRows = [
        headers.join(','),
        ...linkRows.map(row => {
          return [
            `"${row.name || 'Profile'}"`,
            `"${row.title || 'Not available'}"`,
            `"${row.company || 'Not available'}"`,
            `"${row.location || 'Not available'}"`,
            `"${row.score !== undefined ? row.score : 'N/A'}"`,
            `"${row.url.replace(/"/g, '""')}"`
          ].join(',');
        })
      ];
      
      const csvContent = csvRows.join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `linkedin-profiles-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Downloaded",
        description: `Exported ${linkRows.length} profile URLs to CSV file.`,
      });
    } catch (error) {
      console.error("Error creating CSV:", error);
      toast({
        title: "Export Failed",
        description: "There was an error creating the CSV file.",
      });
    }
  };

  const handleRetryExtraction = () => {
    toast({
      title: "Returning to search",
      description: "Going back to search page to try extraction again",
    });
    navigate('/linkedin-google-extractor');
  };

  const handleEditCell = (row: LinkRow, field: 'name' | 'title' | 'company' | 'location' | 'score' | null) => {
    setEditingCell({id: row.id, field});
    const value = field === 'name' ? row.name || '' : 
                  field === 'title' ? row.title || '' : 
                  field === 'company' ? row.company || '' :
                  field === 'location' ? row.location || '' :
                  field === 'score' ? (row.score !== undefined ? row.score.toString() : '') : '';
    setEditValue(value === 'Not available' ? '' : value);
  };

  const handleSaveEdit = (id: string, field: 'name' | 'title' | 'company' | 'location' | 'score') => {
      // Clean value before saving
      let valueToSave = editValue.trim();
      
      // Apply cleanup for specific fields
      if (field === 'title') {
        valueToSave = cleanupJobTitle(valueToSave);
      } else if (field === 'company') {
        valueToSave = cleanupCompanyName(valueToSave);
      }
      
    // Update the row
      setLinkRows(prevRows => {
        const updatedRows = prevRows.map(row => {
          if (row.id === id) {
            if (field === 'score') {
            // For score field, convert to number if possible
            const scoreValue = valueToSave ? parseFloat(valueToSave) : 0;
            return { ...row, [field]: !isNaN(scoreValue) ? scoreValue : 0 };
          } else {
            // For other fields
            return { ...row, [field]: valueToSave || null };
          }
          }
          return row;
        });
        
        // Save updated rows to localStorage
        try {
          localStorage.setItem('linkSheetRows', JSON.stringify(updatedRows));
          console.log("DEBUG - Saved updated rows to localStorage after edit");
        } catch (e) {
          console.error("DEBUG - Error saving edited rows to localStorage:", e);
        }
        
        return updatedRows;
      });
      
      // Exit edit mode
      setEditingCell({id: '', field: null});
      setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string, field: 'name' | 'title' | 'company' | 'location' | 'score') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(id, field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell({id: '', field: null});
    }
  };

  if (isLoading) {
    console.log("SheetView - Loading state is true, showing loader");
  } else {
    console.log("SheetView - Loading state is false, showing table");
    console.log("SheetView - Number of rows to display:", linkRows.length);
  }

  // Log a few sample rows for debugging
  if (linkRows.length > 0) {
    console.log("SheetView - Sample rows:", linkRows.slice(0, 3));
  }

  console.log("DEBUG - Rendering SheetView, linkRows:", linkRows.length);
  console.log("DEBUG - isLoading:", isLoading);
  console.log("DEBUG - dataSource:", dataSource);

  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-red-500 mb-4">An error occurred: {error.message}</p>
      <button onClick={() => window.location.reload()} className="text-white bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 text-sm font-semibold rounded-md">
        Reload Page
      </button>
    </div>
  );

  // Function to recalculate scores based on current requirements
  const recalculateScores = () => {
    if (linkRows.length > 0) {
      const searchTerms = getSearchTerms();
      if (searchTerms.length > 0) {
        console.log("Recalculating scores with requirements:", searchTerms);
        
        // Get the current maxScore from local storage to ensure it's up-to-date
        const currentMaxScore = getMaxScore();
        console.log("Current maxScore for recalculation:", currentMaxScore);
        
        // Update our state with the latest max score
        setMaxScoreValue(currentMaxScore);
        
        // Create a copy of the linkRows to update
        const updatedRows = [...linkRows];
        
        // Recalculate scores
        for (const row of updatedRows) {
          // Clear existing metadata to force complete rebuild
          if (row.metadata) {
            row.metadata.matchedRequirements = [];
            row.metadata.unmatchedRequirements = [];
          } else {
            row.metadata = { 
              matchedRequirements: [], 
              unmatchedRequirements: [] 
            };
          }
          
          // Recalculate score which will rebuild requirements arrays
          calculateProfileScore(row, searchTerms);
          
          console.log(`Profile ${row.name || 'unknown'}: matched requirements =`, row.metadata?.matchedRequirements);
        }
        
        // Sort by score
        updatedRows.sort((a, b) => b.score - a.score);
        
        // Update state and localStorage
        setLinkRows(updatedRows);
        localStorage.setItem('linkSheetRows', JSON.stringify(updatedRows));
        
        toast({
          title: "Scores updated",
          description: `Recalculated scores using ${searchTerms.length} requirements, max score is ${currentMaxScore}`
        });
      } else {
        toast({
          title: "No requirements found",
          description: "Please set requirements first"
        });
      }
    }
  };
  
  // Function to force rebuild of requirements metadata for all profiles
  const rebuildRequirementsMetadata = () => {
    if (linkRows.length > 0) {
      const searchTerms = getSearchTerms();
      if (searchTerms.length > 0) {
        console.log("Rebuilding requirements metadata with:", searchTerms);
        
        // Create a copy of the linkRows to update
        const updatedRows = [...linkRows];
        
        // Force recalculate scores to rebuild matchedRequirements arrays
        for (const row of updatedRows) {
          // Clear existing metadata to force complete rebuild
          if (row.metadata) {
            row.metadata.matchedRequirements = [];
            row.metadata.unmatchedRequirements = [];
          } else {
            row.metadata = { 
              matchedRequirements: [], 
              unmatchedRequirements: [] 
            };
          }
          
          // Recalculate score which will rebuild requirements arrays
          calculateProfileScore(row, searchTerms);
          
          console.log(`Rebuilt metadata for ${row.name}:`, 
            `Matched: ${row.metadata?.matchedRequirements?.join(', ')}`, 
            `Unmatched: ${row.metadata?.unmatchedRequirements?.join(', ')}`
          );
        }
        
        // Update state and localStorage
        setLinkRows(updatedRows);
        localStorage.setItem('linkSheetRows', JSON.stringify(updatedRows));
        
        toast({
          title: "Requirements metadata rebuilt",
          description: `Rebuilt matchedRequirements arrays using ${searchTerms.length} requirements`
        });
      } else {
        toast({
          title: "No requirements found",
          description: "Please set requirements first"
        });
      }
    }
  };

  // Toggle a row selection
  const toggleRowSelection = (rowId: string) => {
    setSelectedRows(prev => {
      if (prev.includes(rowId)) {
        return prev.filter(id => id !== rowId);
      } else {
        return [...prev, rowId];
      }
    });
  };

  // Toggle select all rows
  const toggleSelectAll = () => {
    if (selectedRows.length === filteredRows.length) {
      // If all rows are selected, deselect all
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      // Otherwise, select all visible rows
      setSelectedRows(filteredRows.map(row => row.id));
      setSelectAll(true);
    }
  };

  // Effect to update selectAll state when individual selections change
  useEffect(() => {
    if (filteredRows.length > 0 && selectedRows.length === filteredRows.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedRows, filteredRows]);

  // Save selected profiles to a project
  const saveToProject = () => {
    const newProject = {
      id: crypto.randomUUID(),
      name: projectName,
      profiles: linkRows.filter(row => selectedRows.includes(row.id)),
      createdAt: Date.now() // Lägg till en tidsstämpel
    };
    
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('savedProjects', JSON.stringify(updatedProjects));
    
    // Reset state
    setProjectDialogOpen(false);
    setProjectName("");
    toast({
      title: "Project saved",
      description: `${selectedRows.length} profiles saved to project "${projectName}"`
    });
  };

  // Export selected profiles
  const exportSelected = () => {
    const selectedProfiles = linkRows.filter(row => selectedRows.includes(row.id));
    // Use existing CSV export logic but only for selected profiles
    exportProfilesToCSV(selectedProfiles);
  };

  // Helper function for CSV export of selected profiles
  const exportProfilesToCSV = (profiles: LinkRow[]) => {
    const headers = ['Name', 'Title', 'Company', 'Location', 'Score', 'LinkedIn URL', 'Matched Requirements'];
    const rows = profiles.map(profile => {
      return [
        profile.name || '',
        profile.title || '',
        profile.company || '',
        profile.location || '',
        profile.score.toString(),
        profile.url,
        profile.metadata?.matchedRequirements?.join(', ') || ''
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `selected_profiles_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open the requirements breakdown dialog for a profile
  const openRequirementsBreakdown = (profile: LinkRow) => {
    setSelectedProfile(profile);
    setBreakdownDialogOpen(true);
  };

  // AI analyze selected profiles
  const analyzeSelectedProfiles = () => {
    const selectedProfiles = linkRows.filter(row => selectedRows.includes(row.id));
    
    if (selectedProfiles.length === 0) {
      toast({
        title: "No profiles selected",
        description: "Please select at least one profile to analyze"
      });
      return;
    }
    
    // Reset criteria fields state when opening dialog
    setCriteriaFields([
      { id: 1, placeholder: "Years of experience in..." },
      { id: 2, placeholder: "Graduation year..." },
      { id: 3, placeholder: "Key Skills and Certifications..." }
    ]);
    setDeleteMode(false);
    setSelectedForDeletion([]);
    
    // Open the AI analyze dialog
    setAiAnalyzeDialogOpen(true);
  };
  
  // Add a new criteria field
  const addCriteriaField = () => {
    const newId = criteriaFields.length > 0 ? Math.max(...criteriaFields.map(field => field.id)) + 1 : 1;
    setCriteriaFields([...criteriaFields, { id: newId, placeholder: "" }]);
  };
  
  // Toggle criteria selection for deletion
  const toggleCriteriaSelection = (id: number) => {
    setSelectedForDeletion(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  // Delete selected criteria
  const deleteSelectedCriteria = () => {
    if (selectedForDeletion.length === 0) return;
    
    setCriteriaFields(prev => prev.filter(field => !selectedForDeletion.includes(field.id)));
    setSelectedForDeletion([]);
    setDeleteMode(false);
  };

  // Update function to fetch profile data from SignalHire
  const fetchProfileData = async (
    linkedInUrl: string,
    abortController?: AbortController
  ): Promise<ProfileData> => {
    try {
      console.log('Fetch profile data for URL:', linkedInUrl);

      // Kontrollera att URL börjar med https://
      const formattedUrl = linkedInUrl.startsWith('http') ? linkedInUrl : `https://${linkedInUrl}`;
      
      // Prepare request body
      const requestBody = JSON.stringify({
        url: formattedUrl,
      });
      
      console.log('Request body being sent:', requestBody);

      // Make direct request to our API
      const api = new URL('/api/fetchProfile', window.location.origin);
      
      try {
        const response = await fetch(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: requestBody,
          signal: abortController?.signal,
        });

        // Get response text first regardless of status
        const responseText = await response.text();
        console.log('Response text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        if (!response.ok) {
          console.error('Error response:', responseText);
          if (responseText.includes('Cannot POST')) {
            // Detta indikerar att servern inte körs på port 3333
            throw new Error('Server svarar inte - kontrollera att backend körs på port 3333');
          }
          throw new Error(`Profile API error: ${response.status} - ${responseText}`);
        }

        // Try to parse JSON response with better error handling
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError, 'Response text:', responseText);
          
          // Try to provide more helpful error message based on response text
          if (!responseText || responseText.trim() === '') {
            throw new Error('API returned an empty response');
          } else if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
            throw new Error('API returned HTML instead of JSON. The server might be experiencing issues.');
          } else {
            throw new Error(`Failed to parse response as JSON. Raw response: ${responseText.substring(0, 100)}...`);
          }
        }

        console.log('Profile data received:', data);

        // Check if data is not in expected format
        if (!data || typeof data !== 'object') {
          throw new Error(`Invalid response format: expected an object but got ${typeof data}`);
        }

        // Check if response indicates pending status (request is being processed)
        if (data.pending || data.pollingUrl) {
          // Start polling for results using the provided polling URL or construct one
          console.log('Profile data is pending, starting polling');
          
          const pollingUrl = data.pollingUrl || 
            `http://localhost:3333/api/profile/${encodeURIComponent(linkedInUrl)}`;
          
          return pollForProfileResults(
            pollingUrl, 
            abortController
          );
        }

        // Return the profile data if it's complete
        return {
          name: data.name || 'Unknown',
          title: data.title || '',
          company: data.company || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          experience: Array.isArray(data.experience) ? data.experience : [],
          education: Array.isArray(data.education) ? data.education : [],
          linkedInUrl: linkedInUrl, // Always use the original LinkedIn URL
        };
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        
        // För timeouts och nätverksfel
        if (fetchError instanceof TypeError && fetchError.message.includes('NetworkError')) {
          throw new Error('Kunde inte ansluta till backend-servern. Kontrollera att server.js körs.');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      
      // Provide more descriptive error messages based on error type
      let errorMessage = 'Okänt fel uppstod';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Format network errors more clearly
        if (error.name === 'AbortError') {
          errorMessage = 'Hämtningen avbröts';
        } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
          errorMessage = 'Nätverksfel - kontrollera din internetanslutning och att servern körs';
        }
      }
      
      toast({
        title: "Kunde ej berika profil",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  };

  // Function to poll for profile results
  const pollForProfileResults = async (
    pollingUrl: string, 
    abortController?: AbortController,
    maxAttempts: number = 10,
    intervalMs: number = 2000
  ): Promise<ProfileData> => {
    // Om vi använder mockprofile, generera fake-data direkt
    const isUsingMockProfile = pollingUrl.toLowerCase().includes('mockprofile');
    
    if (isUsingMockProfile) {
      console.log('Using mockprofile data instead of polling');
      const mockName = pollingUrl.split('/').pop()?.replace(/-/g, ' ') || 'Test User';
      
      // Enkel fördröjning för att simulera nätverksanrop
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        name: mockName.replace(/\b\w/g, c => c.toUpperCase()),
        title: 'Software Developer',
        company: 'Tech AB',
        email: `${mockName.replace(/\s+/g, '.').toLowerCase()}@example.com`,
        phone: '+46 70 123 4567',
        location: 'Stockholm, Sweden',
        experience: [
          {
            company: 'Tech AB',
            title: 'Software Developer',
            duration: '2 years'
          }
        ],
        education: [
          {
            school: 'KTH Royal Institute of Technology',
            degree: 'Computer Science',
            year: '2020'
          }
        ],
        linkedInUrl: pollingUrl
      };
    }
    
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkResults = async () => {
        try {
          if (attempts >= maxAttempts) {
            reject(new Error(`Maximal antal försök (${maxAttempts}) har uppnåtts. Serversvar kan ha fördröjts.`));
            return;
          }
          
          attempts++;
          console.log(`Polling attempt ${attempts}/${maxAttempts}: ${pollingUrl}`);
          
          // Kontrollera att vi inte använder window.location när vi gör serveranrop
          const url = pollingUrl.startsWith('http') ? 
            pollingUrl : 
            `http://localhost:3333${pollingUrl}`;
            
          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              signal: abortController?.signal,
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Polling error (attempt ${attempts}/${maxAttempts}):`, errorText);
              
              // Om vi inte har uppnått max antal försök, försök igen
              if (attempts < maxAttempts) {
                setTimeout(checkResults, intervalMs);
                return;
              }
              
              throw new Error(`Polling API error: ${response.status} - ${errorText}`);
            }
            
            // Parse response
            const responseText = await response.text();
            let data;
            
            try {
              data = JSON.parse(responseText);
            } catch (jsonError) {
              console.error('Error parsing polling response:', jsonError);
              
              if (attempts < maxAttempts) {
                setTimeout(checkResults, intervalMs);
                return;
              }
              
              throw new Error(`Failed to parse polling response: ${responseText.substring(0, 100)}...`);
            }
            
            console.log('Polling response:', data);
            
            // Check if still pending
            if (data.pending === true) {
              // Still processing, try again after delay
              setTimeout(checkResults, intervalMs);
              return;
            }
            
            // Results are ready
            resolve({
              name: data.name || 'Unknown',
              title: data.title || '',
              company: data.company || '',
              email: data.email || '',
              phone: data.phone || '',
              location: data.location || '',
              experience: Array.isArray(data.experience) ? data.experience : [],
              education: Array.isArray(data.education) ? data.education : [],
              linkedInUrl: data.linkedInUrl || '',
            });
          } catch (fetchError) {
            console.error(`Polling fetch error (attempt ${attempts}/${maxAttempts}):`, fetchError);
            
            // Fortsätt försöka om vi inte har uppnått max
            if (attempts < maxAttempts) {
              setTimeout(checkResults, intervalMs);
              return;
            }
            
            throw fetchError;
          }
        } catch (error) {
          console.error('Error during polling:', error);
          
          // Om vi inte har uppnått max antal försök, försök igen även vid fel
          if (attempts < maxAttempts) {
            setTimeout(checkResults, intervalMs * 1.5); // Öka intervallet vid fel
            return;
          }
          
          reject(error);
        }
      };
      
      // Start the first polling attempt
      checkResults();
    });
  };

  // Helper functions to extract data from the profile
  const getLatestCompany = (profile: any): string => {
    if (profile.experience && profile.experience.length > 0) {
      // Try to find current position
      const current = profile.experience.find((exp: any) => exp.current === true);
      if (current) return current.company || '';
      // Otherwise return the most recent one
      return profile.experience[0].company || '';
    }
    return '';
  };

  const getEmailFromContacts = (profile: any): string => {
    if (profile.contacts && profile.contacts.length > 0) {
      const email = profile.contacts.find((c: any) => c.type === 'email');
      return email ? email.value : '';
    }
    return '';
  };

  const getPhoneFromContacts = (profile: any): string => {
    if (profile.contacts && profile.contacts.length > 0) {
      const phone = profile.contacts.find((c: any) => c.type === 'phone');
      return phone ? phone.value : '';
    }
    return '';
  };

  const getLocationFromProfile = (profile: any): string => {
    if (profile.locations && profile.locations.length > 0) {
      return profile.locations[0].name || '';
    }
    return '';
  };

  const getLinkedInUrlFromProfile = (profile: any): string => {
    return profile.url || profile.linkedInUrl || '';
  };

  const formatExperienceFromProfile = (profile: any): any[] => {
    if (!profile.experience || !Array.isArray(profile.experience)) {
      return [];
    }
    
    return profile.experience.map((exp: any) => ({
      company: exp.company || '',
      title: exp.position || exp.title || '',
      duration: exp.duration || formatDuration(exp.started, exp.ended) || ''
    }));
  };

  const formatEducationFromProfile = (profile: any): any[] => {
    if (!profile.education || !Array.isArray(profile.education)) {
      return [];
    }
    
    return profile.education.map((edu: any) => ({
      school: edu.university || edu.school || '',
      degree: Array.isArray(edu.degree) ? edu.degree.join(', ') : (edu.degree || ''),
      year: edu.endedYear ? edu.endedYear.toString() : (edu.year || '')
    }));
  };

  const formatDuration = (startDate: string, endDate: string | null): string => {
    if (!startDate) return '';
    
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      
      const years = end.getFullYear() - start.getFullYear();
      const months = end.getMonth() - start.getMonth();
      
      let duration = '';
      
      if (years > 0) {
        duration += `${years} ${years === 1 ? 'year' : 'years'}`;
      }
      
      if (months > 0 || (years === 0 && months === 0)) {
        if (duration) duration += ' ';
        duration += `${months} ${months === 1 ? 'month' : 'months'}`;
      }
      
      return duration;
    } catch (e) {
      return '';
    }
  };

  const processEnrichAndAnalyze = async (
    profiles: Profile[],
    selectedProfileIds: string[],
    analyze: boolean,
    criteria: AnalysisCriteria,
    setProfilesBeingProcessed: (ids: string[]) => void,
    setEnrichError: (error: string | null) => void,
    setProfileData: (id: string, data: ProfileData | null) => void,
    setProfileEvaluation: (id: string, evaluation: ProfileEvaluation | null) => void,
    setIsAnalyzing: (isAnalyzing: boolean) => void,
    setCredits: (credits: number) => void,
    abortController?: AbortController
  ) => {
    // Filter profiles by selected IDs and extract LinkedIn URLs
    const selectedProfiles = profiles.filter(profile => selectedProfileIds.includes(profile.id));
    const linkedInUrls = selectedProfiles.map(profile => profile.linkedin);

    // Check if we have LinkedIn URLs to process
    if (linkedInUrls.length === 0) {
      toast({
        title: "Error",
        description: "No LinkedIn URLs to enrich",
        variant: "destructive"
      });
      return;
    }

    // Set profiles as being processed
    setProfilesBeingProcessed(selectedProfileIds);

    try {
      for (let i = 0; i < selectedProfiles.length; i++) {
        const profile = selectedProfiles[i];
        const linkedInUrl = profile.linkedin;

        // Skip if no LinkedIn URL
        if (!linkedInUrl) {
          console.log(`Profile ${profile.id} has no LinkedIn URL, skipping`);
          continue;
        }

        try {
          // Fetch profile data
          console.log(`Fetching profile data for ${profile.id}: ${linkedInUrl}`);
          const profileData = await fetchProfileData(linkedInUrl, abortController);
          
          // Save profile data
          setProfileData(profile.id, profileData);
          console.log(`Profile data saved for ${profile.id}`);

          // Analyze profile if requested
          if (analyze) {
            setIsAnalyzing(true);
            console.log(`Analyzing profile ${profile.id} with criteria:`, criteria);
            
            try {
              const evaluation = await analyzeProfileWithAI(profileData, criteria, abortController);
              setProfileEvaluation(profile.id, evaluation);
              console.log(`Profile evaluation saved for ${profile.id}:`, evaluation);
            } catch (analysisError) {
              console.error(`Error analyzing profile ${profile.id}:`, analysisError);
              toast({
                title: "Analysis Error",
                description: `Failed to analyze profile: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`,
                variant: "destructive"
              });
            } finally {
              setIsAnalyzing(false);
            }
          }
        } catch (profileError) {
          console.error(`Error processing profile ${profile.id}:`, profileError);
          // Continue with next profile
        }
      }

      // Fetch updated credits
      try {
        const api = new URL('/api/credits', window.location.origin);
        const response = await fetch(api, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController?.signal,
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Credits updated:', data);
          setCredits(data.credits || 0);
        }
      } catch (creditsError) {
        console.error('Error fetching credits:', creditsError);
      }
    } catch (error) {
      console.error('Error in processEnrichAndAnalyze:', error);
      setEnrichError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      // Clear profiles being processed
      setProfilesBeingProcessed([]);
    }
  };

  // Open profile evaluation details
  const openProfileEvaluation = (profileId: string) => {
    if (enrichedProfiles[profileId]) {
      setSelectedEvaluationProfile({
        ...linkRows.find(row => row.id === profileId),
        evaluation: enrichedProfiles[profileId]
      });
      setEvaluationDetailOpen(true);
    }
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Add state variables for processing
  const [profilesBeingProcessed, setProfilesBeingProcessed] = useState<string[]>([]);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Funktion för att enbart berika profil utan att öppna kriterie-dialogen
  const enrichProfileOnly = async (profileId: string, linkedInUrl: string) => {
    if (!linkedInUrl) {
      toast({
        title: "Error",
        description: "Saknar LinkedIn URL för denna profil",
        variant: "destructive"
      });
      return;
    }

    // Kontrollera om profilen redan bearbetas
    if (profilesBeingProcessed.includes(profileId)) {
      toast({
        title: "Vänligen vänta",
        description: "Profilen bearbetas redan",
      });
      return;
    }

    // Sätt profilen som bearbetas
    setProfilesBeingProcessed(prev => [...prev, profileId]);
    setEnrichError(null);
    
    try {
      console.log(`Hämtar profildata för ${profileId}: ${linkedInUrl}`);
      
      // Test med mockprofile för utveckling
      const isMockProfile = linkedInUrl.toLowerCase().includes('mockprofile');
      if (!isMockProfile && !linkedInUrl.includes('linkedin.com')) {
        // Kräv att det är en LinkedIn URL
        toast({
          title: "Ogiltig URL",
          description: "Vänligen ange en giltig LinkedIn URL",
          variant: "destructive"
        });
        return;
      }
      
      // Hämta profildata via API
      const profileData: ProfileData = await fetchProfileData(linkedInUrl);
      
      // Uppdatera UI med resultatet
      const updatedEnrichedProfiles = { ...enrichedProfiles };
      updatedEnrichedProfiles[profileId] = {
        score: 0, // Ingen score när vi bara berikar
        reasoning: "", // Ingen analys när vi bara berikar
        timestamp: new Date().toISOString(),
        enrichedData: profileData
      };
      
      setEnrichedProfiles(updatedEnrichedProfiles);
      
      // Spara i lokal lagring för att behålla data vid siduppdatering
      try {
        localStorage.setItem('enrichedProfiles', JSON.stringify(updatedEnrichedProfiles));
      } catch (storageError) {
        console.warn('Kunde inte spara berikade profiler i local storage', storageError);
      }
      
      // Visa bekräftelse till användaren
      toast({
        title: "Profil berikad",
        description: `Profilinformation för ${profileData.name || 'denna profil'} har hämtats`,
        variant: "default"
      });
      
      // Uppdatera UI för att visa den berikade informationen
      const updatedRows = [...linkRows];
      const rowIndex = updatedRows.findIndex(r => r.id === profileId);
      
      if (rowIndex !== -1) {
        updatedRows[rowIndex] = {
          ...updatedRows[rowIndex],
          name: profileData.name || updatedRows[rowIndex].name,
          title: profileData.title || updatedRows[rowIndex].title,
          company: profileData.company || updatedRows[rowIndex].company,
          location: profileData.location || updatedRows[rowIndex].location
        };
        
        setLinkRows(updatedRows);
        
        // Spara uppdaterade rader i localStorage
        try {
          localStorage.setItem('linkSheetRows', JSON.stringify(updatedRows));
        } catch (storageError) {
          console.warn('Kunde inte spara uppdaterade rader i local storage', storageError);
        }
      }
      
    } catch (error) {
      console.error('Error enriching profile:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Okänt fel';
      setEnrichError(errorMessage);
      
      toast({
        title: "Kunde inte berika profil",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Rensa profilen från bearbetning
      setProfilesBeingProcessed(prev => prev.filter(id => id !== profileId));
    }
  };
  
  return (
    <ErrorBoundary fallbackRender={ErrorFallback}>
      <div className="container mx-auto p-4 bg-white text-black">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            {allRequirements.length > 0 && (
              <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                    {activeRequirements.length > 0 && (
                      <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeRequirements.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 md:w-80">
                  <DropdownMenuLabel className="bg-gray-100 text-black px-2 py-2 rounded-t-md">Filters</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Score section */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-black bg-gray-100">
                    Score Categories
                  </div>
                  <DropdownMenuSeparator />
                  {/* Location filter */}
                  <div className="px-2 py-1.5 cursor-pointer">
                    <div 
                      className="flex items-center gap-2 w-full"
                      onClick={() => toggleRequirement("Location")}
                    >
                      <Checkbox 
                        checked={tempActiveRequirements.includes("Location")}
                        className="cursor-pointer"
                      />
                      <span className="flex-1">Location</span>
                    </div>
                  </div>
                  
                  {/* Title filter */}
                  <div className="px-2 py-1.5 cursor-pointer">
                    <div 
                      className="flex items-center gap-2 w-full"
                      onClick={() => toggleRequirement("Title")}
                    >
                      <Checkbox 
                        checked={tempActiveRequirements.includes("Title")}
                        className="cursor-pointer"
                      />
                      <span className="flex-1">Title</span>
                    </div>
                  </div>
                  
                  {/* Industry filter */}
                  <div className="px-2 py-1.5 cursor-pointer">
                    <div 
                      className="flex items-center gap-2 w-full"
                      onClick={() => toggleRequirement("Industry")}
                    >
                      <Checkbox 
                        checked={tempActiveRequirements.includes("Industry")}
                        className="cursor-pointer"
                      />
                      <span className="flex-1">Industry</span>
                    </div>
                  </div>
                  
                  {/* Requirements section */}
                  <div className="mt-2 px-2 py-1.5 text-xs font-semibold text-black bg-gray-100">
                    Specific Requirements
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {allRequirements
                      .filter(req => req !== "Location" && req !== "Title" && req !== "Industry")
                      .map((req) => {
                      const isChecked = tempActiveRequirements.includes(req);
                      
                      return (
                        <div 
                          key={req} 
                          className="flex items-center px-2 py-1.5 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleRequirement(req);
                          }}
                        >
                          <div className="flex items-center w-full">
                            <div className="relative mr-2 h-4 w-4">
                              <Checkbox 
                                checked={isChecked}
                                className="cursor-pointer"
                              />
                            </div>
                            <span className="truncate flex-1">{req}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <DropdownMenuSeparator />
                  <div className="p-2 flex justify-between gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        resetFilters();
                      }}
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        applyFilters();
                      }}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Apply
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Action buttons when rows are selected */}
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportSelected}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export ({selectedRows.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeSelectedProfiles}
                  className="flex items-center gap-1"
                >
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                    >
                      {/* Förstoringsglas */}
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      
                      {/* Svart sparkle inuti */}
                      <g transform="translate(8 8)">
                        <path d="M3 0 L4 2 L6 3 L4 4 L3 6 L2 4 L0 3 L2 2 Z" fill="black"/>
                      </g>
                    </svg>
                  </div>
                  Enrich and Analyze
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProjectDialogOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Save className="h-3 w-3" />
                  Save to Project
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2"
            >
              <SettingsIcon className="h-4 w-4" />
              App Settings
            </Button>
            <Button
              variant="outline"
              onClick={downloadCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-500">Loading profile data...</p>
            </div>
          </div>
        ) : linkRows.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">No profile data found</p>
            <Button onClick={() => loadLinks(true)}>
              Load Sample Data
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="!p-0 !pl-0 !pr-0" 
                    style={{ 
                      width: '1cm', 
                      minWidth: '1cm', 
                      maxWidth: '1cm', 
                      textAlign: 'center',
                      padding: 0
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-black">Name</TableHead>
                  <TableHead className="text-black">Title</TableHead>
                  <TableHead className="text-black">Company</TableHead>
                  <TableHead className="text-black">Location</TableHead>
                  <TableHead className="text-black">Score</TableHead>
                  <TableHead className="text-black">Profile Evaluation</TableHead>
                  <TableHead className="text-black">Email Address</TableHead>
                  <TableHead className="text-black">LinkedIn URL</TableHead>
                  <TableHead className="text-black text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell 
                      className="!p-0 !pl-0 !pr-0" 
                      style={{ 
                        width: '1cm', 
                        minWidth: '1cm', 
                        maxWidth: '1cm', 
                        textAlign: 'center',
                        padding: 0
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                        <Checkbox
                          checked={selectedRows.includes(row.id)}
                          onCheckedChange={() => toggleRowSelection(row.id)}
                          aria-label={`Select ${row.name || 'profile'}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell 
                      className="font-medium cursor-pointer"
                      onClick={() => handleEditCell(row, 'name')}
                    >
                      {editingCell.id === row.id && editingCell.field === 'name' ? (
                        <input
                          className="w-full bg-transparent outline-none font-medium"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(row.id, 'name')}
                          onKeyDown={(e) => handleKeyPress(e, row.id, 'name')}
                          autoFocus
                        />
                      ) : (
                        row.name || 'Not available'
                      )}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer"
                      onClick={() => handleEditCell(row, 'title')}
                    >
                      {editingCell.id === row.id && editingCell.field === 'title' ? (
                        <input
                          className="w-full bg-transparent outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(row.id, 'title')}
                          onKeyDown={(e) => handleKeyPress(e, row.id, 'title')}
                          autoFocus
                        />
                      ) : (
                        (() => {
                          if (!row.title || /^not\s+available$/i.test(row.title)) {
                            return 'Not available';
                          }
                          
                          // Apply all our cleanup logic
                          const cleanedTitle = cleanupJobTitle(row.title);
                          
                          return cleanedTitle || 'Not available';
                        })()
                      )}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer"
                      onClick={() => handleEditCell(row, 'company')}
                    >
                      {editingCell.id === row.id && editingCell.field === 'company' ? (
                        <input
                          className="w-full bg-transparent outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(row.id, 'company')}
                          onKeyDown={(e) => handleKeyPress(e, row.id, 'company')}
                          autoFocus
                        />
                      ) : (
                        (() => {
                          if (!row.company || /^not\s+available$/i.test(row.company)) {
                            return 'Not available';
                          }
                          
                          // Apply all our cleanup logic
                          const cleanedCompany = cleanupCompanyName(row.company);
                          
                          // Make absolutely sure no periods remain
                          const noDots = cleanedCompany ? cleanedCompany.replace(/\./g, '') : '';
                          
                          return noDots || 'Not available';
                        })()
                      )}
                    </TableCell>
                    <TableCell 
                      className="cursor-pointer"
                      onClick={() => handleEditCell(row, 'location')}
                    >
                      {editingCell.id === row.id && editingCell.field === 'location' ? (
                        <input
                          className="w-full bg-transparent outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(row.id, 'location')}
                          onKeyDown={(e) => handleKeyPress(e, row.id, 'location')}
                          autoFocus
                        />
                      ) : (
                        row.location || 'Not available'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell.id === row.id && editingCell.field === 'score' ? (
                        <input
                          className="w-full bg-transparent outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(row.id, 'score')}
                          onKeyDown={(e) => handleKeyPress(e, row.id, 'score')}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="cursor-pointer p-2 border rounded hover:bg-gray-50"
                          onClick={() => openRequirementsBreakdown(row)}
                        >
                          <div className="flex flex-col">
                            {/* Score Badge */}
                            <div className="flex items-center mb-2">
                              <div 
                                className={`px-3 py-1 rounded-full text-sm font-bold
                                  ${row.score >= 3 ? 'bg-green-500 text-white' : 
                                    row.score >= 1 ? 'bg-yellow-500 text-white' : 
                                    'bg-gray-300 text-gray-700'}
                                `}
                              >
                                {row.score}
                              </div>
                              <span className="ml-2 text-sm font-medium">
                                / {maxScoreValue}
                              </span>
                            </div>
                            
                            {/* Matched Requirements */}
                            <div className="text-xs">
                              {row.score > 0 ? (
                                <div className="mb-1">
                                  <span className="font-semibold text-green-700">✓ Matched:</span> 
                                  <span className="text-green-700">
                                    {row.metadata?.matchedRequirements && row.metadata.matchedRequirements.length > 0 ? (
                                      (() => {
                                        // Collect all matched categories
                                        const matchedCategories = [];
                                        
                                        // For a 3/3 score, show all categories as matched
                                        if (row.score === 3) {
                                          if (row.metadata?.categoriesInSearch?.location) {
                                            matchedCategories.push("Location");
                                          }
                                          if (row.metadata?.categoriesInSearch?.title) {
                                            matchedCategories.push("Title");
                                          }
                                          if (row.metadata?.categoriesInSearch?.industry) {
                                            matchedCategories.push("Industry");
                                          }
                                          
                                          console.log(`Profile ${row.name}: 3/3 score, showing all categories: ${matchedCategories.join(', ')}`);
                                        } 
                                        // For partial scores, check requirement matches
                                        else {
                                          if (row.metadata?.categoriesInSearch?.location && 
                                              row.metadata?.matchedRequirements?.some(req => 
                                                req.toLowerCase().includes('location') || 
                                                locationKeywords.some(k => req.toLowerCase().includes(k))
                                              )) {
                                            matchedCategories.push("Location");
                                          }
                                          
                                          if (row.metadata?.categoriesInSearch?.title && 
                                              row.metadata?.matchedRequirements?.some(req => 
                                                req.toLowerCase().includes('title') ||
                                                titleKeywords.some(k => req.toLowerCase().includes(k))
                                              )) {
                                            matchedCategories.push("Title");
                                          }
                                          
                                          if (row.metadata?.categoriesInSearch?.industry && 
                                              row.metadata?.matchedRequirements?.some(req => 
                                                req.toLowerCase().includes('industry') ||
                                                industryKeywords.some(k => req.toLowerCase().includes(k))
                                              )) {
                                            matchedCategories.push("Industry");
                                          }
                                          
                                          console.log(`Profile ${row.name}: partial score ${row.score}, matched categories: ${matchedCategories.join(', ')}`);
                                        }
                                        
                                        return matchedCategories.length > 0 ? 
                                          matchedCategories.join(', ') : 
                                          "Generic match";
                                      })()
                                    ) : "N/A"}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Profile Evaluation/Enrich Cell */}
                      {enrichedProfiles[row.id] ? (
                        <div 
                          className="cursor-pointer p-2 border rounded hover:bg-gray-50 flex items-center justify-center"
                          onClick={() => openProfileEvaluation(row.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                                ${enrichedProfiles[row.id].score >= 3 ? 'bg-green-100 text-green-800 border border-green-300' : 
                                  enrichedProfiles[row.id].score >= 2 ? 'bg-blue-100 text-blue-800 border border-blue-300' : 
                                  enrichedProfiles[row.id].score >= 1 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 
                                  'bg-gray-100 text-gray-800 border border-gray-300'}
                              `}
                            >
                              {enrichedProfiles[row.id].score}
                            </div>
                            <div className="text-xs">
                              <div className="font-medium">AI Evaluated</div>
                              <div className="text-gray-500">{new Date(enrichedProfiles[row.id].timestamp).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-full text-xs hover:bg-blue-50 hover:text-blue-800 flex items-center justify-center gap-1"
                          onClick={() => {
                            setSelectedRows([row.id]);
                            enrichProfileOnly(row.id, row.url);
                          }}
                          disabled={profilesBeingProcessed.includes(row.id) || isProcessing}
                        >
                          {profilesBeingProcessed.includes(row.id) ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              <span>Enrich Profile</span>
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Empty cell for Email Address */}
                      {enrichedProfiles[row.id]?.enrichedData?.email && (
                        <span className="text-sm">{enrichedProfiles[row.id].enrichedData.email}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <a 
                        href={row.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {row.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyLink(row.url)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          asChild
                        >
                          <a href={row.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {linkRows.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            {filteredRows.length} profiles shown {activeRequirements.length > 0 ? `(filtered from ${linkRows.length})` : ''} {dataSource ? `from ${dataSource}` : ''}
          </div>
        )}
      </div>
      
      {/* Project saving dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Save to Project</DialogTitle>
            <DialogDescription className="text-gray-500">
              Save selected profiles to a new or existing project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right text-black">
                Project Name
              </Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="col-span-3"
                placeholder="Enter project name"
              />
            </div>
            <div className="text-sm text-gray-500">
              {selectedRows.length} profile{selectedRows.length !== 1 ? 's' : ''} will be saved to this project
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={saveToProject}
              disabled={!projectName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Requirements Breakdown Dialog */}
      <Dialog open={breakdownDialogOpen} onOpenChange={setBreakdownDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Requirements Analysis</DialogTitle>
            <DialogDescription>
              Detailed breakdown of requirements matched by {selectedProfile?.name || 'this profile'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="py-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Avatar className="mr-2 w-6 h-6">
                    <AvatarFallback>{selectedProfile.name?.charAt(0) || 'P'}</AvatarFallback>
                  </Avatar>
                  {selectedProfile.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-1">
                  <span className="font-medium">Title:</span> {selectedProfile.title || 'Not available'} 
                </p>
                <p className="text-muted-foreground text-sm mb-1">
                  <span className="font-medium">Company:</span> {selectedProfile.company || 'Not available'}
                </p>
                <p className="text-muted-foreground text-sm mb-1">
                  <span className="font-medium">Location:</span> {selectedProfile.location || 'Not available'}
                </p>
                <div className="mt-3">
                  <a 
                    href={selectedProfile.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    LinkedIn Profile
                  </a>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h4 className="font-semibold mb-2 text-sm flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-bold mr-2">
                    {selectedProfile.score}
                  </span>
                  Profile Score ({selectedProfile.score}/{maxScoreValue})
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  A higher score indicates a better match to your search criteria.
                </p>
                
                <div className="space-y-2 mt-4">
                  <div className={`px-3 py-2 rounded-md ${selectedProfile.metadata?.categoriesInSearch?.location ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    <div className="flex items-center">
                      <div className="mr-2">
                        {selectedProfile.metadata?.categoriesInSearch?.location ? 
                          <Check className="h-4 w-4 text-green-600" /> : 
                          <X className="h-4 w-4 text-gray-400" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-xs">
                          {selectedProfile.metadata?.categoriesInSearch?.location ? 
                            `Matches location criteria: ${selectedProfile.location}` : 
                            `Doesn't match location criteria`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-2 rounded-md ${selectedProfile.metadata?.categoriesInSearch?.title ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    <div className="flex items-center">
                      <div className="mr-2">
                        {selectedProfile.metadata?.categoriesInSearch?.title ? 
                          <Check className="h-4 w-4 text-green-600" /> : 
                          <X className="h-4 w-4 text-gray-400" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">Title</p>
                        <p className="text-xs">
                          {selectedProfile.metadata?.categoriesInSearch?.title ? 
                            `Matches title criteria: ${selectedProfile.title}` : 
                            `Doesn't match title criteria`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-2 rounded-md ${selectedProfile.metadata?.categoriesInSearch?.industry ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    <div className="flex items-center">
                      <div className="mr-2">
                        {selectedProfile.metadata?.categoriesInSearch?.industry ? 
                          <Check className="h-4 w-4 text-green-600" /> : 
                          <X className="h-4 w-4 text-gray-400" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">Industry</p>
                        <p className="text-xs">
                          {selectedProfile.metadata?.categoriesInSearch?.industry ? 
                            `Matches industry criteria: ${selectedProfile.company}` : 
                            `Doesn't match industry criteria`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Matched Requirements Section */}
                <div className="border border-green-200 rounded-md overflow-hidden">
                  <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                    <h4 className="font-semibold text-green-800 text-sm">
                      Matched Requirements ({selectedProfile.metadata?.matchedRequirements?.length || 0})
                    </h4>
                  </div>
                  <div className="p-3 bg-white">
                    {selectedProfile.metadata?.matchedRequirements?.length ? (
                      <ul className="space-y-1">
                        {selectedProfile.metadata.matchedRequirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center">
                            <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No matched requirements.</p>
                    )}
                  </div>
                </div>
                
                {/* Unmatched Requirements Section */}
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-700 text-sm">
                      Unmatched Requirements ({selectedProfile.metadata?.unmatchedRequirements?.length || 0})
                    </h4>
                  </div>
                  <div className="p-3 bg-white">
                    {selectedProfile.metadata?.unmatchedRequirements?.length ? (
                      <ul className="space-y-1">
                        {selectedProfile.metadata.unmatchedRequirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-500 flex items-center">
                            <X className="h-3 w-3 text-gray-400 mr-2 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No unmatched requirements.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setBreakdownDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save to Project</DialogTitle>
            <DialogDescription>
              Save {selectedRows.length} profile{selectedRows.length !== 1 ? 's' : ''} to a new or existing project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                Project Name
              </Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveToProject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Analyze Dialog */}
      <Dialog open={aiAnalyzeDialogOpen} onOpenChange={setAiAnalyzeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profile Evaluation</DialogTitle>
            <DialogDescription>
              Analyze selected profiles with AI. Add more specific criterias.
              <div className="mt-2 text-sm font-medium">
                Available Credits: <span className="font-bold text-blue-600">{userCredits}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {criteriaFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`field-${field.id}`} className="text-right">
                  {deleteMode ? (
                    <div className="flex items-center justify-end">
                      <Checkbox 
                        checked={selectedForDeletion.includes(field.id)}
                        onCheckedChange={() => toggleCriteriaSelection(field.id)}
                        className="mr-2"
                      />
                      <span>Criteria {index + 1}</span>
                    </div>
                  ) : (
                    `Criteria ${index + 1}`
                  )}
                </Label>
                <Input
                  id={`field-${field.id}`}
                  placeholder={field.placeholder}
                  className="col-span-3 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                  disabled={deleteMode || isProcessing}
                />
              </div>
            ))}
            
            <div className="flex justify-between mt-4">
              {deleteMode ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setDeleteMode(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={deleteSelectedCriteria}
                    disabled={selectedForDeletion.length === 0 || isProcessing}
                  >
                    Delete Selected
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={addCriteriaField}
                    disabled={isProcessing}
                  >
                    Add Criteria
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDeleteMode(true)}
                    disabled={criteriaFields.length <= 1 || isProcessing}
                  >
                    Delete Criteria
                  </Button>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAiAnalyzeDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Get values from the criteria fields
                const criteriaValues = criteriaFields.map(field => {
                  const inputElement = document.getElementById(`field-${field.id}`) as HTMLInputElement;
                  return inputElement?.value || '';
                }).filter(value => value.trim() !== '');
                
                // Create criteria object from input values
                const criteria: AnalysisCriteria = {
                  requirements: criteriaValues
                };
                
                // Create a map of profiles with their id and LinkedIn URL
                const profiles = linkRows.map(row => ({
                  id: row.id,
                  linkedin: row.url
                }));
                
                // Start processing with enrichment and analysis
                setIsProcessing(true);
                
                // Create abort controller for potential cancellation
                const abortController = new AbortController();
                
                // Call the processEnrichAndAnalyze function
                processEnrichAndAnalyze(
                  profiles,
                  selectedRows,
                  true, // Analyze = true
                  criteria,
                  setProfilesBeingProcessed,
                  setEnrichError,
                  (id, data) => {
                    if (data) {
                      setEnrichedProfiles(prev => ({
                        ...prev,
                        [id]: {
                          ...prev[id],
                          enrichedData: data
                        }
                      }));
                    }
                  },
                  (id, evaluation) => {
                    if (evaluation) {
                      setEnrichedProfiles(prev => ({
                        ...prev,
                        [id]: {
                          ...prev[id],
                          ...evaluation,
                          timestamp: new Date().toISOString()
                        }
                      }));
                    }
                  },
                  setIsAnalyzing,
                  setUserCredits,
                  abortController
                );
                
                // Close the dialog
                setAiAnalyzeDialogOpen(false);
              }}
              disabled={isProcessing || selectedRows.length === 0 || userCredits < selectedRows.length}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `Enrich and Analyze (${selectedRows.length} ${selectedRows.length === 1 ? "Credit" : "Credits"})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Profile Evaluation Detail Dialog */}
      <Dialog open={evaluationDetailOpen} onOpenChange={setEvaluationDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Evaluation Details</DialogTitle>
            <DialogDescription>
              Detailed evaluation for {selectedEvaluationProfile?.name || 'this profile'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvaluationProfile && (
            <div className="py-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Avatar className="mr-2 w-6 h-6">
                    <AvatarFallback>{selectedEvaluationProfile.name?.charAt(0) || 'P'}</AvatarFallback>
                  </Avatar>
                  {selectedEvaluationProfile.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Title:</span> {selectedEvaluationProfile.evaluation?.enrichedData?.title || selectedEvaluationProfile.title || 'Not available'} 
                    </p>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Company:</span> {selectedEvaluationProfile.evaluation?.enrichedData?.company || selectedEvaluationProfile.company || 'Not available'}
                    </p>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Location:</span> {selectedEvaluationProfile.evaluation?.enrichedData?.location || selectedEvaluationProfile.location || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Email:</span> {selectedEvaluationProfile.evaluation?.enrichedData?.email || 'Not available'} 
                    </p>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Phone:</span> {selectedEvaluationProfile.evaluation?.enrichedData?.phone || 'Not available'}
                    </p>
                    <p className="text-sm mb-1">
                      <span className="font-medium">Evaluated:</span> {new Date(selectedEvaluationProfile.evaluation?.timestamp).toLocaleString()} 
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <a 
                    href={selectedEvaluationProfile.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    LinkedIn Profile
                  </a>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h4 className="font-semibold mb-2 text-sm flex items-center">
                  <span 
                    className={`
                      px-2 py-1 rounded-full text-sm font-medium mr-2
                      ${selectedEvaluationProfile.evaluation.score >= 3 ? 'bg-green-500 text-white' : 
                        selectedEvaluationProfile.evaluation.score >= 2 ? 'bg-blue-500 text-white' : 
                        selectedEvaluationProfile.evaluation.score >= 1 ? 'bg-yellow-500 text-white' : 
                        'bg-gray-500 text-white'}
                    `}
                  >
                    Score: {selectedEvaluationProfile.evaluation.score}
                  </span>
                  Evaluation Score
                </h4>
              </div>
              
              {/* Evaluation Reasoning */}
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800 text-sm">
                      AI Evaluation Reasoning
                    </h4>
                  </div>
                  <div className="p-3 bg-white">
                    {selectedEvaluationProfile.evaluation.reasoning?.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedEvaluationProfile.evaluation.reasoning.map((reason: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center">
                            <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No detailed reasoning available.</p>
                    )}
                  </div>
                </div>
                
                {/* Experience */}
                {selectedEvaluationProfile.evaluation?.enrichedData?.experience && (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800 text-sm">
                        Experience
                      </h4>
                    </div>
                    <div className="p-3 bg-white">
                      {selectedEvaluationProfile.evaluation.enrichedData.experience.length > 0 ? (
                        <ul className="space-y-3">
                          {selectedEvaluationProfile.evaluation.enrichedData.experience.map((exp: any, index: number) => (
                            <li key={index} className="text-sm">
                              <div className="font-medium">{exp.title}</div>
                              <div className="text-gray-600">{exp.company}</div>
                              <div className="text-gray-500 text-xs">{exp.duration}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No experience data available.</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Education */}
                {selectedEvaluationProfile.evaluation?.enrichedData?.education && (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800 text-sm">
                        Education
                      </h4>
                    </div>
                    <div className="p-3 bg-white">
                      {selectedEvaluationProfile.evaluation.enrichedData.education.length > 0 ? (
                        <ul className="space-y-3">
                          {selectedEvaluationProfile.evaluation.enrichedData.education.map((edu: any, index: number) => (
                            <li key={index} className="text-sm">
                              <div className="font-medium">{edu.school}</div>
                              <div className="text-gray-600">{edu.degree}</div>
                              <div className="text-gray-500 text-xs">{edu.year}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No education data available.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setEvaluationDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Settings Dialog */}
      <Settings open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </ErrorBoundary>
  );
}
